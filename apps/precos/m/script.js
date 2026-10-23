(() => {
"use strict";

const API_URL = window.location.origin + '/api';
const SESSION_KEY = 'irUserSession';
const MODULE_SESSION_KEY = 'tabelaPrecosSession';
const PAGE_SIZE = 20;

let sessionToken = null;
let currentUserName = null; // Variável adicionada para corrigir o erro
let records = [];
let currentPage = 1;
let hasMorePages = false;
let marcasDisponiveis = [];
let state = { search: '', marca: 'TODAS' };
let editingId = null;
let delId = null;
let searchTimer;

const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();
});

function verificarAutenticacao() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('sessionToken');
    if (tokenFromUrl) {
        sessionToken = tokenFromUrl;
        sessionStorage.setItem(MODULE_SESSION_KEY, tokenFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        sessionToken = sessionStorage.getItem(MODULE_SESSION_KEY);
    }
    
    if (!sessionToken) {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                sessionToken = parsed.token || parsed.sessionToken || null;
                currentUserName = parsed.name || parsed.nome || parsed.fullName || null; // Pega o nome
            }
        } catch (e) {}
    }

    if (!sessionToken) {
        if (window.IR && IR.denied) IR.denied('Sessão expirada');
        else document.body.innerHTML = '<div class="access-denied"><h1>SESSÃO EXPIRADA</h1></div>';
        return;
    }
    
    if (window.IR && IR.setToken) IR.setToken(sessionToken);
    startApp();
}

const getHeaders = () => {
    const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (sessionToken) h['X-Session-Token'] = sessionToken;
    return h;
};

const api = async (url, opts = {}) => {
    const r = await fetch(url, { ...opts, headers: { ...getHeaders(), ...(opts.headers || {}) } });
    if (r.status === 401 || r.status === 403) {
        sessionStorage.removeItem(MODULE_SESSION_KEY);
        if (window.IR && IR.denied) IR.denied('Sessão expirada');
        throw new Error('Sessão expirada');
    }
    if (!r.ok) {
        let e = {};
        try { e = await r.json(); } catch {}
        throw new Error(e.error || `Erro ${r.status}`);
    }
    return r.status === 204 ? null : r.json();
};

const money = n => 'R$ ' + parseFloat(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function toastSuccess(msg) { const t=$('toast'); t.className='toast success'; t.textContent=msg; t.classList.add('show'); clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),3000); }
function toastError(msg) { const t=$('toast'); t.className='toast error'; t.textContent=msg; t.classList.add('show'); clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),3000); }

function open(id) { const el=$(id); if(el){ el.classList.add('show'); el.setAttribute('aria-hidden','false'); } }
function close(id) { const el=$(id); if(el){ el.classList.remove('show'); el.setAttribute('aria-hidden','true'); } }

document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => close(b.dataset.close)));
document.querySelectorAll('.modal').forEach(o => o.addEventListener('click', e => { if(e.target === o) close(o.id); }));

// UI Listeners
$('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.search = e.target.value.trim(); loadList(); }, 300);
});
$('marcaFilter').addEventListener('change', (e) => { state.marca = e.target.value; loadList(); });
$('syncBtn').addEventListener('click', sincronizar);
$('addBtn').addEventListener('click', () => openForm());
$('confirmDelete').addEventListener('click', doDelete);

// Tabs
document.querySelectorAll('.modal-tab[data-tab]').forEach(t => {
    t.addEventListener('click', () => {
        document.querySelectorAll('.modal-tab[data-tab]').forEach(x => x.classList.toggle('active', x === t));
        document.querySelectorAll('.tab-pane[data-pane]').forEach(p => p.classList.toggle('active', p.dataset.pane === t.dataset.tab));
    });
});

async function startApp() {
    await loadMarcas();
    await loadList();
}

async function loadMarcas() {
    try {
        const arr = await api(API_URL + '/precos/marcas');
        marcasDisponiveis = Array.isArray(arr) ? arr : [];
        const sel = $('marcaFilter'); const val = sel.value;
        sel.innerHTML = '<option value="TODAS">Todas as Marcas</option>' + marcasDisponiveis.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
        if (marcasDisponiveis.includes(val)) sel.value = val;
    } catch (e) { console.error('Erro marcas:', e); }
}

async function loadList() {
    try {
        currentPage = 1;
        const params = new URLSearchParams({ page: '1', limit: PAGE_SIZE });
        if (state.marca !== 'TODAS') params.set('marca', state.marca);
        if (state.search) params.set('search', state.search);

        const res = await api(`${API_URL}/precos?${params.toString()}`);
        
        if (Array.isArray(res)) {
            records = res;
            hasMorePages = false;
        } else {
            records = res.data || [];
            hasMorePages = (res.page || 1) < (res.totalPages || 1);
        }
        renderList();
    } catch (e) {
        $('list').innerHTML = `<div class="empty-state">${esc(e.message)}</div>`;
    }
}

async function loadMore() {
    if (!hasMorePages) return;
    currentPage++;
    const params = new URLSearchParams({ page: String(currentPage), limit: PAGE_SIZE });
    if (state.marca !== 'TODAS') params.set('marca', state.marca);
    if (state.search) params.set('search', state.search);

    try {
        const res = await api(`${API_URL}/precos?${params.toString()}`);
        records = records.concat(res.data || []);
        hasMorePages = currentPage < (res.totalPages || 1);
        renderList();
    } catch (e) { toastError(e.message); }
}

async function sincronizar() {
    const btn = $('syncBtn');
    btn.classList.add('spinning'); btn.disabled = true;
    try {
        await loadMarcas();
        await loadList();
        toastSuccess('Dados sincronizados');
    } catch (e) {
        toastError('Erro ao sincronizar');
    } finally {
        setTimeout(() => { btn.classList.remove('spinning'); btn.disabled = false; }, 600);
    }
}

function renderList() {
    const wrap = $('list');
    const empty = $('emptyState');
    
    if (!records.length) {
        wrap.innerHTML = '';
        empty.hidden = false;
        return;
    }
    empty.hidden = true;

    wrap.innerHTML = records.map(p => {
        const dt = p.ultima_atualizacao ? new Date(p.ultima_atualizacao).toLocaleDateString('pt-BR') : '—';
        const por = String(p.atualizado_por || '').trim().split(/\s+/)[0].toUpperCase() || '—';

        return `
            <div class="price-card">
                <div class="card-top">
                    <span class="card-codigo">${esc(p.codigo)}</span>
                    <span class="badge-marca">${esc(p.marca_nome || p.marca)}</span>
                </div>
                <div class="card-desc">${esc(p.descricao)}</div>
                <div class="card-price">${money(p.preco)}</div>
                <div class="card-meta">
                    <span>Por: ${esc(por)}</span>
                    <span>${dt}</span>
                </div>
                <div class="card-actions">
                    <button type="button" class="action-btn edit" data-edit="${p.id}">Editar</button>
                    <button type="button" class="action-btn delete" data-del="${p.id}">Excluir</button>
                </div>
            </div>
        `;
    }).join('');

    if (hasMorePages) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'load-more-btn';
        btn.textContent = 'Carregar mais';
        btn.addEventListener('click', loadMore);
        wrap.appendChild(btn);
    }

    wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openForm(b.dataset.edit)));
    wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => confirmDelete(b.dataset.del)));
}

function openForm(id = null) {
    editingId = id;
    $('recordForm').reset();
    
    if (id) {
        const p = records.find(x => String(x.id) === String(id));
        if (!p) return;
        $('formTitle').textContent = 'Editar Preço';
        $('btnSubmitForm').textContent = 'Atualizar';
        $('modalMarca').value = p.marca_nome || p.marca || '';
        $('modalCodigo').value = p.codigo || '';
        $('modalDescricao').value = p.descricao || '';
        $('modalPreco').value = p.preco || '';
        $('modalAtualizadoPor').value = p.atualizado_por || '';
        $('modalUltimaAtualizacao').value = p.ultima_atualizacao ? new Date(p.ultima_atualizacao).toLocaleString('pt-BR') : '';
    } else {
        $('formTitle').textContent = 'Novo Preço';
        $('btnSubmitForm').textContent = 'Salvar';
        $('modalAtualizadoPor').value = (currentUserName || 'SISTEMA').toUpperCase();
        $('modalUltimaAtualizacao').value = new Date().toLocaleString('pt-BR');
    }

    // Reset tabs
    document.querySelectorAll('.modal-tab[data-tab]').forEach((t, i) => t.classList.toggle('active', i === 0));
    document.querySelectorAll('.tab-pane[data-pane]').forEach((p, i) => p.classList.toggle('active', i === 0));

    open('formModal');
    setTimeout(() => $('modalMarca').focus(), 100);
}

$('recordForm').addEventListener('submit', async e => {
    e.preventDefault();
    const marca = $('modalMarca').value.trim().toUpperCase();
    const codigo = $('modalCodigo').value.trim();
    const descricao = $('modalDescricao').value.trim().toUpperCase();
    const preco = parseFloat($('modalPreco').value);

    if (!marca || !codigo || !descricao || isNaN(preco) || preco <= 0) {
        toastError('Verifique os campos obrigatórios');
        return;
    }

    const body = {
        marca, codigo, descricao, preco,
        atualizado_por: $('modalAtualizadoPor').value,
        ultima_atualizacao: new Date().toISOString()
    };

    const btn = $('btnSubmitForm');
    btn.disabled = true; btn.textContent = 'Aguarde...';

    try {
        const url = editingId ? `${API_URL}/precos/${editingId}` : `${API_URL}/precos`;
        const method = editingId ? 'PUT' : 'POST';
        
        await api(url, { method, body: JSON.stringify(body) });
        close('formModal');
        toastSuccess(editingId ? 'Preço atualizado' : 'Preço cadastrado');
        
        await loadMarcas();
        await loadList();
    } catch (err) {
        toastError(err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = editingId ? 'Atualizar' : 'Salvar';
    }
});

function confirmDelete(id) {
    delId = id;
    open('deleteModal');
}

async function doDelete() {
    if (!delId) return;
    try {
        await api(`${API_URL}/precos/${delId}`, { method: 'DELETE' });
        close('deleteModal');
        toastSuccess('Preço excluído');
        await loadMarcas();
        await loadList();
    } catch (e) {
        toastError(e.message);
    }
}

})();

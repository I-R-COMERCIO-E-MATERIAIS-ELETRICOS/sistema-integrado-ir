// ============================================================
// Ordens de Compra · Mobile · I.R. Comércio
// ============================================================

const API_URL = window.location.origin + '/api';

let accessToken = null;
let currentUserName = null;
let currentUserIsAdmin = false;

let ordens = [];
let editingId = null;
let itemCounter = 0;
let currentTab = 0;
let fornecedoresCache = {};
let ultimoNumeroGlobal = 0;

const KNOWN_RESPONSAVEIS = ['ROBERTO', 'ISAQUE', 'MIGUEL'];

function resolveToken() {
    const p = new URLSearchParams(window.location.search);
    const fromUrl = p.get('access_token');
    if (fromUrl) {
        sessionStorage.setItem('irToken', fromUrl);
        window.history.replaceState({}, '', window.location.pathname);
        return fromUrl;
    }
    return sessionStorage.getItem('irToken');
}

function getHeaders() {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    };
}

function showDenied(msg) {
    try {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'ir-session-expired', reason: msg || 'sem-acesso' }, '*');
        }
    } catch (e) {}

    document.documentElement.style.overflow = 'hidden';
    document.body.innerHTML = `
        <div style="
            position: fixed; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            background: #F4F5F7; color: #111;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            text-align: center; padding: 2rem; z-index: 2147483647;
        ">
            <h1 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.75rem;">${msg || 'SEM ACESSO'}</h1>
            <p style="color: #5B6470; margin-bottom: 2rem; font-size: 0.9rem;">Você não tem permissão para acessar este módulo.</p>
        </div>
    `;
}

function toUpperCase(v) { return v ? String(v).toUpperCase() : ''; }

function detectResponsavelFromUser(name) {
    if (!name) return null;
    const u = name.trim().toUpperCase();
    for (const r of KNOWN_RESPONSAVEIS) {
        if (u === r || u.startsWith(r + ' ') || u.startsWith(r + '.')) return r;
    }
    return null;
}

function formatCurrency(v) {
    const n = parseFloat(v);
    return isNaN(n) ? 'R$ 0,00' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(d) {
    if (!d) return '-';
    const dt = new Date(d + 'T00:00:00');
    return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('pt-BR');
}

function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function showToast(msg, type) {
    document.querySelectorAll('.m-toast').forEach(t => t.remove());
    const el = document.createElement('div');
    el.className = 'm-toast ' + (type || 'success');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.transition = 'opacity 0.3s';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { showDenied('SESSÃO EXPIRADA'); return; }

    await fetchSessionUser();
    await carregarTudo();
    setInterval(() => carregarTudo(), 30000);
});

async function fetchSessionUser() {
    try {
        const res = await fetch('/api/portal/modules', { headers: getHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (data.user) {
            currentUserName = data.user.name || data.user.username || null;
            currentUserIsAdmin = !!data.user.is_admin;
        }
    } catch (e) {}
}

async function carregarTudo() {
    try {
        await loadOrdens();
        await loadUltimoNumero();
        await loadFornecedoresGlobal();
    } catch (e) {
        console.error('[compra m] carregarTudo:', e);
    } finally {
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'ir-module-ready', module: 'compra' }, '*');
            }
        } catch (e) {}
    }
}

async function loadOrdens() {
    try {
        const res = await fetch(`${API_URL}/ordens`, { headers: getHeaders(), cache: 'no-cache' });
        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (!res.ok) throw new Error('Erro ' + res.status);
        const data = await res.json();
        ordens = Array.isArray(data) ? data : [];
        mesclarCacheFornecedores(ordens);
        updateDisplay();
    } catch (e) {
        showToast('Erro ao carregar ordens', 'error');
    }
}

async function loadUltimoNumero() {
    try {
        const res = await fetch(`${API_URL}/ordens/ultimo-numero`, { headers: getHeaders(), cache: 'no-cache' });
        if (!res.ok) return;
        const data = await res.json();
        ultimoNumeroGlobal = data.ultimoNumero || 0;
    } catch (e) {}
}

async function loadFornecedoresGlobal() {
    try {
        const res = await fetch(`${API_URL}/fornecedores`, { headers: getHeaders(), cache: 'no-cache' });
        if (!res.ok) return;
        const lista = await res.json();
        lista.forEach(f => {
            const key = (f.razao_social || '').trim().toUpperCase();
            if (key && !fornecedoresCache[key]) {
                fornecedoresCache[key] = {
                    razaoSocial: key,
                    nomeFantasia: (f.nome_fantasia || '').toUpperCase(),
                    cnpj: f.cnpj || '',
                    enderecoFornecedor: (f.endereco_fornecedor || '').toUpperCase(),
                    site: f.site || '',
                    contato: (f.contato || '').toUpperCase(),
                    telefone: f.telefone || '',
                    email: f.email || ''
                };
            }
        });
    } catch (e) {}
}

function mesclarCacheFornecedores(lista) {
    lista.forEach(o => {
        const key = toUpperCase(o.razao_social).trim();
        if (!key) return;
        fornecedoresCache[key] = {
            razaoSocial: key,
            nomeFantasia: toUpperCase(o.nome_fantasia || ''),
            cnpj: o.cnpj || '',
            enderecoFornecedor: toUpperCase(o.endereco_fornecedor || ''),
            site: o.site || '',
            contato: toUpperCase(o.contato || ''),
            telefone: o.telefone || '',
            email: o.email || ''
        };
    });
}

async function syncData() {
    const btn = document.querySelector('.m-sync-btn');
    if (btn) btn.classList.add('spinning');
    try {
        await carregarTudo();
        showToast('Dados sincronizados', 'success');
    } catch {
        showToast('Erro ao sincronizar', 'error');
    } finally {
        setTimeout(() => btn && btn.classList.remove('spinning'), 600);
    }
}

function updateDisplay() {
    updateStats();
    updateList();
    updateResponsaveisFilter();
    updateAuditBtn();
}

function updateStats() {
    const fechadas = ordens.filter(o => o.status === 'fechada').length;
    const abertas = ordens.filter(o => o.status === 'aberta').length;
    const t = document.getElementById('m-total');
    const f = document.getElementById('m-fechadas');
    const a = document.getElementById('m-abertas');
    if (t) t.textContent = ordens.length;
    if (f) f.textContent = fechadas;
    if (a) a.textContent = abertas;
}

function updateList() {
    const root = document.getElementById('ordensList');
    if (!root) return;

    let lista = [...ordens];
    const search = (document.getElementById('search')?.value || '').toLowerCase().trim();
    const resp = document.getElementById('filterResponsavel')?.value || '';
    const status = document.getElementById('filterStatus')?.value || '';

    if (search) {
        lista = lista.filter(o =>
            (o.numero_ordem || '').toString().toLowerCase().includes(search) ||
            (o.razao_social || '').toLowerCase().includes(search) ||
            (o.responsavel || '').toLowerCase().includes(search)
        );
    }
    if (resp) lista = lista.filter(o => o.responsavel === resp);
    if (status) lista = lista.filter(o => o.status === status);

    if (!lista.length) {
        root.innerHTML = '<div class="m-empty">Nenhuma ordem encontrada</div>';
        return;
    }

    lista.sort((a, b) => parseInt(b.numero_ordem || 0) - parseInt(a.numero_ordem || 0));

    root.innerHTML = lista.map(o => {
        const fechada = o.status === 'fechada';
        return `
            <div class="m-card ${fechada ? 'fechada' : ''}" onclick="viewOrdem('${o.id}')">
                <div class="m-card-header">
                    <span class="m-numero">Nº ${escHtml(o.numero_ordem)}</span>
                    <span class="m-badge ${o.status}">${o.status.toUpperCase()}</span>
                </div>
                <div class="m-card-body">
                    <div class="m-row"><span>Fornecedor</span><strong>${escHtml(toUpperCase(o.razao_social))}</strong></div>
                    <div class="m-row"><span>Responsável</span><strong>${escHtml(toUpperCase(o.responsavel))}</strong></div>
                    <div class="m-row"><span>Data</span><strong>${formatDate(o.data_ordem)}</strong></div>
                    <div class="m-row"><span>Valor</span><strong>${escHtml(o.valor_total || '-')}</strong></div>
                </div>
                <div class="m-card-actions">
                    <button class="m-btn edit" onclick="event.stopPropagation();editOrdem('${o.id}')">Editar</button>
                    <button class="m-btn ${fechada ? 'reabrir' : 'pdf'}" onclick="event.stopPropagation();toggleStatus('${o.id}')">${fechada ? 'Reabrir' : 'Fechar'}</button>
                    <button class="m-btn del" onclick="event.stopPropagation();deleteOrdem('${o.id}')">Excluir</button>
                </div>
            </div>
        `;
    }).join('');
}

function filterOrdens() { updateList(); }

function updateResponsaveisFilter() {
    const s = document.getElementById('filterResponsavel');
    if (!s) return;
    const cur = s.value;
    const set = new Set();
    ordens.forEach(o => { if (o.responsavel?.trim()) set.add(o.responsavel.trim()); });
    s.innerHTML = '<option value="">Responsável</option>';
    Array.from(set).sort().forEach(r => {
        const opt = document.createElement('option');
        opt.value = r; opt.textContent = toUpperCase(r);
        s.appendChild(opt);
    });
    s.value = cur;
}

function updateAuditBtn() {
    const btn = document.getElementById('auditBtn');
    if (!btn) return;
    btn.style.display = currentUserIsAdmin ? 'flex' : 'none';
}

function viewOrdem(id) {
    const o = ordens.find(x => String(x.id) === String(id));
    if (!o) return;

    const items = Array.isArray(o.items) ? o.items : [];
    const itemsHtml = items.length
        ? items.map(it => `
            <p><strong>${escHtml(it.item)}. ${escHtml(toUpperCase(it.especificacao))}</strong><br>
            ${escHtml(it.quantidade)} ${escHtml(toUpperCase(it.unidade))} × ${formatCurrency(it.valorUnitario || 0)} = ${escHtml(it.valorTotal || '')}</p>
        `).join('')
        : '<p>—</p>';

    document.getElementById('viewModalHost')?.remove();
    const host = document.createElement('div');
    host.id = 'viewModalHost';
    host.innerHTML = `
        <div class="m-modal-overlay" id="viewModal" onclick="if(event.target===this)closeView()">
            <div class="m-modal">
                <div class="m-modal-header">
                    <h2>Ordem Nº ${escHtml(o.numero_ordem)}</h2>
                    <button class="m-close" onclick="closeView()">✕</button>
                </div>
                <div class="m-info-section">
                    <h4>Geral</h4>
                    <p><strong

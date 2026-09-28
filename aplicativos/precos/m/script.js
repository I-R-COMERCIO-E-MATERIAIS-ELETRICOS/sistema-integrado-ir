const API_URL = window.location.origin + '/api/precos';
const PAGE_SIZE = 50;

let state = {
    precos: [],
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    marcaSelecionada: 'TODAS',
    searchTerm: '',
    marcasDisponiveis: [],
    isLoading: false
};
let accessToken = null;
let deleteTargetId = null;

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
    document.body.innerHTML = `
        <div class="m-denied">
            <h1>${msg || 'ACESSO NEGADO'}</h1>
            <p>Você não tem permissão para acessar este módulo.</p>
            <a href="/portal/m/">Voltar ao Portal</a>
        </div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { showDenied('SESSÃO EXPIRADA'); return; }
    await carregarTudo();
});

async function carregarTudo() {
    await loadPrecos(state.currentPage);
    await atualizarMarcasDisponiveis();
}

async function atualizarMarcasDisponiveis() {
    try {
        const res = await fetch(`${API_URL}/marcas`, { headers: getHeaders() });
        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (res.ok) {
            const marcas = await res.json();
            state.marcasDisponiveis = Array.isArray(marcas) ? marcas : [];
        }
    } catch (err) {
        console.error('Erro ao carregar marcas:', err);
    }
    renderMarcaSelect();
}

function renderMarcaSelect() {
    const select = document.getElementById('marcaSelect');
    if (!select) return;
    const selecionada = state.marcaSelecionada;
    select.innerHTML = '<option value="TODAS">Todas as Marcas</option>';
    state.marcasDisponiveis.forEach(nome => {
        const opt = document.createElement('option');
        opt.value = nome;
        opt.textContent = nome;
        if (nome === selecionada) opt.selected = true;
        select.appendChild(opt);
    });
}

window.selecionarMarca = function (nome) {
    state.marcaSelecionada = nome || 'TODAS';
    state.searchTerm = '';
    const searchInput = document.getElementById('search');
    if (searchInput) searchInput.value = '';
    loadPrecos(1);
};

async function loadPrecos(page) {
    page = page || 1;
    if (state.isLoading) return;
    state.isLoading = true;
    state.currentPage = page;

    try {
        const params = new URLSearchParams({ page, limit: PAGE_SIZE });
        if (state.marcaSelecionada && state.marcaSelecionada !== 'TODAS') {
            params.set('marca', state.marcaSelecionada);
        }
        if (state.searchTerm) params.set('search', state.searchTerm);

        const res = await fetch(`${API_URL}?${params.toString()}`, { headers: getHeaders() });
        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (!res.ok) throw new Error('Erro ' + res.status);

        const result = await res.json();
        state.precos = (result.data || []).map(normalizePreco);
        state.totalRecords = typeof result.total === 'number' ? result.total : state.precos.length;
        state.totalPages = result.totalPages || 1;
        state.currentPage = result.page || page;

        renderPrecos();
        renderPagination();
    } catch (err) {
        console.error(err);
        showToast('Erro ao carregar: ' + err.message, 'error');
    } finally {
        state.isLoading = false;
    }
}

function normalizePreco(p) {
    return {
        id:         p.id,
        marca:      (p.marca || '').trim().toUpperCase(),
        codigo:     (p.codigo || '').trim(),
        preco:      parseFloat(p.preco) || 0,
        descricao:  (p.descricao || '').trim().toUpperCase(),
        vendedor:   (p.vendedor || '').trim() || null,
        timestamp:  p.timestamp || null,
        marca_nome: (p.marca_nome || p.marca || '').trim().toUpperCase()
    };
}

let searchDebounceTimer = null;
window.filterPrecos = function () {
    const input = document.getElementById('search');
    state.searchTerm = input ? (input.value || '').trim() : '';
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => loadPrecos(1), 300);
};

function renderPrecos() {
    const root = document.getElementById('precosList');
    if (!root) return;

    if (!state.precos.length) {
        root.innerHTML = '<div class="m-empty">Nenhum preço encontrado</div>';
        return;
    }

    root.innerHTML = state.precos.map(p => {
        const precoFormatado = 'R$ ' + p.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `
            <div class="m-card" onclick="editPreco('${p.id}')">
                <div class="m-card-header">
                    <span class="m-marca">${escHtml(p.marca_nome || p.marca)}</span>
                    <span class="m-preco">${precoFormatado}</span>
                </div>
                <div class="m-card-body">
                    <div class="m-row"><span>Código</span><strong>${escHtml(p.codigo)}</strong></div>
                    <div class="m-row"><span>Descrição</span><strong>${escHtml(p.descricao)}</strong></div>
                    <div class="m-row"><span>Responsável</span><strong>${escHtml(p.vendedor || '—')}</strong></div>
                    <div class="m-row"><span>Alterado</span><strong>${getTimeAgo(p.timestamp)}</strong></div>
                </div>
                <div class="m-card-actions">
                    <button class="m-btn edit" onclick="event.stopPropagation();editPreco('${p.id}')">Editar</button>
                    <button class="m-btn del"  onclick="event.stopPropagation();abrirExclusao('${p.id}')">Excluir</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderPagination() {
    const root = document.getElementById('pagination');
    if (!root) return;
    root.innerHTML = '';

    if (state.totalPages <= 1) return;

    const prev = document.createElement('button');
    prev.textContent = '‹';
    prev.disabled = state.currentPage === 1;
    prev.onclick = () => mudarPagina(state.currentPage - 1);
    root.appendChild(prev);

    const total = state.totalPages;
    const atual = state.currentPage;
    const paginas = [];
    if (total <= 5) {
        for (let i = 1; i <= total; i++) paginas.push(i);
    } else {
        paginas.push(1);
        if (atual > 3) paginas.push('...');
        for (let i = Math.max(2, atual - 1); i <= Math.min(total - 1, atual + 1); i++) paginas.push(i);
        if (atual < total - 2) paginas.push('...');
        paginas.push(total);
    }

    paginas.forEach(p => {
        if (p === '...') {
            const span = document.createElement('span');
            span.textContent = '…';
            span.style.padding = '0.5rem';
            span.style.color = '#9CA3AF';
            root.appendChild(span);
            return;
        }
        const btn = document.createElement('button');
        btn.textContent = p;
        if (p === atual) btn.classList.add('active');
        btn.onclick = () => mudarPagina(p);
        root.appendChild(btn);
    });

    const next = document.createElement('button');
    next.textContent = '›';
    next.disabled = state.currentPage === state.totalPages;
    next.onclick = () => mudarPagina(state.currentPage + 1);
    root.appendChild(next);
}

async function mudarPagina(page) {
    await loadPrecos(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.mudarPagina = mudarPagina;

function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

window.toggleForm = function () { abrirForm(null); };

function abrirForm(editId) {
    const existing = document.getElementById('formModal');
    if (existing) existing.remove();

    const p = editId ? state.precos.find(x => String(x.id) === String(editId)) : null;

    const responsavelTexto = (p && p.vendedor) ? p.vendedor : '';

    document.body.insertAdjacentHTML('beforeend', `
        <div class="m-modal-overlay" id="formModal">
            <div class="m-modal">
                <div class="m-modal-header">
                    <h2>${editId ? 'Editar Preço' : 'Novo Preço'}</h2>
                    <button class="m-close" onclick="fecharForm(true)">✕</button>
                </div>
                <form class="m-form" onsubmit="handleSubmit(event)">
                    <input type="hidden" id="modalEditId" value="${editId || ''}">
                    <label>Marca *</label>
                    <input type="text" id="modalMarca" value="${p ? escHtml(p.marca_nome || p.marca) : ''}" required>
                    <label>Código *</label>
                    <input type="text" id="modalCodigo" value="${p ? escHtml(p.codigo) : ''}" required>
                    <label>Preço (R$) *</label>
                    <input type="number" id="modalPreco" step="0.01" min="0.01" value="${p ? p.preco.toFixed(2) : ''}" required>
                    <label>Responsável</label>
                    <input type="text" id="modalVendedor" value="${escHtml(responsavelTexto)}" disabled>
                    <label>Descrição *</label>
                    <input type="text" id="modalDescricao" value="${p ? escHtml(p.descricao) : ''}" required>
                    <div class="m-form-actions">
                        <button type="button" class="m-btn secondary" onclick="fecharForm(true)">Cancelar</button>
                        <button type="submit" class="m-btn primary" id="modalSubmitBtn">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    `);
}

window.fecharForm = function (cancelado) {
    const m = document.getElementById('formModal');
    if (m) m.remove();
    if (cancelado) {
        const id = document.getElementById('modalEditId')?.value;
        showToast(id ? 'Atualização cancelada' : 'Registro cancelado', 'error');
    }
};

window.handleSubmit = async function (e) {
    e.preventDefault();

    const editId = document.getElementById('modalEditId').value.trim();
    const marca = document.getElementById('modalMarca').value.trim().toUpperCase();
    const codigo = document.getElementById('modalCodigo').value.trim();
    const preco = parseFloat(document.getElementById('modalPreco').value);
    const descricao = document.getElementById('modalDescricao').value.trim().toUpperCase();

    if (!marca || !codigo || !descricao) { showToast('Preencha todos os campos', 'error'); return; }
    if (isNaN(preco) || preco <= 0) { showToast('Preço inválido', 'error'); return; }

    const btn = document.getElementById('modalSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Aguarde...';

    try {
        const url = editId ? `${API_URL}/${editId}` : API_URL;
        const method = editId ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify({ marca, codigo, preco, descricao })
        });

        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (res.status === 409) {
            showToast('Código já cadastrado', 'error');
            return;
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Erro ' + res.status);
        }

        document.getElementById('formModal').remove();
        showToast(editId ? 'Item atualizado' : 'Item cadastrado', 'success');
        await carregarTudo();
    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar';
    }
};

window.editPreco = function (id) { abrirForm(id); };

window.abrirExclusao = function (id) {
    deleteTargetId = id;
    const existing = document.getElementById('deleteModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', `
        <div class="m-modal-overlay" id="deleteModal">
            <div class="m-modal">
                <div class="m-modal-header">
                    <h2>Excluir</h2>
                    <button class="m-close" onclick="fecharExclusao()">✕</button>
                </div>
                <p class="m-confirm-msg">Tem certeza que deseja excluir este preço?</p>
                <div class="m-form-actions centered">
                    <button type="button" class="m-btn secondary" onclick="fecharExclusao()">Não</button>
                    <button type="button" class="m-btn primary" onclick="confirmarExclusao()">Sim</button>
                </div>
            </div>
        </div>
    `);
};

window.fecharExclusao = function () {
    deleteTargetId = null;
    const m = document.getElementById('deleteModal');
    if (m) m.remove();
};

window.confirmarExclusao = async function () {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    fecharExclusao();
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (!res.ok && res.status !== 204) throw new Error('Erro ' + res.status);
        showToast('Preço excluído', 'success');
        await carregarTudo();
    } catch {
        showToast('Erro ao excluir', 'error');
    }
};

window.sincronizarDados = async function () {
    const btn = document.querySelector('.m-sync-btn');
    if (!btn) return;
    btn.classList.add('spinning');
    try {
        await carregarTudo();
        showToast('Sincronização concluída', 'success');
    } catch {
        showToast('Erro na sincronização', 'error');
    } finally {
        setTimeout(() => btn.classList.remove('spinning'), 600);
    }
};

function getTimeAgo(timestamp) {
    if (!timestamp) return 'Sem data';
    const past = new Date(timestamp);
    if (isNaN(past.getTime())) return 'Data inválida';
    const diff = Math.floor((Date.now() - past.getTime()) / 1000);
    if (diff < 60) return diff + 's';
    if (diff < 3600) return Math.floor(diff / 60) + 'min';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd';
    return past.toLocaleDateString('pt-BR');
}

function showToast(msg, type) {
    document.querySelectorAll('.m-toast').forEach(t => t.remove());
    const el = document.createElement('div');
    el.className = 'm-toast ' + type;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.transition = 'opacity 0.3s';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

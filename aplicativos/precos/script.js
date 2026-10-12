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
let modalPrecoIndex = -1;

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
            <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem;">${msg || 'SEM ACESSO'}</h1>
            <p style="color: #5B6470; margin-bottom: 2rem; font-size: 0.95rem;">Você não tem permissão para acessar este módulo.</p>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { showDenied('SESSÃO EXPIRADA'); return; }
    await carregarTudo();
});

async function carregarTudo() {
    try {
        await loadPrecos(state.currentPage);
        await atualizarMarcasDisponiveis();
    } catch (err) {
        console.error('Erro ao carregar:', err);
    } finally {
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'ir-module-ready', module: 'precos' }, '*');
            }
        } catch (e) {}
    }
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
    select.innerHTML = '<option value="TODAS">TODAS AS MARCAS</option>';
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
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Erro ' + res.status);
        }

        const result = await res.json();
        if (Array.isArray(result)) {
            state.precos = result.map(normalizePreco);
            state.totalRecords = result.length;
            state.totalPages = 1;
            state.currentPage = 1;
        } else {
            state.precos = (result.data || []).map(normalizePreco);
            state.totalRecords = typeof result.total === 'number' ? result.total : state.precos.length;
            state.totalPages = result.totalPages || 1;
            state.currentPage = result.page || page;
        }
        renderPrecos();
        renderPaginacao();
    } catch (err) {
        console.error(err);
        showToast('Erro ao carregar preços: ' + err.message, 'error');
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
    const tbody = document.getElementById('precosTableBody');
    if (!tbody) return;

    if (!state.precos.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;">Nenhum preço encontrado</td></tr>';
        return;
    }

    tbody.innerHTML = state.precos.map(p => {
        const precoFormatado = 'R$ ' + p.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const atualizadoPor = primeiroNome(p.vendedor);
        return `
            <tr>
                <td><strong>${escHtml(p.marca_nome || p.marca || '')}</strong></td>
                <td>${escHtml(p.codigo)}</td>
                <td>${precoFormatado}</td>
                <td>${escHtml(p.descricao)}</td>
                <td>${escHtml(atualizadoPor || '—')}</td>
                <td style="color:var(--text-secondary);font-size:0.85rem;">${formatarUltimaAtualizacao(p.timestamp)}</td>
                <td class="actions-cell" style="text-align:center;">
                    <button onclick="editPreco('${p.id}')" class="action-btn edit">Editar</button>
                    <button onclick="abrirExclusao('${p.id}')" class="action-btn delete">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');
}

function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderPaginacao() {
    const existing = document.getElementById('paginacaoContainer');
    if (existing) existing.remove();

    const tableCard = document.querySelector('.table-card');
    if (!tableCard) return;

    const total = state.totalPages;
    const atual = state.currentPage;
    const inicio = state.totalRecords === 0 ? 0 : (atual - 1) * PAGE_SIZE + 1;
    const fim = Math.min(atual * PAGE_SIZE, state.totalRecords);

    const paginas = [];
    if (total <= 7) {
        for (let i = 1; i <= total; i++) paginas.push(i);
    } else {
        paginas.push(1);
        if (atual > 3) paginas.push('...');
        for (let i = Math.max(2, atual - 1); i <= Math.min(total - 1, atual + 1); i++) paginas.push(i);
        if (atual < total - 2) paginas.push('...');
        paginas.push(total);
    }

    const botoesHTML = paginas.map(p => {
        if (p === '...') return '<span class="pag-ellipsis">…</span>';
        const cls = 'pag-btn' + (p === atual ? ' pag-btn-active' : '');
        return `<button class="${cls}" onclick="mudarPagina(${p})">${p}</button>`;
    }).join('');

    const infoText = state.totalRecords > 0
        ? `Exibindo ${inicio}–${fim} de ${state.totalRecords} registros`
        : 'Nenhum registro';

    const div = document.createElement('div');
    div.id = 'paginacaoContainer';
    div.className = 'paginacao-wrapper';
    div.innerHTML = `
        <div class="paginacao-info">${infoText}</div>
        <div class="paginacao-btns">
            <button class="pag-btn pag-nav" onclick="mudarPagina(${atual - 1})" ${atual === 1 ? 'disabled' : ''}>‹</button>
            ${botoesHTML}
            <button class="pag-btn pag-nav" onclick="mudarPagina(${atual + 1})" ${atual === total ? 'disabled' : ''}>›</button>
        </div>`;
    tableCard.appendChild(div);
}

window.mudarPagina = async function (page) {
    await loadPrecos(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.toggleForm = function () { abrirForm(null); };

function primeiroNome(nome) {
    const texto = String(nome || '').trim();
    return texto ? texto.split(/\s+/)[0].toUpperCase() : '';
}

function formatarUltimaAtualizacao(timestamp) {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function getTimeAgo(timestamp) { return formatarUltimaAtualizacao(timestamp); }

function atualizarNavegacaoPreco() {
    const prev = document.getElementById('btnPrecoPrevious');
    const next = document.getElementById('btnPrecoNext');
    const editando = modalPrecoIndex >= 0;
    if (!prev || !next) return;
    prev.style.display = editando && modalPrecoIndex > 0 ? 'inline-flex' : 'none';
    next.style.display = editando && modalPrecoIndex < state.precos.length - 1 ? 'inline-flex' : 'none';
}

window.switchPrecoTab = function(id, button) {
    document.querySelectorAll('#formModal .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#formModal .tab-content').forEach(c => c.classList.remove('active'));
    if (button) button.classList.add('active');
    const tab = document.getElementById(id);
    if (tab) tab.classList.add('active');
};

function preencherFormPreco(p, editId) {
    document.getElementById('modalEditId').value = editId || '';
    document.getElementById('modalMarca').value = p ? (p.marca_nome || p.marca) : '';
    document.getElementById('modalCodigo').value = p ? p.codigo : '';
    document.getElementById('modalPreco').value = p ? p.preco.toFixed(2) : '';
    document.getElementById('modalDescricao').value = p ? p.descricao : '';
    document.getElementById('modalVendedor').value = p ? primeiroNome(p.vendedor) : '';
    document.getElementById('modalTimestamp').value = p ? formatarUltimaAtualizacao(p.timestamp) : 'Será definido ao salvar';
}

function abrirForm(editId) {
    const isEditing = !!editId;
    modalPrecoIndex = isEditing ? state.precos.findIndex(x => String(x.id) === String(editId)) : -1;
    const p = modalPrecoIndex >= 0 ? state.precos[modalPrecoIndex] : null;

    document.getElementById('modalTitle').textContent = isEditing ? 'Editar Preço' : 'Novo Preço';
    preencherFormPreco(p, editId || '');
    document.getElementById('modalSubmitBtn').textContent = isEditing ? 'Atualizar' : 'Salvar';
    document.getElementById('formModal').classList.add('show');
    switchPrecoTab('preco-tab-geral', document.querySelector('#formModal .tab-btn'));
    atualizarNavegacaoPreco();
    setTimeout(() => document.getElementById('modalMarca').focus(), 100);
}

window.previousPrecoRecord = function () {
    if (modalPrecoIndex <= 0) return;
    modalPrecoIndex -= 1;
    const p = state.precos[modalPrecoIndex];
    document.getElementById('modalTitle').textContent = 'Editar Preço';
    preencherFormPreco(p, p.id);
    atualizarNavegacaoPreco();
};

window.nextPrecoRecord = function () {
    if (modalPrecoIndex < 0 || modalPrecoIndex >= state.precos.length - 1) return;
    modalPrecoIndex += 1;
    const p = state.precos[modalPrecoIndex];
    document.getElementById('modalTitle').textContent = 'Editar Preço';
    preencherFormPreco(p, p.id);
    atualizarNavegacaoPreco();
};

window.fecharForm = function (cancelado) {
    document.getElementById('formModal').classList.remove('show');
    modalPrecoIndex = -1;
    if (cancelado) {
        const id = document.getElementById('modalEditId').value;
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

    if (!marca || !codigo || !descricao) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    if (isNaN(preco) || preco <= 0) {
        showToast('Informe um preço válido maior que zero', 'error');
        return;
    }

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
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'Código já cadastrado', 'error');
            return;
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Erro ' + res.status);
        }

        document.getElementById('formModal').classList.remove('show');
        modalPrecoIndex = -1;
        showToast(editId ? 'Item atualizado' : 'Item cadastrado', 'success');
        await carregarTudo();
    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = document.getElementById('modalEditId').value ? 'Atualizar' : 'Salvar';
    }
};

window.editPreco = function (id) { abrirForm(id); };

window.abrirExclusao = function (id) {
    deleteTargetId = id;
    document.getElementById('deleteModal').classList.add('show');
};
window.fecharExclusao = function () {
    deleteTargetId = null;
    document.getElementById('deleteModal').classList.remove('show');
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
    const btn = document.getElementById('syncBtn');
    if (!btn) return;
    btn.classList.add('spinning');
    btn.disabled = true;
    try {
        await carregarTudo();
        showToast('Sincronização concluída', 'success');
    } catch {
        showToast('Erro na sincronização', 'error');
    } finally {
        setTimeout(() => {
            btn.classList.remove('spinning');
            btn.disabled = false;
        }, 600);
    }
};

function showToast(message, type) {
    type = type || 'success';
    document.querySelectorAll('.floating-message').forEach(m => m.remove());
    const div = document.createElement('div');
    div.className = 'floating-message ' + type;
    div.textContent = String(message || '');
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.transition = 'opacity 0.3s';
        div.style.opacity = '0';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

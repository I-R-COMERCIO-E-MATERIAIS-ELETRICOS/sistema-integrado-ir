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
        <div class="access-denied">
            <h1>${msg || 'ACESSO NEGADO'}</h1>
            <p>Você não tem permissão para acessar este módulo.</p>
            <a href="/portal">Voltar ao Portal</a>
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
        return `
            <tr>
                <td><strong>${escHtml(p.marca_nome || p.marca || '')}</strong></td>
                <td>${escHtml(p.codigo)}</td>
                <td>${precoFormatado}</td>
                <td>${escHtml(p.descricao)}</td>
                <td>${escHtml(p.vendedor || '—')}</td>
                <td style="color:var(--text-secondary);font-size:0.85rem;">${getTimeAgo(p.timestamp)}</td>
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

function abrirForm(editId) {
    const existing = document.getElementById('formModal');
    if (existing) existing.classList.remove('show');

    const isEditing = !!editId;
    const p = isEditing ? state.precos.find(x => String(x.id) === String(editId)) : null;

    document.getElementById('modalTitle').textContent = isEditing ? 'Editar Preço' : 'Novo Preço';
    document.getElementById('modalEditId').value = editId || '';
    document.getElementById('modalMarca').value = p ? (p.marca_nome || p.marca) : '';
    document.getElementById('modalCodigo').value = p ? p.codigo : '';
    document.getElementById('modalPreco').value = p ? p.preco.toFixed(2) : '';
    document.getElementById('modalDescricao').value = p ? p.descricao : '';

    const vendedorInput = document.getElementById('modalVendedor');
    if (isEditing && p && p.vendedor) {
        vendedorInput.value = p.vendedor;
    } else {
        vendedorInput.value = '';
    }

    document.getElementById('formModal').classList.add('show');
    setTimeout(() => document.getElementById('modalMarca').focus(), 100);
}

window.fecharForm = function (cancelado) {
    document.getElementById('formModal').classList.remove('show');
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

function getTimeAgo(timestamp) {
    if (!timestamp) return 'Sem data';
    const past = new Date(timestamp);
    if (isNaN(past.getTime())) return 'Data inválida';
    const diff = Math.floor((Date.now() - past.getTime()) / 1000);
    if (diff < 0) return 'agora';
    if (diff < 60) return diff + 's';
    if (diff < 3600) return Math.floor(diff / 60) + 'min';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd';
    return past.toLocaleDateString('pt-BR');
}

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

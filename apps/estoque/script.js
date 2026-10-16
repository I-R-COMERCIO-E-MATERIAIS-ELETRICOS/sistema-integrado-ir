// apps/estoque/script.js
const API_URL = window.location.origin + '/api';
const SESSION_KEY = 'irUserSession';
const MODULE_SESSION_KEY = 'estoqueSession';

const state = {
    items: [],
    grupos: [],
    searchTerm: '',
    marcaFiltro: '',
    grupoFiltro: '',
    isLoading: false
};

let sessionToken = null;
let isOnline = true;
let editingId = null;
let formTabIdx = 0;
const FORM_TABS = ['produto', 'fornecedor', 'movimentacoes'];
let currentMovimentacoes = [];

document.addEventListener('DOMContentLoaded', () => verificarAutenticacao());

// ─── AUTH ────────────────────────────────────────────────────────────────
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
            const stored = sessionStorage.getItem(SESSION_KEY);
            if (stored) {
                const s = JSON.parse(stored);
                sessionToken = s.sessionToken || s.token || null;
            }
        } catch (_) {}
    }

    if (!sessionToken) {
        if (window.IR) IR.denied('Sessão expirada'); else mostrarTelaAcessoNegado();
        return;
    }
    if (window.IR) IR.setToken(sessionToken);
    inicializarApp();
}

function mostrarTelaAcessoNegado(msg) {
    document.body.innerHTML =
        '<div class="access-denied"><h1>' + escHtml(msg || 'NÃO AUTORIZADO') + '</h1>' +
        '<p>Somente usuários autenticados podem acessar esta área.</p>' +
        '<a href="/portal">Ir para o Portal</a></div>';
}

// ─── INIT ────────────────────────────────────────────────────────────────
function inicializarApp() {
    carregarTudo();
    setInterval(() => { if (!state.isLoading) carregarTudo(true); }, 30000);
}

async function carregarTudo(silencioso) {
    try {
        await Promise.all([carregarGrupos(), carregarItens()]);
        if (!silencioso) renderItens();
    } catch (e) {
        if (!silencioso) console.error(e);
    }
}

// ─── HEADERS ─────────────────────────────────────────────────────────────
function getHeaders(extra) {
    return Object.assign({
        'Accept': 'application/json',
        'X-Session-Token': sessionToken || ''
    }, extra || {});
}

async function fetchJSON(url, opts) {
    opts = opts || {};
    opts.headers = getHeaders(opts.headers);
    const r = await fetch(url, opts);
    if (r.status === 401) {
        sessionStorage.removeItem(MODULE_SESSION_KEY);
        if (window.IR) IR.denied('Sua sessão expirou'); else mostrarTelaAcessoNegado('Sua sessão expirou');
        throw new Error('Sessão expirada');
    }
    return r;
}

// ─── DADOS ───────────────────────────────────────────────────────────────
async function carregarGrupos() {
    try {
        const r = await fetchJSON(API_URL + '/estoque/grupos');
        if (!r.ok) throw new Error('Erro grupos');
        state.grupos = await r.json();
        renderFiltroGrupos();
    } catch (e) { console.error('Grupos:', e); }
}

async function carregarItens() {
    state.isLoading = true;
    try {
        const r = await fetchJSON(API_URL + '/estoque');
        if (!r.ok) throw new Error('Erro itens');
        state.items = await r.json();
        isOnline = true;
        renderItens();
        renderFiltroMarcas();
    } catch (e) {
        isOnline = false;
        console.error('Itens:', e);
    } finally {
        state.isLoading = false;
    }
}

// ─── RENDER ──────────────────────────────────────────────────────────────
function getFiltrados() {
    const q = state.searchTerm.toLowerCase().trim();
    const m = state.marcaFiltro;
    const g = state.grupoFiltro;
    return state.items.filter(it => {
        if (q) {
            const blob = [it.codigo, it.descricao, it.marca, it.modelo].join(' ').toLowerCase();
            if (!blob.includes(q)) return false;
        }
        if (m && String(it.marca || '').toUpperCase() !== m) return false;
        if (g && String(it.grupo || '').toUpperCase() !== g) return false;
        return true;
    });
}

function renderItens() {
    const tbody = document.getElementById('estoqueTableBody');
    const lista = getFiltrados();

    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">Nenhum item encontrado</td></tr>';
        atualizarTotais([]);
        return;
    }

    tbody.innerHTML = lista.map(it => {
        const vu = Number(it.valor_unitario || 0);
        const qtd = Number(it.quantidade || 0);
        const vuFmt = 'R$ ' + vu.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `<tr data-id="${escHtml(it.id)}">
            <td><strong>${escHtml(it.codigo || '')}</strong></td>
            <td>${escHtml(it.descricao || '')}</td>
            <td>${escHtml(it.grupo || '')}</td>
            <td>${vuFmt}</td>
            <td>${qtd}</td>
            <td class="actions-cell" style="text-align:center;">
                <button class="action-btn edit"  onclick="event.stopPropagation();openFormModal('${escHtml(it.id)}')">Editar</button>
                <button class="action-btn entry" onclick="event.stopPropagation();abrirMovimentacao('${escHtml(it.id)}','entrada')">Entrada</button>
                <button class="action-btn exit"  onclick="event.stopPropagation();abrirMovimentacao('${escHtml(it.id)}','saida')">Saída</button>
            </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('tr[data-id]').forEach(tr => {
        tr.addEventListener('click', () => abrirVisualizacao(tr.dataset.id));
    });

    atualizarTotais(lista);
}

function atualizarTotais(lista) {
    const qtd = lista.reduce((a, it) => a + Number(it.quantidade || 0), 0);
    const valor = lista.reduce((a, it) => a + Number(it.quantidade || 0) * Number(it.valor_unitario || 0), 0);
    document.getElementById('totalQtd').textContent = String(qtd);
    document.getElementById('totalValor').textContent = 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderFiltroMarcas() {
    const sel = document.getElementById('filterMarca');
    const atual = sel.value;
    const marcas = [...new Set(state.items.map(i => String(i.marca || '').toUpperCase()).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">Todas as Marcas</option>' +
        marcas.map(m => `<option value="${escHtml(m)}">${escHtml(m)}</option>`).join('');
    if (atual && marcas.includes(atual)) sel.value = atual;
}

function renderFiltroGrupos() {
    const sel = document.getElementById('filterGrupo');
    const atual = sel.value;
    sel.innerHTML = '<option value="">Todos os Grupos</option>' +
        state.grupos.map(g => `<option value="${escHtml(g.abreviacao)}">${escHtml(g.abreviacao)} — ${escHtml(g.nome)}</option>`).join('');
    if (atual) sel.value = atual;
}

// ─── FILTROS ─────────────────────────────────────────────────────────────
let searchDebounce = null;
window.filterItems = function () {
    state.searchTerm = document.getElementById('search').value || '';
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(renderItens, 200);
};
window.selecionarMarca = function (v) { state.marcaFiltro = (v || '').toUpperCase(); renderItens(); };
window.selecionarGrupo = function (v) { state.grupoFiltro = (v || '').toUpperCase(); renderItens(); };

window.sincronizarDados = async function () {
    const btn = document.querySelector('.sync-btn');
    if (btn) { btn.classList.add('spinning'); btn.style.pointerEvents = 'none'; }
    try {
        await carregarTudo();
        if (window.IR) IR.toast('Dados sincronizados', 'success');
    } catch (e) {
        if (window.IR) IR.toast('Erro ao sincronizar', 'error');
    } finally {
        if (btn) setTimeout(() => { btn.classList.remove('spinning'); btn.style.pointerEvents = ''; }, 600);
    }
};

// ─── UTILS ───────────────────────────────────────────────────────────────
function escHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function fmtDate(v) {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '—';
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ═══════════════════════════════════════════════════════════════════════
// MODAL DE FORMULÁRIO (CRIAR / EDITAR)
// ═══════════════════════════════════════════════════════════════════════
window.openFormModal = async function (id) {
    editingId = id || null;
    formTabIdx = 0;
    currentMovimentacoes = [];
    const isEditing = !!id;

    if (!state.grupos.length) await carregarGrupos();

    let it = null;
    if (isEditing) {
        it = state.items.find(x => x.id === id);
        if (!it) return;
        try {
            const r = await fetchJSON(API_URL + '/estoque/' + id + '/movimentacoes');
            if (r.ok) currentMovimentacoes = await r.json();
        } catch (_) {}
    }

    const modalId = 'formModal';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const gruposOpts = state.grupos.map(g =>
        `<option value="${escHtml(g.abreviacao)}" ${it && it.grupo === g.abreviacao ? 'selected' : ''}>${escHtml(g.abreviacao)} — ${escHtml(g.nome)}</option>`
    ).join('');

    const movRows = currentMovimentacoes.length
        ? currentMovimentacoes.map(m => `
            <tr>
                <td>${m.numero_pedido || '—'}</td>
                <td class="mov-${m.tipo}">${m.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA'}</td>
                <td>${escHtml(m.atualizado_por || '—')}</td>
                <td>${fmtDate(m.ultima_atualizacao || m.created_at)}</td>
                <td>${m.quantidade}</td>
            </tr>`).join('')
        : '<tr><td colspan="5" class="empty-mov">Sem movimentações registradas.</td></tr>';

    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-overlay show" id="${modalId}">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${isEditing ? 'Editar Item' : 'Novo Item'}</h3>
                    <button class="close-modal" onclick="closeFormModal(true)">✕</button>
                </div>
                <form id="estoqueForm" onsubmit="handleSubmit(event)">
                    <input type="hidden" id="formEditId" value="${escHtml(id || '')}">

                    <div class="tabs-nav">
                        <button type="button" class="tab-btn active" onclick="switchFormTab('produto')">Produto</button>
                        <button type="button" class="tab-btn"        onclick="switchFormTab('fornecedor')">Fornecedor</button>
                        <button type="button" class="tab-btn"        onclick="switchFormTab('movimentacoes')">Movimentações</button>
                    </div>

                    <!-- TAB PRODUTO -->
                    <div class="tab-content active" id="form-tab-produto">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>ID Estoque</label>
                                <input type="text" id="formCodigo" value="${escHtml(it?.codigo || 'Gerado ao salvar')}" readonly tabindex="-1">
                            </div>
                            <div class="form-group">
                                <label>Grupo *</label>
                                <div class="input-with-btn">
                                    <select id="formGrupo" required ${isEditing ? '' : ''}>
                                        <option value="">Selecione...</option>
                                        ${gruposOpts}
                                    </select>
                                    <button type="button" class="btn-plus" title="Novo Grupo" onclick="abrirNovoGrupo()">+</button>
                                </div>
                            </div>
                            <div class="form-group full-width">
                                <label>Descrição *</label>
                                <textarea id="formDescricao" rows="2" required ${isEditing ? '' : ''}>${escHtml(it?.descricao || '')}</textarea>
                            </div>
                            <div class="form-group">
                                <label>Valor Unitário (R$) *</label>
                                <input type="number" id="formValorUnit" step="0.01" min="0" value="${it ? Number(it.valor_unitario || 0).toFixed(2) : ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Quantidade</label>
                                <input type="number" id="formQuantidade" value="${it ? it.quantidade : 0}" readonly tabindex="-1">
                            </div>
                            <div class="form-group">
                                <label>Valor Total</label>
                                <input type="text" id="formValorTotal" value="" readonly tabindex="-1">
                            </div>
                        </div>
                    </div>

                    <!-- TAB FORNECEDOR -->
                    <div class="tab-content" id="form-tab-fornecedor">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Marca</label>
                                <input type="text" id="formMarca" value="${escHtml(it?.marca || '')}" ${isEditing ? 'readonly tabindex="-1"' : ''}>
                            </div>
                            <div class="form-group">
                                <label>Modelo</label>
                                <input type="text" id="formModelo" value="${escHtml(it?.modelo || '')}" ${isEditing ? 'readonly tabindex="-1"' : ''}>
                            </div>
                        </div>
                    </div>

                    <!-- TAB MOVIMENTAÇÕES -->
                    <div class="tab-content" id="form-tab-movimentacoes">
                        ${isEditing ? `
                            <table class="mov-table">
                                <thead>
                                    <tr>
                                        <th>Nº Pedido</th>
                                        <th>Tipo</th>
                                        <th>Atualizado Por</th>
                                        <th>Última Atualização</th>
                                        <th>Quantidade</th>
                                    </tr>
                                </thead>
                                <tbody>${movRows}</tbody>
                            </table>
                        ` : '<p class="empty-mov">Disponível após o item ser salvo.</p>'}
                    </div>

                    <div class="modal-actions">
                        <button type="button" id="formBtnPrev" onclick="formPrevTab()" class="secondary tab-prev" style="display:none">Anterior</button>
                        <button type="button" id="formBtnNext" onclick="formNextTab()" class="secondary tab-next">Próximo</button>
                        <button type="submit" class="save">${isEditing ? 'Atualizar' : 'Salvar'}</button>
                        <button type="button" onclick="closeFormModal(true)" class="cancel-close">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>`);

    showFormTab(0);
    recalcularValorTotalForm();
    ['formValorUnit', 'formQuantidade'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', recalcularValorTotalForm);
    });

    // Aplica uppercase em Marca/Modelo/Descrição
    ['formMarca', 'formModelo', 'formDescricao'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', e => {
            const s = e.target.selectionStart;
            e.target.value = e.target.value.toUpperCase();
            try { e.target.setSelectionRange(s, s); } catch (_) {}
        });
    });
};

function recalcularValorTotalForm() {
    const vu = parseFloat(document.getElementById('formValorUnit')?.value) || 0;
    const qtd = parseInt(document.getElementById('formQuantidade')?.value, 10) || 0;
    const total = vu * qtd;
    document.getElementById('formValorTotal').value = 'R$ ' + total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showFormTab(i) {
    formTabIdx = Math.max(0, Math.min(FORM_TABS.length - 1, i));
    document.querySelectorAll('#formModal .tab-btn').forEach((b, k) => b.classList.toggle('active', k === formTabIdx));
    document.querySelectorAll('#formModal .tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('form-tab-' + FORM_TABS[formTabIdx])?.classList.add('active');
    const prev = document.getElementById('formBtnPrev');
    const next = document.getElementById('formBtnNext');
    if (prev) prev.style.display = formTabIdx > 0 ? 'inline-flex' : 'none';
    if (next) next.style.display = formTabIdx < FORM_TABS.length - 1 ? 'inline-flex' : 'none';
}
window.switchFormTab = function (name) { showFormTab(FORM_TABS.indexOf(name)); };
window.formNextTab = function () { showFormTab(formTabIdx + 1); };
window.formPrevTab = function () { showFormTab(formTabIdx - 1); };

window.closeFormModal = function (showToastMsg) {
    const modal = document.getElementById('formModal');
    if (modal) {
        if (showToastMsg) {
            const editing = document.getElementById('formEditId')?.value;
            if (window.IR) IR.toast(editing ? 'Atualização cancelada' : 'Registro cancelado', 'error');
        }
        modal.style.animation = 'fadeOut 0.2s ease forwards';
        setTimeout(() => modal.remove(), 200);
    }
};

// ─── SUBMIT ──────────────────────────────────────────────────────────────
window.handleSubmit = async function (e) {
    e.preventDefault();
    const id = document.getElementById('formEditId').value.trim();
    const grupo = document.getElementById('formGrupo').value.trim().toUpperCase();
    const descricao = document.getElementById('formDescricao').value.trim().toUpperCase();
    const valorUnit = parseFloat(document.getElementById('formValorUnit').value);
    const marca = document.getElementById('formMarca').value.trim().toUpperCase();
    const modelo = document.getElementById('formModelo').value.trim().toUpperCase();

    if (!descricao || !grupo) {
        if (window.IR) IR.toast(IR.ERRO_CAMPOS_OBRIGATORIOS, 'error');
        return;
    }
    if (!(valorUnit >= 0)) {
        if (window.IR) IR.toast('Informe um valor unitário válido', 'error');
        return;
    }

    const btn = document.querySelector('#estoqueForm button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Aguarde...'; }

    try {
        const url = id ? `${API_URL}/estoque/${id}` : `${API_URL}/estoque`;
        const method = id ? 'PUT' : 'POST';
        const body = { descricao, grupo, valor_unitario: valorUnit, marca, modelo };

        const r = await fetchJSON(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!r.ok) {
            let err = {};
            try { err = await r.json(); } catch (_) {}
            if (window.IR) IR.toast(err.error || `Erro ${r.status}`, 'error');
            if (btn) { btn.disabled = false; btn.textContent = id ? 'Atualizar' : 'Salvar'; }
            return;
        }

        closeFormModal(false);
        if (window.IR) IR.toast(id ? 'Item atualizado com sucesso' : 'Item cadastrado com sucesso', 'success');
        await carregarItens();
    } catch (err) {
        if (window.IR) IR.toast('Erro: ' + (err.message || 'desconhecido'), 'error');
        if (btn) { btn.disabled = false; btn.textContent = id ? 'Atualizar' : 'Salvar'; }
    }
};

// ─── GRUPOS (criação inline) ─────────────────────────────────────────────
window.abrirNovoGrupo = function () {
    const exist = document.getElementById('novoGrupoModal');
    if (exist) exist.remove();

    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-overlay show" id="novoGrupoModal">
            <div class="modal-content ir-modal-confirm" style="max-width:460px;">
                <button class="close-modal ir-close" onclick="fecharNovoGrupo()">✕</button>
                <p class="ir-confirm-msg" style="text-align:left;font-size:1.05rem;">Novo Grupo</p>
                <div class="form-group" style="text-align:left;">
                    <label>Nome do Grupo *</label>
                    <input type="text" id="novoGrupoNome" placeholder="Ex: Iluminação" autocomplete="off">
                </div>
                <div class="form-group" style="text-align:left;">
                    <label>Abreviação (4 letras) *</label>
                    <input type="text" id="novoGrupoAbrev" maxlength="4" placeholder="ILUM" autocomplete="off" style="text-transform:uppercase;letter-spacing:2px;text-align:center;font-weight:700;">
                </div>
                <div class="ir-confirm-actions" style="margin-top:1rem;">
                    <button type="button" class="ir-btn-green" onclick="confirmarNovoGrupo()">Salvar</button>
                    <button type="button" class="ir-btn-red" onclick="fecharNovoGrupo()">Cancelar</button>
                </div>
            </div>
        </div>`);

    ['novoGrupoNome', 'novoGrupoAbrev'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', e => {
            const s = e.target.selectionStart;
            e.target.value = e.target.value.toUpperCase();
            try { e.target.setSelectionRange(s, s); } catch (_) {}
        });
    });
    setTimeout(() => document.getElementById('novoGrupoNome')?.focus(), 100);
};

window.fecharNovoGrupo = function () {
    const m = document.getElementById('novoGrupoModal');
    if (m) { m.style.animation = 'fadeOut 0.2s ease forwards'; setTimeout(() => m.remove(), 200); }
};

window.confirmarNovoGrupo = async function () {
    const nome = (document.getElementById('novoGrupoNome').value || '').trim().toUpperCase();
    const abrev = (document.getElementById('novoGrupoAbrev').value || '').trim().toUpperCase();

    if (!nome || !/^[A-Z]{4}$/.test(abrev)) {
        if (window.IR) IR.toast('Preencha o nome e a abreviação com exatamente 4 letras', 'error');
        return;
    }

    try {
        const r = await fetchJSON(API_URL + '/estoque/grupos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, abreviacao: abrev })
        });
        if (!r.ok) {
            let err = {}; try { err = await r.json(); } catch (_) {}
            if (window.IR) IR.toast(err.error || 'Erro ao criar grupo', 'error');
            return;
        }
        await carregarGrupos();
        // seleciona o grupo criado no select do form
        const sel = document.getElementById('formGrupo');
        if (sel) sel.value = abrev;
        fecharNovoGrupo();
        if (window.IR) IR.toast('Grupo criado com sucesso', 'success');
    } catch (e) {
        if (window.IR) IR.toast('Erro ao criar grupo', 'error');
    }
};

// ─── MOVIMENTAÇÃO (Entrada / Saída) ──────────────────────────────────────
window.abrirMovimentacao = function (id, tipo) {
    const it = state.items.find(x => x.id === id);
    if (!it) return;
    const exist = document.getElementById('movModal');
    if (exist) exist.remove();

    const titulo = tipo === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque';
    const cor = tipo === 'entrada' ? 'green' : 'red';

    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-overlay show" id="movModal">
            <div class="modal-content ir-modal-confirm" style="max-width:460px;">
                <button class="close-modal ir-close" onclick="fecharMovModal()">✕</button>
                <p class="ir-confirm-msg" style="font-weight:600;margin-bottom:1rem;">
                    ${titulo} — <strong>${escHtml(it.codigo)}</strong>
                </p>
                <p style="color:#6B7280;font-size:.9rem;margin-bottom:1rem;">${escHtml(it.descricao)}</p>
                <div class="form-group" style="text-align:left;">
                    <label>Quantidade *</label>
                    <input type="number" id="movQtd" min="1" step="1" value="1"
                           style="text-align:center;font-size:1.1rem;font-weight:700;">
                </div>
                <div class="ir-confirm-actions" style="margin-top:1.5rem;">
                    <button type="button" class="ir-btn-${cor}" onclick="confirmarMovimentacao('${id}','${tipo}')">Confirmar</button>
                    <button type="button" class="ir-btn-red" onclick="fecharMovModal()">Cancelar</button>
                </div>
            </div>
        </div>`);
    setTimeout(() => {
        const inp = document.getElementById('movQtd');
        if (inp) { inp.focus(); inp.select(); }
    }, 100);
};

window.fecharMovModal = function () {
    const m = document.getElementById('movModal');
    if (m) { m.style.animation = 'fadeOut 0.2s ease forwards'; setTimeout(() => m.remove(), 200); }
};

window.confirmarMovimentacao = async function (id, tipo) {
    const qtd = parseInt(document.getElementById('movQtd').value, 10);
    if (!Number.isInteger(qtd) || qtd <= 0) {
        if (window.IR) IR.toast('Informe uma quantidade inteira maior que zero', 'error');
        return;
    }
    try {
        const r = await fetchJSON(`${API_URL}/estoque/${id}/movimentacao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo, quantidade: qtd })
        });
        if (!r.ok) {
            let err = {}; try { err = await r.json(); } catch (_) {}
            if (window.IR) IR.toast(err.error || 'Erro na movimentação', 'error');
            return;
        }
        fecharMovModal();
        if (window.IR) IR.toast(tipo === 'entrada' ? 'Entrada registrada' : 'Saída registrada', 'success');
        await carregarItens();
    } catch (e) {
        if (window.IR) IR.toast('Erro na movimentação', 'error');
    }
};

// ─── VISUALIZAÇÃO ────────────────────────────────────────────────────────
window.abrirVisualizacao = async function (id) {
    const it = state.items.find(x => x.id === id);
    if (!it) return;
    let movs = [];
    try {
        const r = await fetchJSON(API_URL + '/estoque/' + id + '/movimentacoes');
        if (r.ok) movs = await r.json();
    } catch (_) {}

    const movRows = movs.length
        ? movs.map(m => `
            <tr>
                <td>${m.numero_pedido || '—'}</td>
                <td class="mov-${m.tipo}">${m.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA'}</td>
                <td>${escHtml(m.atualizado_por || '—')}</td>
                <td>${fmtDate(m.ultima_atualizacao || m.created_at)}</td>
                <td>${m.quantidade}</td>
            </tr>`).join('')
        : '<tr><td colspan="5" class="empty-mov">Sem movimentações registradas.</td></tr>';

    const vuFmt = 'R$ ' + Number(it.valor_unitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const totalFmt = 'R$ ' + (Number(it.valor_unitario || 0) * Number(it.quantidade || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const exist = document.getElementById('viewModal');
    if (exist) exist.remove();

    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-overlay show" id="viewModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${escHtml(it.codigo)}</h3>
                    <button class="close-modal" onclick="fecharViewModal()">✕</button>
                </div>
                <div class="form-grid">
                    <div class="form-group full-width"><label>Descrição</label><input type="text" value="${escHtml(it.descricao)}" readonly></div>
                    <div class="form-group"><label>Grupo</label><input type="text" value="${escHtml(it.grupo)}" readonly></div>
                    <div class="form-group"><label>Marca</label><input type="text" value="${escHtml(it.marca || '—')}" readonly></div>
                    <div class="form-group"><label>Modelo</label><input type="text" value="${escHtml(it.modelo || '—')}" readonly></div>
                    <div class="form-group"><label>Valor Unitário</label><input type="text" value="${vuFmt}" readonly></div>
                    <div class="form-group"><label>Quantidade em Estoque</label><input type="text" value="${it.quantidade}" readonly></div>
                    <div class="form-group"><label>Valor Total</label><input type="text" value="${totalFmt}" readonly></div>
                    <div class="form-group"><label>Atualizado Por</label><input type="text" value="${escHtml(it.atualizado_por || '—')}" readonly></div>
                    <div class="form-group"><label>Última Atualização</label><input type="text" value="${fmtDate(it.ultima_atualizacao)}" readonly></div>
                </div>
                <h4 style="margin:1rem 0 .5rem;font-size:.95rem;color:var(--primary);">Movimentações</h4>
                <table class="mov-table">
                    <thead><tr><th>Nº Pedido</th><th>Tipo</th><th>Atualizado Por</th><th>Última Atualização</th><th>Quantidade</th></tr></thead>
                    <tbody>${movRows}</tbody>
                </table>
                <div class="modal-actions">
                    <button type="button" class="cancel-close" onclick="fecharViewModal()">Fechar</button>
                </div>
            </div>
        </div>`);
};

window.fecharViewModal = function () {
    const m = document.getElementById('viewModal');
    if (m) { m.style.animation = 'fadeOut 0.2s ease forwards'; setTimeout(() => m.remove(), 200); }
};

// ═══════════════════════════════════════════════════════════════════════
// PDF
// ═══════════════════════════════════════════════════════════════════════
window.gerarPDFEstoque = async function () {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        if (window.IR) IR.toast('Biblioteca PDF indisponível', 'error');
        return;
    }
    const { jsPDF } = window.jspdf;
    const lista = getFiltrados();
    if (!lista.length) {
        if (window.IR) IR.toast('Nenhum item para gerar PDF', 'error');
        return;
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const margin = 12;
    const tw = pw - margin * 2;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    const titulo = state.grupoFiltro
        ? `ESTOQUE — GRUPO ${state.grupoFiltro}`
        : (state.marcaFiltro ? `ESTOQUE — MARCA ${state.marcaFiltro}` : 'ESTOQUE');
    doc.text(titulo, pw / 2, 15, { align: 'center' });

    // Data e hora
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const now = new Date();
    const p = n => String(n).padStart(2, '0');
    const dtStr = `${p(now.getDate())}/${p(now.getMonth() + 1)}/${now.getFullYear()} ${p(now.getHours())}:${p(now.getMinutes())}`;
    doc.text(`Emissão: ${dtStr}`, pw / 2, 21, { align: 'center' });

    // Nome do grupo (se selecionado)
    let y = 28;
    if (state.grupoFiltro) {
        const g = state.grupos.find(x => x.abreviacao === state.grupoFiltro);
        if (g) {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
            doc.text(`${g.abreviacao} — ${g.nome}`, margin, y);
            y += 5;
        }
    } else {
        y += 2;
    }

    // Colunas
    const cols = [
        { w: tw * 0.10, t: 'ID',         a: 'left'   },
        { w: tw * 0.13, t: 'MARCA',      a: 'left'   },
        { w: tw * 0.15, t: 'MODELO',     a: 'left'   },
        { w: tw * 0.30, t: 'DESCRIÇÃO',  a: 'left'   },
        { w: tw * 0.10, t: 'QUANTIDADE', a: 'center' },
        { w: tw * 0.11, t: 'VALOR UNIT.',a: 'right'  },
        { w: tw * 0.11, t: 'VALOR TOTAL',a: 'right'  }
    ];

    function drawHead() {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        let x = margin;
        const hh = 8;
        cols.forEach(c => {
            doc.setFillColor(235, 235, 235);
            doc.rect(x, y, c.w, hh, 'F');
            doc.setDrawColor(120); doc.setLineWidth(0.2);
            doc.rect(x, y, c.w, hh, 'S');
            doc.setTextColor(0);
            doc.text(c.t, x + c.w / 2, y + 5, { align: 'center' });
            x += c.w;
        });
        y += hh;
    }

    drawHead();

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);

    let totalQtd = 0;
    let totalValor = 0;
    const lineH = 4.2;

    for (const it of lista) {
        const rowVals = [
            String(it.codigo || ''),
            String(it.marca || ''),
            String(it.modelo || ''),
            String(it.descricao || ''),
            String(it.quantidade ?? 0),
            'R$ ' + Number(it.valor_unitario || 0).toFixed(2).replace('.', ','),
            'R$ ' + (Number(it.valor_unitario || 0) * Number(it.quantidade || 0)).toFixed(2).replace('.', ',')
        ];
        const wrapped = rowVals.map((v, i) => doc.splitTextToSize(v, cols[i].w - 2));
        const rowH = Math.max(7, wrapped.reduce((m, w) => Math.max(m, w.length), 1) * lineH + 2);

        if (y + rowH > ph - 20) { doc.addPage(); y = 15; drawHead(); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); }

        let x = margin;
        cols.forEach((c, i) => {
            doc.setDrawColor(150); doc.setLineWidth(0.15);
            doc.rect(x, y, c.w, rowH, 'S');
            const tx = c.a === 'right' ? x + c.w - 1.5 : (c.a === 'center' ? x + c.w / 2 : x + 1.5);
            wrapped[i].forEach((ln, k) => doc.text(ln, tx, y + 4 + k * lineH, { align: c.a }));
            x += c.w;
        });
        y += rowH;

        totalQtd += Number(it.quantidade || 0);
        totalValor += Number(it.quantidade || 0) * Number(it.valor_unitario || 0);
    }

    // Totais
    y += 4;
    if (y + 20 > ph - 20) { doc.addPage(); y = 15; }

    doc.setDrawColor(0); doc.setLineWidth(0.4);
    doc.line(margin, y, pw - margin, y);
    y += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(`QUANTIDADE TOTAL EM ESTOQUE: ${totalQtd}`, margin, y);
    doc.text(`VALOR TOTAL EM ESTOQUE: R$ ${totalValor.toFixed(2).replace('.', ',')}`, pw - margin, y, { align: 'right' });

    // Nome do arquivo
    const sufixo = state.grupoFiltro ? ` - ${state.grupoFiltro}` : (state.marcaFiltro ? ` - ${state.marcaFiltro}` : '');
    doc.save(`ESTOQUE${sufixo} ${p(now.getDate())}-${p(now.getMonth() + 1)}-${now.getFullYear()}.pdf`);
    if (window.IR) IR.toast('PDF gerado', 'success');
};

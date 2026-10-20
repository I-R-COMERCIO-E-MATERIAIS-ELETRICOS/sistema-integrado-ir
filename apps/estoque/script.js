/* ============================================================================
 * apps/estoque/script.js — FRONTEND
 * ========================================================================== */

const API_BASE = '/api/estoque';
const SESSION_KEY = 'irUserSession';
const MODULE_SESSION_KEY = 'estoqueSession';
const PORTAL_URL = window.location.origin;

let allItems = [];
let grupos = [];
let editingId = null;
let filtros = { search: '', marca: '', grupo: '' };
let currentFormTabIndex = 0;
let currentViewTabIndex = 0;
const formTabs = ['tab-produto', 'tab-fornecedor', 'tab-valores'];
const viewTabs = ['tab-v-produto', 'tab-v-fornecedor', 'tab-v-valores'];

// ─── Autenticação e API ─────────────────────────────────────────────────────
function getSessionToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('sessionToken');
    if (tokenFromUrl) {
        sessionStorage.setItem(MODULE_SESSION_KEY, tokenFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
        return tokenFromUrl;
    }
    let token = sessionStorage.getItem(MODULE_SESSION_KEY);
    if (token) return token;
    try {
        const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            token = parsed.token || parsed.sessionToken || null;
            if (token) return token;
        }
    } catch (e) { }
    return null;
}

async function api(endpoint, options = {}) {
    const token = getSessionToken();
    const headers = { 'Accept': 'application/json', ...options.headers };
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (token) headers['X-Session-Token'] = token;

    const response = await fetch(endpoint, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        sessionStorage.removeItem(MODULE_SESSION_KEY);
        if (window.IR && typeof IR.denied === 'function') IR.denied('Sua sessão expirou.');
        else window.location.href = PORTAL_URL + '/?logout=1&reason=session';
        throw new Error('Sessão expirada');
    }

    if (!response.ok) {
        let errData = {};
        try { errData = await response.json(); } catch {}
        throw new Error(errData.error || `Erro HTTP: ${response.status}`);
    }

    if (response.status === 204) return null;
    try { return await response.json(); } catch { return {}; }
}

// ─── Utilidades ─────────────────────────────────────────────────────────────
function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function notificar(message, type = 'success') {
    document.querySelectorAll('.floating-message').forEach(msg => msg.remove());
    const messageDiv = document.createElement('div');
    messageDiv.className = `floating-message ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => { 
        messageDiv.style.animation = 'slideOutBottom 0.3s ease forwards'; 
        setTimeout(() => messageDiv.remove(), 300); 
    }, 3000);
}

function getMesAnoAtual() {
    const d = new Date();
    const meses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    return `${meses[d.getMonth()]}-${d.getFullYear()}`;
}

// ─── Ciclo de vida dos modais ───────────────────────────────────────────────
function criarModal(htmlInterno) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = htmlInterno;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) fecharModal(overlay); });
    return overlay;
}

function fecharModal(overlay) {
    if (!overlay || !overlay.parentNode) return;
    overlay.style.animation = 'fadeOut 0.2s ease forwards';
    setTimeout(() => overlay.remove(), 200);
}

function fecharTodosModais() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
}

// ─── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const token = getSessionToken();
    if (!token) {
        if (window.IR && typeof IR.denied === 'function') IR.denied('Sessão expirada.');
        else window.location.href = PORTAL_URL + '/?logout=1&reason=session';
        return;
    }

    const tbody = document.getElementById('estoqueTableBody');
    if (tbody) {
        tbody.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('.id-cell')) return;
            const tr = e.target.closest('tr[data-id]');
            if (tr) openViewModal(tr.dataset.id);
        });
    }
    carregarGrupos();
    carregarEstoque();

    // Atualização automática a cada 5s
    setInterval(() => {
        carregarEstoque(true); 
    }, 5000);
});

// ─── Carregamento ───────────────────────────────────────────────────────────
async function carregarGrupos() {
    try {
        grupos = await api(`${API_BASE}/grupos`);
        preencherFiltroGrupos();
    } catch (e) { console.error('Erro ao carregar grupos', e); }
}

async function carregarEstoque(silent = false) {
    try {
        const novaLista = await api(API_BASE);
        
        if (JSON.stringify(novaLista) !== JSON.stringify(allItems)) {
            allItems = novaLista;
            preencherFiltroMarcas();
            renderTable();
            if (!silent) console.log('Estoque atualizado em tempo real.');
        }
    } catch (e) {
        if (!silent) {
            console.error('Erro ao carregar estoque', e);
            notificar('Erro ao carregar estoque', 'error');
        }
    }
}

function preencherFiltroGrupos() {
    const sel = document.getElementById('filterGrupo');
    if (!sel) return;
    const valorAtual = sel.value;
    sel.innerHTML = '<option value="">Todos os Grupos</option>';
    grupos.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.abreviacao;
        opt.textContent = `${g.nome} (${g.abreviacao})`;
        sel.appendChild(opt);
    });
    sel.value = valorAtual;
}

function preencherFiltroMarcas() {
    const sel = document.getElementById('filterMarca');
    if (!sel) return;
    const valorAtual = sel.value;
    const marcas = [...new Set(allItems.map(i => i.marca).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    sel.innerHTML = '<option value="">Todas as Marcas</option>';
    marcas.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        sel.appendChild(opt);
    });
    sel.value = valorAtual;
}

// ─── Filtros e render ───────────────────────────────────────────────────────
function filterItems() {
    const el = document.getElementById('search');
    filtros.search = el ? el.value.toLowerCase().trim() : '';
    renderTable();
}

function selecionarMarca(value) {
    filtros.marca = value || '';
    renderTable();
}

function selecionarGrupo(value) {
    filtros.grupo = value || '';
    renderTable();
}

function getFilteredItems() {
    return allItems.filter(item => {
        if (filtros.marca && (item.marca || '') !== filtros.marca) return false;
        if (filtros.grupo && (item.grupo || '') !== filtros.grupo) return false;
        if (filtros.search) {
            const hay = [item.codigo, item.descricao, item.marca, item.modelo, item.grupo].join(' ').toLowerCase();
            if (!hay.includes(filtros.search)) return false;
        }
        return true;
    });
}

function renderTable() {
    const tbody = document.getElementById('estoqueTableBody');
    if (!tbody) return;

    const items = getFilteredItems();

    if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-secondary);">Nenhum item encontrado.</td></tr>`;
    } else {
        tbody.innerHTML = items.map(item => `
            <tr data-id="${escapeHtml(item.id)}">
                <td class="id-cell"><strong>${escapeHtml(item.codigo)}</strong></td>
                <td>${escapeHtml(item.descricao || '')}</td>
                <td>${escapeHtml(item.grupo || '')}</td>
                <td>${formatCurrency(item.valor_unitario)}</td>
                <td>${Number(item.quantidade) || 0}</td>
                <td class="actions-cell" style="text-align:center;">
                    <button type="button" class="action-btn edit"  onclick="event.stopPropagation(); openFormModal('${escapeHtml(item.id)}')">Editar</button>
                    <button type="button" class="action-btn entry" onclick="event.stopPropagation(); openMovModal('${escapeHtml(item.id)}', 'entrada')">Entrada</button>
                    <button type="button" class="action-btn exit"  onclick="event.stopPropagation(); openMovModal('${escapeHtml(item.id)}', 'saida')">Saída</button>
                </td>
            </tr>
        `).join('');
    }

    updateTotals(items);
}

function updateTotals(items) {
    const totalQtd = items.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
    const totalValor = items.reduce((s, i) => s + ((Number(i.valor_unitario) || 0) * (Number(i.quantidade) || 0)), 0);
    const qEl = document.getElementById('totalQtd');
    const vEl = document.getElementById('totalValor');
    if (qEl) qEl.textContent = totalQtd;
    if (vEl) vEl.textContent = formatCurrency(totalValor);
}

// ─── Modal de Visualização (Abas e Navegação) ───────────────────────────────
async function openViewModal(id) {
    const item = allItems.find(i => String(i.id) === String(id));
    if (!item) return;

    currentViewTabIndex = 0;

    const html = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2 class="modal-title">Visualizar Item</h2>
                <button type="button" class="close-modal" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            
            <div class="tabs-nav">
                <button class="tab-btn active" onclick="switchViewTab(0)">Produto</button>
                <button class="tab-btn" onclick="switchViewTab(1)">Fornecedor</button>
                <button class="tab-btn" onclick="switchViewTab(2)">Valores</button>
            </div>

            <div class="tab-content active" id="tab-v-produto">
                <div class="info-section">
                    <h4>Dados do Produto</h4>
                    <div class="info-row"><span class="info-label">ID (Código):</span><span class="info-value">${escapeHtml(item.codigo)}</span></div>
                    <div class="info-row"><span class="info-label">Descrição:</span><span class="info-value">${escapeHtml(item.descricao)}</span></div>
                    <div class="info-row"><span class="info-label">Grupo:</span><span class="info-value">${escapeHtml(item.grupo)}</span></div>
                    <div class="info-row"><span class="info-label">NCM:</span><span class="info-value">${escapeHtml(item.ncm || '-')}</span></div>
                </div>
            </div>

            <div class="tab-content" id="tab-v-fornecedor">
                <div class="info-section">
                    <h4>Dados do Fornecedor</h4>
                    <div class="info-row"><span class="info-label">Marca:</span><span class="info-value">${escapeHtml(item.marca || '-')}</span></div>
                    <div class="info-row"><span class="info-label">Modelo:</span><span class="info-value">${escapeHtml(item.modelo || '-')}</span></div>
                </div>
            </div>

            <div class="tab-content" id="tab-v-valores">
                <div class="info-section">
                    <h4>Estoque e Valores</h4>
                    <div class="info-row"><span class="info-label">Valor Unitário:</span><span class="info-value">${formatCurrency(item.valor_unitario)}</span></div>
                    <div class="info-row"><span class="info-label">Quantidade em Estoque:</span><span class="info-value">${Number(item.quantidade) || 0}</span></div>
                    <div class="info-row"><span class="info-label">Valor Total em Estoque:</span><span class="info-value">${formatCurrency((item.valor_unitario || 0) * (item.quantidade || 0))}</span></div>
                </div>
                <!-- Auditoria removida -->
            </div>

            <div class="modal-actions" style="justify-content: space-between;">
                <div>
                    <button type="button" id="btnViewPrev" onclick="prevViewTab()" class="secondary" style="display:none; margin-right: 0.5rem;">Anterior</button>
                    <button type="button" id="btnViewNext" onclick="nextViewTab()" class="secondary">Próximo</button>
                </div>
                <div>
                    <button type="button" class="cancel-close" style="background:#6B7280; margin:0;" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
                </div>
            </div>
        </div>
    `;

    criarModal(html);
    updateViewNavButtons();
}

function switchViewTab(index) {
    currentViewTabIndex = index;
    document.querySelectorAll('.tabs-nav .tab-btn').forEach((btn, i) => btn.classList.toggle('active', i === index));
    viewTabs.forEach((id, i) => document.getElementById(id).classList.toggle('active', i === index));
    updateViewNavButtons();
}

function nextViewTab() { if (currentViewTabIndex < viewTabs.length - 1) switchViewTab(currentViewTabIndex + 1); }
function prevViewTab() { if (currentViewTabIndex > 0) switchViewTab(currentViewTabIndex - 1); }

function updateViewNavButtons() {
    const prev = document.getElementById('btnViewPrev');
    const next = document.getElementById('btnViewNext');
    if(prev) prev.style.display = currentViewTabIndex === 0 ? 'none' : 'inline-block';
    if(next) next.style.display = currentViewTabIndex === viewTabs.length - 1 ? 'none' : 'inline-block';
}

// ─── Formulário de Item (Abas e Navegação) ──────────────────────────────────
function openFormModal(id) {
    editingId = id || null;
    const item = id ? allItems.find(i => String(i.id) === String(id)) : null;
    currentFormTabIndex = 0;

    const html = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h2 class="modal-title">${item ? 'Editar Item' : 'Novo Item'}</h2>
                <button type="button" class="close-modal" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <form id="formItem">
                <div class="tabs-nav">
                    <button type="button" class="tab-btn active" onclick="switchFormTab(0)">Produto</button>
                    <button type="button" class="tab-btn" onclick="switchFormTab(1)">Fornecedor</button>
                    <button type="button" class="tab-btn" onclick="switchFormTab(2)">Valores</button>
                </div>

                <!-- ABA PRODUTO -->
                <div class="tab-content active" id="tab-produto">
                    <div class="form-grid">
                        ${item ? `
                        <div class="form-group full-width">
                            <label>ID (Código)</label>
                            <input type="text" value="${escapeHtml(item.codigo)}" readonly style="background:#eef1f5;cursor:not-allowed;">
                        </div>` : ''}
                        
                        <div class="form-group">
                            <label>Descrição *</label>
                            <input type="text" id="fDescricao" required maxlength="255" value="${item ? escapeHtml(item.descricao) : ''}">
                        </div>
                        
                        <div class="form-group">
                            <label>Grupo *</label>
                            ${item ? `
                            <select id="fGrupo" required>
                                ${grupos.map(g => `<option value="${escapeHtml(g.abreviacao)}" ${item.grupo === g.abreviacao ? 'selected' : ''}>${escapeHtml(g.nome)} (${escapeHtml(g.abreviacao)})</option>`).join('')}
                            </select>
                            ` : `
                            <div class="input-with-btn">
                                <select id="fGrupo" required>
                                    <option value="">Selecione...</option>
                                    ${grupos.map(g => `<option value="${escapeHtml(g.abreviacao)}">${escapeHtml(g.nome)} (${escapeHtml(g.abreviacao)})</option>`).join('')}
                                </select>
                                <button type="button" class="btn-plus" onclick="abrirModalNovoGrupo()" title="Novo grupo">+</button>
                            </div>
                            `}
                        </div>
                        
                        <div class="form-group full-width">
                            <label>NCM</label>
                            <input type="text" id="fNcm" maxlength="20" value="${item ? escapeHtml(item.ncm || '') : ''}">
                        </div>
                    </div>
                </div>

                <!-- ABA FORNECEDOR -->
                <div class="tab-content" id="tab-fornecedor">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Marca</label>
                            <input type="text" id="fMarca" maxlength="100" value="${item ? escapeHtml(item.marca || '') : ''}">
                        </div>
                        <div class="form-group">
                            <label>Modelo</label>
                            <input type="text" id="fModelo" maxlength="100" value="${item ? escapeHtml(item.modelo || '') : ''}">
                        </div>
                    </div>
                </div>

                <!-- ABA VALORES -->
                <div class="tab-content" id="tab-valores">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Valor Unitário (R$)</label>
                            <input type="number" step="0.01" min="0" id="fValor" value="${item ? Number(item.valor_unitario) || 0 : '0.00'}">
                        </div>
                        <div class="form-group">
                            <label>Quantidade</label>
                            <input type="number" id="fQtd" value="${item ? Number(item.quantidade) || 0 : '0'}" ${item ? 'readonly style="background:#eef1f5;cursor:not-allowed;" title="A quantidade só pode ser alterada via Entrada/Saída"' : ''}>
                        </div>
                    </div>
                </div>

                <div class="modal-actions" style="justify-content: space-between;">
                    <div>
                        <button type="button" id="btnFormPrev" onclick="prevFormTab()" class="secondary" style="display:none; margin-right: 0.5rem;">Anterior</button>
                        <button type="button" id="btnFormNext" onclick="nextFormTab()" class="secondary">Próximo</button>
                    </div>
                    <div>
                        <button type="submit" class="save" style="margin-right: 0.5rem;">${item ? 'Atualizar' : 'Salvar'}</button>
                        <button type="button" class="cancel-close" style="background:#6B7280; margin:0;" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    </div>
                </div>
            </form>
        </div>
    `;

    const overlay = criarModal(html);
    overlay.querySelector('#formItem').addEventListener('submit', (e) => salvarItem(e, overlay));
    updateFormNavButtons();
}

function switchFormTab(index) {
    currentFormTabIndex = index;
    const form = document.getElementById('formItem');
    form.querySelectorAll('.tab-btn').forEach((btn, i) => btn.classList.toggle('active', i === index));
    formTabs.forEach((id, i) => document.getElementById(id).classList.toggle('active', i === index));
    updateFormNavButtons();
}

function nextFormTab() { if (currentFormTabIndex < formTabs.length - 1) switchFormTab(currentFormTabIndex + 1); }
function prevFormTab() { if (currentFormTabIndex > 0) switchFormTab(currentFormTabIndex - 1); }

function updateFormNavButtons() {
    const prev = document.getElementById('btnFormPrev');
    const next = document.getElementById('btnFormNext');
    if(prev) prev.style.display = currentFormTabIndex === 0 ? 'none' : 'inline-block';
    if(next) next.style.display = currentFormTabIndex === formTabs.length - 1 ? 'none' : 'inline-block';
}

async function salvarItem(e, overlay) {
    e.preventDefault();
    const descricao = document.getElementById('fDescricao').value.trim();
    const grupo = document.getElementById('fGrupo').value.trim();
    const valor = parseFloat(document.getElementById('fValor').value) || 0;
    const marca = document.getElementById('fMarca').value.trim();
    const modelo = document.getElementById('fModelo').value.trim();
    const ncm = document.getElementById('fNcm').value.trim();

    if (!descricao) return notificar('Informe a descrição', 'error');
    if (!grupo) return notificar('Selecione o grupo', 'error');

    try {
        if (editingId) {
            await api(`${API_BASE}/${editingId}`, {
                method: 'PUT',
                body: JSON.stringify({ descricao, grupo, valor_unitario: valor, marca, modelo, ncm })
            });
        } else {
            const qtd = parseInt(document.getElementById('fQtd').value, 10) || 0;
            await api(API_BASE, {
                method: 'POST',
                body: JSON.stringify({ descricao, grupo, valor_unitario: valor, quantidade: qtd, marca, modelo, ncm })
            });
        }

        fecharModal(overlay);
        notificar(editingId ? 'Item atualizado com sucesso!' : 'Item criado com sucesso!', 'success');
        await carregarEstoque();
    } catch (err) {
        notificar(err.message, 'error');
    }
}

// ─── Modal de Entrada / Saída ──────────────────────────────────────────────
function openMovModal(id, tipo) {
    const item = allItems.find(i => String(i.id) === String(id));
    if (!item) return notificar('Item não encontrado', 'error');

    const tipoLabel = tipo === 'entrada' ? 'Entrada' : 'Saída';

    const html = `
        <div class="modal-content ir-modal-confirm" style="text-align:left;">
            <button type="button" class="close-modal" onclick="this.closest('.modal-overlay').remove()">✕</button>
            <h2 class="modal-title" style="margin-bottom:0.75rem; text-align:center;">${tipoLabel} de Estoque</h2>
            <p style="text-align:center; color:var(--text-secondary); font-size:0.9rem; margin-bottom:1rem;">
                ${escapeHtml(item.codigo)} — ${escapeHtml(item.descricao)}
            </p>
            <div class="form-group">
                <label>Quantidade *</label>
                <input type="number" min="1" id="fMovQtd" value="1" style="text-align:center; font-size:1.2rem;">
                <p style="margin-top:0.5rem; color:var(--text-secondary); font-size:0.85rem; text-align:center;">
                    Estoque atual: <strong>${Number(item.quantidade) || 0}</strong>
                </p>
            </div>
            <div class="ir-confirm-actions">
                <button type="button" class="ir-btn-red" id="btnCancelarMov">Cancelar</button>
                <button type="button" class="ir-btn-green" id="btnConfirmarMov">Confirmar ${tipoLabel}</button>
            </div>
        </div>
    `;

    const overlay = criarModal(html);
    const input = overlay.querySelector('#fMovQtd');
    setTimeout(() => input.focus(), 100);

    overlay.querySelector('#btnCancelarMov').onclick = () => {
        fecharModal(overlay);
        notificar('Operação cancelada', 'error');
    };
    
    overlay.querySelector('#btnConfirmarMov').onclick = async () => {
        const qtd = parseInt(input.value, 10);
        if (!qtd || qtd <= 0) return notificar('Informe uma quantidade válida', 'error');

        try {
            await api(`${API_BASE}/${item.id}/movimentacao`, {
                method: 'POST',
                body: JSON.stringify({ tipo, quantidade: qtd })
            });
            fecharModal(overlay);
            notificar(`${tipoLabel} registrada com sucesso!`, 'success');
            await carregarEstoque();
        } catch (err) {
            notificar(err.message, 'error');
        }
    };
}

// ─── Modal de novo grupo ────────────────────────────────────────────────────
function abrirModalNovoGrupo() {
    const html = `
        <div class="modal-content" style="max-width:460px;">
            <div class="modal-header">
                <h2 class="modal-title">Novo Grupo</h2>
                <button type="button" class="close-modal" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <form id="formGrupo">
                <div class="form-group">
                    <label>Nome do Grupo *</label>
                    <input type="text" id="gNome" required maxlength="100">
                </div>
                <div class="form-group">
                    <label>Abreviação (4 letras) *</label>
                    <input type="text" id="gAbrev" required maxlength="4" style="text-transform:uppercase;" oninput="this.value = this.value.toUpperCase().replace(/[^A-Z]/g, '')">
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-close" style="background:#6B7280;" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button type="submit" class="save">Criar Grupo</button>
                </div>
            </form>
        </div>
    `;

    const overlay = criarModal(html);
    overlay.querySelector('#formGrupo').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('gNome').value.trim();
        const abreviacao = document.getElementById('gAbrev').value.trim().toUpperCase();

        if (abreviacao.length !== 4) return notificar('A abreviação deve ter 4 letras', 'error');

        try {
            const data = await api(`${API_BASE}/grupos`, {
                method: 'POST',
                body: JSON.stringify({ nome, abreviacao })
            });

            fecharModal(overlay);
            await carregarGrupos();
            notificar('Grupo criado com sucesso!', 'success');
        } catch (err) {
            notificar(err.message, 'error');
        }
    });
}

// ─── Sincronização ──────────────────────────────────────────────────────────
async function sincronizarDados(btn) {
    if (btn) {
        btn.classList.add('spinning');
        setTimeout(() => btn.classList.remove('spinning'), 1000);
    }
    await Promise.all([carregarGrupos(), carregarEstoque()]);
    notificar('Dados sincronizados com sucesso!', 'success');
}

// ─── PDF DE ESTOQUE ────────────────────────────────────────────────────────
function gerarPDFEstoque() {
    try {
        const jsPDFConstructor = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
        if (!jsPDFConstructor) throw new Error('A biblioteca jsPDF não foi encontrada.');

        const doc = new jsPDFConstructor({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        if (typeof doc.autoTable !== 'function') throw new Error('O plugin autoTable não está carregado.');

        const items = getFilteredItems();
        if (items.length === 0) return notificar('Nenhum item para gerar PDF', 'error');

        // Título e Subtítulo
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Relatório de Estoque', 14, 16);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);

        // Agrupar itens
        const grouped = {};
        items.forEach(i => {
            const g = i.grupo || 'SEM GRUPO';
            if (!grouped[g]) grouped[g] = [];
            grouped[g].push(i);
        });

        let currentY = 32;
        let isFirstPage = true;

        for (const [grupo, lista] of Object.entries(grouped)) {
            if (!isFirstPage && currentY > 160) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(`GRUPO: ${grupo}`, 14, currentY);
            currentY += 6;

            const body = lista.map(i => [
                i.codigo || '', i.descricao || '', i.marca || '', i.modelo || '',
                formatCurrency(i.valor_unitario), String(Number(i.quantidade) || 0),
                formatCurrency((Number(i.valor_unitario) || 0) * (Number(i.quantidade) || 0))
            ]);

            const totalGrupo = lista.reduce((s, i) => s + ((Number(i.valor_unitario) || 0) * (Number(i.quantidade) || 0)), 0);

            doc.autoTable({
                startY: currentY,
                head: [['Código', 'Descrição', 'Marca', 'Modelo', 'Valor Unit.', 'Qtd', 'Total']],
                body: body,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 2, textColor: [0, 0, 0], lineColor: [200, 200, 200], lineWidth: 0.1, fillColor: [255, 255, 255] },
                headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0, 0, 0] },
                alternateRowStyles: { fillColor: [255, 255, 255] }
            });

            currentY = doc.lastAutoTable.finalY + 8;
            
            doc.setFont(undefined, 'bold');
            doc.setFontSize(10);
            doc.text(`VALOR TOTAL DO GRUPO: ${formatCurrency(totalGrupo)}`, 14, currentY);
            currentY += 15;
            isFirstPage = false;
        }

        const nomeMesAno = getMesAnoAtual();
        doc.save(`${nomeMesAno}-ESTOQUE.pdf`);
        notificar('PDF gerado com sucesso!', 'success');
    } catch (err) {
        console.error(err);
        notificar('Erro ao gerar PDF: ' + err.message, 'error');
    }
}

// ─── PDF DE MOVIMENTAÇÕES ──────────────────────────────────────────────────
async function gerarPDFMovimentacoes() {
    try {
        notificar('Gerando relatório de movimentações...', 'info');
        const movs = await api(`${API_BASE}/movimentacoes/todas`);
        
        if (!movs || movs.length === 0) return notificar('Nenhuma movimentação registrada', 'error');

        const jsPDFConstructor = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
        if (!jsPDFConstructor) throw new Error('Biblioteca jsPDF não encontrada.');
        const doc = new jsPDFConstructor({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // Título e Subtítulo
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Relatório de Movimentações', 14, 16);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);

        // Nomes dos meses para agrupamento
        const meses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

        // Agrupar por Mês/Ano
        const grouped = {};
        movs.forEach(m => {
            const date = new Date(m.created_at || m.ultima_atualizacao);
            const key = `${meses[date.getMonth()]} ${date.getFullYear()}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(m);
        });

        let currentY = 32;
        let isFirstPage = true;

        for (const [mesAno, lista] of Object.entries(grouped)) {
            if (!isFirstPage && currentY > 160) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(mesAno, 14, currentY);
            currentY += 6;

            const body = lista.map(m => [
                m.created_at ? new Date(m.created_at).toLocaleString('pt-BR') : '-',
                m.tipo.toUpperCase(),
                m.estoque?.codigo || m.codigo_estoque || '-',
                m.estoque?.descricao || '-',
                m.quantidade,
                m.atualizado_por || '-',
                m.numero_pedido || '-'
            ]);

            doc.autoTable({
                startY: currentY,
                head: [['Data/Hora', 'Tipo', 'Cód. Estoque', 'Descrição', 'Qtd', 'Responsável', 'Nº Pedido']],
                body: body,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], lineColor: [200, 200, 200], lineWidth: 0.1, fillColor: [255, 255, 255] },
                headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0, 0, 0] },
                alternateRowStyles: { fillColor: [255, 255, 255] }
            });

            currentY = doc.lastAutoTable.finalY + 15;
            isFirstPage = false;
        }

        const nomeMesAno = getMesAnoAtual();
        doc.save(`${nomeMesAno}-MOVIMENTAÇÕES.pdf`);
        notificar('Relatório de movimentações gerado!', 'success');
    } catch (err) {
        console.error(err);
        notificar('Erro ao gerar relatório: ' + err.message, 'error');
    }
}

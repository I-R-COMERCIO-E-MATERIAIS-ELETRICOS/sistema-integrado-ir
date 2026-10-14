// ============================================
// COTAÇÕES DE FRETE - script.js
// ============================================
const PORTAL_URL = window.location.origin;
const API_URL = `${window.location.origin}/api`;

let cotacoes = [];
let isOnline = false;
let editingId = null;
let sessionToken = null;
let currentUser = null;
let currentMonth = new Date();
let transportadorasCache = [];
let currentFetchController = null;
let pendingDeleteId = null;
let isLoading = false;
let podeMarcar = false;

const infoTabs = ['info-tab-geral', 'info-tab-transportadora', 'info-tab-observacoes'];
let currentInfoTabIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();
});

async function verificarAutenticacao() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('sessionToken');
    if (tokenFromUrl) {
        sessionToken = tokenFromUrl;
        sessionStorage.setItem('cotacoesSession', tokenFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        sessionToken = sessionStorage.getItem('cotacoesSession');
    }
    if (!sessionToken) {
        if (window.IR) IR.denied('Sessão expirada'); else mostrarTelaAcessoNegado();
        return;
    }
    if (window.IR) IR.setToken(sessionToken);
    try {
        const verifyRes = await fetch(`${PORTAL_URL}/api/verify-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionToken })
        });
        if (verifyRes.ok) {
            const sessionData = await verifyRes.json();
            if (sessionData.valid && sessionData.session) {
                currentUser = sessionData.session;
                sessionStorage.setItem('cotacoesUserData', JSON.stringify(currentUser));
            } else {
                if (window.IR) IR.denied('Sua sessão expirou'); else mostrarTelaAcessoNegado('Sua sessão expirou');
                return;
            }
        }
    } catch (e) {
        try {
            const userData = sessionStorage.getItem('cotacoesUserData');
            if (userData) currentUser = JSON.parse(userData);
        } catch (e2) {}
    }
    if (window.IR) {
        podeMarcar = await IR.podeConfirmar('ALMOXARIFADO');
        IR.preencherVendedores(document.getElementById('vendedor'));
    }
    inicializarApp();
}

function mostrarTelaAcessoNegado(mensagem = 'NÃO AUTORIZADO') {
    document.body.innerHTML = `<div class="access-denied"><h1>${mensagem}</h1><p>Somente usuários autenticados podem acessar esta área.</p><a href="${PORTAL_URL}">Ir para o Portal</a></div>`;
}

function inicializarApp() {
    updateDisplay();
    loadTransportadorasCache();
    loadCotacoes();
    setInterval(() => { if (isOnline) loadCotacoes(); }, 30000);
}

function showMessage(message, type = 'success') {
    if (window.IR && IR.toast) return IR.toast(message, type);
    const div = document.createElement('div');
    div.className = `floating-message ${type}`;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => { div.style.animation = 'slideOutBottom 0.3s ease forwards'; setTimeout(() => div.remove(), 300); }, 2000);
}

function formatarMoeda(valor) {
    const num = parseFloat(valor) || 0;
    return 'R$ ' + num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function formatarData(data) {
    if (!data) return '-';
    if (typeof data === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(data)) return data;
    const d = new Date(data);
    if (isNaN(d.getTime())) return data;
    return d.toLocaleDateString('pt-BR');
}
function getDataAtual() {
    const hoje = new Date();
    return `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
}

async function syncData() {
    const btn = document.getElementById('syncBtn');
    if (btn) { btn.classList.add('syncing'); btn.disabled = true; }
    try {
        await loadTransportadorasCache();
        await loadCotacoes();
        showMessage('Dados sincronizados', 'success');
    } catch (e) {
        showMessage('Erro ao sincronizar', 'error');
    } finally {
        if (btn) { btn.classList.remove('syncing'); btn.disabled = false; }
    }
}

function changeMonth(direction) {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
    updateDisplay();
    cotacoes = [];
    isLoading = true;
    renderTable();
    loadCotacoes();
}
function updateDisplay() { updateMonthDisplay(); renderTable(); }
function updateMonthDisplay() {
    const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const el = document.getElementById('currentMonth');
    if (el) el.textContent = `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
}

async function loadTransportadorasCache() {
    try {
        const response = await fetch(`${API_URL}/transportadoras?limit=200`, { headers: { 'X-Session-Token': sessionToken } });
        if (!response.ok) return;
        const data = await response.json();
        const lista = Array.isArray(data) ? data : (data.data || []);
        transportadorasCache = lista.map(t => t.nome.trim().toUpperCase()).filter(Boolean).sort();
        updateTransportadoraSelects();
    } catch (e) { console.error('Erro ao carregar transportadoras:', e); }
}
function updateTransportadoraSelects() {
    const selFilter = document.getElementById('filterTransportadora');
    if (selFilter) {
        const current = selFilter.value;
        selFilter.innerHTML = '<option value="">Transportadora</option>' + transportadorasCache.map(n => `<option value="${n}">${n}</option>`).join('');
        if (current) selFilter.value = current;
    }
    const selForm = document.getElementById('transportadora');
    if (selForm) {
        const current = selForm.value;
        selForm.innerHTML = '<option value="">Selecione...</option>' + transportadorasCache.map(n => `<option value="${n}">${n}</option>`).join('');
        if (current) selForm.value = current;
    }
}

async function loadCotacoes() {
    if (currentFetchController) currentFetchController.abort();
    currentFetchController = new AbortController();
    const signal = currentFetchController.signal;
    const mes = currentMonth.getMonth();
    const ano = currentMonth.getFullYear();
    isLoading = true;
    renderTable();
    try {
        const response = await fetch(`${API_URL}/cotacoes?mes=${mes}&ano=${ano}`, {
            headers: { 'X-Session-Token': sessionToken },
            cache: 'no-cache',
            signal
        });
        if (response.status === 401) {
            sessionStorage.removeItem('cotacoesSession');
            if (window.IR) IR.denied('SUA SESSÃO EXPIROU'); else mostrarTelaAcessoNegado('SUA SESSÃO EXPIROU');
            return;
        }
        if (!response.ok) { isOnline = false; isLoading = false; setTimeout(() => loadCotacoes(), 5000); return; }
        cotacoes = await response.json();
        isOnline = true;
        isLoading = false;
        currentFetchController = null;
        updateDisplay();
        updateResponsavelSelect();
    } catch (e) {
        if (e.name === 'AbortError') return;
        isOnline = false; isLoading = false;
        setTimeout(() => loadCotacoes(), 5000);
    }
}

function filterCotacoes() { renderTable(); }
function updateResponsavelSelect() {
    const responsaveis = new Set();
    cotacoes.forEach(c => { if (c.responsavel?.trim()) responsaveis.add(c.responsavel.trim()); });
    const sel = document.getElementById('filterResponsavel');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">Responsável</option>' + Array.from(responsaveis).sort().map(r => `<option value="${r}">${r}</option>`).join('');
    sel.value = current;
}

function renderTable() {
    const container = document.getElementById('cotacoesContainer');
    if (!container) return;

    if (isLoading && cotacoes.length === 0) {
        container.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;">Carregando...</td></tr>`;
        return;
    }

    const search = (document.getElementById('search')?.value || '').toLowerCase();
    const filterTransp = document.getElementById('filterTransportadora')?.value || '';
    const filterResp = document.getElementById('filterResponsavel')?.value || '';
    const filterStatus = document.getElementById('filterStatus')?.value || '';
    let filtered = [...cotacoes];

    if (search) {
        filtered = filtered.filter(c =>
            (c.transportadora || '').toLowerCase().includes(search) ||
            (c.destino || '').toLowerCase().includes(search) ||
            (c.documento || '').toLowerCase().includes(search) ||
            (c.numeroCotacao || '').toLowerCase().includes(search) ||
            (c.responsavel || '').toLowerCase().includes(search)
        );
    }
    if (filterTransp) filtered = filtered.filter(c => c.transportadora === filterTransp);
    if (filterResp) filtered = filtered.filter(c => c.responsavel === filterResp);
    if (filterStatus === 'aprovada') filtered = filtered.filter(c => c.negocioFechado === true);
    if (filterStatus === 'reprovada') filtered = filtered.filter(c => c.negocioFechado === false);

    if (filtered.length === 0) {
        if (currentFetchController) return;
        container.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;">Nenhuma cotação encontrada</td></tr>`;
        return;
    }

    container.innerHTML = filtered.map(c => {
        const aprovada = c.negocioFechado === true;
        return `<tr data-id="${c.id}" class="${aprovada ? 'row-fechada' : ''}" style="cursor:pointer;" onclick="viewCotacao(${c.id})">
            <td class="col-checkbox" style="text-align:center;">
                <div class="checkbox-wrapper">
                    <input type="checkbox" class="styled-checkbox" id="check-${c.id}" ${aprovada ? 'checked' : ''} ${podeMarcar ? '' : 'disabled title="Somente Almoxarifado e administradores"'} onchange="toggleStatus(${c.id}, this.checked)" onclick="event.stopPropagation()">
                    <label for="check-${c.id}" class="checkbox-label-styled" onclick="event.stopPropagation()"></label>
                </div>
            </td>
            <td class="col-codigo"><strong>${c.codigo || '-'}</strong></td>
            <td class="col-data">${formatarData(c.dataCotacao)}</td>
            <td class="col-transportadora"><strong>${c.transportadora || '-'}</strong></td>
            <td class="col-destino">${c.destino || '-'}</td>
            <td class="col-documento">${c.documento || c.numeroCotacao || '-'}</td>
            <td class="col-valor">${c.valorFrete ? formatarMoeda(c.valorFrete) : '-'}</td>
            <td class="col-alerta" style="text-align:center;">${parseObs(c).length ? `<button type="button" class="action-btn alert-icon" onclick="event.stopPropagation();abrirObservacoes(${c.id})" title="Ver observações" aria-label="Ver observações"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></button>` : ''}</td>
            <td class="col-acoes" onclick="event.stopPropagation()">
                <div class="actions-cell">
                    <button onclick="editCotacao(${c.id})" class="action-btn edit">Editar</button>
                    <button onclick="showDeleteModal(${c.id})" class="action-btn delete">Excluir</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function parseObs(c) {
    const raw = c && c.observacoes;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { const a = JSON.parse(raw); if (Array.isArray(a)) return a; } catch (e) {}
    return [{ texto: String(raw), timestamp: (c && (c.createdat || c.timestamp)) || null }];
}
function escHtmlObs(t) { return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function fmtObsData(ts) { return ts ? new Date(ts).toLocaleString('pt-BR') : ''; }
function renderObsLista(list, editable) {
    if (!list.length) return '<p style="color:var(--text-secondary);font-style:italic;text-align:center;padding:1.5rem;">Nenhuma observação registrada</p>';
    return list.map((o, i) => `<div class="observacao-item${editable ? '' : '-view'}"><div class="observacao-header"><div class="observacao-info"><span class="observacao-data">${fmtObsData(o.timestamp)}</span></div>${editable ? `<button type="button" class="btn-remove-obs" onclick="removerObservacao(${i})" title="Remover">✕</button>` : ''}</div><p class="observacao-texto">${escHtmlObs(o.texto)}</p></div>`).join('');
}
function atualizarListaObservacoes() {
    const list = JSON.parse(document.getElementById('observacoes').value || '[]');
    document.getElementById('observacoesList').innerHTML = renderObsLista(list, true);
}
window.adicionarObservacao = function () {
    const ta = document.getElementById('novaObservacao');
    const texto = ta.value.trim();
    if (!texto) { showMessage('Digite uma observação primeiro', 'error'); return; }
    const f = document.getElementById('observacoes');
    const list = JSON.parse(f.value || '[]');
    list.push({ texto, timestamp: new Date().toISOString() });
    f.value = JSON.stringify(list);
    ta.value = '';
    atualizarListaObservacoes();
};
window.removerObservacao = function (i) {
    const f = document.getElementById('observacoes');
    const list = JSON.parse(f.value || '[]');
    list.splice(i, 1);
    f.value = JSON.stringify(list);
    atualizarListaObservacoes();
};
function abrirObservacoes(id) { viewCotacao(id); switchInfoTab('info-tab-observacoes'); }

async function toggleStatus(id, checked) {
    if (!podeMarcar) {
        const cb = document.getElementById(`check-${id}`);
        if (cb) cb.checked = !checked;
        showMessage('Somente Almoxarifado e administradores podem alterar', 'error');
        return;
    }
    const cotacao = cotacoes.find(c => c.id === id);
    if (!cotacao) return;
    const nomeTransportadora = cotacao.transportadora || 'Cotação';
    try {
        const response = await fetch(`${API_URL}/cotacoes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
            body: JSON.stringify({ negocioFechado: checked })
        });
        if (!response.ok) throw new Error('Erro');
        await loadCotacoes();
        const msg = checked ? `${nomeTransportadora} aprovada` : `${nomeTransportadora} reprovada`;
        const tipo = checked ? 'success' : 'error';
        showMessage(msg, tipo);
    } catch (e) {
        showMessage('Erro ao atualizar status!', 'error');
        const cb = document.getElementById(`check-${id}`);
        if (cb) cb.checked = !checked;
    }
}

// ─── EXCLUSÃO ────────────────────────────────────────────────────────────────
function showDeleteModal(id) {
    pendingDeleteId = id;
    const c = cotacoes.find(x => x.id === id);
    const doc = c ? (c.documento || c.numeroCotacao || `#${id}`) : '';
    document.getElementById('deleteModalMessage').textContent = `Tem certeza que deseja excluir a cotação ${doc}?`;
    document.getElementById('deleteModal').classList.add('show');

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.onclick = () => confirmDelete();
}
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
    pendingDeleteId = null;
}
async function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    try {
        const response = await fetch(`${API_URL}/cotacoes/${id}`, {
            method: 'DELETE',
            headers: { 'X-Session-Token': sessionToken }
        });
        if (!response.ok) throw new Error('Erro');
        await loadCotacoes();
        showMessage('Cotação excluída', 'success');
        closeDeleteModal();
    } catch (e) {
        showMessage('Erro ao excluir cotação!', 'error');
        closeDeleteModal();
    }
}

// ─── FORM ────────────────────────────────────────────────────────────────────
function openFormModal() {
    editingId = null;
    document.getElementById('formTitle').textContent = 'Nova Cotação';
    const saveBtn = document.getElementById('btnFormSave');
    if (saveBtn) saveBtn.textContent = 'Salvar';
    resetForm();
    document.getElementById('dataCotacao').value = getDataAtual();
    document.getElementById('responsavel').value = getCurrentFirstName().toUpperCase();
    document.getElementById('observacoes').value = '[]';
    atualizarListaObservacoes();
    updateTransportadoraSelects();
    document.getElementById('formModal').classList.add('show');
    switchFormTab('form-tab-geral');
}
function cancelarFormCotacao() {
    const editando = !!editingId;
    closeFormModal();
    showMessage(editando ? 'Atualização cancelada' : 'Registro cancelado', 'error');
}
window.cancelarFormCotacao = cancelarFormCotacao;
function closeFormModal() { document.getElementById('formModal').classList.remove('show'); resetForm(); }
function getCurrentFirstName() {
    try {
        const raw = sessionStorage.getItem('cotacoesUserData') || sessionStorage.getItem('cotacoesSession') || sessionStorage.getItem('irSession') || '{}';
        const u = JSON.parse(raw);
        const n = u.name || u.nome || u.fullName || (u.user && u.user.name) || '';
        return String(n).trim().split(/\s+/)[0] || '';
    } catch (_) { return ''; }
}
function resetForm() {
    document.querySelectorAll('#formModal input, #formModal select, #formModal textarea').forEach(el => {
        if (el.type === 'checkbox') el.checked = false; else el.value = '';
    });
}

function editCotacao(id) {
    const c = cotacoes.find(x => x.id === id);
    if (!c) return;
    editingId = id;
    document.getElementById('formTitle').textContent = `Editar Cotação`;
    const saveBtn = document.getElementById('btnFormSave');
    if (saveBtn) saveBtn.textContent = 'Atualizar';
    resetForm();
    updateTransportadoraSelects();
    document.getElementById('dataCotacao').value = c.dataCotacao || '';
    document.getElementById('transportadora').value = c.transportadora || '';
    document.getElementById('destino').value = c.destino || '';
    document.getElementById('documento').value = c.documento || '';
    document.getElementById('numeroCotacao').value = c.numeroCotacao || '';
    document.getElementById('valorFrete').value = c.valorFrete || '';
    document.getElementById('previsaoEntrega').value = c.previsaoEntrega || '';
    document.getElementById('responsavel').value = c.responsavel || '';
    document.getElementById('responsavelTransportadora').value = c.responsavelTransportadora || '';
    document.getElementById('canalComunicacao').value = c.canalComunicacao || '';
    document.getElementById('codigoColeta').value = c.codigoColeta || '';
    document.getElementById('observacoes').value = JSON.stringify(parseObs(c));
    atualizarListaObservacoes();
    if (window.IR) IR.preencherVendedores(document.getElementById('vendedor'), c.vendedor);
    document.getElementById('formModal').classList.add('show');
    switchFormTab('form-tab-geral');
}

async function saveCotacao() {
    const transportadora = document.getElementById('transportadora').value.trim();
    const destino = document.getElementById('destino').value.trim();
    if (!transportadora) {
        switchFormTab('form-tab-transportadora');
        showMessage(window.IR ? IR.ERRO_CAMPOS_OBRIGATORIOS : 'Verifique se todas as informações obrigatórias estão preenchidas', 'error');
        return;
    }
    const payload = {
        dataCotacao: document.getElementById('dataCotacao').value,
        transportadora,
        destino,
        documento: document.getElementById('documento').value.trim(),
        numeroCotacao: document.getElementById('numeroCotacao').value.trim(),
        valorFrete: parseFloat(document.getElementById('valorFrete').value) || null,
        previsaoEntrega: document.getElementById('previsaoEntrega').value,
        responsavel: (document.getElementById('responsavel').value.trim() || getCurrentFirstName()),
        vendedor: document.getElementById('vendedor').value.trim(),
        responsavelTransportadora: document.getElementById('responsavelTransportadora').value.trim(),
        canalComunicacao: document.getElementById('canalComunicacao').value.trim(),
        codigoColeta: document.getElementById('codigoColeta').value.trim(),
        observacoes: document.getElementById('observacoes').value || '[]'
    };
    try {
        const url = editingId ? `${API_URL}/cotacoes/${editingId}` : `${API_URL}/cotacoes`;
        const method = editingId ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Erro ao salvar');
        await loadCotacoes();
        closeFormModal();
        showMessage(editingId ? 'Cotação atualizada' : 'Cotação registrada', 'success');
    } catch (e) {
        showMessage('Erro ao salvar cotação!', 'error');
    }
}

// ─── NAVEGAÇÃO DO FORMULÁRIO ─────────────────────────────────────────────────
const formTabs = ['form-tab-geral', 'form-tab-transportadora', 'form-tab-observacoes'];
let currentFormTabIndex = 0;
function switchFormTab(tabId) {
    document.querySelectorAll('#formModal .tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#formModal .tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    currentFormTabIndex = formTabs.indexOf(tabId);
    const btn = Array.from(document.querySelectorAll('#formModal .tab-btn')).find(b => b.getAttribute('onclick')?.includes(tabId));
    if (btn) btn.classList.add('active');
    updateFormNavButtons();
}
function nextFormTab() { if (currentFormTabIndex < formTabs.length - 1) switchFormTab(formTabs[currentFormTabIndex + 1]); }
function previousFormTab() { if (currentFormTabIndex > 0) switchFormTab(formTabs[currentFormTabIndex - 1]); }
function updateFormNavButtons() {
    const btnPrev = document.getElementById('btnFormPrevious');
    const btnNext = document.getElementById('btnFormNext');
    if (btnPrev) btnPrev.style.display = currentFormTabIndex === 0 ? 'none' : 'inline-block';
    if (btnNext) btnNext.style.display = currentFormTabIndex === formTabs.length - 1 ? 'none' : 'inline-block';
}

// ─── MODAL DE VISUALIZAÇÃO ───────────────────────────────────────────────────
function viewCotacao(id) {
    const c = cotacoes.find(x => x.id === id);
    if (!c) return;
    document.getElementById('modalDocumento').textContent = c.documento || c.numeroCotacao || `#${id}`;
    const aprovada = c.negocioFechado === true;
    const statusText = aprovada ? 'APROVADA' : 'REPROVADA';
    document.getElementById('info-tab-geral').innerHTML = `<div class="info-section"><h4>Informações Gerais</h4>
        <div class="info-row"><span class="info-label">Código:</span><span class="info-value">${c.codigo || '-'}</span></div>
        <div class="info-row"><span class="info-label">Data:</span><span class="info-value">${formatarData(c.dataCotacao)}</span></div>
        <div class="info-row"><span class="info-label">Documento:</span><span class="info-value">${c.documento || '-'}</span></div>
        <div class="info-row"><span class="info-label">Nº Cotação:</span><span class="info-value">${c.numeroCotacao || '-'}</span></div>
        <div class="info-row"><span class="info-label">Destino:</span><span class="info-value">${c.destino || '-'}</span></div>
        <div class="info-row"><span class="info-label">Responsável:</span><span class="info-value">${c.responsavel || '-'}</span></div>
        <div class="info-row"><span class="info-label">Vendedor:</span><span class="info-value">${c.vendedor || '-'}</span></div>
        <div class="info-row"><span class="info-label">Status:</span><span class="info-value">${statusText}</span></div>
    </div>`;
    document.getElementById('info-tab-transportadora').innerHTML = `<div class="info-section"><h4>Transportadora</h4>
        <div class="info-row"><span class="info-label">Transportadora:</span><span class="info-value">${c.transportadora || '-'}</span></div>
        <div class="info-row"><span class="info-label">Resp. Transp.:</span><span class="info-value">${c.responsavelTransportadora || '-'}</span></div>
        <div class="info-row"><span class="info-label">Canal Comunicação:</span><span class="info-value">${c.canalComunicacao || '-'}</span></div>
        <div class="info-row"><span class="info-label">Código de Coleta:</span><span class="info-value">${c.codigoColeta || '-'}</span></div>
        <div class="info-row"><span class="info-label">Valor do Frete:</span><span class="info-value">${c.valorFrete ? formatarMoeda(c.valorFrete) : '-'}</span></div>
        <div class="info-row"><span class="info-label">Previsão de Entrega:</span><span class="info-value">${c.previsaoEntrega ? formatarData(c.previsaoEntrega) : '-'}</span></div>
    </div>`;
    document.getElementById('info-tab-observacoes').innerHTML = `<div class="info-section"><h4>Observações</h4><div class="observacoes-list-view">${renderObsLista(parseObs(c), false)}</div></div>`;
    currentInfoTabIndex = 0;
    switchInfoTab('info-tab-geral');
    document.getElementById('infoModal').classList.add('show');
}
function closeInfoModal() { document.getElementById('infoModal').classList.remove('show'); }
function switchInfoTab(tabId) {
    document.querySelectorAll('#infoModal .tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#infoModal .tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId)?.classList.add('active');
    currentInfoTabIndex = infoTabs.indexOf(tabId);
    const btn = Array.from(document.querySelectorAll('#infoModal .tab-btn')).find(b => b.getAttribute('onclick')?.includes(tabId));
    if (btn) btn.classList.add('active');
    updateInfoNavButtons();
}
function nextInfoTab() { if (currentInfoTabIndex < infoTabs.length - 1) switchInfoTab(infoTabs[currentInfoTabIndex + 1]); }
function previousInfoTab() { if (currentInfoTabIndex > 0) switchInfoTab(infoTabs[currentInfoTabIndex - 1]); }
function updateInfoNavButtons() {
    const btnPrev = document.getElementById('btnInfoPrevious');
    const btnNext = document.getElementById('btnInfoNext');
    if (btnPrev) btnPrev.style.display = currentInfoTabIndex === 0 ? 'none' : 'inline-block';
    if (btnNext) btnNext.style.display = currentInfoTabIndex === infoTabs.length - 1 ? 'none' : 'inline-block';
}

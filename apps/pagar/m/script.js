(() => {
"use strict";

const API_URL = window.location.origin + '/api';
const PORTAL_URL = window.location.origin;
const SESSION_KEY = 'contasPagarSession';
const SESSION_TIME_KEY = 'contasPagarSessionTime';
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const BANCOS_OPTS = ['BANCO DO BRASIL','BRADESCO','SICOOB'];
const FORMAS_OPTS = ['PIX','BOLETO','CARTAO','DINHEIRO','TRANSFERENCIA'];

let contas = [];
let isOnline = false;
let lastDataHash = '';
let sessionToken = null;
let podeMarcarPagar = false;
let currentMonth = new Date();
let calendarYear = new Date().getFullYear();
let formType = 'simple';
let editingContaId = null;
let observacoesArray = [];
let tentativasReconexao = 0;
const MAX_TENTATIVAS = 3;

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function fmtBRL(v) { return 'R$ ' + (parseFloat(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d) { if (!d) return '—'; return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); }
function hoje0() { const h = new Date(); h.setHours(0,0,0,0); return h; }
function parseDate0(s) { if (!s) return null; const d = new Date(s + 'T00:00:00'); d.setHours(0,0,0,0); return d; }

function showToast(msg, type = 'success') {
  const t = $('toast'); if (!t) return;
  t.className = `toast ${type}`;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}
const showMessage = showToast;

/* ─── AUTH ─── */
function verificarAutenticacao() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('sessionToken');

  if (tokenFromUrl) {
    sessionToken = tokenFromUrl;
    sessionStorage.setItem(SESSION_KEY, tokenFromUrl);
    sessionStorage.setItem(SESSION_TIME_KEY, Date.now().toString());
    window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    sessionToken = sessionStorage.getItem(SESSION_KEY);
    const t = sessionStorage.getItem(SESSION_TIME_KEY);
    if (t && sessionToken) {
      const hours = (Date.now() - parseInt(t)) / 3600000;
      if (hours > 24) sessionToken = null;
    }
  }

  if (!sessionToken) { denyAccess('Sessão expirada'); return; }
  if (window.IR && typeof IR.setToken === 'function') { try { IR.setToken(sessionToken); } catch(e){} }

  (async () => {
    if (window.IR && typeof IR.podeConfirmar === 'function') {
      try { podeMarcarPagar = await IR.podeConfirmar('FINANCEIRO'); } catch(_) { podeMarcarPagar = false; }
    }
    inicializarApp();
  })();
}

function denyAccess(msg) {
  if (window.IR && typeof IR.denied === 'function') { IR.denied(msg || 'Não autorizado'); return; }
  document.body.innerHTML = `<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;text-align:center;font-family:Inter,sans-serif;">
    <h1 style="font-size:1.4rem;margin-bottom:20px;">${esc(msg || 'NÃO AUTORIZADO')}</h1>
    <a href="${PORTAL_URL}" style="background:#3B82F6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Ir para o Portal</a>
  </div>`;
}

function tratarErroAuth(r) {
  if (r && (r.status === 401 || r.status === 403)) {
    tentativasReconexao++;
    if (tentativasReconexao >= MAX_TENTATIVAS) {
      isOnline = false;
      sessionToken = null;
      sessionStorage.removeItem(SESSION_KEY);
      denyAccess('Sua sessão expirou');
    }
    return true;
  }
  return false;
}

function inicializarApp() {
  tentativasReconexao = 0;
  updateDisplay();
  bindUI();
  checkServerStatus().catch(() => { isOnline = false; });
  if (sessionToken) setInterval(() => loadContas(), 15000);
}

function bindUI() {
  $('monthPrev')?.addEventListener('click', () => changeMonth(-1));
  $('monthNext')?.addEventListener('click', () => changeMonth(1));
  $('calendarBtn')?.addEventListener('click', () => openCalendar());
  $('addBtn')?.addEventListener('click', () => { if (typeof abrirSelecaoTipo === 'function') abrirSelecaoTipo(); });
  $('syncBtn')?.addEventListener('click', () => sincronizarDados());
  $('pdfBtn')?.addEventListener('click', () => gerarPDF());
  $('cardVencido')?.addEventListener('click', () => showVencidoModal());
  $('search')?.addEventListener('input', filterContas);
  $('filterBanco')?.addEventListener('change', filterContas);
  $('filterPagamento')?.addEventListener('change', filterContas);
  $('filterStatus')?.addEventListener('change', filterContas);

  // Delegação de eventos nos cards
  $('contasList')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (btn) {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (!id) return;
      if (action === 'edit') { e.stopPropagation(); editConta(id); }
      else if (action === 'delete') { e.stopPropagation(); deleteConta(id); }
      else if (action === 'toggle') { e.stopPropagation(); togglePago(id); }
      return;
    }
    const alertBtn = e.target.closest('.card-alert-icon');
    if (alertBtn) { e.stopPropagation(); viewConta(alertBtn.dataset.id, 'obs'); return; }
    const card = e.target.closest('.conta-card');
    if (card && card.dataset.id) viewConta(card.dataset.id);
  });
}

/* ─── CONEXÃO ─── */
async function checkServerStatus() {
  if (!sessionToken) { isOnline = false; return false; }
  try {
    const r = await fetch(`${API_URL}/contas?_t=${Date.now()}`, {
      headers: { 'X-Session-Token': sessionToken, 'Accept': 'application/json' },
      credentials: 'same-origin'
    });
    if (tratarErroAuth(r)) return false;
    const wasOffline = !isOnline;
    isOnline = r.ok;
    if (wasOffline && isOnline) { tentativasReconexao = 0; await loadContas(); }
    return isOnline;
  } catch (_) { isOnline = false; return false; }
}

async function loadContas() {
  if (!isOnline && !sessionToken) return;
  try {
    const r = await fetch(`${API_URL}/contas?_t=${Date.now()}`, {
      headers: { 'X-Session-Token': sessionToken, 'Accept': 'application/json' },
      credentials: 'same-origin'
    });
    if (tratarErroAuth(r)) return;
    if (!r.ok) { isOnline = false; return; }
    const data = await r.json();
    contas = data || [];
    isOnline = true;
    lastDataHash = JSON.stringify(contas.map(c => c.id));
    updateAllFilters();
    updateDashboard();
    filterContas();
  } catch (e) {
    if (typeof isOnline !== 'undefined') isOnline = false;
    console.error('[pagar/m] loadContas:', e);
  }
}

/* ─── MÊS ─── */
function updateDisplay() {
  const el = $('currentMonth');
  if (el) el.textContent = `${MESES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
}
function changeMonth(dir) {
  currentMonth.setMonth(currentMonth.getMonth() + dir);
  updateDisplay();
  loadContas();
}

/* ─── FILTROS ─── */
function contasDoMes() {
  const m = currentMonth.getMonth(), y = currentMonth.getFullYear();
  return contas.filter(c => {
    const d = parseDate0(c.data_vencimento);
    return d && d.getMonth() === m && d.getFullYear() === y;
  });
}

function getStatusDinamico(conta) {
  if (conta.status === 'PAGO') return 'PAGO';
  const d = parseDate0(conta.data_vencimento);
  if (d && d <= hoje0()) return 'VENCIDO';
  return 'PENDENTE';
}

function updateAllFilters() {
  const doMes = contasDoMes();

  // Banco
  const bancos = new Set();
  doMes.forEach(c => { if (c.banco) bancos.add(c.banco); });
  const selB = $('filterBanco');
  if (selB) {
    const cur = selB.value;
    selB.innerHTML = '<option value="">Banco</option>' + Array.from(bancos).sort().map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join('');
    selB.value = cur;
  }

  // Forma
  const formas = new Set();
  doMes.forEach(c => { if (c.forma_pagamento) formas.add(c.forma_pagamento); });
  const selP = $('filterPagamento');
  if (selP) {
    const cur = selP.value;
    selP.innerHTML = '<option value="">Forma</option>' + Array.from(formas).sort().map(f => `<option value="${esc(f)}">${esc(f)}</option>`).join('');
    selP.value = cur;
  }

  // Status
  const hasPago = doMes.some(c => c.status === 'PAGO');
  const hasVenc = doMes.some(c => getStatusDinamico(c) === 'VENCIDO');
  const hasPend = doMes.some(c => getStatusDinamico(c) === 'PENDENTE');
  const selS = $('filterStatus');
  if (selS) {
    const cur = selS.value;
    selS.innerHTML = '<option value="">Status</option>';
    if (hasPago) selS.innerHTML += '<option value="PAGO">Pago</option>';
    if (hasVenc) selS.innerHTML += '<option value="VENCIDO">Vencido</option>';
    if (hasPend) selS.innerHTML += '<option value="PENDENTE">Pendente</option>';
    selS.value = cur;
  }
}

function filterContas() {
  const search = ($('search')?.value || '').toLowerCase().trim();
  const banco = $('filterBanco')?.value || '';
  const forma = $('filterPagamento')?.value || '';
  const status = $('filterStatus')?.value || '';

  let list = contasDoMes();
  if (banco) list = list.filter(c => c.banco === banco);
  if (forma) list = list.filter(c => c.forma_pagamento === forma);
  if (status) list = list.filter(c => getStatusDinamico(c) === status);
  if (search) {
    list = list.filter(c => {
      const alvo = [c.descricao, c.documento, c.banco, c.forma_pagamento, c.observacoes].join(' ').toLowerCase();
      return alvo.includes(search);
    });
  }
  list.sort((a, b) => (parseDate0(a.data_vencimento) || 0) - (parseDate0(b.data_vencimento) || 0));
  renderContas(list);
  updateDashboard();
}

/* ─── DASHBOARD ─── */
function updateDashboard() {
  const doMes = contasDoMes();
  const valorPago = doMes.filter(c => c.status === 'PAGO').reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);
  const vencidas = doMes.filter(c => getStatusDinamico(c) === 'VENCIDO');
  const valorTotal = doMes.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);
  const valorPendente = valorTotal - valorPago;

  $('statPagos').textContent = fmtBRL(valorPago);
  $('statVencido').textContent = vencidas.length;
  $('statPendente').textContent = fmtBRL(valorPendente);
  $('statValorTotal').textContent = fmtBRL(valorTotal);

  const card = $('cardVencido');
  const badge = $('pulseBadge');
  if (vencidas.length > 0) {
    card?.classList.add('has-alert');
    if (badge) badge.style.display = 'flex';
  } else {
    card?.classList.remove('has-alert');
    if (badge) badge.style.display = 'none';
  }
}

/* ─── RENDER ─── */
function renderContas(list) {
  const wrap = $('contasList');
  const empty = $('emptyState');
  if (!wrap) return;

  if (!list || list.length === 0) {
    wrap.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  wrap.innerHTML = list.map(c => {
    const contaId = c.id || c.tempId;
    const status = getStatusDinamico(c);
    const isPago = status === 'PAGO';
    const cls = isPago ? 'row-pago' : (status === 'VENCIDO' ? 'row-vencido' : 'row-pendente');
    const badgeCls = isPago ? 'pago' : (status === 'VENCIDO' ? 'vencido' : 'pendente');
    const badgeTxt = isPago ? 'PAGO' : (status === 'VENCIDO' ? 'VENCIDO' : 'PENDENTE');
    const doc = c.documento || (c.parcela_numero ? `NF ${c.parcela_numero}/${c.parcela_total}` : '—');
    const sync = (!c.id && c.tempId) ? '<span class="sync-indicator">⟳</span> ' : '';
    const canToggle = podeMarcarPagar ? '' : 'disabled';
    let temObs = false;
    try { const arr = typeof c.observacoes === 'string' ? JSON.parse(c.observacoes) : c.observacoes; if (Array.isArray(arr) && arr.length > 0) temObs = true; } catch(_) {}

    return `
      <div class="conta-card ${cls}" data-id="${esc(contaId)}">
        <div class="card-top">
          <div class="card-top-left">
            <button class="check-btn ${isPago ? 'checked' : ''}" data-action="toggle" data-id="${esc(contaId)}" ${canToggle} aria-label="Marcar pago"></button>
            <span class="card-doc">${sync}${esc(doc)}</span>
          </div>
          <span class="badge-status ${badgeCls}">${badgeTxt}</span>
        </div>
        <div class="card-desc">${esc(c.descricao || '—')}</div>
        <div class="card-grid">
          <div class="card-cell"><span class="cell-label">Valor</span><span class="cell-value valor">${fmtBRL(c.valor)}</span></div>
          <div class="card-cell"><span class="cell-label">Vencimento</span><span class="cell-value">${fmtDate(c.data_vencimento)}</span></div>
          <div class="card-cell"><span class="cell-label">Banco</span><span class="cell-value">${esc(c.banco || '—')}</span></div>
          <div class="card-cell"><span class="cell-label">Pagamento</span><span class="cell-value">${c.data_pagamento ? fmtDate(c.data_pagamento) : '—'}</span></div>
        </div>
        <div class="card-actions">
          <button class="action-btn edit" data-action="edit" data-id="${esc(contaId)}">Editar</button>
          <button class="action-btn delete" data-action="delete" data-id="${esc(contaId)}">Excluir</button>
        </div>
        ${temObs ? `<button class="card-alert-icon" data-id="${esc(contaId)}" title="Ver observações" aria-label="Observações" style="position:absolute;"></button>` : ''}
      </div>`;
  }).join('');
}

/* ─── TOGGLE PAGO ─── */
async function togglePago(id) {
  if (!podeMarcarPagar) { showToast('Somente Financeiro pode alterar', 'error'); return; }
  const idStr = String(id);
  const conta = contas.find(c => String(c.id || c.tempId) === idStr);
  if (!conta) return;
  if (idStr.startsWith('temp_')) { showToast('Aguarde sincronização', 'warning'); return; }

  const novoStatus = conta.status === 'PAGO' ? 'PENDENTE' : 'PAGO';
  const novaData = novoStatus === 'PAGO' ? new Date().toISOString().split('T')[0] : null;
  const backup = { status: conta.status, data_pagamento: conta.data_pagamento };

  conta.status = novoStatus;
  conta.data_pagamento = novaData;
  filterContas(); updateDashboard();
  showToast(`Conta marcada como ${novoStatus === 'PAGO' ? 'paga' : 'pendente'}!`, 'success');

  try {
    const r = await fetch(`${API_URL}/contas/${idStr}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken, 'Accept': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ status: novoStatus, data_pagamento: novaData })
    });
    if (tratarErroAuth(r)) { conta.status = backup.status; conta.data_pagamento = backup.data_pagamento; filterContas(); updateDashboard(); return; }
    if (!r.ok) throw new Error('Erro');
    const data = await r.json();
    const idx = contas.findIndex(c => String(c.id) === idStr);
    if (idx !== -1) contas[idx] = data;
  } catch (e) {
    conta.status = backup.status;
    conta.data_pagamento = backup.data_pagamento;
    filterContas(); updateDashboard();
    showToast('Erro ao atualizar status', 'error');
  }
}

/* ─── DELETE ─── */
async function deleteConta(id) {
  const idStr = String(id);
  const conta = contas.find(c => String(c.id || c.tempId) === idStr);
  if (!conta) return;

  const msg = `Excluir "${conta.descricao}"?`;
  const ok = window.IR && IR.confirm ? await IR.confirm(msg) : confirm(msg);
  if (!ok) return;

  if (idStr.startsWith('temp_')) {
    contas = contas.filter(c => String(c.id || c.tempId) !== idStr);
    filterContas(); updateDashboard(); updateAllFilters();
    showToast('Registro local excluído', 'error');
    return;
  }

  const backup = contas.slice();
  contas = contas.filter(c => String(c.id) !== idStr);
  filterContas(); updateDashboard(); updateAllFilters();
  showToast('Conta excluída', 'error');

  try {
    const r = await fetch(`${API_URL}/contas/${idStr}`, {
      method: 'DELETE',
      headers: { 'X-Session-Token': sessionToken, 'Accept': 'application/json' },
      credentials: 'same-origin'
    });
    if (tratarErroAuth(r)) { contas = backup; filterContas(); updateDashboard(); return; }
    if (!r.ok) throw new Error('Erro ao excluir');
  } catch (e) {
    contas = backup;
    filterContas(); updateDashboard(); updateAllFilters();
    showToast('Erro ao excluir', 'error');
  }
}

/* ─── VIEW ─── */
function viewConta(id, activeTab = 'dados') {
  const conta = contas.find(c => String(c.id || c.tempId) === String(id));
  if (!conta) { showToast('Conta não encontrada', 'error'); return; }

  let obsHTML = '<p style="color:var(--text-secondary);font-style:italic;padding:1rem;text-align:center;">Nenhuma observação</p>';
  try {
    const arr = typeof conta.observacoes === 'string' ? JSON.parse(conta.observacoes) : conta.observacoes;
    if (Array.isArray(arr) && arr.length > 0) {
      obsHTML = arr.map(o => `<div class="observacao-item"><div class="observacao-header"><span class="observacao-data">${o.timestamp ? new Date(o.timestamp).toLocaleString('pt-BR') : ''}</span></div><p class="observacao-texto">${esc(o.texto || o)}</p></div>`).join('');
    }
  } catch(_) {}

  const parcelaInfo = (conta.parcela_numero && conta.parcela_total) ? `${conta.parcela_numero}/${conta.parcela_total}` : '—';
  const status = getStatusDinamico(conta);
  const statusBadge = `<span class="badge-status ${status === 'PAGO' ? 'pago' : (status === 'VENCIDO' ? 'vencido' : 'pendente')}">${status}</span>`;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal show" id="viewModal">
      <div class="modal-box">
        <header class="modal-head">
          <div class="modal-head-spacer"></div>
          <h2 class="modal-head-title">Detalhes da Conta</h2>
          <button class="modal-close" onclick="window.closeViewModal()" aria-label="Fechar">✕</button>
        </header>
        <div class="modal-tabs">
          <button class="modal-tab ${activeTab==='dados'?'active':''}" data-viewtab="dados">Dados</button>
          <button class="modal-tab ${activeTab==='obs'?'active':''}" data-viewtab="obs">Observações</button>
        </div>
        <div class="modal-body">
          <div class="tab-pane ${activeTab==='dados'?'active':''}" data-viewpane="dados">
            <div class="info-section">
              <div class="info-row"><span class="info-label">Documento</span><span class="info-value">${esc(conta.documento || '—')}</span></div>
              <div class="info-row"><span class="info-label">Descrição</span><span class="info-value">${esc(conta.descricao || '—')}</span></div>
              <div class="info-row"><span class="info-label">Parcela</span><span class="info-value">${parcelaInfo}</span></div>
              <div class="info-row"><span class="info-label">Valor</span><span class="info-value">${fmtBRL(conta.valor)}</span></div>
              <div class="info-row"><span class="info-label">Vencimento</span><span class="info-value">${fmtDate(conta.data_vencimento)}</span></div>
              <div class="info-row"><span class="info-label">Forma de Pagamento</span><span class="info-value">${esc(conta.forma_pagamento || '—')}</span></div>
              <div class="info-row"><span class="info-label">Banco</span><span class="info-value">${esc(conta.banco || '—')}</span></div>
              <div class="info-row"><span class="info-label">Data Pagamento</span><span class="info-value">${conta.data_pagamento ? fmtDate(conta.data_pagamento) : 'Não pago'}</span></div>
              <div class="info-row"><span class="info-label">Status</span><span class="info-value">${statusBadge}</span></div>
            </div>
          </div>
          <div class="tab-pane ${activeTab==='obs'?'active':''}" data-viewpane="obs">
            <div class="observacoes-list">${obsHTML}</div>
          </div>
        </div>
        <footer class="modal-foot">
          <button class="btn btn-red" onclick="window.closeViewModal()">Fechar</button>
        </footer>
      </div>
    </div>`);

  const vModal = $('viewModal');
  vModal?.querySelectorAll('.modal-tab').forEach(t => {
    t.addEventListener('click', () => {
      vModal.querySelectorAll('.modal-tab').forEach(x => x.classList.toggle('active', x === t));
      vModal.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.viewpane === t.dataset.viewtab));
    });
  });
  vModal?.addEventListener('click', e => { if (e.target === vModal) closeViewModal(); });
}

window.closeViewModal = function() {
  const m = $('viewModal');
  if (m) m.remove();
};

/* ─── FORM ─── */
function abrirSelecaoTipo() {
  const existing = $('tipoCadastroModal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal show" id="tipoCadastroModal">
      <div class="modal-box modal-confirm">
        <div class="confirm-msg">Qual é o tipo de cadastro?</div>
        <div class="confirm-actions">
          <button type="button" class="btn btn-blue" onclick="window.escolherTipo('simple')">Simples</button>
          <button type="button" class="btn btn-green" onclick="window.escolherTipo('parcelado')">Parcelado</button>
        </div>
        <div style="margin-top:12px;">
          <button type="button" class="btn btn-gray" style="width:100%;height:38px;font-size:.82rem;" onclick="window.fecharTipo()">Cancelar</button>
        </div>
      </div>
    </div>`);
  const m = $('tipoCadastroModal');
  m?.addEventListener('click', e => { if (e.target === m) window.fecharTipo(); });
}
window.fecharTipo = function() { $('tipoCadastroModal')?.remove(); };
window.escolherTipo = function(tipo) { window.fecharTipo(); showFormModal(null, tipo); };

function showFormModal(editingId = null, presetType = null) {
  const isEditing = editingId !== null && editingId !== undefined && editingId !== '';
  let conta = null;

  if (!isEditing && !presetType) { abrirSelecaoTipo(); return; }
  if (isEditing) {
    conta = contas.find(c => String(c.id || c.tempId) === String(editingId));
    if (!conta) { showToast('Conta não encontrada', 'error'); return; }
    if (String(editingId).startsWith('temp_')) { showToast('Aguarde sincronização', 'warning'); return; }
    observacoesArray = [];
    try { observacoesArray = typeof conta.observacoes === 'string' ? (JSON.parse(conta.observacoes) || []) : (conta.observacoes || []); } catch(_) { observacoesArray = []; }
  } else {
    observacoesArray = [];
  }

  formType = isEditing ? 'edit' : presetType;
  editingContaId = isEditing ? editingId : null;

  const title = isEditing ? 'Editar Conta' : (presetType === 'parcelado' ? 'Nova Conta Parcelada' : 'Nova Conta');
  const obsHTML = renderObsList();
  const isParcelado = !isEditing && presetType === 'parcelado';

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal show" id="formModal">
      <div class="modal-box">
        <header class="modal-head">
          <div class="modal-head-spacer"></div>
          <h2 class="modal-head-title">${title}</h2>
          <button class="modal-close" onclick="window.closeFormModal()" aria-label="Fechar">✕</button>
        </header>
        <div class="modal-tabs">
          <button class="modal-tab active" data-formtab="dados">Dados</button>
          <button class="modal-tab" data-formtab="pagamento">Pagamento</button>
          <button class="modal-tab" data-formtab="obs">Obs</button>
        </div>
        <form id="contaForm" onsubmit="window.handleFormSubmit(event, ${isEditing})">
          <input type="hidden" id="observacoesData" value='${esc(JSON.stringify(observacoesArray))}'>
          <div class="modal-body">
            <div class="tab-pane active" data-formpane="dados">
              <div class="field"><label>Documento</label><input type="text" id="documento" value="${esc(conta?.documento || '')}" placeholder="Ex. CTE 123456"></div>
              <div class="field"><label>Descrição *</label><input type="text" id="descricao" value="${esc(conta?.descricao || '')}" required></div>
              ${isParcelado ? `
                <div class="form-row-3">
                  <div class="field"><label>Nº Parcelas *</label><input type="number" id="numParcelas" min="2" max="360" onchange="window.generateParcelasPreview()"></div>
                  <div class="field"><label>Valor Total (R$) *</label><input type="number" id="valorTotal" step="0.01" min="0" onchange="window.generateParcelasPreview()"></div>
                  <div class="field"><label>Data Início *</label><input type="date" id="dataInicio" onchange="window.generateParcelasPreview()"></div>
                </div>
                <div id="parcelasPreview"></div>
              ` : `
                <div class="form-row-3">
                  <div class="field"><label>Valor (R$) *</label><input type="number" id="valor" step="0.01" min="0" value="${esc(conta?.valor || '')}" required></div>
                  <div class="field"><label>Vencimento *</label><input type="date" id="data_vencimento" value="${esc(conta?.data_vencimento || '')}" required></div>
                </div>
              `}
            </div>
            <div class="tab-pane" data-formpane="pagamento">
              <div class="field"><label>Forma de Pagamento *</label>
                <select id="forma_pagamento" required>
                  <option value="">Selecione...</option>
                  ${FORMAS_OPTS.map(f => `<option value="${f}" ${conta?.forma_pagamento === f ? 'selected' : ''}>${f.charAt(0) + f.slice(1).toLowerCase()}</option>`).join('')}
                </select>
              </div>
              <div class="field"><label>Banco *</label>
                <select id="banco" required>
                  <option value="">Selecione...</option>
                  ${BANCOS_OPTS.map(b => `<option value="${b}" ${conta?.banco === b ? 'selected' : ''}>${b}</option>`).join('')}
                </select>
              </div>
              <div class="field"><label>Data do Pagamento</label><input type="date" id="data_pagamento" value="${esc(conta?.data_pagamento || '')}"></div>
            </div>
            <div class="tab-pane" data-formpane="obs">
              <div class="observacoes-list" id="observacoesList">${obsHTML}</div>
              <div class="nova-observacao">
                <label>Nova observação</label>
                <textarea id="novaObservacao" rows="3" placeholder="Digite aqui..."></textarea>
                <button type="button" class="btn-add-obs" onclick="window.adicionarObservacao()">+ Adicionar</button>
              </div>
            </div>
          </div>
          <footer class="modal-foot">
            <button type="submit" class="btn btn-green">${isEditing ? 'Atualizar' : 'Salvar'}</button>
            <button type="button" class="btn btn-red" onclick="window.closeFormModal()">Cancelar</button>
          </footer>
        </form>
      </div>
    </div>`);

  const m = $('formModal');
  m.querySelectorAll('.modal-tab').forEach(t => {
    t.addEventListener('click', () => {
      m.querySelectorAll('.modal-tab').forEach(x => x.classList.toggle('active', x === t));
      m.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.formpane === t.dataset.formtab));
    });
  });
  m.addEventListener('click', e => { if (e.target === m) window.closeFormModal(); });

  if (isParcelado) window.generateParcelasPreview();
}

function renderObsList() {
  if (!observacoesArray || observacoesArray.length === 0) return '';
  return observacoesArray.map((o, i) => `
    <div class="observacao-item" data-idx="${i}">
      <div class="observacao-header">
        <span class="observacao-data">${o.timestamp ? new Date(o.timestamp).toLocaleString('pt-BR') : ''}</span>
        <button type="button" class="btn-remove-obs" onclick="window.removerObservacao(${i})" aria-label="Remover">✕</button>
      </div>
      <p class="observacao-texto">${esc(o.texto || '')}</p>
    </div>`).join('');
}

window.adicionarObservacao = function() {
  const ta = $('novaObservacao');
  const txt = ta?.value?.trim();
  if (!txt) { showToast('Digite uma observação', 'error'); return; }
  observacoesArray.push({ texto: txt, timestamp: new Date().toISOString() });
  ta.value = '';
  const hidden = $('observacoesData');
  if (hidden) hidden.value = JSON.stringify(observacoesArray);
  const list = $('observacoesList');
  if (list) list.innerHTML = renderObsList();
  showToast('Observação adicionada', 'success');
};

window.removerObservacao = function(i) {
  observacoesArray.splice(i, 1);
  const hidden = $('observacoesData');
  if (hidden) hidden.value = JSON.stringify(observacoesArray);
  const list = $('observacoesList');
  if (list) list.innerHTML = renderObsList();
};

window.generateParcelasPreview = function() {
  const n = parseInt($('numParcelas')?.value);
  const vt = parseFloat($('valorTotal')?.value);
  const di = $('dataInicio')?.value;
  const c = $('parcelasPreview');
  if (!c) return;
  if (!n || n < 2 || !vt || !di) { c.innerHTML = ''; return; }
  const valorP = (vt / n).toFixed(2);
  const base = new Date(di + 'T00:00:00');
  let html = '<div class="parcelas-preview"><h4>Prévia das parcelas</h4>';
  for (let i = 0; i < n; i++) {
    const d = new Date(base); d.setMonth(d.getMonth() + i);
    html += `<div class="parcela-item"><span class="parcela-numero">${i+1}ª</span><span class="parcela-data">${d.toLocaleDateString('pt-BR')}</span><span class="parcela-valor">${fmtBRL(valorP)}</span></div>`;
  }
  html += '</div>';
  c.innerHTML = html;
};

window.closeFormModal = function() {
  const m = $('formModal');
  if (m) m.remove();
  editingContaId = null;
  observacoesArray = [];
};

window.handleFormSubmit = async function(event, isEditing) {
  event.preventDefault();
  if (isEditing) await submitEdit();
  else await submitCreate();
};

async function submitCreate() {
  if (formType === 'parcelado') return salvarParcelada();
  return salvarSimples();
}

async function salvarSimples() {
  const descricao = $('descricao')?.value?.trim();
  const valor = parseFloat($('valor')?.value);
  const data_vencimento = $('data_vencimento')?.value;
  const forma_pagamento = $('forma_pagamento')?.value;
  const banco = $('banco')?.value;
  const documento = $('documento')?.value?.trim() || null;
  const data_pagamento = $('data_pagamento')?.value || null;
  const observacoes = $('observacoesData')?.value || '[]';

  if (!descricao || !valor || valor <= 0 || !data_vencimento || !forma_pagamento || !banco) {
    showToast('Preencha todos os campos obrigatórios', 'error'); return;
  }

  const payload = {
    documento, descricao, valor, data_vencimento, forma_pagamento, banco,
    data_pagamento, observacoes, status: data_pagamento ? 'PAGO' : 'PENDENTE'
  };

  window.closeFormModal();
  try {
    const r = await fetch(`${API_URL}/contas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken, 'Accept': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    if (tratarErroAuth(r)) return;
    if (!r.ok) throw new Error('Erro ao salvar');
    const saved = await r.json();
    contas.push(saved);
    updateAllFilters(); filterContas(); updateDashboard();
    showToast('Conta registrada', 'success');
  } catch (e) {
    showToast('Erro ao salvar conta', 'error');
  }
}

async function salvarParcelada() {
  const descricao = $('descricao')?.value?.trim();
  const documento = $('documento')?.value?.trim() || null;
  const n = parseInt($('numParcelas')?.value);
  const vt = parseFloat($('valorTotal')?.value);
  const di = $('dataInicio')?.value;
  const forma_pagamento = $('forma_pagamento')?.value;
  const banco = $('banco')?.value;
  const observacoes = $('observacoesData')?.value || '[]';

  if (!descricao || !n || n < 2 || !vt || vt <= 0 || !di || !forma_pagamento || !banco) {
    showToast('Preencha todos os campos obrigatórios', 'error'); return;
  }

  const valorP = parseFloat((vt / n).toFixed(2));
  const base = new Date(di + 'T00:00:00');
  const grupoId = crypto.randomUUID ? crypto.randomUUID() : ('g_' + Date.now() + '_' + Math.random().toString(36).slice(2,8));

  window.closeFormModal();

  let ok = 0, fail = 0;
  for (let i = 0; i < n; i++) {
    const d = new Date(base); d.setMonth(d.getMonth() + i);
    const payload = {
      documento, descricao, observacoes, valor: valorP,
      data_vencimento: d.toISOString().split('T')[0],
      data_pagamento: null,
      forma_pagamento, banco, status: 'PENDENTE',
      parcela_numero: i + 1, parcela_total: n, grupo_id: grupoId
    };
    try {
      const r = await fetch(`${API_URL}/contas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken, 'Accept': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });
      if (r.ok) { const s = await r.json(); contas.push(s); ok++; }
      else fail++;
    } catch (_) { fail++; }
  }
  updateAllFilters(); filterContas(); updateDashboard();
  if (fail === 0) showToast(`${ok} parcelas registradas`, 'success');
  else showToast(`${ok} de ${n} parcelas salvas`, 'warning');
}

async function submitEdit() {
  const id = editingContaId;
  if (!id) return;
  const idx = contas.findIndex(c => String(c.id) === String(id));
  if (idx === -1) { showToast('Conta não encontrada', 'error'); return; }
  const orig = contas[idx];

  const descricao = $('descricao')?.value?.trim();
  const valor = parseFloat($('valor')?.value);
  const data_vencimento = $('data_vencimento')?.value;
  const forma_pagamento = $('forma_pagamento')?.value;
  const banco = $('banco')?.value;
  const documento = $('documento')?.value?.trim() || null;
  const data_pagamento = $('data_pagamento')?.value || null;
  const observacoes = $('observacoesData')?.value || '[]';

  if (!descricao || !valor || valor <= 0 || !data_vencimento || !forma_pagamento || !banco) {
    showToast('Preencha todos os campos obrigatórios', 'error'); return;
  }

  const payload = {
    documento, descricao, valor, data_vencimento, forma_pagamento, banco,
    data_pagamento, observacoes,
    status: data_pagamento ? 'PAGO' : (orig.status === 'PAGO' ? 'PENDENTE' : orig.status),
    parcela_numero: orig.parcela_numero || null,
    parcela_total: orig.parcela_total || null,
    grupo_id: orig.grupo_id || null
  };

  const backup = { ...orig };
  contas[idx] = { ...orig, ...payload };
  filterContas(); updateDashboard();
  window.closeFormModal();
  showToast('Atualizando...', 'info');

  try {
    const r = await fetch(`${API_URL}/contas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken, 'Accept': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    if (tratarErroAuth(r)) { contas[idx] = backup; filterContas(); updateDashboard(); return; }
    if (!r.ok) throw new Error('Erro');
    const saved = await r.json();
    contas[idx] = saved;
    updateAllFilters(); filterContas(); updateDashboard();
    showToast('Conta atualizada', 'success');
  } catch (e) {
    contas[idx] = backup;
    filterContas(); updateDashboard();
    showToast('Erro ao atualizar', 'error');
  }
}

function editConta(id) {
  if (String(id).startsWith('temp_')) { showToast('Aguarde sincronização', 'warning'); return; }
  showFormModal(id);
}

/* ─── CALENDÁRIO ─── */
function openCalendar() {
  calendarYear = currentMonth.getFullYear();
  const existing = $('calendarModal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal show" id="calendarModal">
      <div class="modal-box modal-calendar">
        <header class="modal-head">
          <div class="modal-head-spacer"></div>
          <h2 class="modal-head-title">Selecionar Mês</h2>
          <button class="modal-close" onclick="window.closeCalendar()" aria-label="Fechar">✕</button>
        </header>
        <div class="calendar-header">
          <button type="button" class="calendar-year-nav" onclick="window.changeCalendarYear(-1)" aria-label="Ano anterior">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h3 id="calendarYearLabel">${calendarYear}</h3>
          <button type="button" class="calendar-year-nav" onclick="window.changeCalendarYear(1)" aria-label="Próximo ano">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div class="calendar-months" id="calendarMonths"></div>
      </div>
    </div>`);
  const m = $('calendarModal');
  m?.addEventListener('click', e => { if (e.target === m) window.closeCalendar(); });
  renderCalendar();
}

function renderCalendar() {
  const wrap = $('calendarMonths');
  const lbl = $('calendarYearLabel');
  if (lbl) lbl.textContent = calendarYear;
  if (!wrap) return;
  const hoje = new Date();
  wrap.innerHTML = MESES.map((nome, i) => {
    const isCurrent = calendarYear === hoje.getFullYear() && i === hoje.getMonth();
    return `<button type="button" class="calendar-month ${isCurrent ? 'current' : ''}" data-month="${i}">${nome}</button>`;
  }).join('');
  wrap.querySelectorAll('[data-month]').forEach(b => {
    b.addEventListener('click', () => {
      const m = parseInt(b.dataset.month);
      currentMonth = new Date(calendarYear, m, 1);
      updateDisplay();
      window.closeCalendar();
      loadContas();
    });
  });
}

window.closeCalendar = function() { $('calendarModal')?.remove(); };
window.changeCalendarYear = function(dir) { calendarYear += dir; renderCalendar(); };

/* ─── VENCIDOS ─── */
function showVencidoModal() {
  const vencidas = contasDoMes().filter(c => getStatusDinamico(c) === 'VENCIDO')
    .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));

  const html = vencidas.length === 0
    ? '<div style="text-align:center;padding:2rem;color:var(--text-secondary);">Nenhuma conta vencida 🎉</div>'
    : `<div class="vencidos-list">${vencidas.map(c => {
        const dias = Math.floor((hoje0() - parseDate0(c.data_vencimento)) / 86400000);
        return `<div class="vencido-item">
          <div class="vencido-desc">${esc(c.descricao || '—')}</div>
          <div class="vencido-meta">
            <span>Venc. ${fmtDate(c.data_vencimento)}</span>
            <span class="vencido-valor">${fmtBRL(c.valor)}</span>
          </div>
          <div class="vencido-meta"><span style="color:#DC2626;font-weight:600;">${dias} dia${dias !== 1 ? 's' : ''} em atraso</span></div>
        </div>`;
      }).join('')}</div>`;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal show" id="vencidosModal">
      <div class="modal-box">
        <header class="modal-head">
          <div class="modal-head-spacer"></div>
          <h2 class="modal-head-title" style="color:#DC2626;">Vencidos</h2>
          <button class="modal-close" onclick="window.closeVencidos()" aria-label="Fechar">✕</button>
        </header>
        <div class="modal-body">${html}</div>
        <footer class="modal-foot">
          <button class="btn btn-red" onclick="window.closeVencidos()">Fechar</button>
        </footer>
      </div>
    </div>`);
  const m = $('vencidosModal');
  m?.addEventListener('click', e => { if (e.target === m) window.closeVencidos(); });
}

window.closeVencidos = function() { $('vencidosModal')?.remove(); };

/* ─── PDF ─── */
function gerarPDF() {
  const filtrados = getContasFiltradas();
  if (!filtrados.length) { showToast('Nada para exportar', 'warning'); return; }
  const { jsPDF } = window.jspdf;
  if (!jsPDF) { showToast('Biblioteca PDF não carregada', 'error'); return; }
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(16); doc.setFont(undefined, 'bold');
  doc.text('RELATÓRIO DE CONTAS A PAGAR', 148, 20, { align: 'center' });
  doc.setFontSize(10); doc.setFont(undefined, 'normal');
  doc.text(`Período: ${MESES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`, 14, 28);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 34);

  const rows = filtrados.map(c => {
    const parcela = (c.parcela_numero && c.parcela_total) ? `${c.parcela_numero}/${c.parcela_total}` : '-';
    return [
      c.documento || '-', c.descricao || '-', parcela,
      fmtBRL(c.valor), fmtDate(c.data_vencimento),
      c.banco || '-', c.data_pagamento ? fmtDate(c.data_pagamento) : '-'
    ];
  });

  doc.autoTable({
    startY: 40,
    head: [['Documento','Descrição','Parcela','Valor','Vencimento','Banco','Pagamento']],
    body: rows,
    didParseCell: (data) => {
      if (data.section === 'body') {
        const c = filtrados[data.row.index];
        if (c && c.status === 'PAGO') {
          data.cell.styles.fillColor = [220,252,231];
          data.cell.styles.textColor = [22,101,52];
        }
      }
    },
    theme: 'striped',
    headStyles: { fillColor: [100,100,100], textColor: [255,255,255], fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 28 }, 2: { halign: 'center', cellWidth: 18 }, 3: { halign: 'right', cellWidth: 25 }, 4: { halign: 'center', cellWidth: 22 }, 6: { halign: 'center', cellWidth: 22 } },
    margin: { left: 10, right: 10 }
  });

  const totalPago = filtrados.filter(c => c.status === 'PAGO').reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);
  const totalPend = filtrados.filter(c => c.status !== 'PAGO').reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);
  const y = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(10); doc.setFont(undefined, 'bold');
  doc.text(`Pago: ${fmtBRL(totalPago)}`, 14, y);
  doc.text(`Pendente: ${fmtBRL(totalPend)}`, 90, y);
  doc.text(`Total: ${fmtBRL(totalPago + totalPend)}`, 170, y);

  doc.save(`contas_pagar_${MESES[currentMonth.getMonth()]}_${currentMonth.getFullYear()}.pdf`);
  showToast('PDF gerado', 'success');
}

function getContasFiltradas() {
  const search = ($('search')?.value || '').toLowerCase().trim();
  const banco = $('filterBanco')?.value || '';
  const forma = $('filterPagamento')?.value || '';
  const status = $('filterStatus')?.value || '';
  let list = contasDoMes();
  if (banco) list = list.filter(c => c.banco === banco);
  if (forma) list = list.filter(c => c.forma_pagamento === forma);
  if (status) list = list.filter(c => getStatusDinamico(c) === status);
  if (search) list = list.filter(c => {
    const alvo = [c.descricao, c.documento, c.banco, c.forma_pagamento, c.observacoes].join(' ').toLowerCase();
    return alvo.includes(search);
  });
  list.sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));
  return list;
}

/* ─── SYNC ─── */
async function sincronizarDados() {
  const b = $('syncBtn');
  b?.classList.add('spinning');
  try {
    await checkServerStatus();
    await loadContas();
    showToast('Dados sincronizados', 'success');
  } catch (e) {
    showToast('Erro ao sincronizar', 'error');
  } finally {
    setTimeout(() => b?.classList.remove('spinning'), 600);
  }
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', verificarAutenticacao);

})();

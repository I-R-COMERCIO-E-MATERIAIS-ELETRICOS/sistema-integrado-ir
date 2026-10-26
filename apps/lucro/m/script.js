(() => {
"use strict";

const API_URL = window.location.origin + '/api';
const PORTAL_URL = window.location.origin;
const SESSION_KEY = 'lucroSession';
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

let lucroData = [];
let isOnline = false;
let sessionToken = null;
let currentMonth = new Date();
let calendarYear = new Date().getFullYear();
let custoFixoMensal = 0;
let impostoManual = null;
let currentEditCodigo = null;
let cancelNFId = null;

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function formatarMoeda(v) {
  if (v === null || v === undefined) return 'R$ 0,00';
  return 'R$ ' + parseFloat(v).toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function calcularImpostoAuto(v) { return (parseFloat(v) || 0) * 0.11; }
function calcularComissaoAuto(v) { return (parseFloat(v) || 0) * 0.0125; }

function showToast(msg, type = 'success') {
  const t = $('toast'); if (!t) return;
  t.className = `toast ${type}`;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ─── AUTH ─── */
function verificarAutenticacao() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('sessionToken');

  if (tokenFromUrl) {
    sessionToken = tokenFromUrl;
    sessionStorage.setItem(SESSION_KEY, tokenFromUrl);
    window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    sessionToken = sessionStorage.getItem(SESSION_KEY);
  }

  if (!sessionToken) {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SESSION_TOKEN') {
        sessionToken = event.data.token;
        sessionStorage.setItem(SESSION_KEY, sessionToken);
        iniciarApp();
      }
    }, { once: true });
    if (window.parent !== window) window.parent.postMessage({ type: 'REQUEST_SESSION_TOKEN' }, '*');
    setTimeout(() => { if (!sessionToken) denyAccess('Não autorizado'); }, 3000);
    return;
  }
  iniciarApp();
}

function denyAccess(msg) {
  document.body.innerHTML = `<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;text-align:center;font-family:Inter,sans-serif;">
    <h1 style="font-size:1.4rem;margin-bottom:20px;">${esc(msg || 'NÃO AUTORIZADO')}</h1>
    <a href="${PORTAL_URL}" style="background:#3B82F6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Ir para o Portal</a>
  </div>`;
}

function tratarErroAuth(r) {
  if (r && r.status === 401) {
    sessionStorage.removeItem(SESSION_KEY);
    denyAccess('Sua sessão expirou');
    return true;
  }
  return false;
}

/* ─── INIT ─── */
function iniciarApp() {
  updateMonthDisplay();
  bindUI();
  loadLucroReal();
  setInterval(() => loadLucroReal(), 30000);
}

function bindUI() {
  $('search')?.addEventListener('input', filterLucroReal);
  $('filterVendedor')?.addEventListener('change', filterLucroReal);
  $('monthPrev')?.addEventListener('click', () => changeMonth(-1));
  $('monthNext')?.addEventListener('click', () => changeMonth(1));
  $('calendarBtn')?.addEventListener('click', openCalendar);
  $('syncBtn')?.addEventListener('click', syncData);

  $('cardImposto')?.addEventListener('click', abrirModalImpostoFixo);
  $('cardLucroReal')?.addEventListener('click', abrirModalCustoFixo);
  $('cardImposto')?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirModalImpostoFixo(); } });
  $('cardLucroReal')?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirModalCustoFixo(); } });

  document.querySelectorAll('[data-close]').forEach(b => {
    b.addEventListener('click', () => closeModal(b.dataset.close));
  });
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
  });

  $('saveEditBtn')?.addEventListener('click', saveEditModal);
  $('saveCustoFixoBtn')?.addEventListener('click', saveCustoFixo);
  $('saveImpostoBtn')?.addEventListener('click', saveImpostoFixo);
  $('calcImpostoBtn')?.addEventListener('click', calcularImpostoAutomatico);
  $('confirmCancelBtn')?.addEventListener('click', confirmCancel);

  $('calendarPrevYear')?.addEventListener('click', () => { calendarYear--; renderCalendar(); });
  $('calendarNextYear')?.addEventListener('click', () => { calendarYear++; renderCalendar(); });

  $('editCusto')?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveEditModal(); } });

  $('lucroList')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.stopPropagation();
    const action = btn.dataset.action;
    if (action === 'edit') { abrirEditModal(btn.dataset.codigo); return; }
    if (action === 'cancel') { showCancelModal(btn.dataset.id, btn.dataset.nf); return; }
    if (action === 'uncancel') { desfazerCancelamento(btn.dataset.id); return; }
  });
}

function closeModal(id) { const m = $(id); if (m) m.classList.remove('show'); }
function openModal(id) { const m = $(id); if (m) m.classList.add('show'); }

/* ─── LOAD ─── */
async function loadLucroReal() {
  if (!sessionToken) return;
  const mes = currentMonth.getMonth() + 1;
  const ano = currentMonth.getFullYear();
  try {
    const r = await fetch(`${API_URL}/lucro-real?mes=${mes}&ano=${ano}`, {
      headers: { 'X-Session-Token': sessionToken, 'Accept': 'application/json' },
      credentials: 'same-origin',
      cache: 'no-cache'
    });
    if (tratarErroAuth(r)) return;
    if (!r.ok) { isOnline = false; return; }
    const data = await r.json();
    if (mes !== currentMonth.getMonth() + 1 || ano !== currentMonth.getFullYear()) return;
    lucroData = Array.isArray(data) ? data : [];
    // Dedup por id
    const seen = new Set();
    lucroData = lucroData.filter(rec => {
      if (seen.has(rec.id)) return false;
      seen.add(rec.id);
      return true;
    });
    lucroData.forEach(rec => {
      rec._cancelada = !!rec.cancelada;
      rec._impostoAuto = calcularImpostoAuto(rec.venda);
      rec._comissaoAuto = calcularComissaoAuto(rec.venda);
    });
    isOnline = true;
    custoFixoMensal = lucroData.length > 0 ? (parseFloat(lucroData[0].custo_fixo_mensal) || 0) : 0;
    updateDisplay();
  } catch (err) {
    isOnline = false;
    console.error('[lucro/m] load:', err);
  }
}

/* ─── MÊS ─── */
function updateMonthDisplay() {
  const el = $('currentMonth');
  if (el) el.textContent = `${MESES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
}
function changeMonth(dir) {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + dir, 1);
  lucroData = [];
  impostoManual = null;
  updateMonthDisplay();
  renderList([]);
  updateDashboard();
  loadLucroReal();
}

/* ─── DISPLAY ─── */
function updateDisplay() {
  updateMonthDisplay();
  updateDashboard();
  updateVendedoresFilter();
  filterLucroReal();
}

function updateDashboard() {
  const ativos = lucroData.filter(r => !r._cancelada);
  let totalVenda = 0, totalCusto = 0, totalFrete = 0, totalComissao = 0, totalImposto = 0;
  ativos.forEach(r => {
    totalVenda    += parseFloat(r.venda) || 0;
    totalCusto    += parseFloat(r.custo) || 0;
    totalFrete    += parseFloat(r.frete) || 0;
    totalComissao += calcularComissaoAuto(r.venda);
    totalImposto  += calcularImpostoAuto(r.venda);
  });
  const impostoExibido  = impostoManual !== null ? impostoManual : totalImposto;
  const totalLucroBruto = totalVenda - totalCusto - totalFrete - totalComissao - impostoExibido;
  const lucroRealCalc   = totalLucroBruto - custoFixoMensal;

  const setTxt = (id, v) => { const el = $(id); if (el) el.textContent = formatarMoeda(v); };
  setTxt('totalVenda', totalVenda);
  setTxt('totalCusto', totalCusto);
  setTxt('totalFrete', totalFrete);
  setTxt('totalImposto', impostoExibido);
  setTxt('totalLucroBruto', totalLucroBruto);
  setTxt('totalComissao', totalComissao);

  const lucroEl = $('totalLucroReal');
  if (lucroEl) {
    lucroEl.textContent = formatarMoeda(lucroRealCalc);
    lucroEl.classList.toggle('negative', lucroRealCalc < 0);
  }
  const manualTag = $('impostoManualTag');
  if (manualTag) manualTag.style.display = impostoManual !== null ? 'inline-block' : 'none';
}

function updateVendedoresFilter() {
  const vendedores = new Set(lucroData.map(r => r.vendedor).filter(Boolean));
  const sel = $('filterVendedor');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">Vendedor</option>' +
    Array.from(vendedores).sort().map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  sel.value = cur;
}

function filterLucroReal() {
  const search = ($('search')?.value || '').toLowerCase().trim();
  const vendedor = $('filterVendedor')?.value || '';
  let list = lucroData.slice();
  if (search) {
    list = list.filter(r =>
      (r.nf || '').toLowerCase().includes(search) ||
      (r.vendedor || '').toLowerCase().includes(search)
    );
  }
  if (vendedor) list = list.filter(r => (r.vendedor || '') === vendedor);
  list.sort((a, b) => String(a.nf || '').padStart(10, '0').localeCompare(String(b.nf || '').padStart(10, '0')));
  renderList(list);
}

function renderList(list) {
  const wrap = $('lucroList');
  const empty = $('emptyState');
  if (!wrap) return;

  if (!list || list.length === 0) {
    wrap.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  wrap.innerHTML = list.map(r => {
    const cancelada = !!r._cancelada;
    const imposto   = calcularImpostoAuto(r.venda);
    const comissao  = calcularComissaoAuto(r.venda);
    const lucroReal = cancelada
      ? 0
      : (parseFloat(r.venda) || 0) - (parseFloat(r.custo) || 0) - (parseFloat(r.frete) || 0) - comissao - imposto;
    const margem = (!cancelada && r.venda) ? (lucroReal / r.venda) * 100 : 0;

    const cls = cancelada
      ? 'card-cancelada'
      : (lucroReal >= 0 ? 'card-positiva' : 'card-negativa');
    const lucroClass = lucroReal >= 0 ? 'valor-positivo' : 'valor-negativo-lucro';

    const actionBtn = cancelada
      ? `<button type="button" class="action-btn uncancel" data-action="uncancel" data-id="${esc(r.id)}">Desfazer</button>`
      : `<button type="button" class="action-btn cancel" data-action="cancel" data-id="${esc(r.id)}" data-nf="${esc(r.nf || '')}">Cancelar</button>`;

    const editBtn = cancelada
      ? ''
      : `<button type="button" class="btn-edit-custo" data-action="edit" data-codigo="${esc(r.codigo)}">Editar Custo</button>`;

    return `
      <div class="lucro-card ${cls}">
        <div class="card-top">
          <div class="card-top-left">
            <span class="card-nf">NF ${esc(r.nf || '-')}</span>
            <span class="card-vend">${esc((r.vendedor || '-').toUpperCase())}</span>
          </div>
          ${actionBtn}
        </div>
        <div class="card-values">
          <div class="value-row full">
            <div class="value-cell">
              <span class="value-label">Venda</span>
              <span class="value-text">${formatarMoeda(r.venda)}</span>
            </div>
          </div>
          <div class="value-row">
            <div class="value-cell">
              <span class="value-label">Custo</span>
              <span class="value-text valor-negativo">${formatarMoeda(r.custo)}</span>
            </div>
            <div class="value-cell">
              <span class="value-label">Frete</span>
              <span class="value-text">${formatarMoeda(r.frete)}</span>
            </div>
          </div>
          <div class="value-row">
            <div class="value-cell">
              <span class="value-label">Comissão</span>
              <span class="value-text">${cancelada ? '—' : formatarMoeda(comissao)}</span>
            </div>
            <div class="value-cell">
              <span class="value-label">Imp. Fed</span>
              <span class="value-text valor-negativo">${cancelada ? '—' : formatarMoeda(imposto)}</span>
            </div>
          </div>
          <div class="value-row highlight">
            <div class="value-cell">
              <span class="value-label">Lucro Real</span>
              <span class="value-text ${lucroClass}">${cancelada ? '—' : formatarMoeda(lucroReal)}</span>
            </div>
            <div class="value-cell">
              <span class="value-label">Margem Líq.</span>
              <span class="value-text">${cancelada ? '—' : margem.toFixed(2) + '%'}</span>
            </div>
          </div>
        </div>
        ${editBtn ? `<div class="card-actions-row">${editBtn}</div>` : ''}
      </div>`;
  }).join('');
}

/* ─── EDIT CUSTO ─── */
function abrirEditModal(codigo) {
  const registro = lucroData.find(r => r.codigo === codigo);
  if (!registro || registro._cancelada) return;
  currentEditCodigo = codigo;
  $('editNF').textContent = registro.nf || '-';
  $('editCusto').value = registro.custo || 0;
  $('editImpostoInfo').textContent = formatarMoeda(calcularImpostoAuto(registro.venda));
  $('editComissaoInfo').textContent = formatarMoeda(calcularComissaoAuto(registro.venda));
  openModal('editCustoModal');
  setTimeout(() => $('editCusto')?.focus(), 100);
}

async function saveEditModal() {
  if (!currentEditCodigo) return;
  const registro = lucroData.find(r => r.codigo === currentEditCodigo);
  if (!registro) return;
  const novoCusto = parseFloat($('editCusto').value) || 0;
  const novaComissao = calcularComissaoAuto(registro.venda);
  const novoImposto = calcularImpostoAuto(registro.venda);

  try {
    const r = await fetch(`${API_URL}/lucro-real/${currentEditCodigo}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
      credentials: 'same-origin',
      body: JSON.stringify({ custo: novoCusto, comissao: novaComissao, imposto_federal: novoImposto })
    });
    if (tratarErroAuth(r)) return;
    if (!r.ok) throw new Error('Erro');
    registro.custo = novoCusto;
    registro.comissao = novaComissao;
    registro.imposto_federal = novoImposto;
    closeModal('editCustoModal');
    currentEditCodigo = null;
    filterLucroReal();
    updateDashboard();
    showToast('Custo atualizado', 'success');
  } catch (e) {
    showToast('Erro ao salvar custo', 'error');
  }
}

/* ─── CANCEL / UNCANCEL NF ─── */
function showCancelModal(id, nf) {
  cancelNFId = id;
  $('cancelNFMsg').textContent = `Deseja cancelar a NF ${nf}?`;
  openModal('cancelNFModal');
}

async function confirmCancel() {
  if (!cancelNFId) return;
  const registro = lucroData.find(r => r.id === cancelNFId);
  if (!registro) { closeModal('cancelNFModal'); cancelNFId = null; return; }
  closeModal('cancelNFModal');
  try {
    const r = await fetch(`${API_URL}/lucro-real/${registro.codigo}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
      credentials: 'same-origin',
      body: JSON.stringify({ cancelada: true })
    });
    if (tratarErroAuth(r)) return;
    if (!r.ok) throw new Error('Erro');
    registro.cancelada = true;
    registro._cancelada = true;
    cancelNFId = null;
    filterLucroReal();
    updateDashboard();
    showToast(`NF ${registro.nf} cancelada`, 'error');
  } catch (e) {
    showToast('Erro ao cancelar NF', 'error');
  }
}

async function desfazerCancelamento(id) {
  const registro = lucroData.find(r => r.id === id);
  if (!registro) return;
  try {
    const r = await fetch(`${API_URL}/lucro-real/${registro.codigo}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
      credentials: 'same-origin',
      body: JSON.stringify({ cancelada: false })
    });
    if (tratarErroAuth(r)) return;
    if (!r.ok) throw new Error('Erro');
    registro.cancelada = false;
    registro._cancelada = false;
    filterLucroReal();
    updateDashboard();
    showToast(`NF ${registro.nf} reativada`, 'success');
  } catch (e) {
    showToast('Erro ao reativar NF', 'error');
  }
}

/* ─── CUSTO FIXO ─── */
function abrirModalCustoFixo() {
  $('custoFixoInput').value = custoFixoMensal;
  openModal('custoFixoModal');
}

async function saveCustoFixo() {
  const valor = parseFloat($('custoFixoInput').value) || 0;
  const mes = currentMonth.getMonth() + 1;
  const ano = currentMonth.getFullYear();
  try {
    const r = await fetch(`${API_URL}/custo-fixo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
      credentials: 'same-origin',
      body: JSON.stringify({ mes, ano, custo_fixo_mensal: valor })
    });
    if (tratarErroAuth(r)) return;
    if (!r.ok) throw new Error('Erro');
    custoFixoMensal = valor;
    lucroData.forEach(rec => rec.custo_fixo_mensal = valor);
    closeModal('custoFixoModal');
    updateDashboard();
    showToast('Custo fixo atualizado', 'success');
  } catch (e) {
    showToast('Erro ao salvar', 'error');
  }
}

/* ─── IMPOSTO FEDERAL ─── */
function abrirModalImpostoFixo() {
  const totalAuto = lucroData
    .filter(r => !r._cancelada)
    .reduce((s, r) => s + calcularImpostoAuto(r.venda), 0);
  $('impostoInput').value = (impostoManual !== null ? impostoManual : totalAuto).toFixed(2);
  openModal('impostoModal');
}

function saveImpostoFixo() {
  const valor = parseFloat($('impostoInput').value) || 0;
  impostoManual = valor;
  closeModal('impostoModal');
  updateDashboard();
  showToast('Imposto manual aplicado', 'success');
}

function calcularImpostoAutomatico() {
  impostoManual = null;
  closeModal('impostoModal');
  updateDashboard();
  showToast('Imposto automático', 'success');
}

/* ─── CALENDÁRIO ─── */
function openCalendar() {
  calendarYear = currentMonth.getFullYear();
  renderCalendar();
  openModal('calendarModal');
}

function renderCalendar() {
  const wrap = $('calendarMonths');
  const lbl = $('calendarYear');
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
      lucroData = [];
      impostoManual = null;
      updateMonthDisplay();
      renderList([]);
      updateDashboard();
      closeModal('calendarModal');
      loadLucroReal();
    });
  });
}

/* ─── SYNC ─── */
async function syncData() {
  const btn = $('syncBtn');
  btn?.classList.add('spinning');
  try {
    const r = await fetch(`${API_URL}/monitorar-pedidos`, {
      method: 'POST',
      headers: { 'X-Session-Token': sessionToken },
      credentials: 'same-origin'
    });
    if (tratarErroAuth(r)) return;
    await loadLucroReal();
    showToast('Dados sincronizados', 'success');
  } catch (e) {
    showToast('Erro ao sincronizar', 'error');
  } finally {
    setTimeout(() => btn?.classList.remove('spinning'), 600);
  }
}

/* ─── BOOT ─── */
document.addEventListener('DOMContentLoaded', verificarAutenticacao);

})();

(() => {
"use strict";

const PORTAL_URL = window.location.origin;
const API_URL = window.location.origin + '/api';
const MODULE_SESSION_KEY = 'receberSession';
const SESSION_KEY = 'irUserSession';
const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const SPECIAL_STATUS = ['DEVOLUCAO','DEVOLVIDA','SIMPLES REMESSA','REMESSA DE AMOSTRA','CANCELADA','ESPECIAL'];

let contas = [];
let todasContasRaw = [];
let isOnline = false;
let sessionToken = null;
let podeMarcarReceber = false;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let calendarYear = new Date().getFullYear();
let pendingDeleteId = null;
let _editingParcelasTemp = [];
let _descontoConfirmado = false;

const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const up = s => String(s??'').toUpperCase();

function paraCentavos(valor) { return Math.round((parseFloat(valor) || 0) * 100); }
function valorMaiorOuIgual(a, b) { return paraCentavos(a) >= paraCentavos(b); }
function valorMenorQue(a, b) { return paraCentavos(a) < paraCentavos(b); }

function normalizarTexto(str) {
  if (!str) return '';
  return str.trim().toUpperCase().replace(/_/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function isContaEspecial(conta) {
  const t = normalizarTexto(conta.tipo_nf || '');
  const s = normalizarTexto(conta.status || '');
  return SPECIAL_STATUS.some(sp => t === sp || s === sp);
}
function getLabelEspecial(conta) {
  const t = normalizarTexto(conta.tipo_nf || '');
  if (SPECIAL_STATUS.some(sp => t === sp)) return conta.tipo_nf;
  return conta.status;
}
function pertenceAoPeriodo(conta, mes, ano) {
  if (!conta.data_emissao) return false;
  const partes = String(conta.data_emissao).split('-');
  if (partes.length < 2) return false;
  const anoEmissao = parseInt(partes[0], 10);
  const mesEmissao = parseInt(partes[1], 10) - 1;
  if (Number.isNaN(anoEmissao) || Number.isNaN(mesEmissao)) return false;
  return mesEmissao === mes && anoEmissao === ano;
}

/* ─── TOAST (TOPO) ─────────────────────────────────── */
function toastSuccess(m) { toast(m, 'success'); }
function toastError(m)   { toast(m, 'error'); }
function toast(m, type = 'success') {
  const t = $('toast'); if (!t) return;
  t.className = `toast ${type}`;
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

/* ─── AUTH ─────────────────────────────────────────── */
function verificarAutenticacao() {
  const p = new URLSearchParams(window.location.search);
  const fromUrl = p.get('sessionToken');
  if (fromUrl) {
    sessionToken = fromUrl;
    sessionStorage.setItem(MODULE_SESSION_KEY, fromUrl);
    window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    sessionToken = sessionStorage.getItem(MODULE_SESSION_KEY);
  }
  if (!sessionToken) {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (raw) { const parsed = JSON.parse(raw); sessionToken = parsed.token || parsed.sessionToken || null; }
    } catch (e) {}
  }
  if (!sessionToken) { denyAccess('Sessão expirada'); return; }
  if (window.IR && typeof IR.setToken === 'function') { try { IR.setToken(sessionToken); } catch (e) {} }
  iniciar();
}

function denyAccess(msg) {
  if (window.IR && typeof IR.denied === 'function') { IR.denied(msg || 'Não autorizado'); return; }
  document.body.innerHTML = `<div class="empty-state" style="min-height:100vh;">
    <h1 style="font-size:1.4rem;">${esc(msg || 'NÃO AUTORIZADO')}</h1>
    <a href="${PORTAL_URL}" style="margin-top:20px;background:#3B82F6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Ir para o Portal</a>
  </div>`;
}

const api = async (url, opts = {}) => {
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(opts.headers || {}) };
  if (sessionToken) headers['X-Session-Token'] = sessionToken;
  const r = await fetch(url, { ...opts, headers, credentials: 'same-origin', cache: 'no-cache' });
  if (r.status === 401 || r.status === 403) {
    sessionStorage.removeItem(MODULE_SESSION_KEY);
    denyAccess('Sua sessão expirou');
    throw new Error('Sessão expirada');
  }
  if (!r.ok) { let e = {}; try { e = await r.json(); } catch {}; throw new Error(e.details || e.error || `Erro ${r.status}`); }
  return r.status === 204 ? null : r.json();
};

/* ─── UI HELPERS ───────────────────────────────────── */
function open(id) { const el = $(id); if (el) { el.classList.add('show'); el.setAttribute('aria-hidden','false'); } }
function close(id) { const el = $(id); if (el) { el.classList.remove('show'); el.setAttribute('aria-hidden','true'); } }

document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => close(b.dataset.close)));
document.querySelectorAll('.modal').forEach(o => o.addEventListener('click', e => { if (e.target === o) close(o.id); }));

document.querySelectorAll('.modal-tab[data-tab]').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.modal-tab[data-tab]').forEach(x => x.classList.toggle('active', x === t));
    document.querySelectorAll('.tab-pane[data-pane]').forEach(p => p.classList.toggle('active', p.dataset.pane === t.dataset.tab));
  });
});
document.querySelectorAll('.modal-tab[data-vtab]').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.modal-tab[data-vtab]').forEach(x => x.classList.toggle('active', x === t));
    document.querySelectorAll('.tab-pane[data-vpane]').forEach(p => p.classList.toggle('active', p.dataset.vpane === t.dataset.vtab));
  });
});

/* ─── INIT ─────────────────────────────────────────── */
async function iniciar() {
  updateMonthDisplay();
  if (window.IR && typeof IR.podeConfirmar === 'function') {
    try { podeMarcarReceber = await IR.podeConfirmar('FINANCEIRO'); } catch (_) { podeMarcarReceber = false; }
  }
  await loadContas();
  setInterval(() => { if (isOnline) loadContas(true); }, 15000);
  setInterval(checkServer, 15000);
}

async function checkServer() {
  try {
    const r = await fetch(`${API_URL}/receber`, { headers: { 'X-Session-Token': sessionToken, 'Accept': 'application/json' }, credentials: 'same-origin' });
    isOnline = r.ok;
  } catch (_) { isOnline = false; }
}

async function loadContas(silent = false) {
  try {
    const r = await fetch(`${API_URL}/receber?_t=${Date.now()}`, {
      headers: { 'X-Session-Token': sessionToken, 'Accept': 'application/json' },
      credentials: 'same-origin'
    });
    if (r.status === 401) { sessionStorage.removeItem(MODULE_SESSION_KEY); denyAccess('Sua sessão expirou'); return; }
    if (!r.ok) { isOnline = false; return; }
    
    const dados = await r.json();
    todasContasRaw = dados;
    contas = dados.filter(c => pertenceAoPeriodo(c, currentMonth, currentYear));
    isOnline = true;
    
    updateFilters();
    updateDashboard();
    renderList();
  } catch (e) {
    if (!silent) { console.error(e); toastError('Erro ao carregar contas'); }
    isOnline = false;
  }
}

/* ─── FILTERS ──────────────────────────────────────── */
$('searchInput').addEventListener('input', filterContas);
$('filterVendedor').addEventListener('change', filterContas);
$('filterBanco').addEventListener('change', filterContas);
$('filterStatus').addEventListener('change', filterContas);

function updateFilters() {
  const setV = new Set(contas.map(c => c.vendedor).filter(Boolean));
  const selV = $('filterVendedor'); const curV = selV.value;
  selV.innerHTML = '<option value="">Vendedor</option>' + Array.from(setV).sort().map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if (curV) selV.value = curV;

  const setB = new Set(contas.map(c => c.banco).filter(Boolean));
  const selB = $('filterBanco'); const curB = selB.value;
  selB.innerHTML = '<option value="">Banco</option>' + Array.from(setB).sort().map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join('');
  if (curB) selB.value = curB;
}

function filterContas() {
  const s = $('searchInput').value.toLowerCase().trim();
  const fv = $('filterVendedor').value;
  const fb = $('filterBanco').value;
  const fs = $('filterStatus').value;

  let list = contas.filter(c => {
    if (fv && c.vendedor !== fv) return false;
    if (fb && c.banco !== fb) return false;
    if (fs && c.status !== fs) return false;
    if (s) {
      const alvo = [c.numero_nf, c.orgao, c.vendedor, c.banco, c.status].join(' ').toLowerCase();
      if (!alvo.includes(s)) return false;
    }
    return true;
  });
  
  list.sort((a, b) => (parseInt(a.numero_nf) || 0) - (parseInt(b.numero_nf) || 0));
  renderList(list);
  updateDashboard();
}

/* ─── DASHBOARD ────────────────────────────────────── */
function updateDashboard() {
  const hoje = new Date().toISOString().split('T')[0];
  const alerta = contas.filter(c => !isContaEspecial(c) && c.status === 'A RECEBER' && c.data_vencimento && c.data_vencimento < hoje).length;
  const pago = contas.filter(c => !isContaEspecial(c) && isStatusPago(c.status)).reduce((s, c) => s + parseFloat(c.valor || 0), 0);
  const receber = contas.filter(c => !isContaEspecial(c) && c.status === 'A RECEBER').reduce((s, c) => s + parseFloat(c.valor || 0), 0);
  const faturado = pago + receber;
  
  const fmt = v => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  $('statPago').textContent = fmt(pago);
  $('statReceber').textContent = fmt(receber);
  $('statFaturado').textContent = fmt(faturado);
  $('statVencido').textContent = alerta;
  
  const card = $('cardVencido');
  if (card) card.classList.toggle('has-alert', alerta > 0);
  const badge = $('pulseBadgeVencido');
  if (badge) badge.style.display = alerta > 0 ? 'flex' : 'none';
}
function isStatusPago(status) { return status === 'PAGO' || /parcela/i.test(status); }

/* ─── LIST / CARDS ─────────────────────────────────── */
function filtered() {
  const s = $('searchInput').value.toLowerCase().trim();
  const fv = $('filterVendedor').value;
  const fb = $('filterBanco').value;
  const fs = $('filterStatus').value;

  return contas.filter(c => {
    if (fv && c.vendedor !== fv) return false;
    if (fb && c.banco !== fb) return false;
    if (fs && c.status !== fs) return false;
    if (s) {
      const alvo = [c.numero_nf, c.orgao, c.vendedor, c.banco, c.status].join(' ').toLowerCase();
      if (!alvo.includes(s)) return false;
    }
    return true;
  }).sort((a, b) => (parseInt(a.numero_nf) || 0) - (parseInt(b.numero_nf) || 0));
}

function renderList(lista = filtered()) {
  const wrap = $('list');
  const empty = $('emptyState');
  
  if (!lista.length) { wrap.innerHTML = ''; empty.hidden = false; return; }
  empty.hidden = true;

  const hoje = new Date().toISOString().split('T')[0];

  wrap.innerHTML = lista.map(c => {
    const especial = isContaEspecial(c);
    const isPagoTotal = !especial && c.status === 'PAGO';
    const isParcial = !especial && /parcela/i.test(c.status || '');
    const parcelas = getParcelas(c);
    const valorPagoTotal = parcelas.length > 0 ? parcelas.reduce((s, p) => s + parseFloat(p.valor || 0), 0) : parseFloat(c.valor_pago || 0);
    let dataPgto = '—';
    if (parcelas.length > 0) {
      const datas = parcelas.map(p => p.data).filter(Boolean).sort();
      if (datas.length > 0) dataPgto = formatDate(datas[datas.length - 1]);
    } else if (c.data_pagamento) {
      dataPgto = formatDate(c.data_pagamento);
    }

    const atrasado = !especial && c.status === 'A RECEBER' && c.data_vencimento && c.data_vencimento < hoje;
    const cls = isPagoTotal ? 'row-pago' : (atrasado ? 'row-vencido' : (especial ? 'row-especial' : ''));

    let badgeHtml = '';
    if (especial) badgeHtml = `<span class="badge-status especial">${esc(getLabelEspecial(c))}</span>`;
    else if (isPagoTotal) badgeHtml = `<span class="badge-status pago">PAGO</span>`;
    else if (isParcial) badgeHtml = `<span class="badge-status parcela">${esc(c.status)}</span>`;
    else if (atrasado) badgeHtml = `<span class="badge-status vencido">VENCIDO</span>`;
    else badgeHtml = `<span class="badge-status receber">A RECEBER</span>`;

    return `
      <div class="conta-card ${cls}" data-id="${esc(c.id)}">
        <div class="card-top">
          <div class="card-top-left">
            <div class="checkbox-wrapper">
              <input type="checkbox" class="styled-checkbox conta-chk" id="chk-${esc(c.id)}" data-id="${esc(c.id)}" ${isPagoTotal ? 'checked' : ''} ${podeMarcarReceber ? '' : 'disabled'}>
              <label for="chk-${esc(c.id)}" class="checkbox-label-styled"></label>
            </div>
            <span class="card-nf">NF ${esc(c.numero_nf || '—')}</span>
          </div>
          ${badgeHtml}
        </div>
        <div class="card-orgao">${esc(up(c.orgao) || '—')}</div>
        <div class="card-grid">
          <div class="card-cell"><span class="cell-label">Vendedor</span><span class="cell-value">${esc(up(c.vendedor) || '—')}</span></div>
          <div class="card-cell"><span class="cell-label">Banco</span><span class="cell-value">${esc(up(c.banco) || '—')}</span></div>
          <div class="card-cell"><span class="cell-label">Valor NF</span><span class="cell-value valor">R$ ${esc((parseFloat(c.valor) || 0).toFixed(2).replace('.', ','))}</span></div>
          <div class="card-cell"><span class="cell-label">Valor Pago</span><span class="cell-value" style="color:#16A34A">${valorPagoTotal > 0 ? 'R$ ' + valorPagoTotal.toFixed(2).replace('.', ',') : '—'}</span></div>
          <div class="card-cell full"><span class="cell-label">Dt. Pagamento</span><span class="cell-value">${dataPgto}</span></div>
        </div>
        <div class="card-actions">
          <button type="button" class="action-btn edit" data-edit="${esc(c.id)}">Editar</button>
          <button type="button" class="action-btn delete" data-del="${esc(c.id)}">Excluir</button>
        </div>
      </div>`;
  }).join('');

  wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openForm(b.dataset.edit); }));
  wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); confirmDelete(b.dataset.del); }));
  wrap.querySelectorAll('.conta-chk').forEach(chk => {
    chk.addEventListener('change', e => { e.stopPropagation(); toggleCheckbox(chk.dataset.id, chk.checked, chk); });
    chk.addEventListener('click', e => e.stopPropagation());
  });
  wrap.querySelectorAll('.conta-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('button') || e.target.closest('.checkbox-wrapper')) return;
      viewConta(card.dataset.id);
    });
  });
}

function getParcelas(conta) {
  try {
    const obs = conta.observacoes;
    if (!obs) return [];
    const parsed = typeof obs === 'string' ? JSON.parse(obs) : obs;
    if (parsed && Array.isArray(parsed.parcelas)) return parsed.parcelas;
    return [];
  } catch { return []; }
}
function getObservacoesTexto(conta) {
  try {
    const obs = conta.observacoes;
    if (!obs) return [];
    const parsed = typeof obs === 'string' ? JSON.parse(obs) : obs;
    if (parsed && Array.isArray(parsed.notas)) return parsed.notas;
    if (Array.isArray(parsed)) return parsed.filter(n => n.texto);
    return [];
  } catch { return []; }
}

/* ─── CHECKBOX (PAGAMENTO) ─────────────────────────── */
function showConfirmacaoPagamentoModal(id, conta) {
  $('confirmPagMsg').textContent = `O pagamento da NF ${conta.numero_nf} será parcelado?`;
  $('btnSim').onclick = () => { close('confirmPagModal'); openForm(id, true, false); };
  $('btnNao').onclick = () => { close('confirmPagModal'); openForm(id, false, true); };
  open('confirmPagModal');
}

async function toggleCheckbox(id, checked, chkEl) {
  if (!podeMarcarReceber) {
    if (chkEl) chkEl.checked = !checked;
    toastError('Somente Financeiro pode alterar');
    return;
  }
  const conta = contas.find(x => String(x.id) === String(id));
  if (!conta) return;

  if (checked) {
    if (chkEl) chkEl.checked = false;
    showConfirmacaoPagamentoModal(id, conta);
  } else {
    if (confirm(`Reverter pagamento da NF ${conta.numero_nf} para "A Receber"?`)) {
      try {
        const saved = await api(`${API_URL}/receber/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'A RECEBER', data_pagamento: null, valor_pago: 0 }) });
        const idx = contas.findIndex(x => String(x.id) === String(id));
        if (idx !== -1) contas[idx] = saved;
        toastSuccess('Pagamento revertido');
        updateDashboard(); renderList();
      } catch (e) { toastError('Erro ao reverter pagamento'); }
    } else {
      if (chkEl) chkEl.checked = true;
    }
  }
}

/* ─── FORM ─────────────────────────────────────────── */
function vendedorOptionsHtml(sel) {
  const atual = String(sel || '').toUpperCase();
  const lista = ((window.IR && IR._vend) || []).slice();
  if (atual && !lista.includes(atual)) lista.push(atual);
  return '<option value="">Selecione...</option>' + lista.map(n => `<option value="${n}" ${n === atual ? 'selected' : ''}>${n}</option>`).join('');
}

function openForm(id, focusParcelas = false, focusValores = false) {
  const isEditing = !!id;
  const c = isEditing ? contas.find(x => String(x.id) === String(id)) : null;
  if (isEditing && !c) return;

  $('contaForm').reset();
  $('editId').value = id || '';
  $('formTitle').textContent = isEditing ? 'Editar Conta' : 'Nova Conta';
  $('btnSave').textContent = isEditing ? 'Atualizar' : 'Salvar';

  // Geral
  $('f_numero_nf').value = c?.numero_nf || '';
  $('f_orgao').value = c?.orgao || '';
  $('f_vendedor').innerHTML = vendedorOptionsHtml(c?.vendedor);
  $('f_banco').value = c?.banco || '';
  $('f_tipo_nf').value = c?.tipo_nf || 'ENVIO';
  $('f_status').value = c?.status === 'PAGO' ? 'PAGO' : 'A RECEBER';

  // Valores
  const notas = c ? getObservacoesTexto(c) : [];
  const parcelas = c ? getParcelas(c) : [];
  _editingParcelasTemp = JSON.parse(JSON.stringify(parcelas));
  const valorPagoAtual = _editingParcelasTemp.length > 0 ? _editingParcelasTemp.reduce((s,p) => s + parseFloat(p.valor||0), 0) : parseFloat(c?.valor_pago||0);
  
  $('f_valor').value = c?.valor || '';
  $('f_valor_pago').value = valorPagoAtual > 0 ? valorPagoAtual.toFixed(2) : '';
  $('f_data_emissao').value = c?.data_emissao || '';
  $('f_data_vencimento').value = c?.data_vencimento || '';
  
  let dataPgAtual = c?.data_pagamento || '';
  if (_editingParcelasTemp.length > 0) { const datas = _editingParcelasTemp.map(p => p.data).filter(Boolean).sort(); if (datas.length > 0) dataPgAtual = datas[datas.length-1]; }
  $('f_data_pagamento').value = dataPgAtual;

  // Desconto
  _descontoConfirmado = false;
  $('btnDesconto').classList.remove('ativo');
  $('btnDesconto').textContent = 'CONFIRMAR DESCONTO';

  // Parcelas
  renderParcelasForm();

  // Obs
  renderObsForm(notas);

  // Tab default
  let tabId = 'geral';
  if (focusParcelas) tabId = 'parcelas';
  else if (focusValores) tabId = 'valores';
  
  document.querySelectorAll('.modal-tab[data-tab]').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  document.querySelectorAll('.tab-pane[data-pane]').forEach(p => p.classList.toggle('active', p.dataset.pane === tabId));

  open('formModal');
}

function renderParcelasForm() {
  const container = $('parcelasFormList');
  if (_editingParcelasTemp.length === 0) {
    container.innerHTML = `<p style="color:var(--text-secondary);font-style:italic;text-align:center;padding:1rem 0;">Nenhuma parcela adicionada.</p>`;
    return;
  }
  container.innerHTML = _editingParcelasTemp.map((p,i) => `
    <div class="observacao-item" style="margin-bottom:.75rem; background:var(--bg-card);">
      <div class="observacao-header">
        <span class="observacao-data" style="font-weight:600;color:var(--text-primary);">${p.numero||(i+1)+'ª Parcela'}</span>
        <button type="button" class="btn-remove-obs" onclick="removerParcelaForm(${i})">✕</button>
      </div>
      <div class="card-grid" style="margin-top:.5rem;">
        <div class="field"><label>Valor (R$)</label><input type="number" step="0.01" min="0" value="${p.valor||''}" onchange="_editingParcelasTemp[${i}].valor = parseFloat(this.value)||0; atualizarValorPagoForm();"></div>
        <div class="field"><label>Data</label><input type="date" value="${p.data||''}" onchange="_editingParcelasTemp[${i}].data = this.value; atualizarValorPagoForm();"></div>
      </div>
    </div>`).join('');
}

window.adicionarParcelaForm = function () {
  const numero = (_editingParcelasTemp.length + 1);
  _editingParcelasTemp.push({ numero: numero + 'ª Parcela', valor: 0, data: '' });
  renderParcelasForm();
};
window.removerParcelaForm = function (i) {
  _editingParcelasTemp.splice(i,1);
  _editingParcelasTemp.forEach((p,idx) => p.numero = (idx+1)+'ª Parcela');
  renderParcelasForm();
};
function atualizarValorPagoForm() {
  const total = _editingParcelasTemp.reduce((s,p) => s + parseFloat(p.valor||0), 0);
  const elVP = $('f_valor_pago');
  if (elVP && !elVP.dataset.manualEdit) elVP.value = total > 0 ? total.toFixed(2) : '';
  const datas = _editingParcelasTemp.map(p => p.data).filter(Boolean).sort();
  const elData = $('f_data_pagamento');
  if (elData && !elData.dataset.manualEdit) elData.value = datas.length > 0 ? datas[datas.length-1] : '';
}
document.addEventListener('change', function (e) {
  if (e.target.id === 'f_valor_pago' || e.target.id === 'f_data_pagamento') e.target.dataset.manualEdit = '1';
});

window.toggleDesconto = function () {
  _descontoConfirmado = !_descontoConfirmado;
  const btn = $('btnDesconto');
  btn.classList.toggle('ativo', _descontoConfirmado);
  btn.textContent = _descontoConfirmado ? 'DESCONTO CONFIRMADO' : 'CONFIRMAR DESCONTO';
  toast(_descontoConfirmado ? 'Desconto confirmado.' : 'Desconto cancelado.', 'info');
};

function renderObsForm(notas) {
  const list = $('obsFormList');
  if (!notas.length) { list.innerHTML = ''; return; }
  list.innerHTML = notas.map((n,i) => `
    <div class="observacao-item">
      <div class="observacao-header">
        <span class="observacao-data">${n.data||''}</span>
        <button type="button" class="btn-remove-obs" onclick="removerObsForm(${i})">✕</button>
      </div>
      <p class="observacao-texto">${n.texto||''}</p>
    </div>`).join('');
}
window.adicionarObsForm = function () {
  const input = $('novaObsInput');
  if (!input || !input.value.trim()) return toastError('Digite uma observação');
  const list = $('obsFormList');
  const notas = [];
  list.querySelectorAll('.observacao-item').forEach(item => {
    notas.push({ texto: item.querySelector('.observacao-texto')?.textContent || '', data: item.querySelector('.observacao-data')?.textContent || '' });
  });
  notas.push({ texto: input.value.trim(), data: new Date().toLocaleString('pt-BR') });
  input.value = '';
  renderObsForm(notas);
};
window.removerObsForm = function (i) {
  const list = $('obsFormList');
  const notas = [];
  list.querySelectorAll('.observacao-item').forEach(item => {
    notas.push({ texto: item.querySelector('.observacao-texto')?.textContent || '', data: item.querySelector('.observacao-data')?.textContent || '' });
  });
  notas.splice(i,1);
  renderObsForm(notas);
};

$('contaForm').addEventListener('submit', async e => {
  e.preventDefault();
  const editId = $('editId').value;
  const numero_nf = $('f_numero_nf').value.trim();
  const orgao = $('f_orgao').value.trim();
  const vendedor = $('f_vendedor').value;
  const banco = $('f_banco').value.trim() || null;
  const tipo_nf = $('f_tipo_nf').value;
  const valor = parseFloat($('f_valor').value) || 0;
  const data_emissao = $('f_data_emissao').value;
  const data_vencimento = $('f_data_vencimento').value || null;

  if (!numero_nf || !orgao || !vendedor || !data_emissao) {
    return toastError('Preencha todos os campos obrigatórios (*)');
  }

  const parcelas = _editingParcelasTemp.filter(p => p.valor > 0 || p.data);
  const totalParcelas = parcelas.reduce((s,p) => s + parseFloat(p.valor||0), 0);
  for (const p of parcelas) {
    if (p.valor > 0 && !p.data) return toastError('Preencha a data de todas as parcelas');
  }

  const valorPagoCampo = parseFloat($('f_valor_pago').value) || 0;
  const valorPago = parcelas.length > 0 ? totalParcelas : valorPagoCampo;
  let data_pagamento = $('f_data_pagamento').value || null;
  if (parcelas.length > 0 && !$('f_data_pagamento').dataset.manualEdit) {
    const datas = parcelas.map(p => p.data).filter(Boolean).sort();
    data_pagamento = datas.length > 0 ? datas[datas.length-1] : null;
  }

  let status = $('f_status').value || 'A RECEBER';
  let pagamentoValido = false;
  if (parcelas.length > 0) {
    if (valorMaiorOuIgual(totalParcelas, valor) || (_descontoConfirmado && totalParcelas > 0 && valorMenorQue(totalParcelas, valor))) pagamentoValido = true;
  } else {
    if (valorMaiorOuIgual(valorPago, valor) || (_descontoConfirmado && valorPago > 0 && valorMenorQue(valorPago, valor))) pagamentoValido = true;
  }
  
  if (pagamentoValido) status = 'PAGO';
  else if (parcelas.length > 0 && totalParcelas > 0) status = parcelas.length + 'ª PARCELA';
  else if (valorPago > 0 && valorMenorQue(valorPago, valor) && !_descontoConfirmado) status = 'A RECEBER';
  if (_descontoConfirmado && (parcelas.length > 0 ? totalParcelas > 0 : valorPago > 0)) status = 'PAGO';

  const list = $('obsFormList');
  const notas = [];
  list.querySelectorAll('.observacao-item').forEach(item => {
    notas.push({ texto: item.querySelector('.observacao-texto')?.textContent || '', data: item.querySelector('.observacao-data')?.textContent || '' });
  });
  
  const observacoes = { notas, parcelas };
  const formData = { numero_nf, orgao, vendedor, banco, tipo_nf, valor, valor_pago: valorPago, data_emissao, data_vencimento, data_pagamento, status, observacoes };

  const btn = $('btnSave'); btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    const saved = await api(editId ? `${API_URL}/receber/${editId}` : `${API_URL}/receber`, {
      method: editId ? 'PUT' : 'POST',
      body: JSON.stringify(formData)
    });
    close('formModal');
    await loadContas(true);
    toastSuccess(editId ? `NF ${numero_nf} atualizada` : `NF ${numero_nf} registrada`);
  } catch (err) {
    toastError(err.message || 'Erro ao salvar');
    btn.disabled = false;
    btn.textContent = editId ? 'Atualizar' : 'Salvar';
  }
});

/* ─── VIEW ─────────────────────────────────────────── */
function viewConta(id) {
  const c = contas.find(x => String(x.id) === String(id));
  if (!c) return;

  $('viewTitle').textContent = `NF ${c.numero_nf}`;
  const hoje = new Date().toISOString().split('T')[0];
  const fmt = v => v ? `R$ ${parseFloat(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : '—';
  const d = v => v ? formatDate(v) : '—';
  
  const parcelas = getParcelas(c);
  const notas = getObservacoesTexto(c);
  const valorPagoTotal = parcelas.length > 0 ? parcelas.reduce((s,p) => s + parseFloat(p.valor||0), 0) : parseFloat(c.valor_pago||0);
  
  const row = (label, val) => `<div class="info-row"><span class="info-label">${esc(label)}</span><span class="info-value">${esc(val)}</span></div>`;

  $('vgeral').innerHTML = `
    <div class="info-section">
      ${row('Órgão', c.orgao)}
      ${row('Vendedor', c.vendedor)}
      ${row('Banco', c.banco)}
      ${row('Tipo NF', c.tipo_nf)}
      ${row('Status', c.status)}
    </div>`;

  $('vvalores').innerHTML = `
    <div class="info-section">
      ${row('Valor NF', fmt(c.valor))}
      ${row('Valor Pago Total', valorPagoTotal > 0 ? fmt(valorPagoTotal) : '—')}
      ${row('Data Emissão', d(c.data_emissao))}
      ${row('Vencimento', d(c.data_vencimento))}
      ${row('Data Pagamento', d(c.data_pagamento))}
    </div>`;

  let pTxt = '';
  if (parcelas.length === 0) pTxt = '<p style="color:var(--text-secondary);font-style:italic;padding:1rem;">Nenhuma parcela registrada.</p>';
  else {
    pTxt = parcelas.map((p,i) => `<div class="info-row"><span class="info-label">${p.numero || (i+1)+'ª'}</span><span class="info-value">${fmt(p.valor)} em ${d(p.data)}</span></div>`).join('');
  }
  $('vparcelas').innerHTML = `<div class="info-section"><h4>Parcelas</h4>${pTxt}</div>`;

  let oTxt = '';
  if (notas.length === 0) oTxt = '<p style="color:var(--text-secondary);font-style:italic;padding:1rem;">Nenhuma observação registrada.</p>';
  else {
    oTxt = notas.map(n => `<div class="observacao-item"><div class="observacao-header"><span class="observacao-data">${n.data||''}</span></div><p class="observacao-texto">${n.texto||''}</p></div>`).join('');
  }
  $('vobs').innerHTML = `<div class="info-section"><h4>Observações</h4><div class="observacoes-list">${oTxt}</div></div>`;

  document.querySelectorAll('.modal-tab[data-vtab]').forEach((t,i) => t.classList.toggle('active', i===0));
  document.querySelectorAll('.tab-pane[data-vpane]').forEach((p,i) => p.classList.toggle('active', i===0));
  open('viewModal');
}

/* ─── DELETE ───────────────────────────────────────── */
function confirmDelete(id) {
  const c = contas.find(x => String(x.id) === String(id));
  if (!c) return;
  pendingDeleteId = id;
  $('deleteMsg').textContent = `Excluir NF ${c.numero_nf}?`;
  $('confirmDeleteBtn').onclick = executeDelete;
  open('deleteModal');
}

async function executeDelete() {
  if (!pendingDeleteId) return;
  const id = pendingDeleteId;
  const c = contas.find(x => String(x.id) === String(id));
  try {
    await api(`${API_URL}/receber/${id}`, { method: 'DELETE' });
    contas = contas.filter(x => String(x.id) !== String(id));
    close('deleteModal');
    pendingDeleteId = null;
    toastError(`NF ${c?.numero_nf || ''} excluída`);
    updateFilters(); updateDashboard(); renderList();
  } catch (e) {
    toastError(e.message || 'Erro ao excluir');
    close('deleteModal');
    pendingDeleteId = null;
  }
}

/* ─── MÊS / CALENDÁRIO ─────────────────────────────── */
function updateMonthDisplay() {
  const el = $('currentMonth');
  if (el) el.textContent = `${meses[currentMonth]} ${currentYear}`;
}
$('monthPrev').addEventListener('click', () => {
  let m = currentMonth - 1, y = currentYear;
  if (m < 0) { m = 11; y--; }
  currentMonth = m; currentYear = y;
  updateMonthDisplay(); loadContas();
});
$('monthNext').addEventListener('click', () => {
  let m = currentMonth + 1, y = currentYear;
  if (m > 11) { m = 0; y++; }
  currentMonth = m; currentYear = y;
  updateMonthDisplay(); loadContas();
});

function renderCalendar() {
  $('calendarYear').textContent = calendarYear;
  const cont = $('calendarMonths');
  const hoje = new Date();
  cont.innerHTML = meses.map((name, i) => {
    const cur = calendarYear === hoje.getFullYear() && i === hoje.getMonth();
    return `<button type="button" class="calendar-month ${cur ? 'current' : ''}" data-month="${i}">${name}</button>`;
  }).join('');
  cont.querySelectorAll('[data-month]').forEach(b => b.addEventListener('click', () => {
    currentMonth = parseInt(b.dataset.month);
    currentYear = calendarYear;
    close('calendarModal');
    updateMonthDisplay(); loadContas();
  }));
}
$('calendarBtn').addEventListener('click', () => { calendarYear = currentYear; renderCalendar(); open('calendarModal'); });
$('calendarPrevYear').addEventListener('click', () => { calendarYear--; renderCalendar(); });
$('calendarNextYear').addEventListener('click', () => { calendarYear++; renderCalendar(); });

/* ─── FABs ─────────────────────────────────────────── */
$('addBtn').addEventListener('click', () => openForm(null));
$('syncBtn').addEventListener('click', async () => {
  const b = $('syncBtn'); b.classList.add('spinning');
  try {
    await loadContas();
    toastSuccess('Dados sincronizados');
  } catch (e) { toastError('Erro ao sincronizar'); }
  finally { setTimeout(() => b.classList.remove('spinning'), 600); }
});

$('pdfBtn').addEventListener('click', () => {
  const vendedorSelecionado = $('filterVendedor').value.toUpperCase().trim();
  if (!vendedorSelecionado) return toastError('Selecione um Vendedor primeiro');
  
  const contasPagas = todasContasRaw.filter(c => {
    if (isContaEspecial(c)) return false;
    if (!c.data_pagamento) return false;
    if ((c.vendedor || '').toUpperCase().trim() !== vendedorSelecionado) return false;
    const dataPagamento = new Date(c.data_pagamento + 'T00:00:00');
    return dataPagamento.getMonth() === currentMonth && dataPagamento.getFullYear() === currentYear;
  });
  
  if (contasPagas.length === 0) return toastError('Nenhum pagamento encontrado no período');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  
  doc.setFontSize(16); doc.setFont(undefined, 'bold');
  doc.text('RELATÓRIO DE COMISSÃO', 148, 20, { align: 'center' });
  doc.setFontSize(11); doc.setFont(undefined, 'normal');
  doc.text(`Vendedor: ${vendedorSelecionado}`, 148, 28, { align: 'center' });
  doc.text(`Período: ${meses[currentMonth]} ${currentYear}`, 148, 35, { align: 'center' });
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 148, 42, { align: 'center' });

  const tableData = contasPagas.map(c => [
    c.numero_nf, c.orgao || '-', formatDate(c.data_emissao), formatDate(c.data_pagamento),
    `R$ ${(parseFloat(c.valor_pago) || parseFloat(c.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ]);
  
  const totalPago = contasPagas.reduce((sum, c) => sum + (parseFloat(c.valor_pago) || parseFloat(c.valor) || 0), 0);
  const comissao = totalPago * 0.01;
  
  doc.autoTable({
    startY: 50,
    head: [['NF', 'Órgão', 'Emissão', 'Data Pagamento', 'Valor Pago']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { halign: 'center', cellWidth: 25 }, 1: { cellWidth: 'auto' }, 2: { halign: 'center', cellWidth: 25 }, 3: { halign: 'center', cellWidth: 25 }, 4: { halign: 'right', cellWidth: 30 } }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11); doc.setFont(undefined, 'bold');
  doc.text(`TOTAL PAGO NO MÊS: R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY);
  doc.text(`COMISSÃO (1%): R$ ${comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 7);
  doc.save(`COMISSAO_${vendedorSelecionado}_${meses[currentMonth]}_${currentYear}.pdf`);
  toastSuccess('Relatório gerado com sucesso');
});

/* ─── VENCIDOS (ALERTA) ────────────────────────────── */
let vencidosModalPage = 1;
const VENCIDOS_PAGE_SIZE = 4;
let vencidosModalData = [];

$('cardVencido').addEventListener('click', () => {
  const hoje = new Date().toISOString().split('T')[0];
  vencidosModalData = contas.filter(c => !isContaEspecial(c) && c.status === 'A RECEBER' && c.data_vencimento && c.data_vencimento < hoje)
    .sort((a,b) => a.data_vencimento.localeCompare(b.data_vencimento));
  vencidosModalPage = 1;
  renderVencidosModalPage();
  open('vencidosModal');
});

function renderVencidosModalPage() {
  const body = $('vencidosModalBody');
  const totalPages = Math.ceil(vencidosModalData.length / VENCIDOS_PAGE_SIZE);
  const start = (vencidosModalPage-1) * VENCIDOS_PAGE_SIZE;
  const pageData = vencidosModalData.slice(start, start+VENCIDOS_PAGE_SIZE);
  
  let html = '';
  if (pageData.length === 0) html = '<div style="text-align:center;padding:2rem;color:var(--text-secondary);">Nenhuma conta vencida</div>';
  else {
    html = `<table><thead><tr><th>NF</th><th>Órgão</th><th>Venc.</th><th>Valor</th></tr></thead><tbody>${pageData.map(c => `
      <tr>
        <td><strong>${c.numero_nf||'-'}</strong></td>
        <td>${c.orgao||'-'}</td>
        <td style="color:#EF4444;font-weight:600;">${formatDate(c.data_vencimento)}</td>
        <td>R$ ${parseFloat(c.valor||0).toFixed(2).replace('.',',')}</td>
      </tr>`).join('')}</tbody></table>`;
  }
  
  if (totalPages > 1) {
    html += `<div class="alert-pagination">
      <button class="alert-page-btn" onclick="changeVencidosPage(-1)" ${vencidosModalPage===1?'disabled':''}>‹</button>
      <span class="alert-page-info">${vencidosModalPage} / ${totalPages}</span>
      <button class="alert-page-btn" onclick="changeVencidosPage(1)" ${vencidosModalPage===totalPages?'disabled':''}>›</button>
    </div>`;
  }
  body.innerHTML = html;
}

window.changeVencidosPage = function (direction) {
  const totalPages = Math.ceil(vencidosModalData.length / VENCIDOS_PAGE_SIZE);
  vencidosModalPage = Math.max(1, Math.min(totalPages, vencidosModalPage + direction));
  renderVencidosModalPage();
};

/* ─── BOOT ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', verificarAutenticacao);

})();

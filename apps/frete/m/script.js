(() => {
"use strict";

const PORTAL_URL = window.location.origin;
const API_URL = window.location.origin + '/api';
const MODULE_SESSION_KEY = 'controleFreteSession';
const SESSION_KEY = 'irUserSession';
const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

let fretes = [];
let transportadorasList = [];
let isOnline = false;
let sessionToken = null;
let podeMarcarFrete = false;
let currentMonth = new Date();
let calendarYear = new Date().getFullYear();
let pendingDeleteId = null;
let pendingDateResolve = null;

const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const up = s => String(s??'').toUpperCase();

/* ─── TOAST (TOPO · padrão mobile) ─────────────────── */
function toastSuccess(m) { toast(m, 'success'); }
function toastError(m)   { toast(m, 'error'); }
function toastWarn(m)    { toast(m, 'warn'); }
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
  if (!r.ok) { let e = {}; try { e = await r.json(); } catch {}; throw new Error(e.error || `Erro ${r.status}`); }
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
    try { podeMarcarFrete = await IR.podeConfirmar('ALMOXARIFADO'); } catch (_) { podeMarcarFrete = false; }
  }
  await Promise.all([loadFretes(), loadTransportadoras()]);
  setInterval(() => { if (isOnline) loadFretes(true); }, 10000);
  setInterval(checkServer, 15000);
}

async function checkServer() {
  try {
    const r = await fetch(`${API_URL}/fretes`, { headers: { 'X-Session-Token': sessionToken, 'Accept': 'application/json' }, credentials: 'same-origin' });
    isOnline = r.ok;
  } catch (_) { isOnline = false; }
}

async function loadFretes(silent = false) {
  try {
    const r = await fetch(`${API_URL}/fretes?_t=${Date.now()}`, {
      headers: { 'X-Session-Token': sessionToken, 'Accept': 'application/json' },
      credentials: 'same-origin'
    });
    if (r.status === 401) { sessionStorage.removeItem(MODULE_SESSION_KEY); denyAccess('Sua sessão expirou'); return; }
    if (!r.ok) { isOnline = false; return; }
    fretes = await r.json();
    isOnline = true;
    updateAllFilters();
    updateDashboard();
    renderList();
  } catch (e) {
    if (!silent) { console.error(e); toastError('Erro ao carregar fretes'); }
    isOnline = false;
  }
}

async function loadTransportadoras() {
  try {
    const r = await fetch(`${API_URL}/transportadoras`, {
      headers: { 'X-Session-Token': sessionToken, 'Accept': 'application/json' },
      credentials: 'same-origin'
    });
    if (!r.ok) return;
    const data = await r.json();
    const lista = Array.isArray(data) ? data : (data.data || []);
    transportadorasList = lista.map(t => t.nome || t.transportadora || t).filter(Boolean).sort();
    updateTransportadoraFilter();
    updateTransportadoraSelect();
  } catch (e) { console.error(e); }
}

/* ─── FILTERS ──────────────────────────────────────── */
$('searchInput').addEventListener('input', renderList);
$('filterTransportadora').addEventListener('change', renderList);
$('filterVendedor').addEventListener('change', renderList);
$('filterStatus').addEventListener('change', renderList);

function updateTransportadoraFilter() {
  let set;
  if (transportadorasList.length) {
    set = new Set(transportadorasList);
    fretes.forEach(f => { if (f.transportadora?.trim() && f.transportadora !== 'NÃO INFORMADO') set.add(f.transportadora.trim()); });
  } else {
    set = new Set();
    fretes.forEach(f => { if (f.transportadora?.trim()) set.add(f.transportadora.trim()); });
  }
  const sel = $('filterTransportadora'); const cur = sel.value;
  sel.innerHTML = '<option value="">Transportadora</option>' + Array.from(set).sort().map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  if (cur) sel.value = cur;
}

function updateVendedorFilter() {
  const set = new Set();
  fretes.forEach(f => { if (f.vendedor?.trim()) set.add(f.vendedor.trim()); });
  const sel = $('filterVendedor'); const cur = sel.value;
  sel.innerHTML = '<option value="">Vendedor</option>' + Array.from(set).sort().map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if (cur) sel.value = cur;
}

function updateStatusFilter() {
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const statusSet = new Set();
  let temForaPrazo = false;
  fretes.forEach(f => {
    if (f.status?.trim()) statusSet.add(f.status.trim());
    const isTipoEnvio = !f.tipo_nf || f.tipo_nf === 'ENVIO';
    if (isTipoEnvio && f.status !== 'ENTREGUE' && f.previsao_entrega) {
      const prev = new Date(f.previsao_entrega + 'T00:00:00'); prev.setHours(0,0,0,0);
      if (prev < hoje) temForaPrazo = true;
    }
  });
  const sel = $('filterStatus'); const cur = sel.value;
  sel.innerHTML = '<option value="">Status</option>';
  if (temForaPrazo) sel.innerHTML += '<option value="FORA_DO_PRAZO">Fora do Prazo</option>';
  const map = { 'EM_TRANSITO': 'Em Trânsito', 'ENTREGUE': 'Entregue' };
  Array.from(statusSet).sort().forEach(s => {
    sel.innerHTML += `<option value="${esc(s)}">${esc(map[s] || s)}</option>`;
  });
  if (cur) sel.value = cur;
}

function updateAllFilters() {
  updateTransportadoraFilter();
  updateVendedorFilter();
  updateStatusFilter();
}

/* ─── DASHBOARD ────────────────────────────────────── */
function updateDashboard() {
  const fm = fretes.filter(f => {
    const d = new Date(f.data_emissao + 'T00:00:00');
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });
  const tipos = ['ENVIO','SIMPLES_REMESSA','REMESSA_AMOSTRA'];
  const fmStatus = fm.filter(f => tipos.includes(f.tipo_nf || 'ENVIO'));
  const allStatus = fretes.filter(f => tipos.includes(f.tipo_nf || 'ENVIO'));
  const fmEnvio = fm.filter(f => !f.tipo_nf || f.tipo_nf === 'ENVIO');
  const hoje = new Date(); hoje.setHours(0,0,0,0);

  $('statEntregues').textContent = fmStatus.filter(f => f.status === 'ENTREGUE').length;
  $('statTransito').textContent = allStatus.filter(f => f.status === 'EM_TRANSITO').length;
  $('statForaPrazo').textContent = allStatus.filter(f => {
    if (f.status === 'ENTREGUE' || !f.previsao_entrega) return false;
    const p = new Date(f.previsao_entrega + 'T00:00:00'); p.setHours(0,0,0,0);
    return p < hoje;
  }).length;
  $('statValorTotal').textContent = 'R$ ' + fmEnvio.reduce((s, f) => s + parseFloat(f.valor_nf || 0), 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
  $('statFrete').textContent = 'R$ ' + fmEnvio.reduce((s, f) => s + parseFloat(f.valor_frete || 0), 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}

/* ─── LIST ─────────────────────────────────────────── */
function filtered() {
  const s = $('searchInput').value.toLowerCase().trim();
  const ft = $('filterTransportadora').value;
  const fv = $('filterVendedor').value;
  const fs = $('filterStatus').value;
  const hoje = new Date(); hoje.setHours(0,0,0,0);

  return fretes.filter(f => {
    const d = new Date(f.data_emissao + 'T00:00:00');
    if (d.getMonth() !== currentMonth.getMonth() || d.getFullYear() !== currentMonth.getFullYear()) return false;
    if (ft && f.transportadora !== ft) return false;
    if (fv && f.vendedor !== fv) return false;
    if (fs) {
      if (fs === 'FORA_DO_PRAZO') {
        const isEnvio = !f.tipo_nf || f.tipo_nf === 'ENVIO';
        if (!isEnvio || f.status === 'ENTREGUE' || !f.previsao_entrega) return false;
        const p = new Date(f.previsao_entrega + 'T00:00:00'); p.setHours(0,0,0,0);
        if (!(p < hoje)) return false;
      } else if (f.status !== fs) return false;
    }
    if (s) {
      const alvo = [f.numero_nf, f.transportadora, f.nome_orgao, f.cidade_destino, f.vendedor, f.documento, f.contato_orgao, f.cotacao].join(' ').toLowerCase();
      if (!alvo.includes(s)) return false;
    }
    return true;
  }).sort((a, b) => (parseInt(a.numero_nf) || 0) - (parseInt(b.numero_nf) || 0));
}

function renderList() {
  const wrap = $('list');
  const empty = $('emptyState');
  const list = filtered();
  if (!list.length) { wrap.innerHTML = ''; empty.hidden = false; return; }
  empty.hidden = true;

  const hoje = new Date(); hoje.setHours(0,0,0,0);

  wrap.innerHTML = list.map(f => {
    const isEntregue = f.status === 'ENTREGUE';
    const isEspecial = ['SIMPLES_REMESSA','REMESSA_AMOSTRA','CANCELADA','DEVOLUCAO','DEVOLVIDA'].includes(f.tipo_nf);
    const tiposCheckbox = ['ENVIO','SIMPLES_REMESSA','REMESSA_AMOSTRA'];
    const showCheck = tiposCheckbox.includes(f.tipo_nf || 'ENVIO');
    const atrasado = !isEntregue && !isEspecial && f.previsao_entrega && new Date(f.previsao_entrega + 'T00:00:00') < hoje;
    const cls = isEntregue ? 'row-entregue' : (atrasado ? 'row-atrasado' : (isEspecial ? 'row-especial' : ''));

    let temObs = false;
    if (f.observacoes) {
      try {
        const arr = typeof f.observacoes === 'string' ? JSON.parse(f.observacoes) : f.observacoes;
        if (arr.length > 0) temObs = true;
      } catch (_) {}
    }

    let badgeHtml = '';
    if (isEspecial) badgeHtml = `<span class="badge-status especial">${esc(tipoLabel(f.tipo_nf))}</span>`;
    else if (atrasado) badgeHtml = `<span class="badge-status devolvido">Fora do Prazo</span>`;
    else badgeHtml = `<span class="badge-status ${isEntregue ? 'entregue' : 'transito'}">${isEntregue ? 'Entregue' : 'Em Trânsito'}</span>`;

    return `
      <div class="frete-card ${cls}" data-id="${esc(f.id)}">
        <div class="card-top">
          <div class="card-top-left">
            ${showCheck ? `<div class="checkbox-wrapper">
              <input type="checkbox" class="styled-checkbox frete-chk" id="chk-${esc(f.id)}" data-id="${esc(f.id)}" ${isEntregue ? 'checked' : ''} ${podeMarcarFrete ? '' : 'disabled'}>
              <label for="chk-${esc(f.id)}" class="checkbox-label-styled"></label>
            </div>` : ''}
            <span class="card-nf">NF ${esc(f.numero_nf || '—')}</span>
          </div>
          ${badgeHtml}
        </div>
        <div class="card-orgao">${esc(up(f.nome_orgao) || '—')}</div>
        <div class="card-grid">
          <div class="card-cell"><span class="cell-label">Vendedor</span><span class="cell-value">${esc(up(f.vendedor) || '—')}</span></div>
          <div class="card-cell"><span class="cell-label">Transportadora</span><span class="cell-value">${esc(up(f.transportadora) || '—')}</span></div>
          <div class="card-cell"><span class="cell-label">Data Entrega</span><span class="cell-value">${esc(f.data_entrega ? formatDate(f.data_entrega) : '—')}</span></div>
          <div class="card-cell"><span class="cell-label">Valor NF</span><span class="cell-value valor">R$ ${esc((parseFloat(f.valor_nf) || 0).toFixed(2).replace('.', ','))}</span></div>
        </div>
        <div class="card-actions">
          <button type="button" class="action-btn edit" data-edit="${esc(f.id)}">Editar</button>
          <button type="button" class="action-btn delete" data-del="${esc(f.id)}">Excluir</button>
        </div>
      </div>`;
  }).join('');

  wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openForm(b.dataset.edit); }));
  wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); confirmDelete(b.dataset.del); }));
  wrap.querySelectorAll('.frete-chk').forEach(chk => {
    chk.addEventListener('change', e => { e.stopPropagation(); toggleCheckbox(chk.dataset.id, chk.checked, chk); });
    chk.addEventListener('click', e => e.stopPropagation());
  });
  wrap.querySelectorAll('.frete-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('button') || e.target.closest('.checkbox-wrapper')) return;
      viewFrete(card.dataset.id);
    });
  });
}

function tipoLabel(t) {
  return ({ 'ENVIO':'Envio','CANCELADA':'Cancelada','REMESSA_AMOSTRA':'Remessa Amostra','SIMPLES_REMESSA':'Simples Remessa','DEVOLUCAO':'Devolução','DEVOLVIDA':'Devolvida' })[t] || t || 'Envio';
}

/* ─── CHECKBOX ─────────────────────────────────────── */
function showDatePicker(numeroNF, initial) {
  return new Promise(resolve => {
    pendingDateResolve = resolve;
    $('datePickerMsg').textContent = `Data de entrega para NF ${numeroNF}`;
    $('datePickerInput').value = initial || new Date().toISOString().split('T')[0];
    open('datePickerModal');
  });
}

$('datePickerConfirm').addEventListener('click', () => {
  const v = $('datePickerInput').value;
  if (!v) { toastError('Selecione uma data'); return; }
  close('datePickerModal');
  if (pendingDateResolve) { pendingDateResolve(v); pendingDateResolve = null; }
});
$('datePickerModal').addEventListener('click', e => {
  if (e.target === $('datePickerModal') || e.target.closest('[data-close="datePickerModal"]')) {
    if (pendingDateResolve) { pendingDateResolve(null); pendingDateResolve = null; }
  }
});

async function toggleCheckbox(id, checked, chkEl) {
  const f = fretes.find(x => String(x.id) === String(id));
  if (!f) return;
  const tipos = ['ENVIO','SIMPLES_REMESSA','REMESSA_AMOSTRA'];
  if (!tipos.includes(f.tipo_nf || 'ENVIO')) return;
  if (!podeMarcarFrete) { if (chkEl) chkEl.checked = !checked; toastError('Somente Almoxarifado pode alterar'); return; }

  if (f.status === 'ENTREGUE') {
    try {
      const saved = await api(`${API_URL}/fretes/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'EM_TRANSITO', data_entrega: null }) });
      const idx = fretes.findIndex(x => String(x.id) === String(id));
      if (idx !== -1) fretes[idx] = saved;
      toastSuccess(`NF ${saved.numero_nf} desmarcada`);
      updateDashboard(); renderList();
    } catch (e) {
      if (chkEl) chkEl.checked = true;
      toastError(e.message);
    }
    return;
  }

  const data = await showDatePicker(f.numero_nf, f.data_entrega || undefined);
  if (data === null) { if (chkEl) chkEl.checked = false; toastError('Confirmação revogada'); return; }
  try {
    const saved = await api(`${API_URL}/fretes/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'ENTREGUE', data_entrega: data }) });
    const idx = fretes.findIndex(x => String(x.id) === String(id));
    if (idx !== -1) fretes[idx] = saved;
    toastSuccess(`NF ${saved.numero_nf} entregue em ${formatDate(saved.data_entrega)}`);
    updateDashboard(); renderList();
  } catch (e) {
    if (chkEl) chkEl.checked = false;
    toastError(e.message);
  }
}

/* ─── FORM ─────────────────────────────────────────── */
function updateTransportadoraSelect() {
  const sel = $('transportadora'); if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">Selecione...</option>' + transportadorasList.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  if (cur) sel.value = cur;
}

function openForm(id) {
  const isEditing = !!id;
  const f = isEditing ? fretes.find(x => String(x.id) === String(id)) : null;

  $('freteForm').reset();
  $('editId').value = id || '';
  $('formTitle').textContent = isEditing ? 'Editar Frete' : 'Novo Frete';
  $('btnSave').textContent = isEditing ? 'Atualizar' : 'Salvar';
  $('observacoesData').value = '[]';
  $('observacoesList').innerHTML = '';
  $('novaObservacao').value = '';

  updateTransportadoraSelect();

  if (f) {
    $('numero_nf').value = f.numero_nf || '';
    $('data_emissao').value = f.data_emissao || '';
    $('documento').value = f.documento || '';
    $('valor_nf').value = f.valor_nf || '';
    $('tipo_nf').value = f.tipo_nf || 'ENVIO';
    $('nome_orgao').value = f.nome_orgao || '';
    $('contato_orgao').value = f.contato_orgao || '';
    $('cidade_destino').value = f.cidade_destino || '';
    $('transportadora').value = f.transportadora || '';
    $('valor_frete').value = f.valor_frete || '';
    $('data_coleta').value = f.data_coleta || '';
    $('previsao_entrega').value = f.previsao_entrega || '';
    $('data_entrega').value = f.data_entrega || '';
    $('cotacao').value = f.cotacao || '';
    let obs = [];
    if (f.observacoes) { try { obs = typeof f.observacoes === 'string' ? JSON.parse(f.observacoes) : f.observacoes; } catch (_) {} }
    $('observacoesData').value = JSON.stringify(obs);
    renderObservacoes();
    if (window.IR && typeof IR.preencherVendedores === 'function') {
      try { IR.preencherVendedores($('vendedor'), f.vendedor); } catch (_) {}
    }
  } else {
    if (window.IR && typeof IR.preencherVendedores === 'function') {
      try { IR.preencherVendedores($('vendedor')); } catch (_) {}
    }
  }

  ['numero_nf','documento','nome_orgao','contato_orgao','cidade_destino'].forEach(id => {
    const el = $(id);
    if (el && !el._upperBound) {
      el.addEventListener('input', e => {
        const s = e.target.selectionStart;
        e.target.value = e.target.value.toUpperCase();
        try { e.target.setSelectionRange(s, s); } catch (_) {}
      });
      el._upperBound = true;
    }
  });

  document.querySelectorAll('.modal-tab[data-tab]').forEach((t,i) => t.classList.toggle('active', i===0));
  document.querySelectorAll('.tab-pane[data-pane]').forEach((p,i) => p.classList.toggle('active', i===0));
  open('formModal');
}

function renderObservacoes() {
  const obs = JSON.parse($('observacoesData').value || '[]');
  const cont = $('observacoesList');
  if (!obs.length) { cont.innerHTML = ''; return; }
  cont.innerHTML = obs.map((o, i) => `
    <div class="observacao-item">
      <div class="observacao-header">
        <span class="observacao-data">${esc(new Date(o.timestamp).toLocaleString('pt-BR'))}</span>
        <button type="button" class="btn-remove-obs" data-rm-obs="${i}">✕</button>
      </div>
      <p class="observacao-texto">${esc(o.texto)}</p>
    </div>`).join('');
  cont.querySelectorAll('[data-rm-obs]').forEach(b => b.addEventListener('click', () => {
    const idx = parseInt(b.dataset.rmObs);
    const arr = JSON.parse($('observacoesData').value || '[]');
    arr.splice(idx, 1);
    $('observacoesData').value = JSON.stringify(arr);
    renderObservacoes();
  }));
}

$('btnAddObs').addEventListener('click', () => {
  const txt = $('novaObservacao').value.trim();
  if (!txt) { toastError('Digite uma observação'); return; }
  const arr = JSON.parse($('observacoesData').value || '[]');
  arr.push({ texto: txt, timestamp: new Date().toISOString() });
  $('observacoesData').value = JSON.stringify(arr);
  $('novaObservacao').value = '';
  renderObservacoes();
});

$('freteForm').addEventListener('submit', async e => {
  e.preventDefault();
  const editId = $('editId').value;
  const formData = {
    numero_nf: $('numero_nf').value.trim(),
    data_emissao: $('data_emissao').value || new Date().toISOString().split('T')[0],
    documento: $('documento').value.trim() || 'NÃO INFORMADO',
    valor_nf: parseFloat($('valor_nf').value) || 0,
    tipo_nf: $('tipo_nf').value || 'ENVIO',
    nome_orgao: $('nome_orgao').value.trim(),
    contato_orgao: $('contato_orgao').value.trim() || 'NÃO INFORMADO',
    vendedor: $('vendedor').value.trim() || 'NÃO INFORMADO',
    transportadora: $('transportadora').value.trim() || 'NÃO INFORMADO',
    valor_frete: parseFloat($('valor_frete').value) || 0,
    data_coleta: $('data_coleta').value,
    cidade_destino: $('cidade_destino').value.trim() || 'NÃO INFORMADO',
    previsao_entrega: $('previsao_entrega').value || null,
    data_entrega: $('data_entrega').value || null,
    cotacao: $('cotacao').value.trim() || null,
    observacoes: $('observacoesData').value
  };
  if (!formData.numero_nf || !formData.nome_orgao) {
    toastError('Verifique se todas as informações obrigatórias estão preenchidas');
    return;
  }
  const btn = $('btnSave'); btn.disabled = true; btn.textContent = 'Aguarde...';
  try {
    const saved = await api(editId ? `${API_URL}/fretes/${editId}` : `${API_URL}/fretes`, {
      method: editId ? 'PUT' : 'POST',
      body: JSON.stringify(formData)
    });
    close('formModal');
    await loadFretes(true);
    toastSuccess(editId ? `NF ${formData.numero_nf || saved.numero_nf} atualizado` : `NF ${formData.numero_nf || saved.numero_nf} registrado`);
  } catch (err) {
    toastError(err.message || 'Erro ao salvar');
    btn.disabled = false;
    btn.textContent = editId ? 'Atualizar' : 'Salvar';
  }
});

/* ─── VIEW ─────────────────────────────────────────── */
function viewFrete(id) {
  const f = fretes.find(x => String(x.id) === String(id));
  if (!f) return;

  const row = (label, val) => `<div class="info-row"><span class="info-label">${esc(label)}</span><span class="info-value ${!val || val === 'NÃO INFORMADO' ? 'empty' : ''}">${esc(val || '—')}</span></div>`;

  $('vnota').innerHTML = `
    <div class="info-section">
      <h4>Dados da Nota</h4>
      ${row('Número NF', f.numero_nf)}
      ${row('Data Emissão', f.data_emissao ? formatDate(f.data_emissao) : '')}
      ${row('Documento', f.documento)}
      ${row('Valor NF', 'R$ ' + (parseFloat(f.valor_nf) || 0).toFixed(2).replace('.', ','))}
      ${row('Tipo NF', tipoLabel(f.tipo_nf))}
      ${row('Vendedor', f.vendedor)}
    </div>`;

  $('vorgao').innerHTML = `
    <div class="info-section">
      <h4>Órgão</h4>
      ${row('Nome', f.nome_orgao)}
      ${row('Contato', f.contato_orgao)}
      ${row('Cidade-UF', f.cidade_destino)}
    </div>`;

  $('vtransporte').innerHTML = `
    <div class="info-section">
      <h4>Transporte</h4>
      ${row('Transportadora', f.transportadora)}
      ${row('Valor Frete', 'R$ ' + (parseFloat(f.valor_frete) || 0).toFixed(2).replace('.', ','))}
      ${row('Data Coleta', f.data_coleta ? formatDate(f.data_coleta) : '')}
      ${row('Previsão Entrega', f.previsao_entrega ? formatDate(f.previsao_entrega) : '')}
      ${row('Data Entrega', f.data_entrega ? formatDate(f.data_entrega) : '')}
      ${row('Cotação', f.cotacao)}
    </div>`;

  let obsArr = [];
  if (f.observacoes) { try { obsArr = typeof f.observacoes === 'string' ? JSON.parse(f.observacoes) : f.observacoes; } catch (_) {} }
  $('vobs').innerHTML = `
    <div class="info-section">
      <h4>Observações</h4>
      ${obsArr.length
        ? obsArr.map(o => `<div class="observacao-item"><div class="observacao-header"><span class="observacao-data">${esc(new Date(o.timestamp).toLocaleString('pt-BR'))}</span></div><p class="observacao-texto">${esc(o.texto)}</p></div>`).join('')
        : '<p style="color:var(--text-secondary);font-style:italic;text-align:center;padding:1rem;">Nenhuma observação registrada</p>'}
    </div>`;

  document.querySelectorAll('.modal-tab[data-vtab]').forEach((t,i) => t.classList.toggle('active', i===0));
  document.querySelectorAll('.tab-pane[data-vpane]').forEach((p,i) => p.classList.toggle('active', i===0));
  open('viewModal');
}

/* ─── DELETE ───────────────────────────────────────── */
function confirmDelete(id) {
  const f = fretes.find(x => String(x.id) === String(id));
  if (!f) return;
  pendingDeleteId = id;
  $('deleteMsg').textContent = `Tem certeza que deseja excluir a NF ${f.numero_nf || 'sem número'}?`;
  $('confirmDeleteBtn').onclick = executeDelete;
  open('deleteModal');
}

async function executeDelete() {
  if (!pendingDeleteId) return;
  const id = pendingDeleteId;
  const f = fretes.find(x => String(x.id) === String(id));
  try {
    await api(`${API_URL}/fretes/${id}`, { method: 'DELETE' });
    fretes = fretes.filter(x => String(x.id) !== String(id));
    close('deleteModal');
    pendingDeleteId = null;
    updateAllFilters(); updateDashboard(); renderList();
    toastError(`NF ${f?.numero_nf || ''} excluída`);
  } catch (e) {
    toastError(e.message || 'Erro ao excluir');
    close('deleteModal');
    pendingDeleteId = null;
  }
}

/* ─── MÊS / CALENDÁRIO ─────────────────────────────── */
function updateMonthDisplay() {
  const el = $('currentMonth');
  if (el) el.textContent = `${meses[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
}
$('monthPrev').addEventListener('click', () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1); updateMonthDisplay(); updateDashboard(); renderList(); });
$('monthNext').addEventListener('click', () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1); updateMonthDisplay(); updateDashboard(); renderList(); });

function renderCalendar() {
  $('calendarYear').textContent = calendarYear;
  const cont = $('calendarMonths');
  cont.innerHTML = meses.map((name, i) => {
    const cur = calendarYear === currentMonth.getFullYear() && i === currentMonth.getMonth();
    return `<button type="button" class="calendar-month ${cur ? 'current' : ''}" data-month="${i}">${name}</button>`;
  }).join('');
  cont.querySelectorAll('[data-month]').forEach(b => b.addEventListener('click', () => {
    currentMonth = new Date(calendarYear, parseInt(b.dataset.month), 1);
    close('calendarModal');
    updateMonthDisplay(); updateDashboard(); renderList();
  }));
}
$('calendarBtn').addEventListener('click', () => { calendarYear = currentMonth.getFullYear(); renderCalendar(); open('calendarModal'); });
$('calendarPrevYear').addEventListener('click', () => { calendarYear--; renderCalendar(); });
$('calendarNextYear').addEventListener('click', () => { calendarYear++; renderCalendar(); });

/* ─── FABs ─────────────────────────────────────────── */
$('addBtn').addEventListener('click', () => openForm(null));
$('syncBtn').addEventListener('click', async () => {
  const b = $('syncBtn'); b.classList.add('spinning');
  try {
    await Promise.all([loadFretes(true), loadTransportadoras()]);
    toastSuccess('Dados sincronizados');
  } catch (e) { toastError('Erro ao sincronizar'); }
  finally { setTimeout(() => b.classList.remove('spinning'), 600); }
});

/* ═══════════════════════════════════════════════════════════════════════
   ANÁLISE COMPARATIVA (mobile)
   Paginador ÚNICO (só no topo) com 3 páginas — cada página é um dos 3
   comparativos originais:
     0 → Mês        (3 cards: mês selecionado, mês anterior, mesmo mês ano passado)
     1 → Ano        (2 cards: total do ano, total ano passado)
     2 → Mês a Mês  (tabela 12 meses × 2 anos)
   ═══════════════════════════════════════════════════════════════════════ */
let cmpPagina = 0;
const CMP_TOTAL = 3;
const CMP_LABELS = ['Mês', 'Ano', 'Mês a Mês'];

window.cmpNav = function (dir) {
  const next = Math.max(0, Math.min(CMP_TOTAL - 1, cmpPagina + dir));
  if (next === cmpPagina) return;
  cmpPagina = next;
  renderComparativo();
};

$('cmpBtn').addEventListener('click', () => {
  cmpPagina = 0;
  renderComparativo();
  open('dashboardModal');
});

function renderComparativo() {
  const body = $('dashboardModalBody'); if (!body) return;
  const mesesNomes = meses;
  const anoAtual = currentMonth.getFullYear();
  const mesAtual = currentMonth.getMonth();
  const fmt = v => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ehEnvio = f => !f.tipo_nf || f.tipo_nf === 'ENVIO';

  function metricas(mes, ano) {
    const lista = fretes.filter(f => {
      if (!f.data_emissao || !ehEnvio(f)) return false;
      const d = new Date(String(f.data_emissao).slice(0, 10) + 'T00:00:00');
      return d.getMonth() === mes && d.getFullYear() === ano;
    });
    const faturado = lista.reduce((s, f) => s + (parseFloat(f.valor_nf) || 0), 0);
    const frete = lista.reduce((s, f) => s + (parseFloat(f.valor_frete) || 0), 0);
    return { notas: lista.length, faturado, frete, pct: faturado > 0 ? (frete / faturado) * 100 : 0 };
  }
  function somaAno(ano) {
    let notas=0, faturado=0, frete=0;
    for (let m=0;m<12;m++){ const x=metricas(m,ano); notas+=x.notas; faturado+=x.faturado; frete+=x.frete; }
    return { notas, faturado, frete, pct: faturado>0 ? (frete/faturado)*100 : 0 };
  }
  function variacao(atual, base, inverso) {
    if (!base && !atual) return '<span class="cmp-neutro">sem dados</span>';
    if (!base) return '<span class="cmp-neutro">sem base</span>';
    const dif = atual - base; const pct = (dif/base)*100;
    if (Math.abs(pct) < 0.05) return '<span class="cmp-neutro">sem variação</span>';
    const subiu = dif > 0; const bom = inverso ? !subiu : subiu;
    return `<span class="${bom ? 'cmp-bom' : 'cmp-ruim'}">${subiu ? '▲ +' : '▼ −'}${fmt(Math.abs(dif))} (${subiu ? '+' : '−'}${Math.abs(pct).toFixed(1)}%)</span>`;
  }
  const card = (titulo, sub, m, base, rotBase) => `
    <div class="cmp-card">
      <div class="cmp-card-titulo">${titulo}</div>
      <div class="cmp-card-sub">${sub}</div>
      <div class="cmp-linha"><span>Faturado</span><strong>${fmt(m.faturado)}</strong></div>
      <div class="cmp-linha"><span>Frete</span><strong>${fmt(m.frete)}</strong></div>
      <div class="cmp-linha"><span>Frete/Faturado</span><strong>${m.pct.toFixed(1)}%</strong></div>
      <div class="cmp-linha"><span>Notas</span><strong>${m.notas}</strong></div>
      ${base ? `<div class="cmp-sep"></div><div class="cmp-vs">Comparado a ${rotBase}</div>
        <div class="cmp-linha"><span>Faturado</span>${variacao(m.faturado, base.faturado, false)}</div>
        <div class="cmp-linha"><span>Frete</span>${variacao(m.frete, base.frete, true)}</div>` : ''}
    </div>`;

  // ─── CÁLCULO DOS 3 COMPARATIVOS ─────────────────────
  // 1) MÊS
  const mesRef = new Date(anoAtual, mesAtual, 1);
  const mIdx = mesRef.getMonth(), aRef = mesRef.getFullYear();
  const mA = new Date(aRef, mIdx - 1, 1);
  const atual = metricas(mIdx, aRef);
  const anterior = metricas(mA.getMonth(), mA.getFullYear());
  const mesmoAno = metricas(mIdx, aRef - 1);
  const htmlMes = `
    ${card('Mês selecionado', `${mesesNomes[mIdx]}/${aRef}`, atual, anterior, `${mesesNomes[mA.getMonth()]}/${mA.getFullYear()}`)}
    ${card('Mês anterior', `${mesesNomes[mA.getMonth()]}/${mA.getFullYear()}`, anterior)}
    ${card('Mesmo mês, ano passado', `${mesesNomes[mIdx]}/${aRef - 1}`, mesmoAno)}`;

  // 2) ANO
  const totAno = somaAno(anoAtual), totAnoPass = somaAno(anoAtual - 1);
  const htmlAno = `
    ${card('Total do ano', String(anoAtual), totAno, totAnoPass, `total de ${anoAtual-1}`)}
    ${card('Total do ano passado', String(anoAtual-1), totAnoPass)}`;

  // 3) TABELA MÊS A MÊS
  const aTab = anoAtual, aAnt = anoAtual - 1;
  const porMes = [], porMesPass = [];
  for (let m=0;m<12;m++){ porMes.push(metricas(m,aTab)); porMesPass.push(metricas(m,aAnt)); }
  const somaArr = arr => arr.reduce((t,x)=>({notas:t.notas+x.notas, faturado:t.faturado+x.faturado, frete:t.frete+x.frete}),{notas:0,faturado:0,frete:0});
  const totTab = somaArr(porMes), totTabPass = somaArr(porMesPass);
  const pctTab = totTab.faturado > 0 ? (totTab.frete/totTab.faturado)*100 : 0;
  let melhor = -1, pior = -1;
  porMes.forEach((x,i) => {
    if (x.faturado > 0) {
      if (melhor < 0 || x.faturado > porMes[melhor].faturado) melhor = i;
      if (pior < 0 || x.faturado < porMes[pior].faturado) pior = i;
    }
  });
  const linhas = porMes.map((x,i) => {
    const p = porMesPass[i];
    const cls = [];
    if (melhor !== -1 && i === melhor) cls.push('cmp-melhor-mes');
    if (pior !== -1 && pior !== melhor && i === pior) cls.push('cmp-pior-mes');
    if (i === mesAtual && anoAtual === aTab) cls.push('cmp-mes-atual');
    return `<tr class="${cls.join(' ')}">
      <td style="text-align:left;font-weight:600;">${mesesNomes[i]}</td>
      <td>${x.notas}</td>
      <td>${fmt(x.faturado)}</td>
      <td>${fmt(x.frete)}</td>
      <td>${x.faturado > 0 ? x.pct.toFixed(1)+'%' : '—'}</td>
      <td>${fmt(p.faturado)}</td>
      <td>${variacao(x.faturado, p.faturado, false)}</td>
    </tr>`;
  }).join('');

  const htmlTabela = `
    <div style="overflow-x:auto;">
      <table class="cmp-tabela">
        <thead><tr>
          <th style="text-align:left;">Mês</th>
          <th>Notas</th><th>Faturado ${aTab}</th><th>Frete ${aTab}</th>
          <th>Frete/Fat</th><th>Faturado ${aAnt}</th><th>Variação</th>
        </tr></thead>
        <tbody>${linhas}</tbody>
        <tfoot><tr>
          <td style="text-align:left;">Total ${aTab}</td>
          <td>${totTab.notas}</td>
          <td>${fmt(totTab.faturado)}</td>
          <td>${fmt(totTab.frete)}</td>
          <td>${pctTab.toFixed(1)}%</td>
          <td>${fmt(totTabPass.faturado)}</td>
          <td>${variacao(totTab.faturado, totTabPass.faturado, false)}</td>
        </tr></tfoot>
      </table>
    </div>`;

  // ─── CONTEÚDO DA PÁGINA ATUAL ───────────────────────
  let conteudo = '';
  if (cmpPagina === 0) conteudo = `<div class="cmp-grid">${htmlMes}</div>`;
  else if (cmpPagina === 1) conteudo = `<div class="cmp-grid">${htmlAno}</div>`;
  else conteudo = htmlTabela;

  // ─── PAGINADOR ÚNICO (só no topo) ───────────────────
  const paginador = `
    <div class="cmp-pag">
      <button type="button" class="cmp-pag-btn" onclick="cmpNav(-1)" ${cmpPagina === 0 ? 'disabled' : ''} aria-label="Anterior">‹</button>
      <span class="cmp-pag-info">${CMP_LABELS[cmpPagina]}</span>
      <button type="button" class="cmp-pag-btn" onclick="cmpNav(1)" ${cmpPagina === CMP_TOTAL - 1 ? 'disabled' : ''} aria-label="Próximo">›</button>
    </div>`;

  body.innerHTML = `${paginador}${conteudo}`;
}

/* ─── BOOT ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', verificarAutenticacao);

})();

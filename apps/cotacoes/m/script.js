(() => {
"use strict";

const PORTAL_URL = window.location.origin;
const API_URL = `${window.location.origin}/api`;
const MODULE_SESSION_KEY = 'cotacoesSession';
const SESSION_KEY = 'irUserSession';
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

let cotacoes = [];
let editingId = null;
let pendingDeleteId = null;
let sessionToken = null;
let currentUser = null;
let podeMarcar = false;
let currentMonth = new Date();
let calendarYear = new Date().getFullYear();
let transportadorasCache = [];
let isLoading = false;
let currentFetchController = null;

const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function formatarMoeda(valor) {
  const num = parseFloat(valor) || 0;
  return 'R$ ' + num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function formatarData(data) {
  if (!data) return '—';
  if (typeof data === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(data)) return data;
  const d = new Date(data);
  if (isNaN(d.getTime())) return data;
  return d.toLocaleDateString('pt-BR');
}
function getDataAtual() {
  const h = new Date();
  return `${String(h.getDate()).padStart(2,'0')}/${String(h.getMonth()+1).padStart(2,'0')}/${h.getFullYear()}`;
}

/* ─── AUTH ───────────────────────────────────────────── */
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
      const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        sessionToken = parsed.token || parsed.sessionToken || null;
      }
    } catch (e) {}
  }
  if (!sessionToken) { denyAccess('Sessão expirada'); return; }
  if (window.IR && typeof IR.setToken === 'function') { try { IR.setToken(sessionToken); } catch (e) {} }
  inicializarApp();
}

function denyAccess(msg) {
  if (window.IR && typeof IR.denied === 'function') { IR.denied(msg || 'Não autorizado'); return; }
  document.body.innerHTML = `
    <div class="empty-state" style="min-height:100vh;">
      <h1 style="font-size:1.4rem;">${esc(msg || 'NÃO AUTORIZADO')}</h1>
      <p style="margin-top:8px;font-size:.9rem;">Somente usuários autenticados podem acessar esta área.</p>
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
  if (!r.ok) {
    let e = {};
    try { e = await r.json(); } catch {}
    throw new Error(e.error || `Erro ${r.status}`);
  }
  return r.status === 204 ? null : r.json();
};

/* ─── UI HELPERS ────────────────────────────────────── */
function toastSuccess(msg) {
  const t = $('toast'); t.className = 'toast success'; t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}
function toastError(msg) {
  const t = $('toast'); t.className = 'toast error'; t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}
function open(id) { const el = $(id); if (el) { el.classList.add('show'); el.setAttribute('aria-hidden', 'false'); } }
function close(id) { const el = $(id); if (el) { el.classList.remove('show'); el.setAttribute('aria-hidden', 'true'); } }

document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => close(b.dataset.close)));
document.querySelectorAll('.modal').forEach(o => o.addEventListener('click', e => { if (e.target === o) close(o.id); }));

/* ─── TABS ──────────────────────────────────────────── */
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

/* ─── INIT ──────────────────────────────────────────── */
async function inicializarApp() {
  if (window.IR) {
    try { podeMarcar = await IR.podeConfirmar('ALMOXARIFADO'); } catch (_) { podeMarcar = false; }
    try { IR.preencherVendedores($('vendedor')); } catch (_) {}
  }
  updateMonthDisplay();
  await Promise.all([loadTransportadorasCache(), loadCotacoes()]);
  setInterval(() => { if (!isLoading) loadCotacoes(); }, 30000);
}

async function loadTransportadorasCache() {
  try {
    const data = await api(`${API_URL}/transportadoras?limit=200`);
    const lista = Array.isArray(data) ? data : (data.data || []);
    transportadorasCache = lista.map(t => (t.nome || '').trim().toUpperCase()).filter(Boolean).sort();
    updateTransportadoraSelects();
  } catch (e) { console.error('Erro ao carregar transportadoras:', e); }
}

function updateTransportadoraSelects() {
  const selFilter = $('filterTransportadora');
  if (selFilter) {
    const cur = selFilter.value;
    selFilter.innerHTML = '<option value="">Transportadora</option>' +
      transportadorasCache.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if (cur) selFilter.value = cur;
  }
  const selForm = $('transportadora');
  if (selForm) {
    const cur = selForm.value;
    selForm.innerHTML = '<option value="">Selecione...</option>' +
      transportadorasCache.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if (cur) selForm.value = cur;
  }
}

async function loadCotacoes() {
  if (currentFetchController) currentFetchController.abort();
  currentFetchController = new AbortController();
  const signal = currentFetchController.signal;
  const mes = currentMonth.getMonth();
  const ano = currentMonth.getFullYear();
  isLoading = true;
  try {
    const data = await api(`${API_URL}/cotacoes?mes=${mes}&ano=${ano}`, { signal });
    cotacoes = Array.isArray(data) ? data : [];
    isLoading = false;
    currentFetchController = null;
    renderList();
    updateResponsavelSelect();
  } catch (e) {
    if (e.name === 'AbortError') return;
    isLoading = false;
    console.error(e);
  }
}

function updateResponsavelSelect() {
  const responsaveis = new Set();
  cotacoes.forEach(c => { if ((c.responsavel || '').trim()) responsaveis.add(c.responsavel.trim()); });
  const sel = $('filterResponsavel');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">Responsável</option>' +
    Array.from(responsaveis).sort().map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
  if (cur) sel.value = cur;
}

/* ─── LIST ──────────────────────────────────────────── */
function parseObs(c) {
  const raw = c && c.observacoes;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { const a = JSON.parse(raw); if (Array.isArray(a)) return a; } catch (e) {}
  return [{ texto: String(raw), timestamp: (c && (c.createdat || c.timestamp)) || null }];
}

function filteredList() {
  const search = ($('searchInput').value || '').toLowerCase().trim();
  const fTransp = $('filterTransportadora').value || '';
  const fResp = $('filterResponsavel').value || '';
  const fStatus = $('filterStatus').value || '';
  return cotacoes.filter(c => {
    if (search) {
      const alvo = `${c.transportadora||''} ${c.destino||''} ${c.documento||''} ${c.numeroCotacao||''} ${c.responsavel||''}`.toLowerCase();
      if (!alvo.includes(search)) return false;
    }
    if (fTransp && c.transportadora !== fTransp) return false;
    if (fResp && c.responsavel !== fResp) return false;
    if (fStatus === 'aprovada' && c.negocioFechado !== true) return false;
    if (fStatus === 'reprovada' && c.negocioFechado !== false) return false;
    return true;
  });
}

function renderList() {
  const wrap = $('list');
  const empty = $('emptyState');
  const list = filteredList();

  if (!list.length) {
    wrap.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  wrap.innerHTML = list.map(c => {
    const aprovada = c.negocioFechado === true;
    const obsArr = parseObs(c);
    const hasObs = obsArr.length > 0;
    const id = String(c.id);
    const chkAttr = podeMarcar ? '' : 'disabled';

    return `
      <div class="cotacao-card ${aprovada ? 'row-aprovada' : ''}" data-id="${esc(id)}">
        <div class="card-top">
          <div class="card-top-left">
            <div class="checkbox-wrapper">
              <input type="checkbox" class="styled-checkbox cotacao-check" id="chk-${esc(id)}" data-id="${esc(id)}" ${aprovada ? 'checked' : ''} ${chkAttr}>
              <label for="chk-${esc(id)}" class="checkbox-label-styled" ${podeMarcar ? '' : 'title="Somente Almoxarifado e administradores"'}></label>
            </div>
            <span class="card-codigo">${esc(c.codigo || '—')}</span>
          </div>
          ${hasObs ? `<button type="button" class="alert-btn" data-view-obs="${esc(id)}" title="Ver observações" aria-label="Ver observações">
            <svg viewBox="0 0 24 24"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>` : ''}
        </div>
        <div class="card-transp">${esc(c.transportadora || '—')}</div>
        <div class="card-grid">
          <div class="card-cell"><span class="cell-label">Data</span><span class="cell-value">${esc(formatarData(c.dataCotacao))}</span></div>
          <div class="card-cell"><span class="cell-label">Valor</span><span class="cell-value valor">${esc(c.valorFrete ? formatarMoeda(c.valorFrete) : '—')}</span></div>
          <div class="card-cell full"><span class="cell-label">Destino</span><span class="cell-value">${esc(c.destino || '—')}</span></div>
          <div class="card-cell full"><span class="cell-label">Documento</span><span class="cell-value">${esc(c.documento || c.numeroCotacao || '—')}</span></div>
        </div>
        <div class="card-actions">
          <button type="button" class="action-btn edit" data-edit="${esc(id)}">Editar</button>
          <button type="button" class="action-btn delete" data-del="${esc(id)}">Excluir</button>
        </div>
      </div>`;
  }).join('');

  wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); editCotacao(b.dataset.edit); }));
  wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); showDeleteModal(b.dataset.del); }));
  wrap.querySelectorAll('[data-view-obs]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); viewCotacao(b.dataset.viewObs); switchViewTab('vobs'); }));

  wrap.querySelectorAll('.cotacao-check').forEach(chk => {
    chk.addEventListener('change', e => { e.stopPropagation(); toggleStatus(chk.dataset.id, chk.checked, chk); });
    chk.addEventListener('click', e => e.stopPropagation());
  });

  wrap.querySelectorAll('.cotacao-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('button') || e.target.closest('.checkbox-wrapper')) return;
      viewCotacao(card.dataset.id);
    });
  });
}

/* ─── FILTERS ───────────────────────────────────────── */
$('searchInput').addEventListener('input', renderList);
$('filterTransportadora').addEventListener('change', renderList);
$('filterResponsavel').addEventListener('change', renderList);
$('filterStatus').addEventListener('change', renderList);

/* ─── SYNC ──────────────────────────────────────────── */
$('syncBtn').addEventListener('click', async () => {
  const b = $('syncBtn'); b.classList.add('spinning');
  try {
    await loadTransportadorasCache();
    await loadCotacoes();
    toastSuccess('Dados sincronizados');
  } catch (e) { toastError('Erro ao sincronizar'); }
  finally { setTimeout(() => b.classList.remove('spinning'), 600); }
});

/* ─── TOGGLE STATUS ─────────────────────────────────── */
async function toggleStatus(id, checked, chkEl) {
  if (!podeMarcar) {
    if (chkEl) chkEl.checked = !checked;
    toastError('Somente Almoxarifado e administradores podem alterar');
    return;
  }
  const c = cotacoes.find(x => String(x.id) === String(id));
  if (!c) return;
  const nome = c.transportadora || 'Cotação';
  try {
    await api(`${API_URL}/cotacoes/${id}`, { method: 'PATCH', body: JSON.stringify({ negocioFechado: checked }) });
    c.negocioFechado = checked;
    const card = chkEl?.closest('.cotacao-card');
    if (card) card.classList.toggle('row-aprovada', checked);
    toastSuccess(checked ? `${nome} aprovada` : `${nome} reprovada`);
    if (checked) toastSuccess(`${nome} aprovada`); else toastError(`${nome} reprovada`);
  } catch (e) {
    if (chkEl) chkEl.checked = !checked;
    toastError('Erro ao atualizar status');
  }
}

/* ─── FORM ──────────────────────────────────────────── */
function openFormModal() {
  editingId = null;
  $('cotacaoForm').reset();
  $('editId').value = '';
  $('formTitle').textContent = 'Nova Cotação';
  $('btnSave').textContent = 'Salvar';
  $('dataCotacao').value = getDataAtual();
  $('responsavel').value = getCurrentFirstName().toUpperCase();
  $('observacoes').value = '[]';
  atualizarListaObservacoes();
  updateTransportadoraSelects();
  document.querySelectorAll('.modal-tab[data-tab]').forEach((t, i) => t.classList.toggle('active', i === 0));
  document.querySelectorAll('.tab-pane[data-pane]').forEach((p, i) => p.classList.toggle('active', i === 0));
  open('formModal');
}

function editCotacao(id) {
  const c = cotacoes.find(x => String(x.id) === String(id));
  if (!c) return;
  editingId = id;
  $('editId').value = id;
  $('formTitle').textContent = 'Editar Cotação';
  $('btnSave').textContent = 'Atualizar';
  updateTransportadoraSelects();
  $('dataCotacao').value = c.dataCotacao || '';
  $('transportadora').value = c.transportadora || '';
  $('destino').value = c.destino || '';
  $('documento').value = c.documento || '';
  $('numeroCotacao').value = c.numeroCotacao || '';
  $('valorFrete').value = c.valorFrete || '';
  $('previsaoEntrega').value = c.previsaoEntrega || '';
  $('responsavel').value = c.responsavel || '';
  $('responsavelTransportadora').value = c.responsavelTransportadora || '';
  $('canalComunicacao').value = c.canalComunicacao || '';
  $('codigoColeta').value = c.codigoColeta || '';
  $('observacoes').value = JSON.stringify(parseObs(c));
  atualizarListaObservacoes();
  if (window.IR && typeof IR.preencherVendedores === 'function') {
    try { IR.preencherVendedores($('vendedor'), c.vendedor); } catch (_) {}
  }
  document.querySelectorAll('.modal-tab[data-tab]').forEach((t, i) => t.classList.toggle('active', i === 0));
  document.querySelectorAll('.tab-pane[data-pane]').forEach((p, i) => p.classList.toggle('active', i === 0));
  open('formModal');
}

function getCurrentFirstName() {
  try {
    const raw = sessionStorage.getItem('cotacoesUserData') || sessionStorage.getItem(SESSION_KEY) || '{}';
    const u = JSON.parse(raw);
    const n = u.name || u.nome || (u.user && u.user.name) || '';
    return String(n).trim().split(/\s+/)[0] || '';
  } catch (_) { return ''; }
}

$('cotacaoForm').addEventListener('submit', async e => {
  e.preventDefault();
  const transportadora = $('transportadora').value.trim();
  if (!transportadora) {
    document.querySelectorAll('.modal-tab[data-tab]').forEach(t => t.classList.toggle('active', t.dataset.tab === 'transportadora'));
    document.querySelectorAll('.tab-pane[data-pane]').forEach(p => p.classList.toggle('active', p.dataset.pane === 'transportadora'));
    toastError('Verifique se todas as informações obrigatórias estão preenchidas');
    return;
  }
  const payload = {
    dataCotacao: $('dataCotacao').value,
    transportadora,
    destino: $('destino').value.trim(),
    documento: $('documento').value.trim(),
    numeroCotacao: $('numeroCotacao').value.trim(),
    valorFrete: parseFloat($('valorFrete').value) || null,
    previsaoEntrega: $('previsaoEntrega').value,
    responsavel: ($('responsavel').value.trim() || getCurrentFirstName()),
    vendedor: $('vendedor').value.trim(),
    responsavelTransportadora: $('responsavelTransportadora').value.trim(),
    canalComunicacao: $('canalComunicacao').value.trim(),
    codigoColeta: $('codigoColeta').value.trim(),
    observacoes: $('observacoes').value || '[]'
  };
  const btn = $('btnSave');
  btn.disabled = true;
  btn.textContent = 'Aguarde...';
  try {
    const url = editingId ? `${API_URL}/cotacoes/${editingId}` : `${API_URL}/cotacoes`;
    const method = editingId ? 'PUT' : 'POST';
    await api(url, { method, body: JSON.stringify(payload) });
    close('formModal');
    await loadCotacoes();
    toastSuccess(editingId ? 'Cotação atualizada' : 'Cotação registrada');
  } catch (err) {
    toastError(err.message || 'Erro ao salvar cotação');
    btn.disabled = false;
    btn.textContent = editingId ? 'Atualizar' : 'Salvar';
  }
});

/* ─── OBSERVAÇÕES ───────────────────────────────────── */
function renderObsLista(list, editable) {
  if (!list.length) return '';
  return list.map((o, i) => `
    <div class="observacao-item">
      <div class="observacao-header">
        <span class="observacao-data">${esc(o.timestamp ? new Date(o.timestamp).toLocaleString('pt-BR') : '')}</span>
        ${editable ? `<button type="button" class="btn-remove-obs" data-remove-obs="${i}" title="Remover">✕</button>` : ''}
      </div>
      <p class="observacao-texto">${esc(o.texto || '')}</p>
    </div>`).join('');
}
function atualizarListaObservacoes() {
  const list = JSON.parse($('observacoes').value || '[]');
  $('observacoesList').innerHTML = renderObsLista(list, true);
}
$('btnAddObs').addEventListener('click', () => {
  const ta = $('novaObservacao');
  const texto = ta.value.trim();
  if (!texto) { toastError('Digite uma observação primeiro'); return; }
  const list = JSON.parse($('observacoes').value || '[]');
  list.push({ texto, timestamp: new Date().toISOString() });
  $('observacoes').value = JSON.stringify(list);
  ta.value = '';
  atualizarListaObservacoes();
});
$('observacoesList').addEventListener('click', e => {
  const btn = e.target.closest('[data-remove-obs]');
  if (!btn) return;
  const idx = parseInt(btn.dataset.removeObs);
  const list = JSON.parse($('observacoes').value || '[]');
  list.splice(idx, 1);
  $('observacoes').value = JSON.stringify(list);
  atualizarListaObservacoes();
});

/* ─── VIEW ──────────────────────────────────────────── */
function viewCotacao(id) {
  const c = cotacoes.find(x => String(x.id) === String(id));
  if (!c) return;
  $('viewDoc').textContent = c.documento || c.numeroCotacao || `#${c.id}`;

  const row = (label, value) => `<div class="info-row"><span class="info-label">${esc(label)}</span><span class="info-value ${!value ? 'empty' : ''}">${esc(value || '—')}</span></div>`;
  const status = c.negocioFechado === true ? 'APROVADA' : 'REPROVADA';

  $('vgeral').innerHTML = `
    <div class="info-section">
      <h4>Informações Gerais</h4>
      ${row('Código', c.codigo)}
      ${row('Data', formatarData(c.dataCotacao))}
      ${row('Documento', c.documento)}
      ${row('Nº Cotação', c.numeroCotacao)}
      ${row('Destino', c.destino)}
      ${row('Responsável', c.responsavel)}
      ${row('Vendedor', c.vendedor)}
      ${row('Status', status)}
    </div>`;

  $('vtransp').innerHTML = `
    <div class="info-section">
      <h4>Transportadora</h4>
      ${row('Transportadora', c.transportadora)}
      ${row('Atendente', c.responsavelTransportadora)}
      ${row('Canal de Comunicação', c.canalComunicacao)}
      ${row('Código de Coleta', c.codigoColeta)}
      ${row('Valor do Frete', c.valorFrete ? formatarMoeda(c.valorFrete) : '')}
      ${row('Previsão de Entrega', c.previsaoEntrega ? formatarData(c.previsaoEntrega) : '')}
    </div>`;

  const obsArr = parseObs(c);
  $('vobs').innerHTML = `
    <div class="info-section">
      <h4>Observações</h4>
      ${obsArr.length
        ? `<div class="obs-view-list">${obsArr.map(o => `
            <div class="obs-view-item">
              <div class="obs-view-data">${esc(o.timestamp ? new Date(o.timestamp).toLocaleString('pt-BR') : '')}</div>
              <div class="obs-view-texto">${esc(o.texto || '')}</div>
            </div>`).join('')}</div>`
        : '<p style="color:var(--text-secondary);font-style:italic;text-align:center;padding:1rem;font-size:.85rem;">Nenhuma observação registrada</p>'}
    </div>`;

  switchViewTab('vgeral');
  open('viewModal');
}

function switchViewTab(vtab) {
  document.querySelectorAll('.modal-tab[data-vtab]').forEach(x => x.classList.toggle('active', x.dataset.vtab === vtab));
  document.querySelectorAll('.tab-pane[data-vpane]').forEach(p => p.classList.toggle('active', p.dataset.vpane === vtab));
}

/* ─── DELETE ────────────────────────────────────────── */
function showDeleteModal(id) {
  const c = cotacoes.find(x => String(x.id) === String(id));
  if (!c) return;
  pendingDeleteId = id;
  const doc = c.documento || c.numeroCotacao || `#${c.id}`;
  $('deleteMsg').textContent = `Tem certeza que deseja excluir a cotação ${doc}?`;
  $('confirmDeleteBtn').onclick = executeDelete;
  open('deleteModal');
}

async function executeDelete() {
  if (!pendingDeleteId) return;
  const id = pendingDeleteId;
  try {
    await api(`${API_URL}/cotacoes/${id}`, { method: 'DELETE' });
    close('deleteModal');
    pendingDeleteId = null;
    await loadCotacoes();
    toastSuccess('Cotação excluída');
  } catch (e) {
    toastError('Erro ao excluir cotação');
    close('deleteModal');
    pendingDeleteId = null;
  }
}

/* ─── MÊS / CALENDÁRIO ──────────────────────────────── */
function updateMonthDisplay() {
  const el = $('currentMonth');
  if (el) el.textContent = `${MESES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
}

function changeMonth(direction) {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
  updateMonthDisplay();
  cotacoes = [];
  isLoading = true;
  $('list').innerHTML = '';
  loadCotacoes();
}

$('monthPrev').addEventListener('click', () => changeMonth(-1));
$('monthNext').addEventListener('click', () => changeMonth(1));

function renderCalendar() {
  $('calendarYear').textContent = calendarYear;
  const cont = $('calendarMonths');
  cont.innerHTML = MESES.map((name, idx) => {
    const cur = calendarYear === currentMonth.getFullYear() && idx === currentMonth.getMonth();
    return `<button type="button" class="calendar-month ${cur ? 'current' : ''}" data-month="${idx}">${name}</button>`;
  }).join('');
  cont.querySelectorAll('[data-month]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.month);
      currentMonth = new Date(calendarYear, idx, 1);
      close('calendarModal');
      updateMonthDisplay();
      cotacoes = [];
      isLoading = true;
      $('list').innerHTML = '';
      loadCotacoes();
    });
  });
}

$('calendarBtn').addEventListener('click', () => {
  calendarYear = currentMonth.getFullYear();
  renderCalendar();
  open('calendarModal');
});
$('calendarPrevYear').addEventListener('click', () => { calendarYear--; renderCalendar(); });
$('calendarNextYear').addEventListener('click', () => { calendarYear++; renderCalendar(); });

$('addBtn').addEventListener('click', openFormModal);

/* ─── BOOT ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => verificarAutenticacao());

})();

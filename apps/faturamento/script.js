(() => {
"use strict";

const PORTAL_URL = window.location.origin;
const API_URL = `${window.location.origin}/api`;
const MODULE_SESSION_KEY = 'faturamentoSession';
const SESSION_KEY = 'irUserSession';
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const tabsForm = ['geral','faturamento','itens','entrega','transporte'];

let pedidos = [];
let editingId = null;
let pendingDeleteId = null;
let sessionToken = null;
let currentUser = null;
let currentMonth = new Date();
let calendarYear = new Date().getFullYear();
let transportadorasCache = [];
let estoqueCache = {};
let clientesCache = {};
let itemCounter = 0;
let currentFetchController = null;
let pendingNFResolve = null;

const ROLES_CHECKBOX = ['administrador', 'financeiro'];

const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ─── UTILS ─────────────────────────────────────── */
function formatarCNPJ(cnpj) {
  if (!cnpj) return '';
  cnpj = String(cnpj).replace(/\D/g, '');
  if (cnpj.length === 14) return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
  return cnpj;
}
function formatarMoeda(v) {
  if (typeof v === 'string' && v.startsWith('R$')) return v;
  const num = parseFloat(v) || 0;
  return 'R$ ' + num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function parseMoeda(v) {
  if (!v) return 0;
  const cleaned = String(v).replace(/[^\d.,]/g, '').replace(/\.(?=\d{3}[,.])/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}
function formatarData(d) {
  if (!d) return '—';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
    const [a, m, dia] = d.slice(0,10).split('-');
    return `${dia}/${m}/${a}`;
  }
  if (typeof d === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('pt-BR');
}
function getDataLocalISO() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}-${String(h.getDate()).padStart(2,'0')}`;
}
function getDataAtualBR() {
  const h = new Date();
  return `${String(h.getDate()).padStart(2,'0')}/${String(h.getMonth()+1).padStart(2,'0')}/${h.getFullYear()}`;
}
function detectResponsavelFromUser() {
  if (!currentUser) return '';
  const fullName = (currentUser.name || currentUser.nome || currentUser.username || '').trim();
  if (!fullName) return '';
  return fullName.split(' ')[0];
}
function userCanToggleEmissao() {
  if (!currentUser) return false;
  if (currentUser.is_admin === true) return true;
  const sector = (currentUser.sector || '').toLowerCase();
  if (ROLES_CHECKBOX.some(r => sector.includes(r))) return true;
  return false;
}

/* ─── AUTH ─────────────────────────────────────── */
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
  buscarUsuarioLogado().finally(iniciarApp);
}

async function buscarUsuarioLogado() {
  try {
    const r = await fetch(`${API_URL}/pedidos/me`, { headers: { 'X-Session-Token': sessionToken } });
    if (r.ok) currentUser = await r.json();
  } catch (e) {}
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

/* ─── UI HELPERS ───────────────────────────────── */
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
function toastWarn(msg) {
  const t = $('toast'); t.className = 'toast warn'; t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}
function open(id) { const el = $(id); if (el) { el.classList.add('show'); el.setAttribute('aria-hidden','false'); } }
function close(id) { const el = $(id); if (el) { el.classList.remove('show'); el.setAttribute('aria-hidden','true'); } }

document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => close(b.dataset.close)));
document.querySelectorAll('.modal').forEach(o => o.addEventListener('click', e => { if (e.target === o) close(o.id); }));

/* ─── TABS ─────────────────────────────────────── */
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

/* ─── INIT ─────────────────────────────────────── */
async function iniciarApp() {
  updateMonthDisplay();
  if (window.IR && typeof IR.preencherVendedores === 'function') {
    try { IR.preencherVendedores($('vendedor')); } catch (_) {}
  }
  await Promise.all([loadEstoque(), loadTransportadorasCache(), loadAllClientesCache()]);
  await loadPedidos();
  setInterval(() => loadPedidos(), 30000);
}

async function loadPedidos() {
  if (currentFetchController) currentFetchController.abort();
  currentFetchController = new AbortController();
  const signal = currentFetchController.signal;
  const mes = currentMonth.getMonth();
  const ano = currentMonth.getFullYear();
  try {
    const data = await api(`${API_URL}/pedidos?mes=${mes}&ano=${ano}`, { signal });
    pedidos = Array.isArray(data) ? data : [];
    atualizarCacheClientes(pedidos);
    currentFetchController = null;
    renderAll();
  } catch (e) {
    if (e.name === 'AbortError') return;
    console.error(e);
  }
}

function atualizarCacheClientes(lista) {
  lista.forEach(p => {
    const cnpj = (p.cnpj || '').trim();
    if (!cnpj) return;
    const existing = clientesCache[cnpj];
    const existingDate = existing ? new Date(existing._created_at || 0) : new Date(0);
    const newDate = new Date(p.created_at || 0);
    if (!existing || newDate >= existingDate) {
      clientesCache[cnpj] = {
        razaoSocial: p.razao_social,
        inscricaoEstadual: p.inscricao_estadual,
        endereco: p.endereco,
        telefone: p.telefone,
        contato: p.contato,
        email: p.email || '',
        documento: p.documento,
        localEntrega: p.local_entrega,
        setor: p.setor,
        transportadora: p.transportadora,
        valorFrete: p.valor_frete,
        vendedor: p.vendedor,
        peso: p.peso,
        quantidade: p.quantidade,
        volumes: p.volumes,
        previsaoEntrega: p.previsao_entrega,
        items: Array.isArray(p.items) ? p.items : [],
        _created_at: p.created_at
      };
    }
  });
}

async function loadEstoque() {
  try {
    const data = await api(`${API_URL}/estoque`);
    estoqueCache = {};
    (data || []).forEach(it => { estoqueCache[String(it.codigo)] = it; });
  } catch (e) { console.error('Erro ao carregar estoque:', e); }
}

async function loadTransportadorasCache() {
  try {
    const data = await api(`${API_URL}/transportadoras?page=1&limit=200`);
    const lista = Array.isArray(data) ? data : (data.data || []);
    transportadorasCache = lista.map(t => (t.nome || '').trim().toUpperCase()).filter(Boolean).sort();
    updateTransportadoraSelect();
  } catch (e) { console.error('Erro ao carregar transportadoras:', e); }
}

async function loadAllClientesCache() {
  try {
    const data = await api(`${API_URL}/pedidos`);
    atualizarCacheClientes(Array.isArray(data) ? data : []);
  } catch (e) { console.error('Erro cache clientes:', e); }
}

function updateTransportadoraSelect() {
  const sel = $('transportadora');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">Selecione...</option>' +
    transportadorasCache.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
  if (cur) sel.value = cur;
}

/* ─── LIST ─────────────────────────────────────── */
function filteredList() {
  const search = ($('searchInput').value || '').toLowerCase().trim();
  const fVend = $('filterVendedor').value || '';
  const fStatus = $('filterStatus').value || '';
  return pedidos.filter(p => {
    if (search) {
      const alvo = `${p.codigo || ''} ${p.razao_social || ''}`.toLowerCase();
      if (!alvo.includes(search)) return false;
    }
    if (fVend && p.responsavel !== fVend && p.vendedor !== fVend) return false;
    if (fStatus && p.status !== fStatus) return false;
    return true;
  });
}

function renderAll() {
  updateVendedoresFilter();
  renderList();
}

function updateVendedoresFilter() {
  const vendedores = new Set();
  pedidos.forEach(p => {
    if (p.responsavel?.trim()) vendedores.add(p.responsavel.trim());
    else if (p.vendedor?.trim()) vendedores.add(p.vendedor.trim());
  });
  const sel = $('filterVendedor');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Responsável</option>' +
    Array.from(vendedores).sort().map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if (cur) sel.value = cur;
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

  const canToggle = userCanToggleEmissao();
  list.sort((a, b) => (parseInt(a.codigo) || 0) - (parseInt(b.codigo) || 0));

  wrap.innerHTML = list.map(p => {
    const emitida = p.status === 'emitida';
    const chkAttr = canToggle ? '' : 'disabled';
    const nf = p.numero_nf || '';
    const nfHtml = canToggle
      ? `<span class="nf-value" data-nf="${esc(p.id)}" title="Clique para editar o nº da NF">
           ${esc(nf || 'Definir NF')}
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
         </span>`
      : `<span class="cell-value">${esc(nf || '—')}</span>`;

    return `
      <div class="pedido-card ${emitida ? 'row-emitida' : ''}" data-id="${esc(p.id)}">
        <div class="card-top">
          <div class="card-top-left">
            <div class="checkbox-wrapper">
              <input type="checkbox" class="styled-checkbox pedido-chk" id="chk-${esc(p.id)}" data-id="${esc(p.id)}" ${emitida ? 'checked' : ''} ${chkAttr}>
              <label for="chk-${esc(p.id)}" class="checkbox-label-styled" ${canToggle ? '' : 'title="Somente Financeiro e administradores"'}></label>
            </div>
            <span class="card-codigo">Pedido Nº ${esc(p.codigo || '—')}</span>
          </div>
          <span class="badge-status ${emitida ? 'emitida' : 'pendente'}">${emitida ? 'EMITIDO' : 'PENDENTE'}</span>
        </div>
        <div class="card-razao">${esc(p.razao_social || '—')}</div>
        <div class="card-grid">
          <div class="card-cell"><span class="cell-label">CNPJ</span><span class="cell-value">${esc(formatarCNPJ(p.cnpj) || '—')}</span></div>
          <div class="card-cell"><span class="cell-label">Data Emissão</span><span class="cell-value">${esc(p.data_emissao ? formatarData(p.data_emissao) : '—')}</span></div>
          <div class="card-cell"><span class="cell-label">Nº NF</span>${nfHtml}</div>
          <div class="card-cell"><span class="cell-label">Valor Total</span><span class="cell-value valor">${esc(p.valor_total || 'R$ 0,00')}</span></div>
        </div>
        <div class="card-actions ${canToggle ? 'three' : ''}">
          <button type="button" class="action-btn edit" data-edit="${esc(p.id)}">Editar</button>
          <button type="button" class="action-btn etiqueta" data-etiqueta="${esc(p.id)}">Etiqueta</button>
          ${canToggle ? `<button type="button" class="action-btn delete" data-del="${esc(p.id)}">Excluir</button>` : ''}
        </div>
      </div>`;
  }).join('');

  wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); editPedido(b.dataset.edit); }));
  wrap.querySelectorAll('[data-etiqueta]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); gerarEtiqueta(b.dataset.etiqueta); }));
  wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); confirmarExcluir(b.dataset.del); }));
  wrap.querySelectorAll('[data-nf]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); editarNF(b.dataset.nf); }));

  wrap.querySelectorAll('.pedido-chk').forEach(chk => {
    chk.addEventListener('change', e => { e.stopPropagation(); toggleEmissao(chk.dataset.id, chk.checked, chk); });
    chk.addEventListener('click', e => e.stopPropagation());
  });

  wrap.querySelectorAll('.pedido-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('button') || e.target.closest('.checkbox-wrapper') || e.target.closest('.nf-value')) return;
      viewPedido(card.dataset.id);
    });
  });
}

/* ─── FILTERS ──────────────────────────────────── */
$('searchInput').addEventListener('input', renderList);
$('filterVendedor').addEventListener('change', renderList);
$('filterStatus').addEventListener('change', renderList);

/* ─── SYNC ─────────────────────────────────────── */
$('syncBtn').addEventListener('click', async () => {
  const b = $('syncBtn'); b.classList.add('spinning');
  try {
    await Promise.all([loadPedidos(), loadEstoque(), loadTransportadorasCache(), loadAllClientesCache()]);
    toastSuccess('Dados sincronizados');
  } catch (e) { toastError('Erro ao sincronizar'); }
  finally { setTimeout(() => b.classList.remove('spinning'), 600); }
});

/* ─── FORM ─────────────────────────────────────── */
function openFormModal() {
  editingId = null;
  $('pedidoForm').reset();
  $('editId').value = '';
  $('codigo').value = '';
  $('dataRegistro').value = getDataAtualBR();
  $('formTitle').textContent = 'Novo Pedido';
  $('btnSave').textContent = 'Salvar';
  $('responsavel').value = detectResponsavelFromUser();
  updateNumeroNFVisibility();
  atualizarTransportadoraSelect();
  $('itemsList').innerHTML = '';
  itemCounter = 0;
  atualizarTotaisTotais();
  document.querySelectorAll('.modal-tab[data-tab]').forEach((t,i) => t.classList.toggle('active', i===0));
  document.querySelectorAll('.tab-pane[data-pane]').forEach((p,i) => p.classList.toggle('active', i===0));
  open('formModal');
  if (window.IR && typeof IR.preencherVendedores === 'function') {
    try { IR.preencherVendedores($('vendedor')); } catch (_) {}
  }
}

function atualizarTransportadoraSelect() {
  updateTransportadoraSelect();
}

function updateNumeroNFVisibility() {
  const group = $('numeroNFGroup');
  if (group) group.hidden = !userCanToggleEmissao();
}

async function editPedido(id) {
  const p = pedidos.find(x => String(x.id) === String(id));
  if (!p) return;
  editingId = id;
  $('editId').value = id;
  $('formTitle').textContent = `Editar Pedido Nº ${p.codigo}`;
  $('btnSave').textContent = 'Atualizar';
  updateTransportadoraSelect();

  $('codigo').value = p.codigo || '';
  $('documento').value = p.documento || '';
  updateNumeroNFVisibility();
  $('numeroNF').value = p.numero_nf || '';
  $('responsavel').value = p.responsavel || '';
  $('dataRegistro').value = p.data_registro ? formatarData(p.data_registro) : '';
  $('cnpj').value = formatarCNPJ(p.cnpj) || '';
  $('razaoSocial').value = p.razao_social || '';
  $('inscricaoEstadual').value = p.inscricao_estadual || '';
  $('telefone').value = p.telefone || '';
  $('contato').value = p.contato || '';
  $('email').value = p.email || '';
  $('endereco').value = p.endereco || '';
  $('valorTotalPedido').value = p.valor_total || '';
  $('peso').value = p.peso || '';
  $('quantidade').value = p.quantidade || '';
  $('volumes').value = p.volumes || '';
  $('localEntrega').value = p.local_entrega || '';
  $('setor').value = p.setor || '';
  $('previsaoEntrega').value = p.previsao_entrega || '';
  $('transportadora').value = p.transportadora || '';
  $('valorFrete').value = p.valor_frete || '';

  if (window.IR && typeof IR.preencherVendedores === 'function') {
    try { IR.preencherVendedores($('vendedor'), p.vendedor || ''); } catch (_) {}
  }

  $('itemsList').innerHTML = '';
  itemCounter = 0;
  const items = Array.isArray(p.items) ? p.items : [];
  if (items.length === 0) {
    addItemCard();
  } else {
    items.forEach(it => addItemCard(it));
  }
  atualizarTotaisTotais();

  document.querySelectorAll('.modal-tab[data-tab]').forEach((t,i) => t.classList.toggle('active', i===0));
  document.querySelectorAll('.tab-pane[data-pane]').forEach((p,i) => p.classList.toggle('active', i===0));
  open('formModal');
}

/* ─── ITEMS (card por item) ────────────────────── */
function addItemCard(item = {}) {
  itemCounter++;
  const idx = itemCounter;
  const card = document.createElement('div');
  card.className = 'item-form-card';
  card.dataset.itemIdx = idx;
  card.innerHTML = `
    <div class="item-form-card-head">
      <span class="item-form-card-title">ITEM ${idx}</span>
      <button type="button" class="item-del-btn" data-remove="${idx}" title="Remover">✕</button>
    </div>
    <div class="field">
      <label>Código Estoque</label>
      <input type="text" class="item-codigo" value="${esc(item.codigoEstoque || '')}" placeholder="Buscar código...">
    </div>
    <div class="field">
      <label>Especificação</label>
      <textarea class="item-especificacao" rows="2" placeholder="Descrição do item">${esc(item.especificacao || '')}</textarea>
    </div>
    <div class="item-grid-2">
      <div class="field">
        <label>UN</label>
        <select class="item-unidade">
          <option value="">-</option>
          ${['UN','MT','KG','PC','CX','LT','BO','BA'].map(u => `<option value="${u}" ${item.unidade === u ? 'selected':''}>${u}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Qtd</label>
        <input type="number" class="item-quantidade" min="0" step="1" value="${item.quantidade || ''}">
      </div>
    </div>
    <div class="item-grid-2">
      <div class="field">
        <label>Valor Un. (R$)</label>
        <input type="number" class="item-valor-unit" min="0" step="0.01" value="${item.valorUnitario || ''}" placeholder="0.00">
      </div>
      <div class="field">
        <label>Valor Total</label>
        <input type="text" class="item-valor-total" value="${esc(item.valorTotal || '')}" readonly>
      </div>
    </div>
    <div class="field">
      <label>NCM</label>
      <input type="text" class="item-ncm" value="${esc(item.ncm || '')}">
    </div>
  `;
  $('itemsList').appendChild(card);
  bindItemCardEvents(card);
  calcularTotalItem(card);
  atualizarTotaisTotais();
}

function bindItemCardEvents(card) {
  const codigoInput = card.querySelector('.item-codigo');
  const especificacao = card.querySelector('.item-especificacao');
  const ncm = card.querySelector('.item-ncm');
  const qtd = card.querySelector('.item-quantidade');
  const valorUnit = card.querySelector('.item-valor-unit');

  const toUpper = el => {
    const start = el.selectionStart;
    el.value = el.value.toUpperCase();
    try { el.setSelectionRange(start, start); } catch(_) {}
  };

  codigoInput.addEventListener('input', () => toUpper(codigoInput));
  especificacao.addEventListener('input', () => toUpper(especificacao));
  ncm.addEventListener('input', () => toUpper(ncm));

  codigoInput.addEventListener('change', () => {
    const cod = codigoInput.value.trim();
    if (!cod) return;
    const itEstoque = estoqueCache[cod];
    if (itEstoque) {
      especificacao.value = (itEstoque.descricao || '').toUpperCase();
      ncm.value = (itEstoque.ncm || '').toUpperCase();
    } else {
      toastError('O item não foi encontrado');
    }
  });

  qtd.addEventListener('input', () => { calcularTotalItem(card); atualizarTotaisTotais(); });
  qtd.addEventListener('change', () => { calcularTotalItem(card); verificarEstoqueCard(card); atualizarTotaisTotais(); });
  valorUnit.addEventListener('input', () => { calcularTotalItem(card); atualizarTotaisTotais(); });

  card.querySelector('.item-del-btn').addEventListener('click', () => {
    card.remove();
    atualizarTotaisTotais();
  });
}

function calcularTotalItem(card) {
  const qtd = parseFloat(card.querySelector('.item-quantidade').value) || 0;
  const vu = parseFloat(card.querySelector('.item-valor-unit').value) || 0;
  card.querySelector('.item-valor-total').value = formatarMoeda(qtd * vu);
}

function verificarEstoqueCard(card) {
  const cod = card.querySelector('.item-codigo').value.trim();
  const qtd = parseFloat(card.querySelector('.item-quantidade').value) || 0;
  if (!cod || !qtd) return;
  const itEstoque = estoqueCache[cod];
  if (!itEstoque) return;
  const disponivel = parseFloat(itEstoque.quantidade) || 0;
  if (qtd > disponivel) toastError(`Quantidade acima do estoque do item ${cod}`);
}

function atualizarTotaisTotais() {
  let totalValor = 0;
  let totalQtd = 0;
  document.querySelectorAll('.item-form-card').forEach(card => {
    totalValor += parseMoeda(card.querySelector('.item-valor-total').value);
    totalQtd += parseFloat(card.querySelector('.item-quantidade').value) || 0;
  });
  $('valorTotalPedido').value = formatarMoeda(totalValor);
  $('quantidade').value = String(totalQtd);
}

$('btnAddItem').addEventListener('click', () => addItemCard());

function getItems() {
  const items = [];
  document.querySelectorAll('.item-form-card').forEach(card => {
    const codigoEstoque = card.querySelector('.item-codigo').value.trim();
    const especificacao = card.querySelector('.item-especificacao').value.trim();
    const unidade = card.querySelector('.item-unidade').value;
    const quantidade = parseFloat(card.querySelector('.item-quantidade').value) || 0;
    const valorUnitario = parseFloat(card.querySelector('.item-valor-unit').value) || 0;
    const valorTotal = card.querySelector('.item-valor-total').value;
    const ncm = card.querySelector('.item-ncm').value.trim();
    const temDados = codigoEstoque || especificacao || (unidade && unidade !== '') || quantidade > 0 || valorUnitario > 0 || ncm;
    if (temDados) {
      items.push({ item: items.length + 1, codigoEstoque, especificacao, unidade, quantidade, valorUnitario, valorTotal, ncm });
    }
  });
  return items;
}

/* ─── CNPJ AUTOCOMPLETE ────────────────────────── */
const cnpjInput = $('cnpj');
cnpjInput.addEventListener('input', () => {
  const start = cnpjInput.selectionStart;
  cnpjInput.value = formatarCNPJ(cnpjInput.value);
  try { cnpjInput.setSelectionRange(start, start); } catch(_) {}
  buscarClientePorCNPJ(cnpjInput.value);
});
cnpjInput.addEventListener('blur', () => {
  setTimeout(() => {
    const s = $('cnpjSuggestions');
    if (s) s.classList.remove('open');
  }, 200);
});

function buscarClientePorCNPJ(cnpj) {
  const clean = String(cnpj).replace(/\D/g, '');
  const box = $('cnpjSuggestions');
  if (clean.length < 3) { box.classList.remove('open'); box.innerHTML = ''; return; }
  const matches = Object.keys(clientesCache).filter(k => k.replace(/\D/g, '').includes(clean));
  if (!matches.length) { box.classList.remove('open'); box.innerHTML = ''; return; }
  box.innerHTML = matches.slice(0, 8).map(k => {
    const c = clientesCache[k];
    return `<div class="cnpj-suggestion" data-cnpj="${esc(k)}">
      <strong>${esc(formatarCNPJ(k))}</strong>
      <span>${esc(c.razaoSocial || '')}</span>
    </div>`;
  }).join('');
  box.classList.add('open');
  box.querySelectorAll('.cnpj-suggestion').forEach(el => {
    el.addEventListener('click', () => {
      preencherCliente(el.dataset.cnpj);
      box.classList.remove('open');
    });
  });
}

function preencherCliente(cnpj) {
  const c = clientesCache[cnpj];
  if (!c) return;
  $('cnpj').value = formatarCNPJ(cnpj);
  $('razaoSocial').value = c.razaoSocial || '';
  $('inscricaoEstadual').value = c.inscricaoEstadual || '';
  $('endereco').value = c.endereco || '';
  $('telefone').value = c.telefone || '';
  $('contato').value = c.contato || '';
  $('email').value = c.email || '';
  $('documento').value = c.documento || '';
  if (c.peso) $('peso').value = c.peso;
  if (c.volumes) $('volumes').value = c.volumes;
  $('localEntrega').value = c.localEntrega || '';
  $('setor').value = c.setor || '';
  if (c.previsaoEntrega) $('previsaoEntrega').value = c.previsaoEntrega;
  const tSel = $('transportadora');
  if (tSel && c.transportadora) {
    const opts = Array.from(tSel.options).map(o => o.value);
    if (opts.includes(c.transportadora)) tSel.value = c.transportadora;
  }
  $('valorFrete').value = c.valorFrete || '';
  if ($('vendedor') && c.vendedor) $('vendedor').value = c.vendedor;

  if (Array.isArray(c.items) && c.items.length > 0) {
    $('itemsList').innerHTML = '';
    itemCounter = 0;
    c.items.forEach(it => addItemCard(it));
    atualizarTotaisTotais();
  }
  toastSuccess('Dados do último pedido preenchidos!');
}

/* ─── SALVAR ───────────────────────────────────── */
$('pedidoForm').addEventListener('submit', async e => {
  e.preventDefault();
  const responsavel = $('responsavel').value.trim();
  if (!responsavel && !editingId) {
    document.querySelectorAll('.modal-tab[data-tab]').forEach(t => t.classList.toggle('active', t.dataset.tab === 'geral'));
    document.querySelectorAll('.tab-pane[data-pane]').forEach(p => p.classList.toggle('active', p.dataset.pane === 'geral'));
    toastError('Por favor, selecione um responsável!');
    return;
  }
  const cnpj = $('cnpj').value.replace(/\D/g, '');
  const razaoSocial = $('razaoSocial').value.trim();
  const endereco = $('endereco').value.trim();
  if (!cnpj || !razaoSocial || !endereco) {
    toastError('Verifique se todas as informações obrigatórias estão preenchidas');
    return;
  }
  const items = getItems();
  const payload = {
    cnpj,
    razao_social: razaoSocial,
    inscricao_estadual: $('inscricaoEstadual').value.trim(),
    endereco,
    telefone: $('telefone').value.trim(),
    contato: $('contato').value.trim(),
    email: $('email').value.trim().toLowerCase(),
    documento: $('documento').value.trim(),
    valor_total: $('valorTotalPedido').value,
    peso: $('peso').value,
    quantidade: $('quantidade').value,
    volumes: $('volumes').value,
    local_entrega: $('localEntrega').value.trim(),
    setor: $('setor').value.trim(),
    previsao_entrega: $('previsaoEntrega').value || null,
    transportadora: $('transportadora').value.trim(),
    valor_frete: $('valorFrete').value,
    vendedor: $('vendedor').value.trim(),
    atualizado_por: currentUser && (currentUser.name || currentUser.username)
      ? String(currentUser.name || currentUser.username).trim().split(/\s+/)[0].toUpperCase()
      : '',
    ultima_atualizacao: new Date().toISOString()
  };
  if (items.length > 0) payload.items = items;
  if (userCanToggleEmissao()) {
    payload.numero_nf = $('numeroNF').value.trim() || null;
  }
  if (!editingId) {
    payload.responsavel = responsavel;
    payload.status = 'pendente';
    payload.data_registro = getDataLocalISO();
  } else {
    payload.codigo = $('codigo').value.trim();
  }

  const btn = $('btnSave');
  btn.disabled = true; btn.textContent = 'Aguarde...';
  try {
    const url = editingId ? `${API_URL}/pedidos/${editingId}` : `${API_URL}/pedidos`;
    const method = editingId ? 'PATCH' : 'POST';
    const saved = await api(url, { method, body: JSON.stringify(payload) });
    const wasEditing = !!editingId;
    const savedCodigo = saved?.codigo || payload.codigo || '';
    close('formModal');
    await loadPedidos();
    toastSuccess(wasEditing ? `Pedido ${payload.codigo} atualizado` : `Pedido ${savedCodigo} registrado`);
  } catch (err) {
    toastError(err.message || 'Erro ao salvar pedido');
    btn.disabled = false;
    btn.textContent = editingId ? 'Atualizar' : 'Salvar';
  }
});

/* ─── VIEW ─────────────────────────────────────── */
function viewPedido(id) {
  const p = pedidos.find(x => String(x.id) === String(id));
  if (!p) return;
  $('viewCodigo').textContent = p.codigo || '';
  const row = (label, val) => `<div class="info-row"><span class="info-label">${esc(label)}</span><span class="info-value ${!val ? 'empty' : ''}">${esc(val || '—')}</span></div>`;

  $('vgeral').innerHTML = `
    <div class="info-section">
      <h4>Informações Gerais</h4>
      ${row('Responsável', p.responsavel || p.vendedor)}
      ${row('Data de Registro', formatarData(p.data_registro))}
      ${row('Vendedor', p.vendedor)}
      ${row('Atualizado Por', (p.atualizado_por || '').toUpperCase())}
      ${row('Última Atualização', p.ultima_atualizacao ? new Date(p.ultima_atualizacao).toLocaleString('pt-BR') : '')}
      ${row('Data Emissão', p.data_emissao ? formatarData(p.data_emissao) : '')}
      ${row('Status', p.status === 'emitida' ? 'EMITIDO' : 'PENDENTE')}
    </div>`;

  $('vfaturamento').innerHTML = `
    <div class="info-section">
      <h4>Faturamento</h4>
      ${row('CNPJ', formatarCNPJ(p.cnpj))}
      ${row('Razão Social', p.razao_social)}
      ${row('Inscrição Estadual', p.inscricao_estadual)}
      ${row('Endereço', p.endereco)}
      ${row('Telefone', p.telefone)}
      ${row('Contato', p.contato)}
      ${row('E-mail', p.email)}
      ${row('Documento', p.documento)}
    </div>`;

  const items = Array.isArray(p.items) ? p.items : [];
  $('vitens').innerHTML = `
    <div class="info-section">
      <h4>Itens do Pedido</h4>
      ${items.length ? `<div class="info-items">${items.map((it, i) => `
        <div class="info-item-card">
          <div class="info-item-title">ITEM ${i+1}</div>
          <div class="info-item-line"><strong>Cód.:</strong> ${esc(it.codigoEstoque || '—')}</div>
          <div class="info-item-line"><strong>Descrição:</strong> ${esc(it.especificacao || '—')}</div>
          <div class="info-item-line"><strong>UN:</strong> ${esc(it.unidade || '—')}</div>
          <div class="info-item-line"><strong>Qtd:</strong> ${esc(it.quantidade ?? '—')}</div>
          <div class="info-item-line"><strong>Valor Un.:</strong> ${formatarMoeda(it.valorUnitario || 0)}</div>
          <div class="info-item-line"><strong>Valor Total:</strong> ${esc(it.valorTotal || 'R$ 0,00')}</div>
          <div class="info-item-line"><strong>NCM:</strong> ${esc(it.ncm || '—')}</div>
        </div>`).join('')}</div>` : '<p style="color:var(--text-secondary);font-style:italic;">Nenhum item registrado</p>'}
    </div>
    <div class="info-section">
      <h4>Totais</h4>
      ${row('Valor Total', p.valor_total)}
      ${row('Peso (kg)', p.peso)}
      ${row('Quantidade Total', p.quantidade)}
      ${row('Volumes', p.volumes)}
    </div>`;

  $('ventrega').innerHTML = `
    <div class="info-section">
      <h4>Entrega</h4>
      ${row('Local de Entrega', p.local_entrega)}
      ${row('Setor', p.setor)}
    </div>`;

  $('vtransporte').innerHTML = `
    <div class="info-section">
      <h4>Transporte</h4>
      ${row('Transportadora', p.transportadora)}
      ${row('Valor do Frete', p.valor_frete)}
      ${row('Vendedor', p.vendedor)}
      ${row('Previsão de Entrega', p.previsao_entrega ? formatarData(p.previsao_entrega) : '')}
    </div>`;

  document.querySelectorAll('.modal-tab[data-vtab]').forEach((t,i) => t.classList.toggle('active', i===0));
  document.querySelectorAll('.tab-pane[data-vpane]').forEach((p2,i) => p2.classList.toggle('active', i===0));
  open('viewModal');
}

/* ─── DELETE ───────────────────────────────────── */
function confirmarExcluir(id) {
  const p = pedidos.find(x => String(x.id) === String(id));
  if (!p) return;
  pendingDeleteId = id;
  $('deleteMsg').textContent = `Deseja excluir o Pedido Nº ${p.codigo}?`;
  $('confirmDeleteBtn').onclick = executeDelete;
  open('deleteModal');
}

async function executeDelete() {
  if (!pendingDeleteId) return;
  const id = pendingDeleteId;
  const p = pedidos.find(x => String(x.id) === String(id));
  try {
    await api(`${API_URL}/pedidos/${id}`, { method: 'DELETE' });
    close('deleteModal');
    pendingDeleteId = null;
    await loadPedidos();
    toastSuccess(`Pedido ${p?.codigo || ''} excluído`);
  } catch (e) {
    toastError('Erro ao excluir pedido');
    close('deleteModal');
    pendingDeleteId = null;
  }
}

/* ─── NF MODAL (emitir / editar) ───────────────── */
function promptNF(msg, initial) {
  return new Promise(resolve => {
    pendingNFResolve = resolve;
    $('nfMsg').textContent = msg;
    $('nfInput').value = initial || '';
    open('nfModal');
    setTimeout(() => $('nfInput').focus(), 120);
  });
}

$('confirmNfBtn').addEventListener('click', () => {
  const v = $('nfInput').value.trim();
  if (!v) { toastError('Informe o número da NF'); return; }
  close('nfModal');
  if (pendingNFResolve) { pendingNFResolve(v); pendingNFResolve = null; }
});
$('nfInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); $('confirmNfBtn').click(); }
});

async function toggleEmissao(id, checked, chkEl) {
  const p = pedidos.find(x => String(x.id) === String(id));
  if (!p) return;
  if (!userCanToggleEmissao()) {
    if (chkEl) chkEl.checked = !checked;
    toastError('Somente Financeiro e administradores podem alterar');
    return;
  }
  if (checked && p.status === 'pendente') {
    const nf = await promptNF(`Informe o número da NF para emitir o pedido ${p.codigo}:`, p.numero_nf || '');
    if (!nf) { if (chkEl) chkEl.checked = false; return; }
    await executarEmissao(id, nf, chkEl);
  } else if (!checked && p.status === 'emitida') {
    if (chkEl) chkEl.checked = true;
    await executarReverterEmissao(id, chkEl);
  }
}

async function executarEmissao(id, nf, chkEl) {
  const p = pedidos.find(x => String(x.id) === String(id));
  if (!p) return;
  const items = Array.isArray(p.items) ? p.items : [];
  const hasStockCode = items.some(it => (it.codigoEstoque || '').trim());
  try {
    if (hasStockCode) {
      for (const it of items) {
        if (!it.codigoEstoque) continue;
        const itEstoque = estoqueCache[it.codigoEstoque];
        if (!itEstoque) continue;
        const novaQtd = parseFloat(itEstoque.quantidade) - it.quantidade;
        await api(`${API_URL}/estoque/${itEstoque.codigo}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantidade: novaQtd, numero_pedido: p.codigo, atualizado_por: p.responsavel || p.vendedor || null })
        });
      }
    }
    await api(`${API_URL}/pedidos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'emitida', data_emissao: new Date().toISOString(), numero_nf: nf })
    });
    await Promise.all([loadPedidos(), loadEstoque()]);
    toastSuccess(hasStockCode ? `Pedido ${p.codigo} emitido` : `Pedido ${p.codigo} emitido (sem referência de estoque)`);
  } catch (err) {
    if (chkEl) chkEl.checked = false;
    toastError('Erro ao emitir pedido');
  }
}

async function executarReverterEmissao(id, chkEl) {
  const p = pedidos.find(x => String(x.id) === String(id));
  if (!p) return;
  const items = Array.isArray(p.items) ? p.items : [];
  try {
    for (const it of items) {
      if (!it.codigoEstoque) continue;
      const itEstoque = estoqueCache[it.codigoEstoque];
      if (!itEstoque) continue;
      const novaQtd = parseFloat(itEstoque.quantidade) + it.quantidade;
      await api(`${API_URL}/estoque/${itEstoque.codigo}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantidade: novaQtd, numero_pedido: p.codigo, atualizado_por: p.responsavel || p.vendedor || null })
      });
    }
    await api(`${API_URL}/pedidos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'pendente', data_emissao: null })
    });
    await Promise.all([loadPedidos(), loadEstoque()]);
    toastSuccess(`Emissão do pedido ${p.codigo} revertida`);
  } catch (err) {
    if (chkEl) chkEl.checked = true;
    toastError('Erro ao reverter emissão');
  }
}

async function editarNF(id) {
  if (!userCanToggleEmissao()) return;
  const p = pedidos.find(x => String(x.id) === String(id));
  if (!p) return;
  const nf = await promptNF(`Número da NF do pedido ${p.codigo}:`, p.numero_nf || '');
  if (!nf) return;
  try {
    await api(`${API_URL}/pedidos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ numero_nf: nf || null })
    });
    await loadPedidos();
    toastSuccess(`Nº NF do pedido ${p.codigo} atualizado`);
  } catch (e) { toastError('Erro ao salvar NF'); }
}

/* ─── ETIQUETA ─────────────────────────────────── */
async function gerarEtiqueta(id) {
  const p = pedidos.find(x => String(x.id) === String(id));
  if (!p) { toastError('Pedido não encontrado'); return; }
  const nf = await promptNF(`Número da NF para gerar as etiquetas do pedido ${p.codigo}:`, p.numero_nf || '');
  if (!nf) return;

  const totalVolumes = parseInt(p.quantidade) || 1;
  let municipio = '';
  const partes = (p.endereco || '').split(',');
  municipio = partes.length > 1 ? partes[partes.length - 1].trim() : (p.endereco || '');

  imprimirEtiquetas(nf, totalVolumes, p.razao_social, municipio, p.endereco || '', p.local_entrega || '');
}

function imprimirEtiquetas(nf, totalVolumes, destinatario, municipio, endereco, infoAdicional) {
  let content = '';
  const ts = new Date().getTime();
  for (let i = 1; i <= totalVolumes; i++) {
    content += `<div class='label-container'><div class='logo-container'><img src='/apps/imagens/ETIQUETA.png?v=${ts}' alt='Logo' style='max-width: 100px; max-height: 100px; margin-right: 15px; display: block;'><div><div class='header'>I.R COMÉRCIO E <br>MATERIAIS ELÉTRICOS LTDA</div><div class='cnpj'>CNPJ: 33.149.502/0001-38</div></div></div><div class='nf-volume-container'><div class='nf-volume'>NF: ${nf}</div><div class='volume'>VOLUME: ${i}/${totalVolumes}</div></div><hr><div class='section-title'>DESTINATÁRIO:</div><div class='section'>${destinatario}</div><div class='section'>${endereco}</div>${infoAdicional ? `<div class='section-title additional-info'>LOCAL DE ENTREGA:</div><div class='section'>${infoAdicional}</div>` : ""}</div>`;
  }
  const printSection = document.createElement('div');
  printSection.id = 'printSection';
  printSection.innerHTML = content;
  const style = document.createElement('style');
  style.id = 'printStyle';
  style.innerHTML = `
    @media print {
      @page { size: 100mm 150mm; margin: 2mm; }
      body * { visibility: hidden !important; background: transparent !important; }
      #printSection, #printSection * { visibility: visible !important; }
      #printSection { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; display: block !important; }
      .label-container { width: 96mm; height: 146mm; padding: 2mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: flex-start; overflow: hidden; page-break-after: always; }
      .logo-container { display: flex; align-items: center; margin-bottom: 10px; }
      .logo-container img { max-width: 100px; max-height: 100px; margin-right: 15px; display: block !important; visibility: visible !important; }
      .header, .cnpj, .section-title { font-weight: bold; margin-bottom: 5px; }
      .header { font-size: 14px; line-height: 1.2; }
      .cnpj { font-size: 12px; }
      .nf-volume-container { text-align: center; border: 1px solid black; padding: 5px; margin: 10px 0; }
      .nf-volume { font-size: 30px; font-weight: bold; margin-bottom: 2px; }
      .volume { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
      .section { line-height: 1.2; word-wrap: break-word; margin-top: 2px; }
      .additional-info { margin-top: 10px; }
      hr { border: none; border-top: 1px solid #000; margin: 10px 0; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(printSection);

  const imgs = printSection.querySelectorAll('img');
  let loaded = 0;
  let printed = false;
  const trigger = () => {
    if (printed) return;
    printed = true;
    window.print();
    window.onafterprint = function() {
      printSection.remove(); style.remove(); window.onafterprint = null;
    };
    toastSuccess(`${totalVolumes} etiqueta(s) gerada(s) para NF ${nf}`);
  };
  if (!imgs.length) { setTimeout(trigger, 100); }
  else {
    const fb = setTimeout(trigger, 2000);
    imgs.forEach(img => {
      const done = () => { loaded++; if (loaded === imgs.length) { clearTimeout(fb); setTimeout(trigger, 100); } };
      if (img.complete) done();
      else { img.onload = done; img.onerror = done; }
    });
  }
}

/* ─── MÊS / CALENDÁRIO ─────────────────────────── */
function updateMonthDisplay() {
  const el = $('currentMonth');
  if (el) el.textContent = `${MESES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
}

function changeMonth(direction) {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
  updateMonthDisplay();
  pedidos = [];
  $('list').innerHTML = '';
  loadPedidos();
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
      currentMonth = new Date(calendarYear, parseInt(btn.dataset.month), 1);
      close('calendarModal');
      updateMonthDisplay();
      pedidos = [];
      $('list').innerHTML = '';
      loadPedidos();
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

/* ─── FAB ──────────────────────────────────────── */
$('addBtn').addEventListener('click', openFormModal);

/* ─── BOOT ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', verificarAutenticacao);

})();

(() => {
"use strict";

const PORTAL_URL = window.location.origin;
const API_URL = `${window.location.origin}/api`;
const MODULE_SESSION_KEY = 'transportadorasSession';
const SESSION_KEY = 'irUserSession';

const REGIOES_LISTA = ['NORTE', 'NORDESTE', 'SUDESTE', 'SUL', 'CENTRO-OESTE'];
const ESTADOS_LISTA = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

let transportadoras = [];
let editingId = null;
let pendingDeleteId = null;
let sessionToken = null;

const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const up = s => String(s??'').toUpperCase();

document.addEventListener('DOMContentLoaded', () => verificarAutenticacao());

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
  iniciarApp();
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

/* ─── HELPERS UI ─────────────────────────────────────── */
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

/* ─── TABS ───────────────────────────────────────────── */
document.querySelectorAll('.modal-tab[data-tab]').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.modal-tab[data-tab]').forEach(x => x.classList.toggle('active', x === t));
    document.querySelectorAll('.tab-pane[data-pane]').forEach(p => p.classList.toggle('active', p.dataset.pane === t.dataset.tab));
  });
});

/* ─── INICIALIZAÇÃO ──────────────────────────────────── */
async function iniciarApp() {
  renderChips();
  await loadTransportadoras();
  setInterval(loadTransportadoras, 30000);
}

async function loadTransportadoras() {
  try {
    const data = await api(`${API_URL}/transportadoras`);
    transportadoras = Array.isArray(data) ? data : (data.data || []);
    renderList();
  } catch (e) {
    console.error(e);
  }
}

function filteredTransportadoras() {
  const search = ($('searchInput').value || '').toLowerCase().trim();
  if (!search) return transportadoras;
  return transportadoras.filter(t =>
    (t.nome || '').toLowerCase().includes(search) ||
    (t.representante || '').toLowerCase().includes(search) ||
    (t.email || '').toLowerCase().includes(search) ||
    (t.regioes || []).join(' ').toLowerCase().includes(search) ||
    (t.estados || []).join(' ').toLowerCase().includes(search)
  );
}

function renderList() {
  const wrap = $('list');
  const empty = $('emptyState');
  const filtered = filteredTransportadoras();

  if (!filtered.length) {
    wrap.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  wrap.innerHTML = filtered.map(t => {
    const regioes = (t.regioes || []);
    const estados = (t.estados || []);
    const chipsHtml = [
      ...regioes.map(r => `<span class="mini-chip">${esc(r)}</span>`),
      ...estados.map(uf => `<span class="mini-chip uf">${esc(uf)}</span>`)
    ].join('');

    const telefones = (t.telefones || []).join(', ') || '—';
    const celulares = (t.celulares || []).join(', ') || '—';

    return `
      <div class="transp-card" data-id="${esc(t.id)}">
        <div class="card-top">
          <span class="card-nome">${esc(up(t.nome))}</span>
          <span class="card-badge-count">${regioes.length + estados.length} cobertura</span>
        </div>
        <div class="card-grid">
          <div class="card-cell"><span class="cell-label">Representante</span><span class="cell-value">${esc(up(t.representante) || '—')}</span></div>
          <div class="card-cell"><span class="cell-label">E-mail</span><span class="cell-value email">${esc(t.email || '—')}</span></div>
          <div class="card-cell"><span class="cell-label">Telefone</span><span class="cell-value">${esc(telefones)}</span></div>
          <div class="card-cell"><span class="cell-label">Celular</span><span class="cell-value">${esc(celulares)}</span></div>
        </div>
        ${chipsHtml ? `<div class="chips-row">${chipsHtml}</div>` : ''}
        <div class="card-actions">
          <button type="button" class="action-btn edit" data-edit="${esc(t.id)}">Editar</button>
          <button type="button" class="action-btn delete" data-del="${esc(t.id)}">Excluir</button>
        </div>
      </div>`;
  }).join('');

  wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); editTransportadora(b.dataset.edit); }));
  wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); confirmDeleteFlow(b.dataset.del); }));
}

$('searchInput').addEventListener('input', renderList);
$('addBtn').addEventListener('click', openFormModal);
$('syncBtn').addEventListener('click', async () => {
  const b = $('syncBtn'); b.classList.add('spinning');
  await loadTransportadoras();
  setTimeout(() => b.classList.remove('spinning'), 600);
  toastSuccess('Dados sincronizados');
});

/* ─── CHIPS ──────────────────────────────────────────── */
function renderChips() {
  const regioesC = $('regioesContainer');
  const estadosC = $('estadosContainer');
  regioesC.innerHTML = REGIOES_LISTA.map(r =>
    `<button type="button" class="chip-selector" data-regiao="${esc(r)}">${esc(r)}</button>`
  ).join('');
  estadosC.innerHTML = ESTADOS_LISTA.map(uf =>
    `<button type="button" class="chip-selector" data-estado="${esc(uf)}">${esc(uf)}</button>`
  ).join('');

  regioesC.querySelectorAll('.chip-selector').forEach(b => {
    b.addEventListener('click', () => b.classList.toggle('selected'));
  });
  estadosC.querySelectorAll('.chip-selector').forEach(b => {
    b.addEventListener('click', () => b.classList.toggle('selected'));
  });
}

function setChipsSelected(regioes = [], estados = []) {
  document.querySelectorAll('#regioesContainer .chip-selector').forEach(b => {
    b.classList.toggle('selected', regioes.includes(b.dataset.regiao));
  });
  document.querySelectorAll('#estadosContainer .chip-selector').forEach(b => {
    b.classList.toggle('selected', estados.includes(b.dataset.estado));
  });
}

function getSelectedRegioes() {
  return Array.from(document.querySelectorAll('#regioesContainer .chip-selector.selected')).map(b => b.dataset.regiao);
}
function getSelectedEstados() {
  return Array.from(document.querySelectorAll('#estadosContainer .chip-selector.selected')).map(b => b.dataset.estado);
}

/* ─── FORM ───────────────────────────────────────────── */
function openFormModal() {
  editingId = null;
  $('transpForm').reset();
  $('editId').value = '';
  $('formTitle').textContent = 'Nova Transportadora';
  $('btnSave').textContent = 'Salvar';
  setChipsSelected([], []);
  document.querySelectorAll('.modal-tab[data-tab]').forEach((t, i) => t.classList.toggle('active', i === 0));
  document.querySelectorAll('.tab-pane[data-pane]').forEach((p, i) => p.classList.toggle('active', i === 0));
  open('formModal');
}

function editTransportadora(id) {
  const t = transportadoras.find(x => String(x.id) === String(id));
  if (!t) return;
  editingId = id;
  $('editId').value = id;
  $('formTitle').textContent = 'Editar Transportadora';
  $('btnSave').textContent = 'Atualizar';
  $('nome').value = t.nome || '';
  $('representante').value = t.representante || '';
  $('email').value = t.email || '';
  $('telefones').value = (t.telefones || []).join(', ');
  $('celulares').value = (t.celulares || []).join(', ');
  setChipsSelected(t.regioes || [], t.estados || []);
  document.querySelectorAll('.modal-tab[data-tab]').forEach((x, i) => x.classList.toggle('active', i === 0));
  document.querySelectorAll('.tab-pane[data-pane]').forEach((p, i) => p.classList.toggle('active', i === 0));
  open('formModal');
}

function parseArray(str) {
  if (!str || !str.trim()) return [];
  return str.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
}

$('transpForm').addEventListener('submit', async e => {
  e.preventDefault();
  const nome = $('nome').value.trim();
  const email = $('email').value.trim();
  if (!nome || !email) {
    toastError('Verifique se todas as informações obrigatórias estão preenchidas');
    return;
  }

  const payload = {
    nome: up(nome),
    representante: up($('representante').value.trim()),
    email: email.toLowerCase(),
    telefones: parseArray($('telefones').value),
    celulares: parseArray($('celulares').value),
    regioes: getSelectedRegioes(),
    estados: getSelectedEstados()
  };

  const btn = $('btnSave');
  btn.disabled = true;
  btn.textContent = 'Aguarde...';

  try {
    const url = editingId ? `${API_URL}/transportadoras/${editingId}` : `${API_URL}/transportadoras`;
    const method = editingId ? 'PUT' : 'POST';
    await api(url, { method, body: JSON.stringify(payload) });
    close('formModal');
    await loadTransportadoras();
    toastSuccess(editingId ? `${payload.nome} atualizada` : `${payload.nome} registrada`);
  } catch (err) {
    toastError(err.message || 'Erro ao salvar transportadora');
  } finally {
    btn.disabled = false;
    btn.textContent = editingId ? 'Atualizar' : 'Salvar';
  }
});

/* ─── DELETE ─────────────────────────────────────────── */
function confirmDeleteFlow(id) {
  const t = transportadoras.find(x => String(x.id) === String(id));
  if (!t) return;
  pendingDeleteId = id;
  $('deleteMsg').textContent = `Tem certeza que deseja excluir a transportadora "${up(t.nome)}"?`;
  const btn = $('confirmDeleteBtn');
  const fresh = btn.cloneNode(true);
  btn.parentNode.replaceChild(fresh, btn);
  fresh.addEventListener('click', executeDelete);
  open('deleteModal');
}

async function executeDelete() {
  if (!pendingDeleteId) return;
  const id = pendingDeleteId;
  const nome = transportadoras.find(t => String(t.id) === String(id))?.nome || 'Transportadora';
  try {
    await api(`${API_URL}/transportadoras/${id}`, { method: 'DELETE' });
    close('deleteModal');
    pendingDeleteId = null;
    await loadTransportadoras();
    toastError(`${up(nome)} excluída`);
  } catch (e) {
    toastError('Erro ao excluir transportadora');
    close('deleteModal');
    pendingDeleteId = null;
  }
}

})();

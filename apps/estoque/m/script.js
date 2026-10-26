(() => {
"use strict";

const API_URL = `${window.location.origin}/api`;
const API_BASE = `${API_URL}/estoque`;
const PORTAL_URL = window.location.origin;
const MODULE_SESSION_KEY = 'estoqueSession';
const SESSION_KEY = 'irUserSession';

let allItems = [];
let grupos = [];
let editingId = null;
let filtros = { search: '', marca: '', grupo: '' };
let pendingMovId = null;
let pendingMovTipo = null;
let sessionToken = null;

const estoqueBC = (typeof BroadcastChannel !== 'undefined')
    ? new BroadcastChannel('estoque-updates')
    : null;

const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const up = s => String(s??'').toUpperCase();
const fmtMoney = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/* ─── AUTH ─────────────────────────────────────────── */
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

/* ─── HELPERS ──────────────────────────────────────── */
function notificar(message, type = 'success') {
  if (window.IR && typeof IR.toast === 'function') return IR.toast(message, type);
  const t = $('toast');
  t.className = `toast ${type}`;
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

function open(id) { const el = $(id); if (el) { el.classList.add('show'); el.setAttribute('aria-hidden', 'false'); } }
function close(id) { const el = $(id); if (el) { el.classList.remove('show'); el.setAttribute('aria-hidden', 'true'); } }

document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => close(b.dataset.close)));
document.querySelectorAll('.modal').forEach(o => o.addEventListener('click', e => { if (e.target === o) close(o.id); }));

/* Tabs */
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
async function iniciarApp() {
  await Promise.all([carregarGrupos(), carregarEstoque()]);

  // Sincronização instantânea
  if (estoqueBC) {
    estoqueBC.onmessage = (e) => {
      if (e.data && e.data.type === 'estoque-changed') carregarEstoque(true);
    };
  }
  window.addEventListener('storage', (e) => {
    if (e.key === 'estoque:lastUpdate') carregarEstoque(true);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') carregarEstoque(true);
  });
  window.addEventListener('focus', () => carregarEstoque(true));

  setInterval(() => carregarEstoque(true), 2000);
}

function broadcastEstoque() {
  if (estoqueBC) {
    try { estoqueBC.postMessage({ type: 'estoque-changed', ts: Date.now() }); } catch (e) {}
  }
  try { localStorage.setItem('estoque:lastUpdate', String(Date.now())); } catch (e) {}
}

async function carregarGrupos() {
  try {
    grupos = await api(`${API_BASE}/grupos`);
    preencherFiltroGrupos();
  } catch (e) { console.error('Erro grupos:', e); }
}

async function carregarEstoque(silent = false) {
  try {
    const novaLista = await api(API_BASE);
    if (JSON.stringify(novaLista) !== JSON.stringify(allItems)) {
      allItems = novaLista || [];
      preencherFiltroMarcas();
      renderList();
    }
  } catch (e) {
    if (!silent) { console.error(e); notificar('Erro ao carregar estoque', 'error'); }
  }
}

function preencherFiltroGrupos() {
  const sel = $('filterGrupo');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">Todos os Grupos</option>' +
    grupos.map(g => `<option value="${esc(g.abreviacao)}">${esc(g.nome)} (${esc(g.abreviacao)})</option>`).join('');
  if (cur) sel.value = cur;
}

function preencherFiltroMarcas() {
  const sel = $('filterMarca');
  if (!sel) return;
  const cur = sel.value;
  const marcas = [...new Set(allItems.map(i => i.marca).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">Todas as Marcas</option>' +
    marcas.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
  if (cur) sel.value = cur;
}

/* ─── FILTERS ──────────────────────────────────────── */
$('searchInput').addEventListener('input', () => {
  filtros.search = $('searchInput').value.toLowerCase().trim();
  renderList();
});
$('filterMarca').addEventListener('change', () => { filtros.marca = $('filterMarca').value; renderList(); });
$('filterGrupo').addEventListener('change', () => { filtros.grupo = $('filterGrupo').value; renderList(); });

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

/* ─── RENDER LIST ──────────────────────────────────── */
function renderList() {
  const wrap = $('list');
  const empty = $('emptyState');
  const items = getFilteredItems();
  updateTotals(items);

  if (!items.length) { wrap.innerHTML = ''; empty.hidden = false; return; }
  empty.hidden = true;

  wrap.innerHTML = items.map(item => {
    const qtd = Number(item.quantidade) || 0;
    const qtdClass = qtd === 0 ? 'qtd zero' : 'qtd';
    return `
      <div class="item-card" data-id="${esc(item.id)}">
        <div class="card-top">
          <span class="card-codigo">${esc(item.codigo || '—')}</span>
          <span class="card-grupo">${esc(up(item.grupo))}</span>
        </div>
        <div class="card-descricao">${esc(up(item.descricao) || '—')}</div>
        <div class="card-grid">
          <div class="card-cell"><span class="cell-label">Marca</span><span class="cell-value">${esc(up(item.marca) || '—')}</span></div>
          <div class="card-cell"><span class="cell-label">Modelo</span><span class="cell-value">${esc(up(item.modelo) || '—')}</span></div>
          <div class="card-cell"><span class="cell-label">Valor Unit.</span><span class="cell-value valor">${esc(fmtMoney(item.valor_unitario))}</span></div>
          <div class="card-cell"><span class="cell-label">Quantidade</span><span class="cell-value ${qtdClass}">${qtd}</span></div>
        </div>
        <div class="card-actions">
          <button type="button" class="action-btn edit" data-edit="${esc(item.id)}">Editar</button>
          <button type="button" class="action-btn entry" data-mov="entrada" data-id="${esc(item.id)}">Entrada</button>
          <button type="button" class="action-btn exit" data-mov="saida" data-id="${esc(item.id)}">Saída</button>
        </div>
      </div>`;
  }).join('');

  wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openFormModal(b.dataset.edit); }));
  wrap.querySelectorAll('[data-mov]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openMovModal(b.dataset.id, b.dataset.mov); }));

  wrap.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      viewItem(card.dataset.id);
    });
  });
}

function updateTotals(items) {
  const q = items.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
  const v = items.reduce((s, i) => s + ((Number(i.valor_unitario) || 0) * (Number(i.quantidade) || 0)), 0);
  $('totalQtd').textContent = q;
  $('totalValor').textContent = fmtMoney(v);
}

/* ─── FORM (Novo / Editar) ─────────────────────────── */
function openFormModal(id) {
  editingId = id || null;
  const item = id ? allItems.find(i => String(i.id) === String(id)) : null;

  $('itemForm').reset();
  $('formTitle').textContent = item ? 'Editar Item' : 'Novo Item';
  $('btnSave').textContent = item ? 'Atualizar' : 'Salvar';
  $('editId').value = id || '';

  // Código só aparece na edição
  $('codigoField').hidden = !item;
  if (item) $('fCodigo').value = item.codigo || '';

  // Grupo
  const grupoSel = $('fGrupo');
  grupoSel.innerHTML = '<option value="">Selecione...</option>' +
    grupos.map(g => `<option value="${esc(g.abreviacao)}">${esc(g.nome)} (${esc(g.abreviacao)})</option>`).join('');
  if (item) grupoSel.value = item.grupo || '';

  $('fDescricao').value = item ? item.descricao : '';
  $('fNcm').value = item ? (item.ncm || '') : '';
  $('fMarca').value = item ? (item.marca || '') : '';
  $('fModelo').value = item ? (item.modelo || '') : '';
  $('fValor').value = item ? (Number(item.valor_unitario) || 0) : 0;
  $('fQtd').value = item ? (Number(item.quantidade) || 0) : 0;
  $('fQtd').readOnly = !!item;
  $('fQtd').style.background = item ? '#E5E7EB' : '';
  $('fQtd').style.cursor = item ? 'not-allowed' : '';

  document.querySelectorAll('.modal-tab[data-tab]').forEach((t, i) => t.classList.toggle('active', i === 0));
  document.querySelectorAll('.tab-pane[data-pane]').forEach((p, i) => p.classList.toggle('active', i === 0));

  open('formModal');
}

$('itemForm').addEventListener('submit', async e => {
  e.preventDefault();
  const descricao = $('fDescricao').value.trim();
  const grupo = $('fGrupo').value.trim();
  const valor = parseFloat($('fValor').value) || 0;
  const marca = $('fMarca').value.trim();
  const modelo = $('fModelo').value.trim();
  const ncm = $('fNcm').value.trim();

  if (!descricao) { notificar('Informe a descrição', 'error'); return; }
  if (!grupo) {
    document.querySelectorAll('.modal-tab[data-tab]').forEach(t => t.classList.toggle('active', t.dataset.tab === 'produto'));
    document.querySelectorAll('.tab-pane[data-pane]').forEach(p => p.classList.toggle('active', p.dataset.pane === 'produto'));
    notificar('Selecione o grupo', 'error');
    return;
  }

  const btn = $('btnSave');
  btn.disabled = true; btn.textContent = 'Aguarde...';

  try {
    if (editingId) {
      await api(`${API_BASE}/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ descricao, grupo, valor_unitario: valor, marca, modelo, ncm })
      });
    } else {
      const qtd = parseInt($('fQtd').value, 10) || 0;
      await api(API_BASE, {
        method: 'POST',
        body: JSON.stringify({ descricao, grupo, valor_unitario: valor, quantidade: qtd, marca, modelo, ncm })
      });
    }
    close('formModal');
    broadcastEstoque();
    notificar(editingId ? 'Item atualizado com sucesso!' : 'Item criado com sucesso!', 'success');
    await carregarEstoque();
  } catch (err) {
    notificar(err.message, 'error');
    btn.disabled = false;
    btn.textContent = editingId ? 'Atualizar' : 'Salvar';
  }
});

/* ─── MOVIMENTAÇÃO (Entrada / Saída) ──────────────── */
function openMovModal(id, tipo) {
  const item = allItems.find(i => String(i.id) === String(id));
  if (!item) return notificar('Item não encontrado', 'error');
  pendingMovId = id;
  pendingMovTipo = tipo;
  const tipoLabel = tipo === 'entrada' ? 'Entrada' : 'Saída';

  $('movMsg').textContent = `${tipoLabel} de Estoque`;
  $('movInfo').innerHTML = `
    <strong>${esc(item.codigo)}</strong> — ${esc(up(item.descricao))}<br>
    Estoque atual: <strong>${Number(item.quantidade) || 0}</strong>
  `;
  $('fMovQtd').value = '1';
  $('btnConfirmarMov').textContent = `Confirmar ${tipoLabel}`;

  open('movModal');
  setTimeout(() => $('fMovQtd').focus(), 120);
}

$('btnConfirmarMov').addEventListener('click', async () => {
  if (!pendingMovId || !pendingMovTipo) return;
  const qtd = parseInt($('fMovQtd').value, 10);
  if (!qtd || qtd <= 0) return notificar('Informe uma quantidade válida', 'error');

  const btn = $('btnConfirmarMov');
  btn.disabled = true; btn.textContent = 'Aguarde...';

  try {
    await api(`${API_BASE}/${pendingMovId}/movimentacao`, {
      method: 'POST',
      body: JSON.stringify({ tipo: pendingMovTipo, quantidade: qtd })
    });
    close('movModal');
    broadcastEstoque();
    notificar(`${pendingMovTipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`, 'success');
    await carregarEstoque();
  } catch (err) {
    notificar(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = `Confirmar ${pendingMovTipo === 'entrada' ? 'Entrada' : 'Saída'}`;
    pendingMovId = null;
    pendingMovTipo = null;
  }
});

/* ─── NOVO GRUPO ──────────────────────────────────── */
$('btnNovoGrupo').addEventListener('click', () => {
  $('grupoForm').reset();
  open('grupoModal');
  setTimeout(() => $('gNome').focus(), 120);
});

$('gAbrev').addEventListener('input', () => {
  $('gAbrev').value = $('gAbrev').value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
});

$('grupoForm').addEventListener('submit', async e => {
  e.preventDefault();
  const nome = $('gNome').value.trim();
  const abreviacao = $('gAbrev').value.trim().toUpperCase();
  if (abreviacao.length !== 4) return notificar('A abreviação deve ter 4 letras', 'error');

  const btn = $('btnSaveGrupo');
  btn.disabled = true; btn.textContent = 'Aguarde...';

  try {
    const data = await api(`${API_BASE}/grupos`, {
      method: 'POST',
      body: JSON.stringify({ nome, abreviacao })
    });
    close('grupoModal');
    await carregarGrupos();
    notificar('Grupo criado com sucesso!', 'success');
  } catch (err) {
    notificar(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Criar Grupo';
  }
});

/* ─── VIEW ────────────────────────────────────────── */
function viewItem(id) {
  const item = allItems.find(i => String(i.id) === String(id));
  if (!item) return;

  $('viewTitle').textContent = item.codigo || 'Item';
  const row = (label, val, extraClass = '') => `<div class="info-row"><span class="info-label">${esc(label)}</span><span class="info-value ${extraClass} ${!val && val !== 0 ? 'empty' : ''}">${esc(val || (val === 0 ? '0' : '—'))}</span></div>`;

  $('vproduto').innerHTML = `
    <div class="info-section">
      <h4>Produto</h4>
      ${row('ID (Código)', item.codigo)}
      ${row('Descrição', up(item.descricao))}
      ${row('Grupo', up(item.grupo))}
      ${row('NCM', item.ncm)}
    </div>`;

  $('vfornecedor').innerHTML = `
    <div class="info-section">
      <h4>Fornecedor</h4>
      ${row('Marca', up(item.marca))}
      ${row('Modelo', up(item.modelo))}
    </div>`;

  const valorTotal = (Number(item.valor_unitario) || 0) * (Number(item.quantidade) || 0);
  $('vvalores').innerHTML = `
    <div class="info-section">
      <h4>Estoque e Valores</h4>
      ${row('Valor Unitário', fmtMoney(item.valor_unitario), 'valor')}
      ${row('Quantidade', String(Number(item.quantidade) || 0), 'qtd')}
      ${row('Valor Total em Estoque', fmtMoney(valorTotal), 'valor')}
    </div>`;

  document.querySelectorAll('.modal-tab[data-vtab]').forEach((t, i) => t.classList.toggle('active', i === 0));
  document.querySelectorAll('.tab-pane[data-vpane]').forEach((p, i) => p.classList.toggle('active', i === 0));

  open('viewModal');
}

/* ─── SYNC ────────────────────────────────────────── */
$('syncBtn').addEventListener('click', async () => {
  const b = $('syncBtn'); b.classList.add('spinning');
  try {
    await Promise.all([carregarGrupos(), carregarEstoque()]);
    broadcastEstoque();
    notificar('Dados sincronizados com sucesso!', 'success');
  } catch (e) {
    notificar('Erro ao sincronizar', 'error');
  } finally {
    setTimeout(() => b.classList.remove('spinning'), 600);
  }
});

/* ─── FAB NOVO ITEM ───────────────────────────────── */
$('addBtn').addEventListener('click', () => openFormModal(null));

/* ─── PDFs ────────────────────────────────────────── */
function getMesAnoAtual() {
  const d = new Date();
  const meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
  return `${meses[d.getMonth()]}-${d.getFullYear()}`;
}

$('pdfEstoqueBtn').addEventListener('click', () => gerarPDFEstoque());
$('pdfMovBtn').addEventListener('click', () => gerarPDFMovimentacoes());

function gerarPDFEstoque() {
  try {
    const jsPDFConstructor = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
    if (!jsPDFConstructor) throw new Error('Biblioteca jsPDF não encontrada.');
    const doc = new jsPDFConstructor({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    if (typeof doc.autoTable !== 'function') throw new Error('Plugin autoTable não carregado.');

    const items = getFilteredItems();
    if (!items.length) return notificar('Nenhum item para gerar PDF', 'error');

    doc.setFontSize(16); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Estoque', 14, 16);
    doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);

    const grouped = {};
    items.forEach(i => {
      const g = i.grupo || 'SEM GRUPO';
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(i);
    });

    let currentY = 32, isFirstPage = true;
    for (const [grupo, lista] of Object.entries(grouped)) {
      if (!isFirstPage && currentY > 160) { doc.addPage(); currentY = 20; }
      doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 0, 0);
      doc.text(`GRUPO: ${grupo}`, 14, currentY); currentY += 6;

      const body = lista.map(i => [
        i.codigo || '', i.descricao || '', i.marca || '', i.modelo || '',
        fmtMoney(i.valor_unitario), String(Number(i.quantidade) || 0),
        fmtMoney((Number(i.valor_unitario) || 0) * (Number(i.quantidade) || 0))
      ]);
      const totalGrupo = lista.reduce((s, i) => s + ((Number(i.valor_unitario) || 0) * (Number(i.quantidade) || 0)), 0);

      doc.autoTable({
        startY: currentY,
        head: [['Código','Descrição','Marca','Modelo','Valor Unit.','Qtd','Total']],
        body,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2, textColor: [0,0,0], lineColor: [200,200,200], lineWidth: 0.1 },
        headStyles: { fillColor: [0,0,0], textColor: [255,255,255], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0,0,0] },
        alternateRowStyles: { fillColor: [255,255,255] }
      });
      currentY = doc.lastAutoTable.finalY + 8;
      doc.setFont(undefined, 'bold'); doc.setFontSize(10);
      doc.text(`VALOR TOTAL DO GRUPO: ${fmtMoney(totalGrupo)}`, 14, currentY);
      currentY += 15;
      isFirstPage = false;
    }

    doc.save(`${getMesAnoAtual()}-ESTOQUE.pdf`);
    notificar('PDF gerado com sucesso!', 'success');
  } catch (err) {
    console.error(err);
    notificar('Erro ao gerar PDF: ' + err.message, 'error');
  }
}

async function gerarPDFMovimentacoes() {
  try {
    notificar('Gerando relatório de movimentações...', 'info');
    const movs = await api(`${API_BASE}/movimentacoes/todas`);
    if (!movs || !movs.length) return notificar('Nenhuma movimentação registrada', 'error');

    const jsPDFConstructor = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
    if (!jsPDFConstructor) throw new Error('Biblioteca jsPDF não encontrada.');
    const doc = new jsPDFConstructor({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(16); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Movimentações', 14, 16);
    doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);

    const meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
    const grouped = {};
    movs.forEach(m => {
      const date = new Date(m.created_at || m.ultima_atualizacao);
      const key = `${meses[date.getMonth()]} ${date.getFullYear()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });

    let currentY = 32, isFirstPage = true;
    for (const [mesAno, lista] of Object.entries(grouped)) {
      if (!isFirstPage && currentY > 160) { doc.addPage(); currentY = 20; }
      doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 0, 0);
      doc.text(mesAno, 14, currentY); currentY += 6;

      const body = lista.map(m => [
        m.created_at ? new Date(m.created_at).toLocaleString('pt-BR') : '-',
        (m.tipo || '').toUpperCase(),
        m.estoque?.codigo || m.codigo_estoque || '-',
        m.estoque?.descricao || '-',
        m.quantidade,
        m.atualizado_por || '-',
        m.numero_pedido || '-'
      ]);

      doc.autoTable({
        startY: currentY,
        head: [['Data/Hora','Tipo','Cód. Estoque','Descrição','Qtd','Responsável','Nº Pedido']],
        body,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, textColor: [0,0,0], lineColor: [200,200,200], lineWidth: 0.1 },
        headStyles: { fillColor: [0,0,0], textColor: [255,255,255], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0,0,0] },
        alternateRowStyles: { fillColor: [255,255,255] }
      });
      currentY = doc.lastAutoTable.finalY + 15;
      isFirstPage = false;
    }

    doc.save(`${getMesAnoAtual()}-MOVIMENTAÇÕES.pdf`);
    notificar('Relatório de movimentações gerado!', 'success');
  } catch (err) {
    console.error(err);
    notificar('Erro ao gerar relatório: ' + err.message, 'error');
  }
}

/* ─── BOOT ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', verificarAutenticacao);

})();

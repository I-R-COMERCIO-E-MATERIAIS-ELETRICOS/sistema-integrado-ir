(() => {
"use strict";

const MODULE_SESSION_KEY = 'licitacoesSession';
const SESSION_KEY = 'irUserSession';
const PORTAL_URL = window.location.origin;

const LOGO_SRC = '/apps/imagens/I.R.-COMERCIO-E-MATERIAIS-ELETRICOS-LTDA-PDF.png';
const SIGN_SRC = '/apps/imagens/assinatura.png';

const reqs = ['CERTIFICADO IBAMA','REGISTRO DE PREÇO','INSTALAÇÃO/INSPEÇÃO','VISITA TÉCNICA/ENSAIO','ENVIO DE AMOSTRA','ATESTADO DE CAPACIDADE','GARANTIA DE PROPOSTA','INFORMAÇÕES SOBRE ICMS'];
const states = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const COLORS = { amarelo:'#fef9c3', azul:'#bfdbfe', cinza:'#e5e7eb', vermelho:'#fca5a5', laranja:'#fed7aa' };
const STATUS_LABEL = {
  aguardando:'AGUARDANDO DISPUTA',
  'disputa-aberta':'DISPUTA ABERTA',
  ganho:'GANHO',
  realizado:'REALIZADO',
  suspenso:'SUSPENSO',
  encerrado:'ENCERRADO',
  cancelado:'CANCELADO'
};
const MESES = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
const MESES_CURTO = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

let sessionToken = null;
let records=[], users=[], banks=[];
let current=null;
let tables = [];
let currentPage = 1;
let hasMorePages = false;
let searchTimer, saveTimer, quoteMode=null;
let lastSnapshot = '';
let delId = null;
let delTableIdx = null;
let colorPop = null;
let pdfBusy = false;
let selectedDoc = null;
let quoteTIdx = null;
let assetsPromise = null;
let lastWarnSig = '';
let currentMonth = new Date();
let pendingRangeTIdx = 0;

const $ = id => document.getElementById(id);

const money = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
const num = v => {
  if(typeof v==='number') return v;
  const s=String(v??'').trim().replace(/\./g,'').replace(',','.').replace(/[^\d.-]/g,'');
  return Number(s)||0;
};
const fmtNum = (v, dec=2) => num(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const up = s => String(s??'').toUpperCase();
const fmtDate = v => { if(!v) return '—'; const p=String(v).split('-'); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:'—'; };
const todayStr = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

function effectiveStatus(r){
  if (r.ganho) return 'ganho';
  const s = String(r.status || '').toLowerCase();
  if (s === 'suspenso' || s === 'encerrado' || s === 'cancelado') return s;
  const d = r.data_pregao || '';
  if (!d) return 'aguardando';
  const today = todayStr();
  if (d < today) return 'realizado';
  if (d > today) return 'aguardando';
  if (r.horario_pregao) {
    const [h, m] = r.horario_pregao.split(':').map(Number);
    const dt = new Date(); dt.setHours(h||0, m||0, 0, 0);
    if (dt.getTime() <= Date.now()) return 'disputa-aberta';
    return 'aguardando';
  }
  return 'aguardando';
}

function triggerGlobalLogout(message) {
  const msg = message || 'Sua sessão expirou';
  try { if (window.IR && typeof IR.denied === 'function') { IR.denied(msg); return; } } catch(e){}
  let inIframe = false;
  try { inIframe = window.self !== window.top; } catch (e) { inIframe = true; }
  if (inIframe) {
    try { window.top.postMessage({ type: 'IR_LOGOUT', message: msg, source: 'licitacoes' }, '*'); } catch (e) {}
    try { window.top.location.href = PORTAL_URL + '/?logout=1&reason=session'; return; } catch (e) {}
    return;
  }
  window.location.href = PORTAL_URL + '/?logout=1&reason=session';
}

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
      if (raw) { const parsed = JSON.parse(raw); sessionToken = parsed.token || parsed.sessionToken || null; }
    } catch (e) {}
  }
  if (!sessionToken) { triggerGlobalLogout('Sessão expirada'); return; }
  if (window.IR && typeof IR.setToken === 'function') { try { IR.setToken(sessionToken); } catch (e) {} }
  startApp();
}

const api = async (url, opts = {}) => {
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(opts.headers || {}) };
  if (sessionToken) headers['X-Session-Token'] = sessionToken;
  const r = await fetch(url, { ...opts, headers, credentials: 'same-origin' });
  if (r.status === 401 || r.status === 403) {
    sessionStorage.removeItem(MODULE_SESSION_KEY);
    triggerGlobalLogout('Sua sessão expirou');
    throw new Error('Sessão expirada');
  }
  if (!r.ok) {
    let e = {};
    try { e = await r.json(); } catch {}
    throw new Error(e.error || e.hint || `Erro ${r.status}`);
  }
  return r.status === 204 ? null : r.json();
};

function toastSuccess(msg){ const t=$('toast'); t.className='toast success'; t.textContent=msg; t.classList.add('show'); clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),3000); }
function toastError(msg){ const t=$('toast'); t.className='toast error'; t.textContent=msg; t.classList.add('show'); clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),3000); }

function open(id){ const el=$(id); if(el){ el.classList.add('show'); el.setAttribute('aria-hidden','false'); } }
function close(id){ const el=$(id); if(el){ el.classList.remove('show'); el.setAttribute('aria-hidden','true'); } }

document.querySelectorAll('[data-close]').forEach(b=>{
  b.addEventListener('click', ()=>close(b.dataset.close));
});
document.querySelectorAll('.modal').forEach(o=>{
  o.addEventListener('click', e=>{ if(e.target === o) close(o.id); });
});

$('uf').innerHTML += states.map(s=>`<option>${s}</option>`).join('');
$('requirements').innerHTML = reqs.map(r=>`<button type="button" class="requirement" data-req="${r}">${r}</button>`).join('');
$('requirements').querySelectorAll('[data-req]').forEach(b=>b.addEventListener('click',()=>b.classList.toggle('selected')));

// Form tabs
document.querySelectorAll('.modal-tab[data-tab]').forEach(t => {
  t.addEventListener('click', () => setFormTab(t.dataset.tab));
});
function setFormTab(tab) {
  document.querySelectorAll('.modal-tab[data-tab]').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.tab-pane[data-pane]').forEach(p => p.classList.toggle('active', p.dataset.pane === tab));
}

// View tabs
document.querySelectorAll('.modal-tab[data-vtab]').forEach(t => {
  t.addEventListener('click', () => setViewTab(t.dataset.vtab));
});
function setViewTab(tab) {
  document.querySelectorAll('.modal-tab[data-vtab]').forEach(t => t.classList.toggle('active', t.dataset.vtab === tab));
  document.querySelectorAll('.tab-pane[data-vpane]').forEach(p => p.classList.toggle('active', p.dataset.vpane === tab));
}

$('addBtn').addEventListener('click', () => newRecord());
$('searchInput').addEventListener('input', ()=>{ clearTimeout(searchTimer); searchTimer=setTimeout(()=>loadList(),300); });
$('statusFilter').addEventListener('change', ()=>loadList());
$('vendedorFilter').addEventListener('change', ()=>loadList());
$('syncBtn').addEventListener('click', ()=>syncNow());
$('disputaBtn').addEventListener('click', ()=>openDisputaModal());
$('monthPrev').addEventListener('click', ()=>changeMonth(-1));
$('monthNext').addEventListener('click', ()=>changeMonth(1));

function updateMonthDisplay(){
  const el = $('currentMonth');
  if(el) el.textContent = `${MESES_CURTO[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
}
function changeMonth(direction){
  currentMonth.setMonth(currentMonth.getMonth() + direction);
  currentPage = 1;
  records = [];
  updateMonthDisplay();
  loadList();
}
function monthParams(){
  return { mes: String(currentMonth.getMonth()), ano: String(currentMonth.getFullYear()) };
}

function buildListParams(){
  const params = new URLSearchParams();
  const { mes, ano } = monthParams();
  params.set('mes', mes);
  params.set('ano', ano);
  const s = $('searchInput').value.trim(); if(s) params.set('search', s);
  const v = $('vendedorFilter').value.trim(); if(v) params.set('vendedor', v);
  const st = $('statusFilter').value.trim(); if(st) params.set('status', st);
  return params;
}

async function loadOpcoes(){
  try{
    const o = await api('/api/licitacoes/opcoes');
    users = o.users || []; banks = o.banks || [];
    const sel = $('vendedor');
    sel.innerHTML = '<option value="">Selecione o vendedor</option>' +
      users.map(u=>`<option value="${esc(u.id)}">${esc(u.firstName || u.name)}</option>`).join('');

    const fv = $('vendedorFilter');
    const uniq = [...new Set(users.map(u=>up(u.firstName || u.name)))].sort();
    fv.innerHTML = '<option value="">Todos os Vendedores</option>' +
      uniq.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
  }catch(e){ toastError(e.message); }
}

async function loadList(){
  try{
    currentPage = 1;
    const params = buildListParams();
    params.set('page', '1');
    const res = await api('/api/licitacoes?'+params.toString());
    records = res.data || [];
    hasMorePages = (res.page || 1) < (res.pages || 1);
    renderList();
  }catch(e){
    $('list').innerHTML = `<div class="empty-mini">${esc(e.message)}</div>`;
    $('emptyState').hidden = true;
  }
}

async function loadMore(){
  if(!hasMorePages) return;
  currentPage++;
  const params = buildListParams();
  params.set('page', String(currentPage));
  try{
    const res = await api('/api/licitacoes?'+params.toString());
    records = records.concat(res.data || []);
    hasMorePages = currentPage < (res.pages || 1);
    renderList();
  }catch(e){ toastError(e.message); }
}

async function syncNow(){
  const btn=$('syncBtn');
  if(btn){ btn.classList.add('spinning'); btn.disabled=true; }
  try{
    await loadList();
    toastSuccess('Dados sincronizados');
  }catch(e){ toastError('Erro de sincronização'); }
  finally{ if(btn){ setTimeout(()=>{ btn.classList.remove('spinning'); btn.disabled=false; }, 600); } }
}

function renderList(){
  const wrap = $('list');
  const empty = $('emptyState');
  if(!records.length){
    wrap.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  wrap.innerHTML = records.map(r=>{
    const st = effectiveStatus(r);
    const cls = st==='ganho' ? 'row-ganho' : (st==='cancelado' ? 'row-cancelado' : '');
    const badge = `<span class="badge-status ${st}">${STATUS_LABEL[st]||up(st)}</span>`;
    return `
      <div class="lic-card ${cls}" data-id="${r.id}">
        <div class="card-top">
          <div class="card-top-left">
            <div class="checkbox-wrapper">
              <input type="checkbox" class="styled-checkbox ganho-chk" id="lic-chk-${r.id}" ${r.ganho?'checked':''} data-id="${r.id}">
              <label for="lic-chk-${r.id}" class="checkbox-label-styled" title="Marcar como ganho"></label>
            </div>
            <span class="card-pregao">${esc(up(r.numero_pregao))}</span>
          </div>
          ${badge}
        </div>
        <div class="card-grid">
          <div class="card-cell"><span class="cell-label">Vendedor</span><span class="cell-value">${esc(up(r.vendedor)||'—')}</span></div>
          <div class="card-cell"><span class="cell-label">UASG</span><span class="cell-value">${esc(up(r.uasg)||'—')}</span></div>
          <div class="card-cell" style="grid-column: 1 / -1;"><span class="cell-label">Órgão</span><span class="cell-value">${esc(up(r.nome_orgao)||'—')}</span></div>
          <div class="card-cell"><span class="cell-label">Data</span><span class="cell-value">${esc(fmtDate(r.data_pregao))}</span></div>
          <div class="card-cell"><span class="cell-label">Hora</span><span class="cell-value">${esc(r.horario_pregao||'—')}</span></div>
        </div>
        <div class="card-actions">
          <button type="button" class="action-btn edit" data-edit="${r.id}">Editar</button>
          <button type="button" class="action-btn itens" data-itens="${r.id}">Itens</button>
          <button type="button" class="action-btn delete" data-del="${r.id}">Excluir</button>
        </div>
      </div>`;
  }).join('');

  if(hasMorePages){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'load-more-btn';
    btn.textContent = 'Carregar mais';
    btn.addEventListener('click', loadMore);
    wrap.appendChild(btn);
  }

  wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); editRecord(b.dataset.edit); }));
  wrap.querySelectorAll('[data-itens]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); showItems(b.dataset.itens); }));
  wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); confirmDeleteFlow(b.dataset.del); }));
  wrap.querySelectorAll('.ganho-chk').forEach(chk => {
    chk.addEventListener('change', async e => {
      e.stopPropagation();
      await toggleGanho(chk.dataset.id, chk.checked, chk);
    });
    chk.addEventListener('click', e => e.stopPropagation());
  });
  wrap.querySelectorAll('.lic-card').forEach(card => {
    card.addEventListener('click', e => {
      if(e.target.closest('button') || e.target.closest('.checkbox-wrapper')) return;
      viewRecord(card.dataset.id);
    });
  });
}

async function toggleGanho(id, ganho, chkEl){
  const r = records.find(x=>x.id===id);
  const numP = up(r?.numero_pregao || '');
  try{
    await api(`/api/licitacoes/${id}/ganho`, { method:'PATCH', body: JSON.stringify({ ganho }) });
    if (r) r.ganho = ganho;
    const card = chkEl ? chkEl.closest('.lic-card') : null;
    if (card){
      card.classList.toggle('row-ganho', ganho);
      const st = effectiveStatus(r);
      const badge = card.querySelector('.badge-status');
      if(badge){
        badge.className = `badge-status ${st}`;
        badge.textContent = STATUS_LABEL[st]||up(st);
      }
    }
    if (ganho) toastSuccess(`O ${numP} foi marcado como ganho`);
    else toastSuccess(`Pregão ${numP} atualizado`);
  }catch(err){
    if (chkEl) chkEl.checked = !ganho;
    toastError(err.message);
  }
}

async function openDisputaModal(){
  $('disputaBody').innerHTML = '<div class="empty-mini">Carregando…</div>';
  open('disputaModal');
  try{
    const list = await api('/api/licitacoes/disputa-hoje');
    if(!list.length){
      $('disputaBody').innerHTML = '<div class="empty-mini">Nenhum pregão programado para hoje.</div>';
      return;
    }
    $('disputaBody').innerHTML = list.map(r=>`
      <div class="disputa-row">
        <div class="d-top">
          <span class="d-pregao">${esc(up(r.numero_pregao))}</span>
          <span class="d-hora">${esc(r.horario_pregao||'—')}</span>
        </div>
        <div class="d-meta">${esc(up(r.vendedor)||'—')} · ${esc(fmtDate(r.data_pregao))}</div>
        <div class="d-meta">${esc(up(r.nome_orgao))}</div>
      </div>`).join('');
  }catch(e){
    $('disputaBody').innerHTML = `<div class="empty-mini">${esc(e.message)}</div>`;
  }
}

function newRecord(){
  current = null;
  setFormTab('info');
  $('recordForm').reset();
  $('recordId').value='';
  $('formTitle').textContent = 'Nova Licitação';
  $('btnSubmitForm').textContent = 'Salvar';
  $('validadeProposta').value = '60 DIAS CORRIDOS';
  $('prazoEntrega').value = '30 DIAS CORRIDOS';
  $('prazoPagamento').value = '30 DIAS CORRIDOS';
  $('modalidade').value = 'ABERTO';
  $('bancoPagamento').value = 'BANCO DO BRASIL';
  $('statusManual').value = '';
  $('dataRegistro').value = todayStr();
  $('requirements').querySelectorAll('.requirement').forEach(b=>b.classList.remove('selected'));
  open('formModal');
}

function editRecord(id){
  const r = records.find(x=>x.id===id);
  if(!r) return;
  current = r;
  $('recordId').value = r.id;
  $('formTitle').textContent = 'Editar Licitação';
  $('btnSubmitForm').textContent = 'Atualizar';
  $('vendedor').value = r.vendedor_id || '';
  $('dataRegistro').value = r.data_registro || '';
  $('dataPregao').value = r.data_pregao || '';
  $('horarioPregao').value = r.horario_pregao || '';
  $('modalidade').value = r.modalidade || 'ABERTO';
  $('numeroPregao').value = r.numero_pregao || '';
  $('nomeOrgao').value = r.nome_orgao || '';
  $('uasg').value = r.uasg || '';
  $('cidade').value = r.cidade || '';
  $('uf').value = r.uf || '';
  $('telefone').value = r.telefone || '';
  $('email').value = r.email || '';
  $('bancoPagamento').value = r.banco_pagamento || 'BANCO DO BRASIL';
  $('validadeProposta').value = r.validade_proposta || '60 DIAS CORRIDOS';
  $('prazoEntrega').value = r.prazo_entrega || '30 DIAS CORRIDOS';
  $('prazoPagamento').value = r.prazo_pagamento || '30 DIAS CORRIDOS';
  const stManual = String(r.status || '').toLowerCase();
  $('statusManual').value = ['suspenso','encerrado','cancelado'].includes(stManual) ? stManual : '';
  $('requirements').querySelectorAll('.requirement').forEach(b=>b.classList.toggle('selected', !!(r.requisitos||{})[b.dataset.req]));
  setFormTab('info');
  open('formModal');
}

$('recordForm').addEventListener('submit', async e => {
  e.preventDefault();
  const user = users.find(u=>u.id === $('vendedor').value);
  const requisitos = {};
  $('requirements').querySelectorAll('[data-req]').forEach(b=>requisitos[b.dataset.req]=b.classList.contains('selected'));
  const body = {
    vendedorId: user?.id || null,
    vendedor: user?.name || '',
    dataRegistro: $('dataRegistro').value || todayStr(),
    dataPregao: $('dataPregao').value || '',
    horarioPregao: $('horarioPregao').value || '',
    modalidade: $('modalidade').value,
    numeroPregao: $('numeroPregao').value.trim(),
    nomeOrgao: $('nomeOrgao').value.trim(),
    uasg: $('uasg').value.trim(),
    cidade: $('cidade').value.trim(),
    uf: $('uf').value,
    telefone: $('telefone').value.trim(),
    email: $('email').value.trim(),
    bancoPagamento: $('bancoPagamento').value,
    status: $('statusManual').value || '',
    requisitos,
    validadeProposta: $('validadeProposta').value,
    prazoEntrega: $('prazoEntrega').value,
    prazoPagamento: $('prazoPagamento').value,
    items: current?.items || [],
    grupos: current?.grupos || []
  };
  try{
    const id = $('recordId').value;
    const saved = await api(id ? `/api/licitacoes/${id}` : '/api/licitacoes',
      { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    close('formModal');
    const numP = up(saved?.numero_pregao || body.numeroPregao);
    if(id){
      toastSuccess(`Pregão ${numP} atualizado`);
    } else {
      toastSuccess('Licitação salva com sucesso.');
    }
    await loadList();
  }catch(err){ toastError(err.message); }
});

function confirmDeleteFlow(id){
  const r = records.find(x=>x.id===id);
  if(!r) return;
  delId = id;
  delTableIdx = null;
  $('deleteMsg').textContent = `Deseja excluir o pregão ${up(r.numero_pregao)}?`;
  open('deleteModal');
}
function confirmDeleteTable(tIdx){
  const t = tables[tIdx];
  if(!t) return;
  delId = null;
  delTableIdx = tIdx;
  const qtd = t.items.length;
  const nome = t.titulo ? `o grupo "${up(t.titulo)}"` : 'a tabela de itens';
  const extra = qtd ? ` (${qtd} ${qtd === 1 ? 'item' : 'itens'})` : '';
  $('deleteMsg').textContent = `Deseja excluir ${nome}${extra}?`;
  open('deleteModal');
}
$('confirmDelete').addEventListener('click', async ()=>{
  if(delTableIdx !== null){
    const tI = delTableIdx;
    delTableIdx = null;
    close('deleteModal');
    if(tables[tI]){
      tables.splice(tI, 1);
      renderAllTables();
      scheduleSave();
    }
    return;
  }
  if(!delId) return;
  const r = records.find(x=>x.id===delId);
  const numP = up(r?.numero_pregao || '');
  try{
    await api(`/api/licitacoes/${delId}`, { method:'DELETE' });
    close('deleteModal');
    delId = null;
    toastSuccess(`Pregão ${numP} foi excluído`);
    await loadList();
  }catch(e){ toastError(e.message); }
});

function viewRecord(id){
  const r = records.find(x=>x.id===id);
  if(!r) return;
  $('viewNumero').textContent = up(r.numero_pregao);
  const st = effectiveStatus(r);
  const reqsArr = Object.entries(r.requisitos||{}).filter(([k,v])=>v).map(([k])=>k);
  $('vinfo').innerHTML = `
    <div>
      <p><b>Vendedor:</b> ${esc(up(r.vendedor)||'—')}</p>
      <p><b>Data de Registro:</b> ${esc(fmtDate(r.data_registro))}</p>
      <p><b>Data do Pregão:</b> ${esc(fmtDate(r.data_pregao))}</p>
      <p><b>Horário:</b> ${esc(r.horario_pregao||'—')}</p>
      <p><b>Modalidade:</b> ${esc(up(r.modalidade)||'—')}</p>
      <p><b>Número do Pregão:</b> ${esc(up(r.numero_pregao))}</p>
      <p><b>Status:</b> <span class="badge-status ${st}">${STATUS_LABEL[st]||up(st)}</span></p>
    </div>`;
  $('vorgao').innerHTML = `
    <div>
      <p><b>Órgão:</b> ${esc(up(r.nome_orgao))}</p>
      <p><b>UASG:</b> ${esc(up(r.uasg)||'—')}</p>
      <p><b>Cidade:</b> ${esc(up(r.cidade)||'—')}</p>
      <p><b>UF:</b> ${esc(up(r.uf)||'—')}</p>
      <p><b>Telefone:</b> ${esc(r.telefone||'—')}</p>
      <p><b>Email:</b> ${esc(r.email||'—')}</p>
    </div>`;
  $('vreq').innerHTML = `
    <div>
      <p><b>Requisitos:</b> ${reqsArr.length? reqsArr.map(esc).join(', ') : '—'}</p>
      <p><b>Banco para pagamento:</b> ${esc(up(r.banco_pagamento)||'—')}</p>
    </div>`;
  $('vprazos').innerHTML = `
    <div>
      <p><b>Validade da proposta:</b> ${esc(up(r.validade_proposta)||'—')}</p>
      <p><b>Prazo de entrega:</b> ${esc(up(r.prazo_entrega)||'—')}</p>
      <p><b>Prazo de pagamento:</b> ${esc(up(r.prazo_pagamento)||'—')}</p>
    </div>`;
  setViewTab('vinfo');
  open('viewModal');
}

/* ─── ITENS ─────────────────────────────────────────── */
function normalizeTables(r){
  const rawItems = Array.isArray(r.items) ? r.items : [];
  const gruposList = Array.isArray(r.grupos) ? r.grupos.slice() : [];
  const main = [];
  const byGroup = {};

  rawItems.forEach((x,i)=>{
    const g = String(x.grupo || '').trim();
    const it = {
      item: x.item ?? (i+1),
      descricao: x.descricao || '',
      qtd: x.qtd ?? 1,
      und: x.und || 'UN',
      marca: x.marca || '',
      modelo: x.modelo || '',
      estimadoUnt: x.estimadoUnt ?? '',
      custoUnt: x.custoUnt ?? '',
      porcentagem: x.porcentagem ?? 149,
      selecionado: x.selecionado !== false,
      cor: x.cor || ''
    };
    if(!g) main.push(it);
    else {
      if(!gruposList.includes(g)) gruposList.push(g);
      if(!byGroup[g]) byGroup[g] = [];
      byGroup[g].push(it);
    }
  });

  const out = [];
  if(main.length) out.push({ titulo:'', items: main });
  gruposList.forEach(titulo=>{
    out.push({ titulo, items: byGroup[titulo] || [] });
  });
  return out;
}

function flatItems(){
  const all = [];
  tables.forEach(t=>{
    t.items.forEach(it=>{
      all.push({ ...it, grupo: t.titulo });
    });
  });
  return all;
}

function groupTitles(){
  return tables.filter(t=>t.titulo).map(t=>t.titulo);
}

function showItems(id){
  const r = records.find(x=>x.id===id);
  if(!r) return;
  current = JSON.parse(JSON.stringify(r));
  tables = normalizeTables(current);
  tables.forEach(t=>t.items.sort((a,b)=>num(a.item)-num(b.item)));
  $('itemsTitle').textContent = `Pregão ${up(current.numero_pregao)}`;
  $('itemsSubtitle').textContent = up(current.nome_orgao || '');
  document.body.classList.add('items-view');
  $('list').style.display = 'none';
  document.querySelector('.search-bar').style.display = 'none';
  document.querySelector('.filters').style.display = 'none';
  document.querySelector('.month-nav').style.display = 'none';
  $('mainFab').hidden = true;
  $('itemsFab').hidden = false;
  $('itemsPage').hidden = false;
  renderAllTables();
  lastSnapshot = snapshotAll();
  preloadAssets();
}

function nextGroupNumber(){
  let max = 0;
  tables.forEach(t=>{
    if(!t.titulo) return;
    const m = t.titulo.match(/grupo\s*(\d+)/i);
    if(m) max = Math.max(max, parseInt(m[1]));
  });
  return max + 1;
}

const INSERT_BAR = at => `
    <div class="items-toolbar-center">
      <button type="button" class="btn-toggle-table" data-insert-at="${at}" data-type="main">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Tabela
      </button>
      <button type="button" class="btn-toggle-table" data-insert-at="${at}" data-type="grupo">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        Grupo
      </button>
    </div>`;

function renderAllTables(){
  const container = $('tablesContainer');
  if(tables.length === 0){
    container.innerHTML = INSERT_BAR(0);
    bindInsertButtons();
    updateMarcaFilter();
    applyFilters();
    return;
  }
  let html = INSERT_BAR(0);
  tables.forEach((t, tIdx)=>{
    html += renderSingleTable(t, tIdx);
    html += INSERT_BAR(tIdx+1);
  });
  container.innerHTML = html;
  bindTableEvents();
  bindInsertButtons();
  autoResizeAll();
  applyFilters();
  updateMarcaFilter();
}

function renderSingleTable(t, tIdx){
  const isMain = !t.titulo;
  const cardsHTML = t.items.map((it, i)=>itemCardHTML(it, tIdx, i)).join('');
  const totais = computeTotals(t.items);
  const titleHTML = isMain
    ? ''
    : `<input class="grupo-titulo-input" data-gidx="${tIdx}" value="${esc(t.titulo)}" placeholder="Nome do Grupo">`;

  return `
    <div class="grupo-tabela" data-gidx="${tIdx}">
      <div class="grupo-header">
        <span style="flex:1;min-width:0;">${titleHTML}</span>
        <div class="grupo-actions">
          <button type="button" class="grupo-icon-btn add-item" data-gidx="${tIdx}" title="Adicionar Item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button type="button" class="grupo-icon-btn add-range" data-gidx="${tIdx}" title="Adicionar Intervalo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>
          <button type="button" class="grupo-icon-btn cotacao-group" data-gidx="${tIdx}" title="Cotação de Preço">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
          </button>
          <button type="button" class="grupo-icon-btn del-table" data-gidx="${tIdx}" title="Excluir grupo/tabela">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      <div class="items-cards">
        ${cardsHTML || '<div class="empty-mini">Nenhum item</div>'}
      </div>
      <div class="totals-bar">
        <div class="totals-item"><span>ESTIMADO</span><strong>${money(totais.estimado)}</strong></div>
        <div class="totals-item"><span>CUSTO</span><strong>${money(totais.custo)}</strong></div>
        <div class="totals-item"><span>VENDA</span><strong>${money(totais.venda)}</strong></div>
      </div>
    </div>`;
}

function itemCardHTML(it, tIdx, idx){
  const sel = it.selecionado !== false;
  const cls = ['item-card'];
  if(sel) cls.push('row-ganho-item');
  else if(it.cor && COLORS[it.cor]) cls.push('row-color-'+it.cor);
  const custoTotal = num(it.custoUnt) * num(it.qtd);
  const estimTotal = num(it.estimadoUnt) * num(it.qtd);
  const vendaUnt = num(it.custoUnt) * (num(it.porcentagem ?? 149)/100);
  const vendaTotal = vendaUnt * num(it.qtd);
  const warn = vendaUnt > num(it.estimadoUnt) && num(it.estimadoUnt) > 0;
  if(warn) cls.push('row-warn');

  return `<div class="${cls.join(' ')}" data-tidx="${tIdx}" data-idx="${idx}" data-cor="${esc(it.cor||'')}">
    <div class="item-card-top">
      <div class="checkbox-wrapper">
        <input type="checkbox" class="styled-checkbox item-chk" id="it-chk-${tIdx}-${idx}" ${sel?'checked':''}>
        <label for="it-chk-${tIdx}-${idx}" class="checkbox-label-styled" title="Marcar como ganho"></label>
      </div>
      <div class="item-card-number">
        <span class="item-card-number-label">ITEM</span>
        <input class="itemno" data-k="item" inputmode="numeric" value="${esc(it.item??'')}">
      </div>
      <div class="item-card-actions">
        <button type="button" class="row-btn brush

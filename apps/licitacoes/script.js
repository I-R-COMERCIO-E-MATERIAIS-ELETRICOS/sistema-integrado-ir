(() => {
"use strict";

const SESSION_KEY = 'irUserSession';
const MODULE_SESSION_KEY = 'licitacoesSession';
const DEVELOPMENT_MODE = false;
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
let currentUserName = null;
let records=[], users=[], banks=[];
let stats={total:0,disputa:0,ganhos:0,realizados:0,pulse:false};
let current=null;
let tables = [];
let activeTab=0;
let page=1, pages=1, searchTimer, saveTimer, quoteMode=null;
let lastSnapshot = '';
let delId = null;
let delTableIdx = null;
let colorPop = null;
let booted = false;
let pdfBusy = false;
let selectedDoc = null;
let quoteTIdx = null;
let assetsPromise = null;
let lastWarnSig = '';
let currentMonth = new Date();

const $ = id => document.getElementById(id);

const money = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
const num = v => {
  if(typeof v==='number') return v;
  const s=String(v??'').trim().replace(/\./g,'').replace(',','.').replace(/[^\d.-]/g,'');
  return Number(s)||0;
};
const fmtNum = (v, dec=2) => {
  const n = num(v);
  return n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};
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
  try {
    if (window.IR && typeof IR.denied === 'function') {
      IR.denied(msg);
      return;
    }
  } catch (e) { }
  let inIframe = false;
  try { inIframe = window.self !== window.top; } catch (e) { inIframe = true; }
  if (inIframe) {
    try { window.top.postMessage({ type: 'IR_LOGOUT', message: msg, source: 'licitacoes' }, '*'); } catch (e) { }
    try { window.top.location.href = PORTAL_URL + '/?logout=1&reason=session'; return; } catch (e) { }
    return;
  }
  window.location.href = PORTAL_URL + '/?logout=1&reason=session';
}

async function fetchSessionUser() {
  if (!sessionToken) return;
  try {
    const r = await fetch(`${PORTAL_URL}/api/portal/verify-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken })
    });
    if (!r.ok) return;
    const d = await r.json();
    if (d.valid && d.session && d.session.name) currentUserName = d.session.name;
  } catch (e) {}
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
      if (raw) {
        const parsed = JSON.parse(raw);
        sessionToken = parsed.token || parsed.sessionToken || null;
      }
    } catch (e) {}
  }
  if (!sessionToken) {
    triggerGlobalLogout('Sessão expirada');
    return;
  }
  if (window.IR && typeof IR.setToken === 'function') {
    try { IR.setToken(sessionToken); } catch (e) {}
  }
  fetchSessionUser();
  startApp();
}

const api = async (url, opts = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(opts.headers || {})
  };
  if (!DEVELOPMENT_MODE && sessionToken) headers['X-Session-Token'] = sessionToken;
  const r = await fetch(url, { ...opts, headers, credentials: 'same-origin' });
  if (!DEVELOPMENT_MODE && (r.status === 401 || r.status === 403)) {
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

function toastSuccess(msg){
  const t = $('toast');
  t.className = 'toast success';
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 3000);
}
function toastError(msg){
  const t = $('toast');
  t.className = 'toast error';
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 3000);
}
function toastWarn(msg){
  const t = $('toast');
  t.className = 'toast warn';
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 3200);
}

function open(id){ const el=$(id); if(el) el.classList.add('open'); }
function close(id){ const el=$(id); if(el) el.classList.remove('open'); }

document.querySelectorAll('[data-close]').forEach(b=>{
  b.addEventListener('click', ()=>close(b.dataset.close));
});
document.querySelectorAll('.modal-overlay').forEach(o=>{
  o.addEventListener('click', e=>{ if(e.target === o) close(o.id); });
});

$('uf').innerHTML += states.map(s=>`<option>${s}</option>`).join('');
$('requirements').innerHTML = reqs.map(r=>`<button type="button" class="requirement" data-req="${r}">${r}</button>`).join('');
$('requirements').querySelectorAll('[data-req]').forEach(b=>b.addEventListener('click',()=>b.classList.toggle('selected')));

const TAB_IDS = ['tab-info','tab-orgao','tab-req','tab-prazos'];
const TAB_KEYS = ['info','orgao','req','prazos'];
function setTab(n){
  activeTab = Math.max(0, Math.min(3, n));
  document.querySelectorAll('.tabs-nav .tab-btn[data-tab]').forEach((b,i)=>b.classList.toggle('active', i===activeTab));
  TAB_IDS.forEach((id,i)=>$(id).classList.toggle('active', i===activeTab));
  $('prevTab').style.display = activeTab===0 ? 'none' : '';
  $('nextTab').style.display = activeTab===3 ? 'none' : '';
}
document.querySelectorAll('.tabs-nav .tab-btn[data-tab]').forEach(b=>{
  b.addEventListener('click', ()=>{
    const idx = TAB_KEYS.indexOf(b.dataset.tab);
    if(idx>=0) setTab(idx);
  });
});
$('prevTab').addEventListener('click', ()=>setTab(activeTab-1));
$('nextTab').addEventListener('click', ()=>setTab(activeTab+1));

const VIEW_TABS = ['vinfo','vorgao','vreq','vprazos'];
function setViewTab(id){
  document.querySelectorAll('[data-vtab]').forEach(b=>b.classList.toggle('active', b.dataset.vtab===id));
  VIEW_TABS.forEach(i=>$(i).classList.toggle('active', i===id));
}
document.querySelectorAll('[data-vtab]').forEach(b=>b.addEventListener('click',()=>setViewTab(b.dataset.vtab)));

$('newBtn').addEventListener('click', () => newRecord());

$('search').addEventListener('input', ()=>{
  clearTimeout(searchTimer); searchTimer=setTimeout(()=>{ page=1; loadList(); },300);
});
$('filterVendedor').addEventListener('change', ()=>{ page=1; loadList(); });
$('filterStatus').addEventListener('change', ()=>{ page=1; loadList(); });
$('syncBtn').addEventListener('click', ()=>syncNow());

document.querySelectorAll('.stat-card[data-filter]').forEach(c=>{
  c.addEventListener('click', ()=>{
    const f = c.dataset.filter;
    if(f === 'disputa'){ openDisputaModal(); return; }
    document.querySelectorAll('.stat-card').forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
    $('filterStatus').value = (f==='all') ? '' : f;
    page=1; loadList();
  });
});

function updateMonthDisplay(){
  const el = $('currentMonth');
  if(el) el.textContent = `${MESES_CURTO[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
}
function changeMonth(direction){
  currentMonth.setMonth(currentMonth.getMonth() + direction);
  page = 1;
  records = [];
  updateMonthDisplay();
  loadList();
  loadStats();
}
$('monthPrev').addEventListener('click', ()=>changeMonth(-1));
$('monthNext').addEventListener('click', ()=>changeMonth(1));

function monthParams(){
  return { mes: String(currentMonth.getMonth()), ano: String(currentMonth.getFullYear()) };
}

async function loadStats(){
  try{
    const p = monthParams();
    const qs = new URLSearchParams(p).toString();
    stats = await api('/api/licitacoes/stats?' + qs);
    $('dashTotal').textContent = stats.total ?? 0;
    $('dashDisputa').textContent = stats.disputa ?? 0;
    $('dashGanhos').textContent = stats.ganhos ?? 0;
    $('dashRealizados').textContent = stats.realizados ?? 0;
    $('cardDisputa').classList.toggle('pulse', !!stats.pulse);
  }catch(e){}
}

async function loadOpcoes(){
  try{
    const o = await api('/api/licitacoes/opcoes');
    users = o.users || []; banks = o.banks || [];
    const sel = $('vendedor'); const old = sel.value;
    sel.innerHTML = '<option value="">Selecione o vendedor</option>' +
      users.map(u=>`<option value="${esc(u.id)}">${esc(u.firstName || u.name)}</option>`).join('');
    if(old) sel.value = old;

    const fv = $('filterVendedor'); const fvOld = fv.value;
    const uniq = [...new Set(users.map(u=>up(u.firstName || u.name)))].sort();
    fv.innerHTML = '<option value="">Todos os Vendedores</option>' +
      uniq.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if(fvOld) fv.value = fvOld;
  }catch(e){ toastError(e.message); }
}

async function loadList(){
  try{
    const params = new URLSearchParams();
    params.set('page', String(page));
    const { mes, ano } = monthParams();
    params.set('mes', mes);
    params.set('ano', ano);
    const s = $('search').value.trim(); if(s) params.set('search', s);
    const v = $('filterVendedor').value.trim(); if(v) params.set('vendedor', v);
    const st = $('filterStatus').value.trim(); if(st) params.set('status', st);
    const res = await api('/api/licitacoes?'+params.toString());
    records = res.data || [];
    pages = res.pages || 1;
    renderTable();
    renderPagination();
  }catch(e){
    $('records').innerHTML = `<tr><td colspan="9" class="empty">${esc(e.message)}</td></tr>`;
    toastError(e.message);
  }
}

async function syncNow(){
  const btn=$('syncBtn');
  if(btn){ btn.classList.add('spin'); setTimeout(()=>btn.classList.remove('spin'),1000); }
  try{
    await Promise.all([loadList(), loadStats()]);
    toastSuccess('Dados sincronizados');
  }catch(e){ toastError('Erro de sincronização'); }
}

function renderTable(){
  const tbody = $('records');
  if(!records.length){
    tbody.innerHTML = '<tr><td colspan="9" class="empty">Nenhuma licitação cadastrada neste mês.</td></tr>';
    return;
  }
  tbody.innerHTML = records.map(r=>{
    const st = effectiveStatus(r);
    const cls = st==='ganho' ? 'row-ganho' : (st==='cancelado' ? 'row-cancelado' : '');
    const badge = `<span class="badge-status ${st}">${STATUS_LABEL[st]||up(st)}</span>`;
    return `
      <tr data-id="${r.id}" class="${cls}">
        <td style="text-align:center;">
          <div class="checkbox-wrapper">
            <input type="checkbox" class="styled-checkbox ganho-chk" id="chk-${r.id}" ${r.ganho?'checked':''} data-id="${r.id}">
            <label for="chk-${r.id}" class="checkbox-label-styled" title="Marcar como ganho"></label>
          </div>
        </td>
        <td><strong>${esc(up(r.numero_pregao))}</strong></td>
        <td>${esc(up(r.uasg)||'—')}</td>
        <td>${esc(up(r.vendedor)||'—')}</td>
        <td>${esc(up(r.nome_orgao))}</td>
        <td>${esc(fmtDate(r.data_pregao))}</td>
        <td>${esc(r.horario_pregao||'—')}</td>
        <td style="text-align:center;">${badge}</td>
        <td class="actions-cell">
          <div class="actions">
            <button type="button" class="action-btn edit" data-edit="${r.id}">Editar</button>
            <button type="button" class="action-btn itens" data-itens="${r.id}">Itens</button>
            <button type="button" class="action-btn delete" data-del="${r.id}">Excluir</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('tr[data-id]').forEach(tr=>{
    tr.addEventListener('click', e=>{
      if(e.target.closest('button') || e.target.closest('.checkbox-wrapper')) return;
      viewRecord(tr.dataset.id);
    });
  });
  tbody.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', e=>{ e.stopPropagation(); editRecord(b.dataset.edit); }));
  tbody.querySelectorAll('[data-itens]').forEach(b=>b.addEventListener('click', e=>{ e.stopPropagation(); showItems(b.dataset.itens); }));
  tbody.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', e=>{ e.stopPropagation(); confirmDeleteFlow(b.dataset.del); }));
  tbody.querySelectorAll('.ganho-chk').forEach(chk=>{
    chk.addEventListener('change', async e=>{
      e.stopPropagation();
      await toggleGanho(chk.dataset.id, chk.checked, chk);
    });
    chk.addEventListener('click', e=>e.stopPropagation());
  });
}

async function toggleGanho(id, ganho, chkEl){
  const r = records.find(x=>x.id===id);
  const numP = up(r?.numero_pregao || '');
  try{
    await api(`/api/licitacoes/${id}/ganho`, { method:'PATCH', body: JSON.stringify({ ganho }) });
    if (r) r.ganho = ganho;
    const tr = chkEl ? chkEl.closest('tr') : null;
    if (tr){
      tr.classList.toggle('row-ganho', ganho);
      const st = effectiveStatus(r);
      const td = tr.querySelector('td:nth-child(8)');
      if(td) td.innerHTML = `<span class="badge-status ${st}">${STATUS_LABEL[st]||up(st)}</span>`;
    }
    if (ganho) toastSuccess(`O ${numP} foi marcado como ganho`);
    else toastSuccess(`Pregão ${numP} atualizado`);
    loadStats();
  }catch(err){
    if (chkEl) chkEl.checked = !ganho;
    toastError(err.message);
  }
}

function renderPagination(){
  const el = $('pagination');
  if(pages <= 1){ el.innerHTML=''; return; }
  const cur = page;
  const nums = [];
  const add = n => { if(n>=1 && n<=pages && !nums.includes(n)) nums.push(n); };
  add(1); add(cur-1); add(cur); add(cur+1); add(pages);
  nums.sort((a,b)=>a-b);
  const html = [];
  html.push(`<button class="page-btn" ${cur===1?'disabled':''} data-pg="${cur-1}">‹</button>`);
  let prev = 0;
  for(const n of nums){
    if(prev && n - prev > 1) html.push('<span class="page-ellipsis">…</span>');
    html.push(`<button class="page-btn ${n===cur?'active':''}" data-pg="${n}">${n}</button>`);
    prev = n;
  }
  html.push(`<button class="page-btn" ${cur===pages?'disabled':''} data-pg="${cur+1}">›</button>`);
  el.innerHTML = html.join('');
  el.querySelectorAll('[data-pg]').forEach(b=>b.addEventListener('click', ()=>{
    const p = parseInt(b.dataset.pg);
    if(!p || p<1 || p>pages || p===page) return;
    page = p; loadList();
  }));
}

async function openDisputaModal(){
  $('disputaBody').innerHTML = '<tr><td colspan="5" class="empty">Carregando…</td></tr>';
  open('disputaOverlay');
  try{
    const list = await api('/api/licitacoes/disputa-hoje');
    if(!list.length){
      $('disputaBody').innerHTML = '<tr><td colspan="5" class="empty">Nenhum pregão programado para hoje.</td></tr>';
      return;
    }
    $('disputaBody').innerHTML = list.map(r=>`
      <tr>
        <td>${esc(fmtDate(r.data_pregao))}</td>
        <td>${esc(r.horario_pregao||'—')}</td>
        <td><strong>${esc(up(r.numero_pregao))}</strong></td>
        <td>${esc(up(r.vendedor)||'—')}</td>
        <td>${esc(up(r.nome_orgao))}</td>
      </tr>`).join('');
  }catch(e){
    $('disputaBody').innerHTML = `<tr><td colspan="5" class="empty">${esc(e.message)}</td></tr>`;
  }
}

function newRecord(){
  current = null;
  activeTab = 0;
  setTab(0);
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
  open('formOverlay');
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
  setTab(0);
  open('formOverlay');
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
    close('formOverlay');
    const numP = up(saved?.numero_pregao || body.numeroPregao);
    if(id){
      toastSuccess(`Pregão ${numP} atualizado`);
    } else {
      toastSuccess('Licitação salva com sucesso.');
    }
    await Promise.all([loadList(), loadStats()]);
  }catch(err){ toastError(err.message); }
});

function confirmDeleteFlow(id){
  const r = records.find(x=>x.id===id);
  if(!r) return;
  delId = id;
  delTableIdx = null;
  $('deleteMsg').textContent = `Deseja excluir o pregão ${up(r.numero_pregao)}?`;
  open('deleteOverlay');
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
  open('deleteOverlay');
}
$('confirmDelete').addEventListener('click', async ()=>{
  if(delTableIdx !== null){
    const tI = delTableIdx;
    delTableIdx = null;
    close('deleteOverlay');
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
    close('deleteOverlay');
    delId = null;
    toastSuccess(`Pregão ${numP} foi excluído`);
    await Promise.all([loadList(), loadStats()]);
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
  open('viewOverlay');
}

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
  $('mainContainer').hidden = true;
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
        Tabela de Itens
      </button>
      <button type="button" class="btn-toggle-table" data-insert-at="${at}" data-type="grupo">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        Grupo/Lote
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
  const cardsHTML = t.items.map((it, i)=>itemRowHTML(it, tIdx, i)).join('');
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
          <button type="button" class="grupo-icon-btn del-table" data-gidx="${tIdx}" title="Excluir tabela inteira">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      <div class="card table-card items-card">
        <div class="items-wrap">
          <table class="items-table">
            <thead>
              <tr>
                <th class="col-check">✓</th>
                <th class="col-item">ITEM</th>
                <th class="col-desc">DESCRIÇÃO</th>
                <th class="col-qtd">QTD</th>
                <th class="col-und">UND</th>
                <th class="col-marca">MARCA</th>
                <th class="col-modelo">MODELO</th>
                <th class="col-num">ESTIM. UNT</th>
                <th class="col-num">ESTIM. TOTAL</th>
                <th class="col-num">CUSTO UNT</th>
                <th class="col-num">CUSTO TOTAL</th>
                <th class="col-pct">%</th>
                <th class="col-num">VENDA UNT</th>
                <th class="col-num">VENDA TOTAL</th>
                <th class="col-actions"></th>
              </tr>
            </thead>
            <tbody>${cardsHTML || '<tr><td colspan="15" class="empty">Nenhum item</td></tr>'}</tbody>
          </table>
        </div>
      </div>
      <div class="totals-bar">
        <div class="totals-item"><span>ESTIMADO</span><strong>${money(totais.estimado)}</strong></div>
        <div class="totals-item"><span>CUSTO</span><strong>${money(totais.custo)}</strong></div>
        <div class="totals-item"><span>VENDA</span><strong>${money(totais.venda)}</strong></div>
      </div>
    </div>`;
}

function itemRowHTML(it, tIdx, idx){
  const sel = it.selecionado !== false;
  const cls = [];
  if(sel) cls.push('row-ganho-item');
  else if(it.cor && COLORS[it.cor]) cls.push('row-color-'+it.cor);
  const custoTotal = num(it.custoUnt) * num(it.qtd);
  const estimTotal = num(it.estimadoUnt) * num(it.qtd);
  const vendaUnt = num(it.custoUnt) * (num(it.porcentagem ?? 149)/100);
  const vendaTotal = vendaUnt * num(it.qtd);
  const warn = vendaUnt > num(it.estimadoUnt) && num(it.estimadoUnt) > 0;
  if(warn) cls.push('row-warn');

  return `<tr data-tidx="${tIdx}" data-idx="${idx}" data-cor="${esc(it.cor||'')}" class="${cls.join(' ')}">
    <td style="text-align:center;">
      <div class="checkbox-wrapper">
        <input type="checkbox" class="styled-checkbox item-chk" id="it-chk-${tIdx}-${idx}" ${sel?'checked':''}>
        <label for="it-chk-${tIdx}-${idx}" class="checkbox-label-styled" title="Marcar como ganho"></label>
      </div>
    </td>
    <td><input class="itemno" data-k="item" value="${esc(it.item??'')}"></td>
    <td><textarea class="desc" data-k="descricao" rows="1" placeholder="Descrição">${esc(it.descricao??'')}</textarea></td>
    <td><input class="num" data-k="qtd" inputmode="decimal" value="${esc(fmtNum(it.qtd??1, 0))}"></td>
    <td><input class="unit" data-k="und" value="${esc(up(it.und??'UN'))}"></td>
    <td><input data-k="marca" value="${esc(up(it.marca??''))}"></td>
    <td><input data-k="modelo" value="${esc(up(it.modelo??''))}"></td>
    <td class="col-bg-amarelo"><input class="num" data-k="estimadoUnt" inputmode="decimal" value="${esc(it.estimadoUnt!==undefined && it.estimadoUnt!=='' ? fmtNum(it.estimadoUnt) : '')}"></td>
    <td class="col-bg-amarelo"><input class="num calculated" data-k="estimadoTotal" readonly value="${esc(fmtNum(estimTotal))}"></td>
    <td><input class="num" data-k="custoUnt" inputmode="decimal" value="${esc(it.custoUnt!==undefined && it.custoUnt!=='' ? fmtNum(it.custoUnt) : '')}"></td>
    <td><input class="num calculated" data-k="custoTotal" readonly value="${esc(fmtNum(custoTotal))}"></td>
    <td><input class="num" data-k="porcentagem" inputmode="decimal" value="${esc(fmtNum(it.porcentagem??149, 0))}"></td>
    <td class="col-bg-laranja"><input class="num calculated" data-k="vendaUnt" readonly value="${esc(fmtNum(vendaUnt))}"></td>
    <td><input class="num calculated" data-k="vendaTotal" readonly value="${esc(fmtNum(vendaTotal))}"></td>
    <td>
      <div class="row-actions">
        <button type="button" class="row-btn brush" title="Cor"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg></button>
        <button type="button" class="row-btn del" title="Excluir"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
    </td>
  </tr>`;
}

function computeTotals(list){
  let e=0,c=0,v=0;
  list.forEach(x=>{
    const qtd = num(x.qtd);
    const cu = num(x.custoUnt);
    const eu = num(x.estimadoUnt);
    const pct = num(x.porcentagem ?? 149);
    e += eu * qtd;
    c += cu * qtd;
    v += (cu * pct / 100) * qtd;
  });
  return { estimado:e, custo:c, venda:v };
}

function bindInsertButtons(){
  document.querySelectorAll('.btn-toggle-table').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const at = parseInt(btn.dataset.insertAt) || 0;
      const type = btn.dataset.type;
      insertNewTable(at, type);
    });
  });
}

function insertNewTable(at, type){
  const titulo = (type === 'grupo') ? ('Grupo ' + nextGroupNumber()) : '';
  tables.splice(at, 0, { titulo, items: [] });
  renderAllTables();
  const el = document.querySelector(`.grupo-tabela[data-gidx="${at}"]`);
  if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  scheduleSave();
}

function bindTableEvents(){
  document.querySelectorAll('.grupo-tabela').forEach(gt=>{
    gt.querySelectorAll('input[data-k], textarea[data-k]').forEach(i=>{
      i.addEventListener('input', ()=>{ if(i.tagName==='TEXTAREA') autoResize(i); recalcAll(); });
      i.addEventListener('change', recalcAll);
      i.addEventListener('blur', ()=>{
        const k = i.dataset.k;
        if(['qtd','estimadoUnt','custoUnt','porcentagem'].includes(k)){
          const dec = (k === 'qtd' || k === 'porcentagem') ? 0 : 2;
          i.value = fmtNum(num(i.value), dec);
        }
        recalcAll();
      });
      i.addEventListener('focus', ()=>{
        const k = i.dataset.k;
        if(['qtd','estimadoUnt','custoUnt','porcentagem'].includes(k)){
          i.value = String(num(i.value)).replace('.', ',');
        }
      });
      if(i.tagName === 'TEXTAREA'){
        i.addEventListener('paste', cleanPasteHandler);
        i.addEventListener('keydown', e=>{ if(e.key === 'Enter') e.stopPropagation(); });
      }
    });

    const titleInput = gt.querySelector('.grupo-titulo-input');
    if(titleInput){
      titleInput.addEventListener('input', ()=>{
        const tI = parseInt(titleInput.dataset.gidx);
        if(!tables[tI]) return;
        tables[tI].titulo = titleInput.value.trim();
        scheduleSave();
      });
    }

    gt.querySelectorAll('.grupo-icon-btn.del-table').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const tI = parseInt(btn.dataset.gidx);
        if(isNaN(tI)) return;
        confirmDeleteTable(tI);
      });
    });

    gt.querySelectorAll('.row-btn.del').forEach(b=>{
      b.addEventListener('click', ()=>{
        const tr = b.closest('tr');
        const tI = parseInt(tr.dataset.tidx);
        const iI = parseInt(tr.dataset.idx);
        if(isNaN(tI) || isNaN(iI)) return;
        const before = tables[tI].items.length;
        tables[tI].items.splice(iI, 1);
        const after = tables[tI].items.length;
        if(before > 0 && after === 0){
          tables.splice(tI, 1);
        }
        renderAllTables();
        scheduleSave();
      });
    });

    gt.querySelectorAll('.row-btn.brush').forEach(b=>{
      b.addEventListener('click', (e)=>{ e.stopPropagation(); openColorPop(b); });
    });

    gt.querySelectorAll('.item-chk').forEach(chk=>{
      chk.addEventListener('change', ()=>{
        const tr = chk.closest('tr');
        const tI = parseInt(tr.dataset.tidx);
        const iI = parseInt(tr.dataset.idx);
        const ganho = chk.checked;
        if(!isNaN(tI) && !isNaN(iI) && tables[tI] && tables[tI].items[iI]){
          tables[tI].items[iI].selecionado = ganho;
        }
        tr.classList.toggle('row-ganho-item', ganho);
        if(ganho){
          [...tr.classList].filter(c=>c.startsWith('row-color-')).forEach(c=>tr.classList.remove(c));
        } else {
          const cor = tr.dataset.cor || '';
          if(cor && COLORS[cor]) tr.classList.add('row-color-'+cor);
        }
        recalcAll();
      });
    });

    gt.querySelectorAll('.grupo-icon-btn.add-item').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const gI = parseInt(btn.dataset.gidx);
        addNewItem(gI);
      });
    });
    gt.querySelectorAll('.grupo-icon-btn.add-range').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const gI = parseInt(btn.dataset.gidx);
        openRangeModal(gI);
      });
    });
    gt.querySelectorAll('.grupo-icon-btn.cotacao-group').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const gI = parseInt(btn.dataset.gidx);
        openQuoteModal(gI);
      });
    });
  });
}

function autoResizeAll(){
  document.querySelectorAll('.items-table textarea').forEach(ta=>autoResize(ta));
}
function autoResize(el){
  if(!el) return;
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight) + 'px';
}

function cleanPasteHandler(e){
  const raw = (e.clipboardData || window.clipboardData).getData('text') || '';
  if(!raw) return;
  e.preventDefault();
  let clean = raw.replace(/\r/g,'').replace(/\t/g,' ').replace(/[ ]{2,}/g,' ').replace(/\n{2,}/g,'\n').trim();
  const t = e.target;
  const start = t.selectionStart, end = t.selectionEnd;
  t.value = t.value.slice(0,start) + clean + t.value.slice(end);
  t.selectionStart = t.selectionEnd = start + clean.length;
  autoResize(t);
  recalcAll();
}

function readTableState(){
  document.querySelectorAll('.grupo-tabela').forEach(gt=>{
    const tIdx = parseInt(gt.dataset.gidx);
    if(isNaN(tIdx) || !tables[tIdx]) return;
    const rows = [...gt.querySelectorAll('tbody tr[data-idx]')];
    const newItems = rows.map(tr=>{
      const o = {};
      tr.querySelectorAll('[data-k]').forEach(i=>o[i.dataset.k] = i.value);
      o.item = o.item ?? '';
      o.descricao = o.descricao ?? '';
      o.qtd = num(o.qtd);
      o.und = o.und ?? 'UN';
      o.marca = o.marca ?? '';
      o.modelo = o.modelo ?? '';
      o.estimadoUnt = num(o.estimadoUnt);
      o.custoUnt = num(o.custoUnt);
      o.porcentagem = num(o.porcentagem ?? 149);
      o.selecionado = tr.querySelector('.item-chk').checked;
      o.cor = tr.dataset.cor || '';
      return o;
    });
    tables[tIdx].items = newItems;
  });
}

function updateWarnings(list){
  const sig = JSON.stringify(list);
  if(sig === lastWarnSig) return;
  lastWarnSig = sig;
  const panel = $('warningPanel');
  if(!panel) return;
  panel.innerHTML = '';
  list.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'warn-msg';
    div.textContent = msg;
    panel.appendChild(div);
  });
}

function recalcAll(doSave = true){
  readTableState();
  const warnings = [];
  document.querySelectorAll('.grupo-tabela').forEach(gt=>{
    const tIdx = parseInt(gt.dataset.gidx);
    const t = tables[tIdx];
    if(!t) return;
    let e=0,c=0,v=0;
    gt.querySelectorAll('tbody tr[data-idx]').forEach(tr=>{
      const estU = num(tr.querySelector('[data-k="estimadoUnt"]').value);
      const qtd = num(tr.querySelector('[data-k="qtd"]').value);
      const cu = num(tr.querySelector('[data-k="custoUnt"]').value);
      const pct = num(tr.querySelector('[data-k="porcentagem"]').value);
      const estT = estU * qtd;
      const ct = cu * qtd;
      const vu = cu * pct / 100;
      const vt = vu * qtd;
      tr.querySelector('[data-k="estimadoTotal"]').value = fmtNum(estT);
      tr.querySelector('[data-k="custoTotal"]').value = fmtNum(ct);
      tr.querySelector('[data-k="vendaUnt"]').value = fmtNum(vu);
      tr.querySelector('[data-k="

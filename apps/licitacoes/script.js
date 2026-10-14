(() => {
const $ = id => document.getElementById(id);
const token = () => sessionStorage.getItem('irToken') || sessionStorage.getItem('sessionToken') || '';

const api = async (url, opts = {}) => {
  const r = await fetch(url, {
    ...opts,
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token()}`, ...(opts.headers || {}) }
  });
  if (!r.ok) { let e={}; try{e=await r.json();}catch{} throw new Error(e.error || `Erro ${r.status}`); }
  return r.status === 204 ? null : r.json();
};

const reqs = ['CERTIFICADO IBAMA','REGISTRO DE PREÇO','INSTALAÇÃO/INSPEÇÃO','VISITA TÉCNICA/ENSAIO','ENVIO DE AMOSTRA','ATESTADO DE CAPACIDADE','GARANTIA DE PROPOSTA','INFORMAÇÕES SOBRE ICMS'];
const states = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const COLORS = { amarelo:'#fef9c3', cinza:'#e5e7eb', vermelho:'#fecaca', azul:'#dbeafe' };

let records=[], users=[], banks=[], stats={total:0,disputa:0,ganhos:0,ocorridos:0,pulse:false};
let current=null, items=[], activeTab=0, viewTab=0;
let page=1, pages=1, searchTimer, saveTimer, quoteMode=null;

const money = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
const num = v => { if(typeof v==='number') return v;
  const s=String(v??'').trim().replace(/\./g,'').replace(',','.').replace(/[^\d.-]/g,'');
  return Number(s)||0; };
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const up = s => String(s??'').toUpperCase();
const fmtDate = v => { if(!v) return '—'; const [y,m,d]=v.split('-'); return (y&&m&&d)?`${d}/${m}/${y}`:'—'; };

function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),2800); }
function open(id){ $(id).classList.add('open'); }
function close(id){ $(id).classList.remove('open'); }

document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>close(b.dataset.close));
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{
  if(e.target===o) close(o.id);
}));

/* Init UI estática */
$('uf').innerHTML += states.map(s=>`<option>${s}</option>`).join('');
$('requirements').innerHTML = reqs.map(r=>`<button type="button" class="requirement" data-req="${r}">${r}</button>`).join('');
$('requirements').querySelectorAll('[data-req]').forEach(b=>b.onclick=()=>b.classList.toggle('selected'));

/* Tabs cadastro */
function setTab(n){
  activeTab = Math.max(0,Math.min(3,n));
  document.querySelectorAll('.tabs-nav .tab-btn').forEach((b,i)=>b.classList.toggle('active',i===activeTab));
  document.querySelectorAll('#recordForm > .tab-content, #recordForm .tab-content').forEach((p,i)=>{
    if(p.id.startsWith('tab-')) p.classList.toggle('active', p.id === ['tab-info','tab-orgao','tab-req','tab-detail'][activeTab]);
  });
  $('prevTab').style.display = activeTab===0?'none':'';
  $('nextTab').style.display = activeTab===3?'none':'';
}
document.querySelectorAll('.tabs-nav .tab-btn[data-tab]').forEach(b=>b.onclick=()=>{
  const idx = ['info','orgao','req','detail'].indexOf(b.dataset.tab); setTab(idx);
});
$('prevTab').onclick=()=>setTab(activeTab-1);
$('nextTab').onclick=()=>setTab(activeTab+1);

/* Tabs visualização */
function setViewTab(id){
  document.querySelectorAll('[data-vtab]').forEach(b=>b.classList.toggle('active',b.dataset.vtab===id));
  ['vinfo','vorgao','vreq','vdetail'].forEach(i=>$(i).classList.toggle('active', i===id));
}
document.querySelectorAll('[data-vtab]').forEach(b=>b.onclick=()=>setViewTab(b.dataset.vtab));

/* Filtros globais */
['search'].forEach(id=>{
  $(id).addEventListener('input',()=>{ clearTimeout(searchTimer); searchTimer=setTimeout(()=>{ page=1; loadList(); },300); });
});
$('filterVendedor').onchange=()=>{ page=1; loadList(); };
$('filterStatus').onchange=()=>{ page=1; loadList(); };
$('syncBtn').onclick = () => syncNow();
document.querySelectorAll('.stat-card[data-filter]').forEach(c=>{
  c.onclick=()=>{
    document.querySelectorAll('.stat-card').forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
    const f = c.dataset.filter;
    $('filterStatus').value = (f==='all') ? '' : f;
    page=1; loadList();
  };
});

/* ================= CARREGAMENTO ================= */
async function loadStats(){
  try{
    stats = await api('/api/licitacoes/stats');
    $('dashTotal').textContent = stats.total ?? 0;
    $('dashDisputa').textContent = stats.disputa ?? 0;
    $('dashGanhos').textContent = stats.ganhos ?? 0;
    $('dashOcorridos').textContent = stats.ocorridos ?? 0;
    $('cardDisputa').classList.toggle('pulse', !!stats.pulse);
  }catch(e){ /* silencioso */ }
}

async function loadOpcoes(){
  try{
    const o = await api('/api/licitacoes/opcoes');
    users = o.users || []; banks = o.banks || [];
    const sel = $('vendedor'); const old = sel.value;
    sel.innerHTML = '<option value="">Selecione o vendedor</option>' +
      users.map(u=>`<option value="${esc(u.id)}">${esc(u.name)}</option>`).join('');
    if(old) sel.value = old;

    const fv = $('filterVendedor'); const fvOld = fv.value;
    const uniq = [...new Set(users.map(u=>up(u.name)))].sort();
    fv.innerHTML = '<option value="">Todos os Vendedores</option>' +
      uniq.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if(fvOld) fv.value = fvOld;
  }catch(e){ toast(e.message); }
}

async function loadList(){
  try{
    const params = new URLSearchParams();
    params.set('page', String(page));
    const s = $('search').value.trim(); if(s) params.set('search', s);
    const v = $('filterVendedor').value.trim(); if(v) params.set('vendedor', v);
    const st = $('filterStatus').value.trim(); if(st) params.set('status', st);
    const res = await api('/api/licitacoes?'+params.toString());
    records = res.data || [];
    pages = res.pages || 1;
    renderTable();
    renderPagination();
  }catch(e){
    $('records').innerHTML = `<tr><td colspan="8" class="empty">${esc(e.message)}</td></tr>`;
    toast(e.message);
  }
}

async function syncNow(){
  const btn=$('syncBtn'); if(btn){ btn.classList.add('spin'); setTimeout(()=>btn.classList.remove('spin'),1000); }
  await Promise.all([loadList(), loadStats()]);
  toast('Dados sincronizados');
}

/* ================= TABELA ================= */
function renderTable(){
  const tbody = $('records');
  if(!records.length){ tbody.innerHTML = '<tr><td colspan="8" class="empty">Nenhuma licitação cadastrada.</td></tr>'; return; }
  tbody.innerHTML = records.map(r=>`
    <tr data-id="${r.id}" class="${r.ganho?'row-ganho':''}">
      <td style="text-align:center;">
        <div class="checkbox-wrapper">
          <input type="checkbox" class="styled-checkbox" id="chk-${r.id}" ${r.ganho?'checked':''}>
          <label for="chk-${r.id}" class="checkbox-label-styled" title="Marcar como ganho"></label>
        </div>
      </td>
      <td><strong>${esc(up(r.numero_pregao))}</strong></td>
      <td>${esc(up(r.uasg)||'—')}</td>
      <td>${esc(up(r.vendedor)||'—')}</td>
      <td>${esc(up(r.nome_orgao))}</td>
      <td>${esc(fmtDate(r.data_pregao))}</td>
      <td>${esc(r.horario_pregao||'—')}</td>
      <td class="actions-cell">
        <div class="actions">
          <button class="action-btn edit" data-edit="${r.id}">Editar</button>
          <button class="action-btn itens" data-itens="${r.id}">Itens</button>
          <button class="action-btn delete" data-del="${r.id}">Excluir</button>
        </div>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('tr[data-id]').forEach(tr=>{
    tr.addEventListener('click', e=>{
      if(e.target.closest('button') || e.target.closest('input') || e.target.closest('label')) return;
      viewRecord(tr.dataset.id);
    });
  });

  tbody.querySelectorAll('[data-edit]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); editRecord(b.dataset.edit); });
  tbody.querySelectorAll('[data-itens]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); showItems(b.dataset.itens); });
  tbody.querySelectorAll('[data-del]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); confirmDeleteFlow(b.dataset.del); });
  tbody.querySelectorAll('input.styled-checkbox').forEach(chk=>{
    chk.onchange = async e => {
      e.stopPropagation();
      const id = chk.id.replace('chk-','');
      try{
        await api(`/api/licitacoes/${id}/ganho`, { method:'PATCH', body: JSON.stringify({ ganho: chk.checked }) });
        const rec = records.find(r=>r.id===id); if(rec) rec.ganho = chk.checked;
        chk.closest('tr').classList.toggle('row-ganho', chk.checked);
        toast(chk.checked ? 'Marcado como ganho' : 'Desmarcado');
        loadStats();
      }catch(err){ chk.checked = !chk.checked; toast(err.message); }
    };
  });
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
  el.querySelectorAll('[data-pg]').forEach(b=>b.onclick=()=>{
    const p = parseInt(b.dataset.pg); if(!p || p<1 || p>pages || p===page) return;
    page = p; loadList();
  });
}

/* ================= CADASTRO ================= */
function newRecord(){
  current = null; activeTab = 0; setTab(0);
  $('recordForm').reset();
  $('recordId').value='';
  $('formTitle').textContent = 'Nova Licitação';
  $('validadeProposta').value = '60 DIAS CORRIDOS';
  $('prazoEntrega').value = '30 DIAS CORRIDOS';
  $('prazoPagamento').value = '30 DIAS CORRIDOS';
  $('modalidade').value = 'ABERTO';
  $('bancoPagamento').value = 'BANCO DO BRASIL';
  $('atualizadoPor').value = '';
  $('ultimaAtualizacao').value = '';
  $('requirements').querySelectorAll('.requirement').forEach(b=>b.classList.remove('selected'));
  open('formOverlay');
}

function editRecord(id){
  const r = records.find(x=>x.id===id); if(!r) return;
  current = r;
  $('recordId').value = r.id;
  $('formTitle').textContent = 'Editar Licitação';
  $('vendedor').value = r.vendedor_id || '';
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
  $('requirements').querySelectorAll('.requirement').forEach(b=>b.classList.toggle('selected', !!(r.requisitos||{})[b.dataset.req]));
  $('atualizadoPor').value = r.atualizado_por || '';
  $('ultimaAtualizacao').value = r.ultima_atualizacao ? new Date(r.ultima_atualizacao).toLocaleString('pt-BR') : '';
  setTab(0); open('formOverlay');
}

$('recordForm').onsubmit = async e => {
  e.preventDefault();
  const user = users.find(u=>u.id === $('vendedor').value);
  const requisitos = {};
  $('requirements').querySelectorAll('[data-req]').forEach(b=>requisitos[b.dataset.req]=b.classList.contains('selected'));
  const body = {
    vendedorId: user?.id || null,
    vendedor: user?.name || '',
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
    requisitos,
    validadeProposta: $('validadeProposta').value,
    prazoEntrega: $('prazoEntrega').value,
    prazoPagamento: $('prazoPagamento').value,
    items: current?.items || []
  };
  try{
    const id = $('recordId').value;
    await api(id ? `/api/licitacoes/${id}` : '/api/licitacoes',
      { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    close('formOverlay');
    toast('Licitação salva com sucesso.');
    await Promise.all([loadList(), loadStats()]);
  }catch(err){ toast(err.message); }
};

/* ================= EXCLUSÃO ================= */
let delId = null;
function confirmDeleteFlow(id){
  const r = records.find(x=>x.id===id); if(!r) return;
  delId = id;
  $('deleteMsg').textContent = `Deseja excluir o pregão ${up(r.numero_pregao)}?`;
  open('deleteOverlay');
}
$('confirmDelete').onclick = async () => {
  if(!delId) return;
  try{
    await api(`/api/licitacoes/${delId}`, { method:'DELETE' });
    close('deleteOverlay'); delId = null;
    toast('Licitação excluída.');
    await Promise.all([loadList(), loadStats()]);
  }catch(e){ toast(e.message); }
};

/* ================= VISUALIZAÇÃO ================= */
function viewRecord(id){
  const r = records.find(x=>x.id===id); if(!r) return;
  $('viewNumero').textContent = up(r.numero_pregao);
  const reqsArr = Object.entries(r.requisitos||{}).filter(([k,v])=>v).map(([k])=>k);
  $('vinfo').innerHTML = `
    <div class="info-grid">
      <p><b>Vendedor:</b> ${esc(up(r.vendedor)||'—')}</p>
      <p><b>Data do Pregão:</b> ${esc(fmtDate(r.data_pregao))}</p>
      <p><b>Horário:</b> ${esc(r.horario_pregao||'—')}</p>
      <p><b>Modalidade:</b> ${esc(up(r.modalidade)||'—')}</p>
      <p><b>Número do Pregão:</b> ${esc(up(r.numero_pregao))}</p>
    </div>`;
  $('vorgao').innerHTML = `
    <div class="info-grid">
      <p><b>Órgão:</b> ${esc(up(r.nome_orgao))}</p>
      <p><b>UASG:</b> ${esc(up(r.uasg)||'—')}</p>
      <p><b>Cidade:</b> ${esc(up(r.cidade)||'—')}</p>
      <p><b>UF:</b> ${esc(up(r.uf)||'—')}</p>
      <p><b>Telefone:</b> ${esc(r.telefone||'—')}</p>
      <p><b>Email:</b> ${esc(r.email||'—')}</p>
    </div>`;
  $('vreq').innerHTML = `
    <div class="info-grid">
      <p><b>Requisitos:</b> ${reqsArr.length? reqsArr.map(esc).join(', ') : '—'}</p>
      <p><b>Banco para pagamento:</b> ${esc(up(r.banco_pagamento)||'—')}</p>
      <p><b>Validade da proposta:</b> ${esc(up(r.validade_proposta)||'—')}</p>
      <p><b>Prazo de entrega:</b> ${esc(up(r.prazo_entrega)||'—')}</p>
      <p><b>Prazo de pagamento:</b> ${esc(up(r.prazo_pagamento)||'—')}</p>
    </div>`;
  $('vdetail').innerHTML = `
    <div class="info-grid">
      <p><b>Atualizado por:</b> ${esc(r.atualizado_por||'—')}</p>
      <p><b>Última atualização:</b> ${r.ultima_atualizacao ? new Date(r.ultima_atualizacao).toLocaleString('pt-BR') : '—'}</p>
      <p><b>Ganho:</b> ${r.ganho?'SIM':'NÃO'}</p>
    </div>`;
  setViewTab('vinfo');
  open('viewOverlay');
}

/* ================= ITENS ================= */
function showItems(id){
  const r = records.find(x=>x.id===id); if(!r) return;
  current = JSON.parse(JSON.stringify(r));
  items = (current.items||[]).map((x,i)=>({
    ...x,
    item: x.item ?? i+1,
    selecionado: x.selecionado !== false,
    porcentagem: x.porcentagem ?? 149,
    cor: x.cor || ''
  }));
  $('itemsTitle').textContent = `Pregão ${up(current.numero_pregao)}`;
  $('itemsSubtitle').textContent = up(current.nome_orgao || '');
  $('mainContainer').hidden = true;
  $('itemsPage').hidden = false;
  updateMarcaFilter();
  renderItems();
}

function itemRow(it){
  const cls = [];
  if(it.cor && COLORS[it.cor]) cls.push('row-color-'+it.cor);
  const custoTotal = num(it.custoUnt) * num(it.qtd);
  const estimTotal = num(it.estimadoUnt) * num(it.qtd);
  const vendaUnt = num(it.custoUnt) * (num(it.porcentagem ?? 149)/100);
  const vendaTotal = vendaUnt * num(it.qtd);
  const warn = vendaUnt > num(it.estimadoUnt) && num(it.estimadoUnt) > 0;
  if(warn) cls.push('row-warn');
  return `<tr data-row="1" class="${cls.join(' ')}">
    <td><input type="checkbox" data-k="selecionado" ${it.selecionado!==false?'checked':''} title="Item ganho"></td>
    <td><input class="itemno" data-k="item" value="${esc(it.item??'')}"></td>
    <td><textarea class="desc" data-k="descricao" rows="2" placeholder="Descrição do item">${esc(it.descricao??'')}</textarea></td>
    <td><input class="num" data-k="qtd" type="number" min="0" step="any" value="${esc(it.qtd??1)}"></td>
    <td><input class="unit" data-k="und" value="${esc(up(it.und??'UN'))}"></td>
    <td><input data-k="marca" value="${esc(up(it.marca??''))}"></td>
    <td><input data-k="modelo" value="${esc(up(it.modelo??''))}"></td>
    <td><input class="num" data-k="estimadoUnt" inputmode="decimal" value="${esc(it.estimadoUnt??'')}"></td>
    <td><input class="num calculated" data-k="estimadoTotal" readonly value="${estimTotal.toFixed(2)}"></td>
    <td><input class="num" data-k="custoUnt" inputmode="decimal" value="${esc(it.custoUnt??'')}"></td>
    <td><input class="num calculated" data-k="custoTotal" readonly value="${custoTotal.toFixed(2)}"></td>
    <td><input class="num" data-k="porcentagem" type="number" min="0" step="0.01" value="${esc(it.porcentagem??149)}"></td>
    <td><input class="num calculated" data-k="vendaUnt" readonly value="${vendaUnt.toFixed(2)}"></td>
    <td><input class="num calculated" data-k="vendaTotal" readonly value="${vendaTotal.toFixed(2)}"></td>
    <td>
      <div class="row-actions">
        <button type="button" class="row-btn brush" title="Cor do item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/>
            <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>
          </svg>
        </button>
        <button type="button" class="row-btn del" title="Remover item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </td>
  </tr>`;
}

function renderItems(){
  const wrap = $('itemsBody');
  wrap.innerHTML = items.map(itemRow).join('');
  bindItemEvents();
  recalc(false);
  applyFilters();
  updateWarnings();
  updateMarcaFilter();
}

function bindItemEvents(){
  const wrap = $('itemsBody');
  wrap.querySelectorAll('input, textarea').forEach(i=>{
    i.oninput = recalc;
    i.onchange = recalc;
    if(i.tagName === 'TEXTAREA'){
      i.addEventListener('paste', cleanPasteHandler);
      i.addEventListener('keydown', e=>{
        if(e.key === 'Enter'){ e.stopPropagation(); } // permite quebra de linha natural
      });
    }
  });
  wrap.querySelectorAll('.row-btn.del').forEach(b=>{
    b.onclick = () => { b.closest('tr').remove(); recalc(); };
  });
  wrap.querySelectorAll('.row-btn.brush').forEach(b=>{
    b.onclick = (e) => { e.stopPropagation(); openColorPop(b); };
  });
}

function cleanPasteHandler(e){
  const raw = (e.clipboardData || window.clipboardData).getData('text') || '';
  if(!raw) return;
  e.preventDefault();
  // Remove \r, tabs → espaço, colapsa espaços, preserva quebras simples já existentes no destino
  let clean = raw.replace(/\r/g,'')
                 .replace(/\t/g,' ')
                 .replace(/[ ]{2,}/g,' ')
                 .replace(/\n{3,}/g,'\n\n')
                 .trim();
  const t = e.target;
  const start = t.selectionStart, end = t.selectionEnd;
  const cur = t.value;
  const nv = cur.slice(0,start) + clean + cur.slice(end);
  t.value = nv;
  t.selectionStart = t.selectionEnd = start + clean.length;
  recalc();
}

function collectItems(){
  return [...$('itemsBody').rows].map(tr=>{
    const o = {};
    tr.querySelectorAll('[data-k]').forEach(i=>o[i.dataset.k] = i.value);
    o.selecionado = tr.querySelector('[data-k="selecionado"]').checked;
    o.qtd = num(o.qtd);
    o.porcentagem = num(o.porcentagem ?? 149);
    o.estimadoUnt = num(o.estimadoUnt);
    o.estimadoTotal = o.estimadoUnt * o.qtd;
    o.custoUnt = num(o.custoUnt);
    o.custoTotal = o.custoUnt * o.qtd;
    o.vendaUnt = o.custoUnt * (o.porcentagem/100);
    o.vendaTotal = o.vendaUnt * o.qtd;
    // cor salva no data-cor do <tr>
    o.cor = tr.dataset.cor || '';
    return o;
  });
}

let rendering = false;
function recalc(doSave = true){
  const data = collectItems();
  [...$('itemsBody').rows].forEach((tr,i)=>{
    const x = data[i];
    tr.querySelector('[data-k="estimadoTotal"]').value = x.estimadoTotal.toFixed(2);
    tr.querySelector('[data-k="custoTotal"]').value = x.custoTotal.toFixed(2);
    tr.querySelector('[data-k="vendaUnt"]').value = x.vendaUnt.toFixed(2);
    tr.querySelector('[data-k="vendaTotal"]').value = x.vendaTotal.toFixed(2);
    const warn = x.vendaUnt > x.estimadoUnt && x.estimadoUnt > 0;
    tr.classList.toggle('row-warn', warn);
    if(x.cor && COLORS[x.cor]){
      [...tr.classList].filter(c=>c.startsWith('row-color-')).forEach(c=>tr.classList.remove(c));
      tr.classList.add('row-color-'+x.cor);
    }
  });
  $('totalEstimado').textContent = money(data.reduce((a,x)=>a+x.estimadoTotal,0));
  $('totalCusto').textContent = money(data.reduce((a,x)=>a+x.custoTotal,0));
  $('totalVenda').textContent = money(data.reduce((a,x)=>a+x.vendaTotal,0));
  updateWarnings();
  if(doSave && !rendering) scheduleSave();
}

function updateWarnings(){
  const data = collectItems();
  const w = [];
  data.forEach(x=>{
    if(x.vendaUnt > x.estimadoUnt && x.estimadoUnt > 0){
      w.push(`O item ${x.item||'?'} possui valor unitário de venda superior ao estimado unitário.`);
    }
  });
  const el = $('itemsWarnings');
  el.innerHTML = w.length ? w.map(m=>`<div class="warn-item">${esc(m)}</div>`).join('') : '';
}

function scheduleSave(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistItems, 700);
}

async function persistItems(){
  if(!current) return;
  try{
    const data = collectItems();
    const body = {
      vendedorId: current.vendedor_id, vendedor: current.vendedor,
      numeroPregao: current.numero_pregao, uasg: current.uasg, nomeOrgao: current.nome_orgao,
      cidade: current.cidade, uf: current.uf, telefone: current.telefone, email: current.email,
      dataPregao: current.data_pregao, horarioPregao: current.horario_pregao,
      modalidade: current.modalidade,
      bancoPagamento: current.banco_pagamento, requisitos: current.requisitos || {},
      validadeProposta: current.validade_proposta,
      prazoEntrega: current.prazo_entrega, prazoPagamento: current.prazo_pagamento,
      items: data
    };
    await api(`/api/licitacoes/${current.id}`, { method:'PUT', body: JSON.stringify(body) });
    current.items = data;
    const idx = records.findIndex(r=>r.id===current.id);
    if(idx !== -1) records[idx] = { ...records[idx], items: data };
    toast('Dados Atualizados.');
  }catch(e){ toast('Falha ao salvar: '+e.message); }
}

/* Brush / color popup */
let colorPop = null;
function openColorPop(btn){
  closeColorPop();
  const rect = btn.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = 'color-pop';
  pop.style.position = 'fixed';
  pop.style.top = (rect.bottom+6)+'px';
  pop.style.left = (rect.left-60)+'px';
  ['amarelo','cinza','vermelho','azul'].forEach(c=>{
    const b = document.createElement('button');
    b.style.background = COLORS[c];
    b.title = c.charAt(0).toUpperCase()+c.slice(1);
    b.onclick = e => {
      e.stopPropagation();
      const tr = btn.closest('tr');
      [...tr.classList].filter(x=>x.startsWith('row-color-')).forEach(x=>tr.classList.remove(x));
      if(c !== 'none'){ tr.classList.add('row-color-'+c); tr.dataset.cor = c; }
      closeColorPop();
      scheduleSave();
    };
    pop.appendChild(b);
  });
  // opção "limpar"
  const clr = document.createElement('button');
  clr.style.background = '#fff';
  clr.style.color = '#6b7280';
  clr.style.fontSize = '10px';
  clr.style.width = 'auto';
  clr.style.minWidth = '24px';
  clr.style.padding = '0 6px';
  clr.style.borderRadius = '4px';
  clr.textContent = '×';
  clr.title = 'Limpar';
  clr.onclick = e => {
    e.stopPropagation();
    const tr = btn.closest('tr');
    [...tr.classList].filter(x=>x.startsWith('row-color-')).forEach(x=>tr.classList.remove(x));
    tr.dataset.cor = '';
    closeColorPop();
    scheduleSave();
  };
  pop.appendChild(clr);
  document.body.appendChild(pop);
  colorPop = pop;
  setTimeout(()=>document.addEventListener('click', onDocClickForPop), 0);
}
function closeColorPop(){
  if(colorPop){ colorPop.remove(); colorPop = null; document.removeEventListener('click', onDocClickForPop); }
}
function onDocClickForPop(e){
  if(colorPop && !colorPop.contains(e.target)) closeColorPop();
}

/* Botão voltar */
$('backItems').onclick = () => {
  $('itemsPage').hidden = true;
  $('mainContainer').hidden = false;
  Promise.all([loadList(), loadStats()]);
};

/* Adicionar item */
$('addItemBtn').onclick = () => {
  const next = Math.max(0, ...collectItems().map(x=>num(x.item)))+1;
  const it = { item: next, qtd:1, und:'UN', porcentagem:149, selecionado:true };
  $('itemsBody').insertAdjacentHTML('beforeend', itemRow(it));
  bindItemEvents();
  recalc();
};

/* Adicionar intervalo */
$('addRangeBtn').onclick = () => {
  const raw = prompt('Informe os itens ou intervalos. Exemplos: 1-5,12,100-180');
  if(!raw) return;
  const values = parseRange(raw);
  if(values === null) return;
  const existing = new Set(collectItems().map(x=>String(x.item)));
  values.forEach(n=>{
    if(!existing.has(String(n))){
      $('itemsBody').insertAdjacentHTML('beforeend', itemRow({ item:n, qtd:1, und:'UN', porcentagem:149, selecionado:true }));
    }
  });
  bindItemEvents();
  recalc();
};

function parseRange(raw){
  const values = new Set();
  for(const part of String(raw).split(',')){
    const p = part.trim();
    if(/^\d+\s*-\s*\d+$/.test(p)){
      const [a,b] = p.split('-').map(Number);
      if(Math.abs(b-a) > 1000){ toast('Intervalo muito grande (máx. 1001 itens).'); return null; }
      for(let n=Math.min(a,b); n<=Math.max(a,b); n++) values.add(n);
    } else if(/^\d+$/.test(p)) values.add(Number(p));
    else if(p){ toast(`Intervalo inválido: ${p}`); return null; }
  }
  return values;
}

/* Filtros da página de itens */
$('itemSearch').oninput = applyFilters;
$('filterMarca').onchange = applyFilters;
$('filterItens').onchange = applyFilters;
function applyFilters(){
  const q = $('itemSearch').value.toLowerCase().trim();
  const marca = $('filterMarca').value.trim();
  const itens = $('filterItens').value;
  [...$('itemsBody').rows].forEach(tr=>{
    const desc = (tr.querySelector('[data-k="descricao"]').value||'').toLowerCase();
    const itemN = (tr.querySelector('[data-k="item"]').value||'').toLowerCase();
    const marcaTr = (tr.querySelector('[data-k="marca"]').value||'').toUpperCase();
    const sel = tr.querySelector('[data-k="selecionado"]').checked;
    let show = true;
    if(q && !(desc.includes(q) || itemN.includes(q))) show = false;
    if(marca && marcaTr !== marca) show = false;
    if(itens === 'ganhos' && !sel) show = false;
    if(itens === 'nao-ganhos' && sel) show = false;
    tr.style.display = show ? '' : 'none';
  });
}

function updateMarcaFilter(){
  const marcas = new Set();
  [...$('itemsBody').rows].forEach(tr=>{
    const m = (tr.querySelector('[data-k="marca"]').value||'').trim().toUpperCase();
    if(m) marcas.add(m);
  });
  const sel = $('filterMarca'); const old = sel.value;
  sel.innerHTML = '<option value="">Todas as Marcas</option>' +
    [...marcas].sort().map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('');
  if(old && marcas.has(old)) sel.value = old;
}

$('syncItemsBtn').onclick = async () => {
  const b = $('syncItemsBtn'); b.classList.add('spin'); setTimeout(()=>b.classList.remove('spin'),1000);
  try{
    const fresh = await api(`/api/licitacoes/${current.id}`);
    current = fresh;
    items = (current.items||[]).map((x,i)=>({ ...x, item:x.item??i+1, selecionado:x.selecionado!==false, porcentagem:x.porcentagem??149, cor:x.cor||'' }));
    renderItems();
    toast('Dados sincronizados');
  }catch(e){ toast(e.message); }
};

/* ================= COTAÇÃO ================= */
$('cotacaoBtn').onclick = () => {
  quoteMode = null;
  document.querySelectorAll('.quote-option').forEach(b=>b.classList.remove('selected'));
  $('quoteRange').value = '';
  open('quoteOverlay');
};
document.querySelectorAll('.quote-option').forEach(b=>b.onclick=()=>{
  quoteMode = b.dataset.quote;
  document.querySelectorAll('.quote-option').forEach(x=>x.classList.toggle('selected', x===b));
});
$('confirmQuote').onclick = () => {
  if(!quoteMode){ toast('Selecione o modelo de cotação.'); return; }
  const values = parseRange($('quoteRange').value);
  if(values === null) return;
  if(!values.size){ toast('Informe o intervalo de itens.'); return; }
  // marcar em azul
  const data = collectItems();
  const selected = [];
  [...$('itemsBody').rows].forEach((tr,i)=>{
    const x = data[i];
    if(values.has(num(x.item))){
      [...tr.classList].filter(c=>c.startsWith('row-color-')).forEach(c=>tr.classList.remove(c));
      tr.classList.add('row-color-azul');
      tr.dataset.cor = 'azul';
      selected.push(x);
    }
  });
  // montar mensagem
  const greeting = (() => {
    const h = new Date().getHours();
    if(h < 12) return 'Bom dia';
    if(h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();
  const linhas = selected
    .sort((a,b)=>num(a.item)-num(b.item))
    .map(x => quoteMode === 'modelo'
      ? `${x.item} - ${up(x.modelo||'')} - ${x.qtd} - ${up(x.und||'')}`
      : `${x.item} - ${up(x.descricao||'')} - ${x.qtd} - ${up(x.und||'')}`)
    .join('\n');
  const msg = `${greeting}\n\nGostaria de solicitar um orçamento para os seguintes itens:\n\n${linhas}\n\nPoderia realizar este processo, por gentileza?`;
  navigator.clipboard.writeText(msg).then(()=>toast('Cotação copiada para a área de transferência.'))
    .catch(()=>toast('Não foi possível copiar.'));
  close('quoteOverlay');
  scheduleSave();
};

/* ================= PDF / DOCS ================= */
function fileBase(r){
  const numP = up(r.numero_pregao || '');
  const uasg = (r.uasg||'').trim();
  return uasg ? `PROPOSTA ${numP} (${up(uasg)})` : `PROPOSTA ${numP}`;
}

function cleanPdfText(s){ return String(s??'').replace(/\r/g,'').trim(); }

$('pdfBtn').onclick = async () => {
  if(!current) return;
  await loadBanksIfNeeded();
  if(!(window.jspdf && window.jspdf.jsPDF)){
    let tries=0; const iv=setInterval(()=>{
      tries++;
      if(window.jspdf && window.jspdf.jsPDF){ clearInterval(iv); gerarPdf(); }
      else if(tries>10){ clearInterval(iv); toast('Biblioteca PDF não disponível.'); }
    },300);
    return;
  }
  gerarPdf();
};

async function loadBanksIfNeeded(){
  try{ banks = await api('/api/licitacoes-bancos'); }catch{ banks = []; }
}

function gerarPdf(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const margin = 15, pw = doc.internal.pageSize.getWidth(), ph = doc.internal.pageSize.getHeight();
  const data = (current.items||[]).filter(x=>x.selecionado !== false);
  const bank = banks.find(b=>b.nome_banco === current.banco_pagamento) || {};

  const logo = new Image(); logo.crossOrigin='anonymous';
  logo.src = '/apps/imagens/I.R.-COMERCIO-E-MATERIAIS-ELETRICOS-LTDA-PDF.png';

  const draw = () => {
    // Cabeçalho (logo à esquerda + empresa ao lado — mesmo padrão de Ordens de Compra)
    try{
      const lw = 40;
      const lh = logo.height && logo.width ? (logo.height/logo.width)*lw : 12;
      doc.addImage(logo, 'PNG', 5, 5, lw, lh);
      const baseY = 5 + lh*0.42;
      doc.setFont('helvetica','bold');
      doc.setFontSize(14);
      doc.setTextColor(150,150,150);
      doc.text('I.R COMÉRCIO E', 5+lw+2, baseY);
      doc.text('MATERIAIS ELÉTRICOS LTDA', 5+lw+2, baseY + 6);
      doc.setTextColor(0,0,0);
      let y = 5 + lh + 6;
      y = renderBody(y);
      doc.save(`${fileBase(current)}.pdf`);
      toast(`Ordem de Nº ${current.numero_pregao} emitida`);
    }catch(e){ console.error(e); simplePdf(); }
  };

  const simplePdf = () => {
    let y = 20;
    y = renderBody(y);
    doc.save(`${fileBase(current)}.pdf`);
  };

  const renderBody = (startY) => {
    let y = startY;
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(0,0,0);
    doc.text(`AO ${up(current.nome_orgao)}`, margin, y); y += 5;
    doc.text('COMISSÃO PERMANENTE DE LICITAÇÃO', margin, y); y += 5;
    const linha3 = `PREGÃO ELETRÔNICO ${up(current.numero_pregao)}` + (current.uasg?` UASG ${up(current.uasg)}`:'');
    doc.text(linha3, margin, y); y += 7;

    // Tabela
    const tw = pw - margin*2;
    const cols = [
      { k:'item', w: tw*0.06, t:'ITEM', a:'c' },
      { k:'qtd', w: tw*0.08, t:'QTD', a:'c' },
      { k:'und', w: tw*0.08, t:'UND', a:'c' },
      { k:'descricao', w: tw*0.32, t:'DESCRIÇÃO', a:'l' },
      { k:'marca', w: tw*0.14, t:'MARCA', a:'l' },
      { k:'modelo', w: tw*0.14, t:'MODELO', a:'l' },
      { k:'vendaUnt', w: tw*0.09, t:'PREÇO UNIT.', a:'r' },
      { k:'vendaTotal', w: tw*0.09, t:'PREÇO TOTAL', a:'r' }
    ];
    const rowH = 7;
    // header
    doc.setFillColor(240,240,240); doc.setDrawColor(120,120,120);
    let x = margin;
    doc.setFont('helvetica','bold'); doc.setFontSize(8);
    cols.forEach(c=>{ doc.rect(x, y, c.w, rowH, 'FD'); doc.text(c.t, x + c.w/2, y + 4.7, { align:'center' }); x += c.w; });
    y += rowH;
    // rows
    doc.setFont('helvetica','normal');
    let total = 0;
    data.forEach((it, idx) => {
      const custoUnt = num(it.custoUnt);
      const pct = num(it.porcentagem ?? 149);
      const vUnt = it.vendaUnt !== undefined ? num(it.vendaUnt) : (custoUnt * pct/100);
      const vTot = it.vendaTotal !== undefined ? num(it.vendaTotal) : vUnt * num(it.qtd);
      total += vTot;
      const descLines = doc.splitTextToSize(up(it.descricao || ''), cols[3].w - 2);
      const needed = Math.max(rowH, descLines.length * 4 + 3);
      if(y + needed > ph - 40){ doc.addPage(); y = 20; }
      x = margin;
      if(idx % 2 === 0){ doc.setFillColor(250,250,250); doc.rect(margin, y, tw, needed, 'F'); }
      const cells = [
        String(it.item ?? ''), String(it.qtd ?? ''), up(it.und || ''),
        null, up(it.marca || ''), up(it.modelo || ''),
        money(vUnt), money(vTot)
      ];
      cols.forEach((c,i)=>{
        doc.rect(x, y, c.w, needed);
        if(i===3){
          doc.text(descLines, x + 1.5, y + 4);
        } else {
          const cy = y + needed/2 + 1.2;
          const tx = c.a==='r' ? x + c.w - 1.5 : (c.a==='c' ? x + c.w/2 : x + 1.5);
          doc.text(cells[i], tx, cy, { align: c.a });
        }
        x += c.w;
      });
      y += needed;
    });

    y += 4;
    doc.setFont('helvetica','bold'); doc.setFontSize(10);
    doc.text(`VALOR TOTAL: ${money(total)}`, pw - margin, y, { align:'right' }); y += 8;

    doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text(`BANCO: ${up(current.banco_pagamento||'—')}`, margin, y); y += 5;
    doc.text(`AGÊNCIA: ${bank.agencia||''}`, margin, y); y += 5;
    doc.text(`CONTA CORRENTE: ${bank.conta_corrente||''}`, margin, y); y += 5;
    doc.text(`VALIDADE DA PROPOSTA: ${up(current.validade_proposta||'')}`, margin, y); y += 5;
    doc.text(`PRAZO DE ENTREGA: ${up(current.prazo_entrega||'')}`, margin, y); y += 5;
    doc.text(`PRAZO DE PAGAMENTO: ${up(current.prazo_pagamento||'')}`, margin, y); y += 8;

    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    const decl1 = 'Declaramos que nos preços cotados estão incluídas todas as despesas tais como frete (CIF), impostos, taxas, seguros, tributos e demais encargos de qualquer natureza incidentes sobre o objeto do Pregão.';
    const decl2 = 'Declaramos que somos Optantes pelo Simples Nacional';
    const decl3 = 'Declaramos que o objeto fornecido não é remanufaturado ou recondicionado';
    const l1 = doc.splitTextToSize(decl1, tw);
    if(y + l1.length*4 + 20 > ph - 40){ doc.addPage(); y = 20; }
    doc.text(l1, margin, y); y += l1.length*4 + 3;
    doc.text(decl2, pw/2, y, { align:'center' }); y += 6;
    doc.text(decl3, pw/2, y, { align:'center' }); y += 10;

    const dt = new Date();
    const meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
    doc.text(`SERRA/ES, ${dt.getDate()} DE ${meses[dt.getMonth()]} DE ${dt.getFullYear()}`, pw/2, y, { align:'center' });
    y += 8;

    // Assinatura — levemente maior sem sobrepor (linha em branco maior abaixo)
    const sign = new Image(); sign.crossOrigin='anonymous';
    sign.src = '/apps/imagens/assinatura.png';
    try{
      if(sign.complete && sign.width){
        const iw = 60;
        const ih = (sign.height/sign.width)*iw;
        doc.addImage(sign, 'PNG', pw/2 - iw/2, y, iw, ih);
        y += ih + 3;
      }
    }catch{}
    doc.setFont('helvetica','bold'); doc.setFontSize(10);
    doc.text('ROSEMEIRE BICALHO DE LIMA GRAVINO', pw/2, y, { align:'center' }); y += 5;
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    doc.text('MG-10.078.568 / CPF: 045.160.616-78', pw/2, y, { align:'center' }); y += 4;
    doc.text('DIRETORA', pw/2, y, { align:'center' });

    // Rodapé fixo em todas as páginas (sem linha)
    const totalPages = doc.internal.getNumberOfPages();
    for(let i=1;i<=totalPages;i++){
      doc.setPage(i);
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(90,90,90);
      const yBase = ph - 12;
      doc.text('RUA TADORNA Nº 472, SALA 102, BAIRRO NOVO HORIZONTE, CEP: 29.163-318, SERRA/ES', pw/2, yBase, { align:'center' });
      doc.text('TELEFONE: (27) 3209-4291 / (27) 99802-3083 (Whatsapp) / (27) 99726-3058', pw/2, yBase+3.5, { align:'center' });
      doc.text('CNPJ: 33.149.502/0001-38', pw/2, yBase+7, { align:'center' });
      doc.text('E-MAIL: COMERCIAL.IRCOMERCIO@GMAIL.COM', pw/2, yBase+10.5, { align:'center' });
      doc.setTextColor(0,0,0);
    }
    return y;
  };

  if(logo.complete && logo.width) draw();
  else { logo.onload = draw; logo.onerror = () => simplePdf(); }
}

/* DOC (Word) */
$('pdfBtn').addEventListener('contextmenu', ()=>{});
// Gera também DOC via outro atalho? Usuário pediu o docs na interface antiga (modal). Como removemos o modal,
// mantemos o acesso pelo botão PDF e adicionamos menu por clique-direito.
// Aqui, o PDF único atende o requisito. DOC é gerado por atalho (alt+clique).
$('pdfBtn').onmousedown = (e) => {
  if(e.altKey){ e.preventDefault(); gerarDocWord(); }
};

function gerarDocWord(){
  const data = (current.items||[]).filter(x=>x.selecionado !== false);
  const bank = banks.find(b=>b.nome_banco === current.banco_pagamento) || {};
  const total = data.reduce((a,x)=>{
    const custoUnt = num(x.custoUnt); const pct = num(x.porcentagem ?? 149);
    const vUnt = x.vendaUnt !== undefined ? num(x.vendaUnt) : (custoUnt*pct/100);
    const vTot = x.vendaTotal !== undefined ? num(x.vendaTotal) : vUnt*num(x.qtd);
    return a + vTot;
  }, 0);
  const dt = new Date();
  const meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
  const linhas = data.map(x=>{
    const custoUnt = num(x.custoUnt); const pct = num(x.porcentagem ?? 149);
    const vUnt = x.vendaUnt !== undefined ? num(x.vendaUnt) : (custoUnt*pct/100);
    const vTot = x.vendaTotal !== undefined ? num(x.vendaTotal) : vUnt*num(x.qtd);
    return `<tr>
      <td>${esc(x.item)}</td><td>${esc(x.qtd)}</td><td>${esc(up(x.und))}</td>
      <td>${esc(up(x.descricao))}</td><td>${esc(up(x.marca))}</td><td>${esc(up(x.modelo))}</td>
      <td>${money(vUnt)}</td><td>${money(vTot)}</td>
    </tr>`;
  }).join('');

  const html = `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      lang="pt-BR"><head><meta charset="utf-8">
<title>${esc(fileBase(current))}</title>
<style>
  @page Section1{
    size:595.3pt 841.9pt;
    margin:50pt 26pt 60pt 26pt;
    mso-header-margin:14pt;
    mso-footer-margin:22pt;
    mso-header:h1; mso-footer:f1; mso-paper-source:0;
  }
  div.Section1{page:Section1}
  body{font:10pt Arial,sans-serif;color:#111}
  h3{margin:6pt 0;font-size:11pt;text-align:left}
  p{margin:4pt 0}
  table{width:100%;border-collapse:collapse;margin:12pt 0;font-size:8pt}
  th,td{border:1px solid #444;padding:4pt 3pt;vertical-align:top;overflow-wrap:anywhere}
  th{text-align:center;background:#f0f0f0;white-space:nowrap;font-size:8pt}
  td:nth-child(1),td:nth-child(2){text-align:center}
  .total{text-align:right;font-weight:bold;margin:8pt 0}
  .decl{text-align:center;margin:10pt 0;line-height:1.5}
  .date{text-align:center;margin-top:26pt}
  .sign-space{height:60pt}
  .sign-name{text-align:center;font-weight:bold;margin:0}
  .sign-sub{text-align:center;font-size:9pt;margin:0}
  .MsoHeader,.MsoFooter{margin:0;font-family:Arial,sans-serif}
</style></head>
<body>
<div class="Section1">
  <h3>AO ${esc(up(current.nome_orgao))}</h3>
  <h3>COMISSÃO PERMANENTE DE LICITAÇÃO</h3>
  <h3>PREGÃO ELETRÔNICO ${esc(up(current.numero_pregao))}${current.uasg?` UASG ${esc(up(current.uasg))}`:''}</h3>

  <table>
    <thead>
      <tr><th>ITEM</th><th>QTD</th><th>UND</th><th>DESCRIÇÃO</th><th>MARCA</th><th>MODELO</th><th>PREÇO UNIT.</th><th>PREÇO TOTAL</th></tr>
    </thead>
    <tbody>${linhas}</tbody>
  </table>
  <p class="total">VALOR TOTAL: ${money(total)}</p>
  <p><b>BANCO:</b> ${esc(up(current.banco_pagamento||'—'))}</p>
  <p><b>AGÊNCIA:</b> ${esc(bank.agencia||'')}</p>
  <p><b>CONTA CORRENTE:</b> ${esc(bank.conta_corrente||'')}</p>
  <p><b>VALIDADE DA PROPOSTA:</b> ${esc(up(current.validade_proposta||''))}</p>
  <p><b>PRAZO DE ENTREGA:</b> ${esc(up(current.prazo_entrega||''))}</p>
  <p><b>PRAZO DE PAGAMENTO:</b> ${esc(up(current.prazo_pagamento||''))}</p>

  <p class="decl">Declaramos que nos preços cotados estão incluídas todas as despesas tais como frete (CIF), impostos, taxas, seguros, tributos e demais encargos de qualquer natureza incidentes sobre o objeto do Pregão.</p>
  <p class="decl">Declaramos que somos Optantes pelo Simples Nacional</p>
  <p class="decl">Declaramos que o objeto fornecido não é remanufaturado ou recondicionado</p>

  <p class="date">SERRA/ES, ${dt.getDate()} DE ${meses[dt.getMonth()]} DE ${dt.getFullYear()}</p>
  <div class="sign-space"></div>
  <p class="sign-name">ROSEMEIRE BICALHO DE LIMA GRAVINO</p>
  <p class="sign-sub">MG-10.078.568 / CPF: 045.160.616-78</p>
  <p class="sign-sub">DIRETORA</p>
</div>

<div style='mso-element:header' id="h1">
  <p class="MsoHeader" style="text-align:left;">
    <img src="${location.origin}/apps/imagens/I.R.-COMERCIO-E-MATERIAIS-ELETRICOS-LTDA-PDF.png"
         style="width:80pt;height:auto;vertical-align:middle;margin-right:6pt;">
    <span style="color:#969696;font-weight:bold;font-size:12pt;">I.R COMÉRCIO E MATERIAIS ELÉTRICOS LTDA</span>
  </p>
</div>
<div style='mso-element:footer' id="f1">
  <p class="MsoFooter" style="text-align:center;font-size:8pt;color:#777;line-height:1.25;">
    RUA TADORNA Nº 472, SALA 102, BAIRRO NOVO HORIZONTE, CEP: 29.163-318, SERRA/ES<br>
    TELEFONE: (27) 3209-4291 / (27) 99802-3083 (Whatsapp) / (27) 99726-3058<br>
    CNPJ: 33.149.502/0001-38<br>
    E-MAIL: COMERCIAL.IRCOMERCIO@GMAIL.COM
  </p>
</div>
</body></html>`;

  const blob = new Blob(['\ufeff', html], { type:'application/msword;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${fileBase(current)}.doc`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Documento Word gerado.');
}

/* ================= INIT ================= */
async function boot(){
  await loadOpcoes();
  await Promise.all([loadList(), loadStats()]);
  // auto-refresh a cada 30s
  setInterval(()=>{ Promise.all([loadList(), loadStats()]); }, 30000);
}
boot();

// Cliques em qualquer lugar fecham o pop de cores
document.addEventListener('click', e=>{
  if(colorPop && !colorPop.contains(e.target) && !e.target.closest('.row-btn.brush')) closeColorPop();
});

})();

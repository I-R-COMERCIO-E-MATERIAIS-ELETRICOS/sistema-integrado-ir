// ============================================================
// Ordens de Compra · Mobile · I.R. Comércio
// ============================================================

const API_URL = window.location.origin + '/api';

let accessToken = null;
let currentUserName = null;

let ordens = [];
let currentMonth = new Date();
let editingId = null;
let itemCounter = 0;
let currentTab = 0;
let fornecedoresCache = {};
let ultimoNumeroGlobal = 0;

const KNOWN_RESPONSAVEIS = ['ROBERTO', 'ISAQUE', 'MIGUEL'];
const tabs = ['tab-geral', 'tab-fornecedor', 'tab-pedido', 'tab-entrega', 'tab-pagamento'];

// ─── AUTH ───────────────────────────────────────────────────
function resolveToken() {
    const p = new URLSearchParams(window.location.search);
    const fromUrl = p.get('access_token');
    if (fromUrl) {
        sessionStorage.setItem('irToken', fromUrl);
        window.history.replaceState({}, '', window.location.pathname);
        return fromUrl;
    }
    return sessionStorage.getItem('irToken');
}

function getHeaders() {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    };
}

function showDenied(msg) {
    try {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'ir-session-expired', reason: msg || 'sem-acesso' }, '*');
        }
    } catch (e) {}

    document.documentElement.style.overflow = 'hidden';
    document.body.innerHTML = `
        <div style="
            position: fixed; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            background: #F4F5F7; color: #111;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            text-align: center; padding: 2rem; z-index: 2147483647;
        ">
            <h1 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.75rem;">${msg || 'SEM ACESSO'}</h1>
            <p style="color: #5B6470; margin-bottom: 2rem; font-size: 0.9rem;">Você não tem permissão para acessar este módulo.</p>
        </div>
    `;
}

// ─── HELPERS ────────────────────────────────────────────────
function toUpperCase(v) { return v ? String(v).toUpperCase() : ''; }
function parseFloatLocale(str) {
    if (typeof str !== 'string') return NaN;
    const c = str.replace(/\s+/g, '').replace(',', '.');
    const n = parseFloat(c);
    return isNaN(n) ? NaN : n;
}
function detectResponsavelFromUser(name) {
    if (!name) return null;
    const u = name.trim().toUpperCase();
    for (const r of KNOWN_RESPONSAVEIS) {
        if (u === r || u.startsWith(r + ' ') || u.startsWith(r + '.')) return r;
    }
    return null;
}
function formatCurrency(v) {
    return parseFloat(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatDate(d) {
    if (!d) return '-';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}
function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function showToast(msg, type) {
    document.querySelectorAll('.m-toast').forEach(t => t.remove());
    const el = document.createElement('div');
    el.className = 'm-toast ' + (type || 'success');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.transition = 'opacity 0.3s';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

// ─── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { showDenied('SESSÃO EXPIRADA'); return; }

    await fetchSessionUser();
    updateMonthDisplay();
    await carregarTudo();
    setInterval(() => carregarTudo(), 30000);
});

async function fetchSessionUser() {
    try {
        const res = await fetch('/api/portal/modules', { headers: getHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (data.user) currentUserName = data.user.name || data.user.username || null;
    } catch (e) {}
}

async function carregarTudo() {
    try {
        await loadOrdens();
        await loadUltimoNumero();
        await loadFornecedoresGlobal();
    } catch (e) {
        console.error('[compra m] carregarTudo:', e);
    } finally {
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'ir-module-ready', module: 'compra' }, '*');
            }
        } catch (e) {}
    }
}

// ─── FETCH ──────────────────────────────────────────────────
async function loadOrdens() {
    const mes = currentMonth.getMonth();
    const ano = currentMonth.getFullYear();
    try {
        const res = await fetch(`${API_URL}/ordens?mes=${mes}&ano=${ano}`, { headers: getHeaders(), cache: 'no-cache' });
        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (!res.ok) throw new Error('Erro ' + res.status);
        const data = await res.json();
        ordens = Array.isArray(data) ? data : [];
        mesclarCacheFornecedores(ordens);
        updateDisplay();
    } catch (e) {
        console.error('[compra m] loadOrdens:', e);
    }
}

async function loadUltimoNumero() {
    try {
        const res = await fetch(`${API_URL}/ordens/ultimo-numero`, { headers: getHeaders(), cache: 'no-cache' });
        if (!res.ok) return;
        const data = await res.json();
        ultimoNumeroGlobal = data.ultimoNumero || 0;
    } catch (e) {}
}

async function loadFornecedoresGlobal() {
    try {
        const res = await fetch(`${API_URL}/fornecedores`, { headers: getHeaders(), cache: 'no-cache' });
        if (!res.ok) return;
        const lista = await res.json();
        lista.forEach(f => {
            const key = (f.razao_social || '').trim().toUpperCase();
            if (key && !fornecedoresCache[key]) {
                fornecedoresCache[key] = {
                    razaoSocial: key,
                    nomeFantasia: (f.nome_fantasia || '').toUpperCase(),
                    cnpj: f.cnpj || '',
                    enderecoFornecedor: (f.endereco_fornecedor || '').toUpperCase(),
                    site: f.site || '',
                    contato: (f.contato || '').toUpperCase(),
                    telefone: f.telefone || '',
                    email: f.email || ''
                };
            }
        });
    } catch (e) {}
}

function mesclarCacheFornecedores(lista) {
    lista.forEach(o => {
        const key = toUpperCase(o.razao_social).trim();
        if (!key) return;
        fornecedoresCache[key] = {
            razaoSocial: key,
            nomeFantasia: toUpperCase(o.nome_fantasia || ''),
            cnpj: o.cnpj || '',
            enderecoFornecedor: toUpperCase(o.endereco_fornecedor || ''),
            site: o.site || '',
            contato: toUpperCase(o.contato || ''),
            telefone: o.telefone || '',
            email: o.email || ''
        };
    });
}

// ─── MÊS ────────────────────────────────────────────────────
function changeMonth(dir) {
    currentMonth.setMonth(currentMonth.getMonth() + dir);
    ordens = [];
    updateMonthDisplay();
    document.getElementById('ordensList').innerHTML = '';
    loadOrdens();
}
function updateMonthDisplay() {
    const m = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const el = document.getElementById('currentMonth');
    if (el) el.textContent = `${m[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
}

async function syncData() {
    const btn = document.querySelector('.m-sync-btn');
    if (btn) btn.classList.add('spinning');
    try {
        await carregarTudo();
        showToast('Dados sincronizados', 'success');
    } catch {
        showToast('Erro ao sincronizar', 'error');
    } finally {
        setTimeout(() => btn && btn.classList.remove('spinning'), 600);
    }
}

// ─── RENDER ─────────────────────────────────────────────────
function updateDisplay() {
    updateMonthDisplay();
    updateStats();
    updateList();
    updateResponsaveisFilter();
}

function updateStats() {
    const fechadas = ordens.filter(o => o.status === 'fechada').length;
    const abertas = ordens.filter(o => o.status === 'aberta').length;
    const t = document.getElementById('m-total');
    const f = document.getElementById('m-fechadas');
    const a = document.getElementById('m-abertas');
    if (t) t.textContent = ordens.length;
    if (f) f.textContent = fechadas;
    if (a) a.textContent = abertas;
}

function updateList() {
    const root = document.getElementById('ordensList');
    if (!root) return;

    let lista = [...ordens];
    const search = (document.getElementById('search')?.value || '').toLowerCase().trim();
    const resp = document.getElementById('filterResponsavel')?.value || '';
    const status = document.getElementById('filterStatus')?.value || '';

    if (search) {
        lista = lista.filter(o =>
            (o.numero_ordem || '').toString().toLowerCase().includes(search) ||
            (o.razao_social || '').toLowerCase().includes(search) ||
            (o.responsavel || '').toLowerCase().includes(search)
        );
    }
    if (resp) lista = lista.filter(o => o.responsavel === resp);
    if (status) lista = lista.filter(o => o.status === status);

    if (!lista.length) {
        root.innerHTML = '<div class="m-empty">Nenhuma ordem encontrada</div>';
        return;
    }

    lista.sort((a, b) => parseInt(a.numero_ordem) - parseInt(b.numero_ordem));

    root.innerHTML = lista.map(o => `
        <div class="m-card ${o.status === 'fechada' ? 'fechada' : ''}" onclick="viewOrdem('${o.id}')">
            <div class="m-card-header">
                <span class="m-numero">Nº ${escHtml(o.numero_ordem)}</span>
                <span class="m-badge ${o.status}">${o.status.toUpperCase()}</span>
            </div>
            <div class="m-card-body">
                <div class="m-row"><span>Fornecedor</span><strong>${escHtml(toUpperCase(o.razao_social))}</strong></div>
                <div class="m-row"><span>Responsável</span><strong>${escHtml(toUpperCase(o.responsavel))}</strong></div>
                <div class="m-row"><span>Data</span><strong>${formatDate(o.data_ordem)}</strong></div>
                <div class="m-row"><span>Valor</span><strong>${escHtml(o.valor_total || '-')}</strong></div>
            </div>
            <div class="m-card-actions">
                <button class="m-btn edit" onclick="event.stopPropagation();editOrdem('${o.id}')">Editar</button>
                <button class="m-btn pdf" onclick="event.stopPropagation();toggleStatus('${o.id}')">${o.status === 'aberta' ? 'Fechar' : 'Reabrir'}</button>
                <button class="m-btn del" onclick="event.stopPropagation();deleteOrdem('${o.id}')">Excluir</button>
            </div>
        </div>
    `).join('');
}

function filterOrdens() { updateList(); }

function updateResponsaveisFilter() {
    const s = document.getElementById('filterResponsavel');
    if (!s) return;
    const cur = s.value;
    const set = new Set();
    ordens.forEach(o => { if (o.responsavel?.trim()) set.add(o.responsavel.trim()); });
    s.innerHTML = '<option value="">Responsável</option>';
    Array.from(set).sort().forEach(r => {
        const opt = document.createElement('option');
        opt.value = r; opt.textContent = toUpperCase(r);
        s.appendChild(opt);
    });
    s.value = cur;
}

// ─── VISUALIZAR ─────────────────────────────────────────────
function viewOrdem(id) {
    const o = ordens.find(x => String(x.id) === String(id));
    if (!o) return;

    const items = Array.isArray(o.items) ? o.items : [];
    const itemsHtml = items.map(it => `
        <p><strong>${escHtml(it.item)}. ${escHtml(toUpperCase(it.especificacao))}</strong><br>
        ${it.quantidade} ${escHtml(toUpperCase(it.unidade))} × ${formatCurrency(it.valorUnitario || 0)} = ${escHtml(it.valorTotal || '')}</p>
    `).join('');

    document.getElementById('viewModalHost')?.remove();
    const host = document.createElement('div');
    host.id = 'viewModalHost';
    host.innerHTML = `
        <div class="m-modal-overlay" id="viewModal" onclick="if(event.target===this)closeView()">
            <div class="m-modal">
                <div class="m-modal-header">
                    <h2>Ordem Nº ${escHtml(o.numero_ordem)}</h2>
                    <button class="m-close" onclick="closeView()">✕</button>
                </div>
                <div class="m-info-section">
                    <h4>Geral</h4>
                    <p><strong>Responsável:</strong> ${escHtml(toUpperCase(o.responsavel))}</p>
                    <p><strong>Data:</strong> ${formatDate(o.data_ordem)}</p>
                    <p><strong>Status:</strong> ${escHtml(o.status.toUpperCase())}</p>
                </div>
                <div class="m-info-section">
                    <h4>Fornecedor</h4>
                    <p><strong>Razão:</strong> ${escHtml(toUpperCase(o.razao_social))}</p>
                    ${o.cnpj ? `<p><strong>CNPJ:</strong> ${escHtml(o.cnpj)}</p>` : ''}
                    ${o.contato ? `<p><strong>Contato:</strong> ${escHtml(toUpperCase(o.contato))}</p>` : ''}
                    ${o.telefone ? `<p><strong>Telefone:</strong> ${escHtml(o.telefone)}</p>` : ''}
                </div>
                <div class="m-info-section">
                    <h4>Itens</h4>
                    ${itemsHtml || '<p>—</p>'}
                    <p style="margin-top:0.5rem;"><strong>Total:</strong> ${escHtml(o.valor_total || '-')}</p>
                </div>
                <div class="m-info-section">
                    <h4>Entrega</h4>
                    ${o.local_entrega ? `<p><strong>Local:</strong> ${escHtml(toUpperCase(o.local_entrega))}</p>` : ''}
                    ${o.prazo_entrega ? `<p><strong>Prazo:</strong> ${escHtml(toUpperCase(o.prazo_entrega))}</p>` : ''}
                    ${o.transporte ? `<p><strong>Transporte:</strong> ${escHtml(toUpperCase(o.transporte))}</p>` : ''}
                </div>
                <div class="m-info-section">
                    <h4>Pagamento</h4>
                    <p><strong>Forma:</strong> ${escHtml(toUpperCase(o.forma_pagamento))}</p>
                    <p><strong>Prazo:</strong> ${escHtml(toUpperCase(o.prazo_pagamento))}</p>
                    ${o.dados_bancarios ? `<p><strong>Dados:</strong> ${escHtml(toUpperCase(o.dados_bancarios))}</p>` : ''}
                </div>
                <div class="m-form-actions">
                    <button class="m-btn secondary" onclick="closeView()">Fechar</button>
                    <button class="m-btn blue" onclick="closeView();editOrdem('${o.id}')">Editar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(host);
}
function closeView() { document.getElementById('viewModalHost')?.remove(); }

// ─── FORM ───────────────────────────────────────────────────
function toggleForm() {
    editingId = null;
    currentTab = 0;
    itemCounter = 0;

    const next = ultimoNumeroGlobal > 0 ? (ultimoNumeroGlobal + 1).toString() : '1';
    const today = new Date().toISOString().split('T')[0];
    const resp = detectResponsavelFromUser(currentUserName) || '';

    openFormModal({
        title: 'Nova Ordem',
        editId: '',
        numeroOrdem: next,
        responsavel: resp,
        dataOrdem: today,
        ordem: null
    });
}

function editOrdem(id) {
    const o = ordens.find(x => String(x.id) === String(id));
    if (!o) return showToast('Ordem não encontrada', 'error');

    editingId = id;
    currentTab = 0;
    itemCounter = 0;

    openFormModal({
        title: 'Editar Ordem',
        editId: id,
        numeroOrdem: o.numero_ordem,
        responsavel: o.responsavel,
        dataOrdem: o.data_ordem,
        ordem: o
    });
}

function openFormModal(cfg) {
    const o = cfg.ordem;
    document.getElementById('formModalHost')?.remove();
    const host = document.createElement('div');
    host.id = 'formModalHost';
    host.innerHTML = `
        <div class="m-modal-overlay" id="formModal">
            <div class="m-modal">
                <div class="m-modal-header">
                    <h2>${cfg.title}</h2>
                    <button class="m-close" onclick="closeForm(true)">✕</button>
                </div>

                <div class="m-tabs" id="formTabs">
                    <button class="m-tab active" onclick="switchTab(0,this)">Geral</button>
                    <button class="m-tab" onclick="switchTab(1,this)">Fornecedor</button>
                    <button class="m-tab" onclick="switchTab(2,this)">Itens</button>
                    <button class="m-tab" onclick="switchTab(3,this)">Entrega</button>
                    <button class="m-tab" onclick="switchTab(4,this)">Pagamento</button>
                </div>

                <form class="m-form" onsubmit="handleSubmit(event)">
                    <input type="hidden" id="editId" value="${cfg.editId}">

                    <div class="m-pane active" data-pane="0">
                        <label>Número da Ordem *</label>
                        <input type="text" id="numeroOrdem" value="${escHtml(cfg.numeroOrdem)}" required>
                        <label>Responsável</label>
                        <input type="text" id="responsavel" value="${escHtml(cfg.responsavel || '')}" readonly>
                        <label>Data da Ordem *</label>
                        <input type="date" id="dataOrdem" value="${escHtml(cfg.dataOrdem || '')}" required>
                    </div>

                    <div class="m-pane" data-pane="1">
                        <label>Razão Social *</label>
                        <input type="text" id="razaoSocial" value="${o ? escHtml(o.razao_social) : ''}" required>
                        <label>Nome Fantasia</label>
                        <input type="text" id="nomeFantasia" value="${o ? escHtml(o.nome_fantasia || '') : ''}">
                        <label>CNPJ *</label>
                        <input type="text" id="cnpj" value="${o ? escHtml(o.cnpj || '') : ''}" required>
                        <label>Endereço</label>
                        <input type="text" id="enderecoFornecedor" value="${o ? escHtml(o.endereco_fornecedor || '') : ''}">
                        <label>Contato</label>
                        <input type="text" id="contato" value="${o ? escHtml(o.contato || '') : ''}">
                        <label>Telefone</label>
                        <input type="text" id="telefone" value="${o ? escHtml(o.telefone || '') : ''}">
                        <label>E-mail</label>
                        <input type="email" id="email" value="${o ? escHtml(o.email || '') : ''}">
                    </div>

                    <div class="m-pane" data-pane="2">
                        <button type="button" class="m-btn blue" onclick="addItem()" style="width:100%; margin-bottom:0.75rem;">+ Adicionar Item</button>
                        <div id="itemsBody"></div>
                        <label>Valor Total</label>
                        <input type="text" id="valorTotalOrdem" readonly value="${o ? escHtml(o.valor_total || 'R$ 0,00') : 'R$ 0,00'}">
                        <label>Frete</label>
                        <input type="text" id="frete" value="${o ? escHtml(o.frete || 'CIF') : 'CIF'}">
                    </div>

                    <div class="m-pane" data-pane="3">
                        <label>Local de Entrega</label>
                        <input type="text" id="localEntrega" value="${o ? escHtml(o.local_entrega || '') : 'RUA TADORNA Nº 472, SALA 2, NOVO HORIZONTE - SERRA/ES  |  CEP: 29.163-318'}">
                        <label>Prazo de Entrega</label>
                        <input type="text" id="prazoEntrega" value="${o ? escHtml(o.prazo_entrega || 'IMEDIATO') : 'IMEDIATO'}">
                        <label>Transporte</label>
                        <input type="text" id="transporte" value="${o ? escHtml(o.transporte || 'FORNECEDOR') : 'FORNECEDOR'}">
                    </div>

                    <div class="m-pane" data-pane="4">
                        <label>Forma de Pagamento *</label>
                        <input type="text" id="formaPagamento" value="${o ? escHtml(o.forma_pagamento || '') : ''}" required>
                        <label>Prazo de Pagamento *</label>
                        <input type="text" id="prazoPagamento" value="${o ? escHtml(o.prazo_pagamento || '') : ''}" required>
                        <label>Dados Bancários</label>
                        <textarea id="dadosBancarios" rows="3">${o ? escHtml(o.dados_bancarios || '') : ''}</textarea>
                    </div>

                    <div class="m-form-actions">
                        <button type="button" class="m-btn secondary" onclick="closeForm(true)">Cancelar</button>
                        <button type="submit" class="m-btn primary" id="btnSave">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(host);

    if (o && Array.isArray(o.items) && o.items.length) {
        o.items.forEach(it => {
            addItem();
            const row = document.querySelectorAll('#itemsBody .m-item-row');
            const last = row[row.length - 1];
            if (!last) return;
            last.querySelector('.it-espec').value = toUpperCase(it.especificacao || '');
            last.querySelector('.it-qtd').value = it.quantidade || 1;
            last.querySelector('.it-unid').value = toUpperCase(it.unidade || 'UN');
            last.querySelector('.it-valor').value = it.valorUnitario || 0;
            last.querySelector('.it-total').value = it.valorTotal || 'R$ 0,00';
        });
        recalcTotal();
    } else {
        addItem();
    }
}

function closeForm(cancelado) {
    document.getElementById('formModalHost')?.remove();
    if (cancelado) {
        showToast(editingId ? 'Atualização cancelada' : 'Registro cancelado', 'error');
    }
    editingId = null;
}

function switchTab(i, btn) {
    currentTab = i;
    document.querySelectorAll('#formModal .m-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#formModal .m-pane').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.querySelector(`#formModal .m-pane[data-pane="${i}"]`)?.classList.add('active');
}

function addItem() {
    itemCounter++;
    const root = document.getElementById('itemsBody');
    if (!root) return;
    const div = document.createElement('div');
    div.className = 'm-item-row';
    div.innerHTML = `
        <div class="full"><strong>Item ${itemCounter}</strong></div>
        <div class="full">
            <label>Especificação</label>
            <input type="text" class="it-espec" placeholder="Descrição">
        </div>
        <div>
            <label>QTD</label>
            <input type="number" class="it-qtd" min="0" step="0.01" value="1" oninput="recalcItem(this)">
        </div>
        <div>
            <label>Unidade</label>
            <input type="text" class="it-unid" value="UN">
        </div>
        <div>
            <label>Valor UN</label>
            <input type="number" class="it-valor" min="0" step="0.01" value="0" oninput="recalcItem(this)">
        </div>
        <div>
            <label>Total</label>
            <input type="text" class="it-total" readonly value="R$ 0,00">
        </div>
        <div class="full">
            <button type="button" class="m-btn del" onclick="this.closest('.m-item-row').remove(); recalcTotal();" style="width:100%;">Remover</button>
        </div>
    `;
    root.appendChild(div);
}

function recalcItem(input) {
    const row = input.closest('.m-item-row');
    const qtd = parseFloat(row.querySelector('.it-qtd').value) || 0;
    const vlr = parseFloat(row.querySelector('.it-valor').value) || 0;
    row.querySelector('.it-total').value = formatCurrency(qtd * vlr);
    recalcTotal();
}

function recalcTotal() {
    let sum = 0;
    document.querySelectorAll('#itemsBody .it-total').forEach(i => {
        const v = i.value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        sum += parseFloat(v) || 0;
    });
    const out = document.getElementById('valorTotalOrdem');
    if (out) out.value = formatCurrency(sum);
}

async function handleSubmit(e) {
    e.preventDefault();

    const items = [];
    document.querySelectorAll('#itemsBody .m-item-row').forEach((row, i) => {
        const espec = row.querySelector('.it-espec')?.value || '';
        if (!espec.trim()) return;
        items.push({
            item: i + 1,
            especificacao: toUpperCase(espec),
            quantidade: parseFloat(row.querySelector('.it-qtd').value) || 0,
            unidade: toUpperCase(row.querySelector('.it-unid').value),
            valorUnitario: parseFloat(row.querySelector('.it-valor').value) || 0,
            ipi: '',
            st: '',
            valorTotal: row.querySelector('.it-total').value
        });
    });

    const payload = {
        numeroOrdem: document.getElementById('numeroOrdem').value.trim(),
        responsavel: toUpperCase(document.getElementById('responsavel').value),
        dataOrdem: document.getElementById('dataOrdem').value,
        razaoSocial: toUpperCase(document.getElementById('razaoSocial').value),
        nomeFantasia: toUpperCase(document.getElementById('nomeFantasia').value),
        cnpj: document.getElementById('cnpj').value,
        enderecoFornecedor: toUpperCase(document.getElementById('enderecoFornecedor').value),
        contato: toUpperCase(document.getElementById('contato').value),
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value,
        items,
        valorTotal: document.getElementById('valorTotalOrdem').value,
        frete: toUpperCase(document.getElementById('frete').value),
        localEntrega: toUpperCase(document.getElementById('localEntrega').value),
        prazoEntrega: toUpperCase(document.getElementById('prazoEntrega').value),
        transporte: toUpperCase(document.getElementById('transporte').value),
        formaPagamento: toUpperCase(document.getElementById('formaPagamento').value),
        prazoPagamento: toUpperCase(document.getElementById('prazoPagamento').value),
        dadosBancarios: toUpperCase(document.getElementById('dadosBancarios').value),
        status: 'aberta'
    };

    const btn = document.getElementById('btnSave');
    if (btn) { btn.disabled = true; btn.textContent = 'Aguarde...'; }

    try {
        const url = editingId ? `${API_URL}/ordens/${editingId}` : `${API_URL}/ordens`;
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Erro ' + res.status);
        }

        const saved = await res.json();
        showToast(editingId ? `Ordem Nº ${saved.numero_ordem} atualizada` : `Ordem Nº ${saved.numero_ordem} criada`, 'success');
        closeForm(false);
        await carregarTudo();
    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Salvar'; }
    }
}

// ─── STATUS / DELETE ────────────────────────────────────────
async function toggleStatus(id) {
    const o = ordens.find(x => String(x.id) === String(id));
    if (!o) return;

    const novo = o.status === 'aberta' ? 'fechada' : 'aberta';
    const old = o.status;
    o.status = novo;
    updateDisplay();

    try {
        const res = await fetch(`${API_URL}/ordens/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ status: novo })
        });
        if (!res.ok) throw new Error('Erro ' + res.status);
        const data = await res.json();
        const i = ordens.findIndex(x => String(x.id) === String(id));
        if (i !== -1) ordens[i] = data;
        showToast(`Ordem Nº ${o.numero_ordem} ${novo}`, novo === 'fechada' ? 'success' : 'error');
    } catch {
        o.status = old;
        updateDisplay();
        showToast('Erro ao alterar status', 'error');
    }
}

function deleteOrdem(id) {
    const o = ordens.find(x => String(x.id) === String(id));
    if (!o) return;
    document.getElementById('deleteModalHost')?.remove();
    const host = document.createElement('div');
    host.id = 'deleteModalHost';
    host.innerHTML = `
        <div class="m-modal-overlay" id="deleteModal">
            <div class="m-modal">
                <div class="m-modal-header">
                    <h2>Excluir Ordem</h2>
                    <button class="m-close" onclick="closeDelete()">✕</button>
                </div>
                <p class="m-confirm-msg">Excluir a ordem Nº ${escHtml(o.numero_ordem)}?</p>
                <div class="m-form-actions centered">
                    <button class="m-btn secondary" onclick="closeDelete()">Não</button>
                    <button class="m-btn del" onclick="confirmDelete('${o.id}')">Sim</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(host);
}
function closeDelete() { document.getElementById('deleteModalHost')?.remove(); }

async function confirmDelete(id) {
    closeDelete();
    try {
        const res = await fetch(`${API_URL}/ordens/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (!res.ok && res.status !== 204) throw new Error('Erro ' + res.status);
        showToast('Ordem excluída', 'success');
        await carregarTudo();
    } catch {
        showToast('Erro ao excluir', 'error');
    }
}

// ─── DUPLICAR ───────────────────────────────────────────────
function abrirDuplicar() {
    document.getElementById('duplicarHost')?.remove();
    const host = document.createElement('div');
    host.id = 'duplicarHost';
    host.innerHTML = `
        <div class="m-modal-overlay" id="duplicarModal">
            <div class="m-modal">
                <div class="m-modal-header">
                    <h2>Duplicar Ordem</h2>
                    <button class="m-close" onclick="fecharDuplicar()">✕</button>
                </div>
                <label style="font-size:0.78rem; font-weight:600; text-transform:uppercase;">Número da ordem</label>
                <input type="text" id="numeroDuplicar" placeholder="Ex: 1250" style="margin-top:0.35rem; padding:0.85rem 1rem; border:1.5px solid var(--border); border-radius:12px; background:var(--input-bg); font-size:1rem; width:100%;">
                <div id="duplicarErro" style="color:#EF4444; font-size:0.85rem; margin-top:0.5rem; display:none;"></div>
                <div class="m-form-actions centered" style="margin-top:1.25rem;">
                    <button class="m-btn secondary" onclick="fecharDuplicar()">Cancelar</button>
                    <button class="m-btn primary" onclick="confirmarDuplicar()">Confirmar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(host);
    document.getElementById('numeroDuplicar').focus();
}
function fecharDuplicar() { document.getElementById('duplicarHost')?.remove(); }

async function confirmarDuplicar() {
    const numero = document.getElementById('numeroDuplicar')?.value.trim();
    if (!numero) return;

    try {
        const res = await fetch(`${API_URL}/ordens/numero/${numero}`, { headers: getHeaders() });
        if (res.status === 404) {
            const e = document.getElementById('duplicarErro');
            if (e) { e.style.display = 'block'; e.textContent = 'Esta ordem ainda não existe.'; }
            return;
        }
        if (!res.ok) throw new Error('Erro ' + res.status);

        const o = await res.json();
        fecharDuplicar();

        const hoje = new Date().toISOString().split('T')[0];
        const nova = {
            numeroOrdem: o.numero_ordem,
            responsavel: o.responsavel || '',
            dataOrdem: hoje,
            razaoSocial: o.razao_social || '',
            nomeFantasia: o.nome_fantasia || '',
            cnpj: o.cnpj || '',
            enderecoFornecedor: o.endereco_fornecedor || '',
            contato: o.contato || '',
            telefone: o.telefone || '',
            email: o.email || '',
            items: (o.items || []).map(it => ({
                item: it.item, especificacao: it.especificacao, quantidade: it.quantidade,
                unidade: it.unidade, valorUnitario: it.valorUnitario || 0,
                ipi: it.ipi || '', st: it.st || '', valorTotal: it.valorTotal || 'R$ 0,00'
            })),
            valorTotal: o.valor_total || 'R$ 0,00',
            frete: o.frete || 'CIF',
            localEntrega: o.local_entrega || '',
            prazoEntrega: o.prazo_entrega || 'IMEDIATO',
            transporte: o.transporte || 'FORNECEDOR',
            formaPagamento: o.forma_pagamento || '',
            prazoPagamento: o.prazo_pagamento || '',
            dadosBancarios: o.dados_bancarios || '',
            status: 'aberta'
        };

        const criar = await fetch(`${API_URL}/ordens`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(nova)
        });
        if (!criar.ok) throw new Error('Erro ' + criar.status);
        const salva = await criar.json();
        showToast(`Ordem Nº ${salva.numero_ordem} duplicada`, 'success');
        await carregarTudo();
    } catch (err) {
        showToast('Erro ao duplicar: ' + err.message, 'error');
    }
}

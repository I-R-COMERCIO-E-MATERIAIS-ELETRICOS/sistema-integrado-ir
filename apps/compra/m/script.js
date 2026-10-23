(() => {
"use strict";

const API_URL = window.location.origin + '/api';
const SESSION_KEY = 'irUserSession';
const MODULE_SESSION_KEY = 'ordemCompraSession';

let ordens = [];
let currentMonth = new Date();
let editingId = null;
let itemCounter = 0;
let sessionToken = null;
let fornecedoresCache = {};
let ultimoNumeroGlobal = 0;
let currentUserName = null;
const KNOWN_RESPONSAVEIS = ['ROBERTO', 'ISAQUE', 'VICTOR'];

const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();
});

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
        if (window.IR) IR.denied('Sessão expirada'); else document.body.innerHTML = '<div class="empty-state"><h1>SESSÃO EXPIRADA</h1></div>';
        return;
    }

    if (window.IR) IR.setToken(sessionToken);
    fetchSessionUser();
    inicializarApp();
}

async function fetchSessionUser() {
    if (!sessionToken) return;
    try {
        const r = await fetch(`${window.location.origin}/api/portal/verify-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionToken })
        });
        if (!r.ok) return;
        const d = await r.json();
        if (d.valid && d.session && d.session.name) currentUserName = d.session.name;
    } catch (e) {}
}

const getHeaders = () => {
    const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (sessionToken) h['X-Session-Token'] = sessionToken;
    return h;
};

const api = async (url, opts = {}) => {
    const r = await fetch(url, { ...opts, headers: { ...getHeaders(), ...(opts.headers || {}) }, credentials: 'same-origin' });
    if (r.status === 401 || r.status === 403) {
        sessionStorage.removeItem(MODULE_SESSION_KEY);
        if (window.IR) IR.denied('Sessão expirada'); else document.body.innerHTML = '<div class="empty-state"><h1>SESSÃO EXPIRADA</h1></div>';
        throw new Error('Sessão expirada');
    }
    if (!r.ok) {
        let e = {};
        try { e = await r.json(); } catch {}
        throw new Error(e.error || `Erro ${r.status}`);
    }
    return r.status === 204 ? null : r.json();
};

const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const up = s => String(s??'').toUpperCase();
const formatCurrency = value => parseFloat(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = dateString => { if (!dateString) return '-'; return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR'); };
const parseFloatLocale = str => {
    if (typeof str !== 'number') return NaN;
    return str;
};

function showToast(message, type = 'success') {
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

$('addBtn').addEventListener('click', () => openFormModal());
$('searchInput').addEventListener('input', () => updateTable());
$('filterResponsavel').addEventListener('change', () => updateTable());
$('filterStatus').addEventListener('change', () => updateTable());
$('monthPrev').addEventListener('click', () => changeMonth(-1));
$('monthNext').addEventListener('click', () => changeMonth(1));
$('syncBtn').addEventListener('click', () => syncData());
$('duplicateBtn').addEventListener('click', () => abrirModalDuplicar());

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

function detectResponsavelFromUser(name) {
    if (!name) return '';
    const upper = name.trim().toUpperCase();
    for (const resp of KNOWN_RESPONSAVEIS) {
        if (upper === resp || upper.startsWith(resp + ' ') || upper.startsWith(resp + '.')) return resp;
    }
    return '';
}

function updateMonthDisplay() {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    $('currentMonth').textContent = `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
}

function changeMonth(direction) {
    currentMonth.setMonth(currentMonth.getMonth() + direction);
    ordens = [];
    updateMonthDisplay();
    $('list').innerHTML = '';
    loadOrdensDirectly();
}

async function inicializarApp() {
    updateMonthDisplay();
    await Promise.all([loadOrdensDirectly(), loadUltimoNumero(), loadFornecedoresGlobal()]);
    setInterval(() => loadOrdensDirectly(), 30000);
}

async function loadOrdensDirectly() {
    const mesFetch = currentMonth.getMonth();
    const anoFetch = currentMonth.getFullYear();
    try {
        const data = await api(`${API_URL}/ordens?mes=${mesFetch}&ano=${anoFetch}`);
        if (mesFetch !== currentMonth.getMonth() || anoFetch !== currentMonth.getFullYear()) return;
        ordens = data;
        mesclarCacheFornecedores(data);
        updateDisplay();
    } catch (error) { console.error('Erro ao carregar ordens:', error); }
}

async function loadFornecedoresGlobal() {
    try {
        const lista = await api(`${API_URL}/fornecedores`);
        lista.forEach(f => {
            const razao = up(f.razao_social || '').trim();
            if (razao && !fornecedoresCache[razao]) {
                fornecedoresCache[razao] = {
                    razaoSocial: up(f.razao_social || ''),
                    nomeFantasia: up(f.nome_fantasia || ''),
                    cnpj: f.cnpj || '',
                    enderecoFornecedor: up(f.endereco_fornecedor || ''),
                    site: f.site || '',
                    contato: up(f.contato || ''),
                    telefone: f.telefone || '',
                    email: f.email || ''
                };
            }
        });
    } catch (e) { console.error('Erro fornecedores:', e); }
}

async function loadUltimoNumero() {
    try {
        const data = await api(`${API_URL}/ordens/ultimo-numero`);
        ultimoNumeroGlobal = data.ultimoNumero || 0;
        updateDashboard();
    } catch (e) { console.error('Erro ultimo numero:', e); }
}

async function syncData() {
    const btn = $('syncBtn');
    btn.classList.add('spinning');
    try {
        await loadOrdensDirectly();
        await loadUltimoNumero();
        showToast('Dados sincronizados', 'success');
    } catch (e) {
        showToast('Erro ao sincronizar', 'error');
    } finally {
        setTimeout(() => btn.classList.remove('spinning'), 600);
    }
}

function mesclarCacheFornecedores(lista) {
    lista.forEach(ordem => {
        const razaoSocial = up(ordem.razao_social || ordem.razaoSocial || '').trim();
        if (!razaoSocial) return;
        fornecedoresCache[razaoSocial] = {
            razaoSocial: up(ordem.razao_social || ordem.razaoSocial),
            nomeFantasia: up(ordem.nome_fantasia || ordem.nomeFantasia || ''),
            cnpj: ordem.cnpj || '',
            enderecoFornecedor: up(ordem.endereco_fornecedor || ordem.enderecoFornecedor || ''),
            site: ordem.site || '',
            contato: up(ordem.contato || ''),
            telefone: ordem.telefone || '',
            email: ordem.email || ''
        };
    });
}

function updateDisplay() {
    updateMonthDisplay();
    updateDashboard();
    updateTable();
    updateResponsaveisFilter();
}

function updateDashboard() {
    const totalFechadas = ordens.filter(o => o.status === 'fechada').length;
    const totalAbertas = ordens.filter(o => o.status === 'aberta').length;
    $('totalOrdens').textContent = ultimoNumeroGlobal;
    $('totalFechadas').textContent = totalFechadas;
    $('totalAbertas').textContent = totalAbertas;
    
    let valorTotalMes = 0;
    ordens.forEach(ordem => {
        const valorStr = (ordem.valor_total || ordem.valorTotal || 'R$ 0,00').replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        valorTotalMes += parseFloat(valorStr) || 0;
    });
    $('valorTotal').textContent = formatCurrency(valorTotalMes);
}

function updateResponsaveisFilter() {
    const responsaveis = new Set();
    ordens.forEach(o => { if (o.responsavel?.trim()) responsaveis.add(o.responsavel.trim()); });
    const select = $('filterResponsavel');
    const currentValue = select.value;
    select.innerHTML = '<option value="">Responsável</option>';
    Array.from(responsaveis).sort().forEach(r => { 
        const option = document.createElement('option'); 
        option.value = r; 
        option.textContent = up(r); 
        select.appendChild(option); 
    });
    select.value = currentValue;
}

function updateTable() {
    const container = $('list');
    const empty = $('emptyState');
    let filtered = ordens;
    const search = $('searchInput').value.toLowerCase();
    const filterResp = $('filterResponsavel').value;
    const filterStatus = $('filterStatus').value;

    if (search) filtered = filtered.filter(o => (o.numero_ordem || '').toLowerCase().includes(search) || (o.razao_social || '').toLowerCase().includes(search) || (o.responsavel || '').toLowerCase().includes(search));
    if (filterResp) filtered = filtered.filter(o => o.responsavel === filterResp);
    if (filterStatus) filtered = filtered.filter(o => o.status === filterStatus);

    if (filtered.length === 0) { 
        container.innerHTML = ''; 
        empty.hidden = false; 
        return; 
    }
    empty.hidden = true;

    filtered.sort((a, b) => (parseInt(a.numero_ordem) - parseInt(b.numero_ordem)));

    container.innerHTML = filtered.map(ordem => {
        const isFechada = ordem.status === 'fechada';
        return `
            <div class="order-card ${isFechada ? 'row-fechada' : ''}" data-id="${ordem.id}">
                <div class="card-top">
                    <div class="card-top-left">
                        <div class="checkbox-wrapper">
                            <input type="checkbox" class="styled-checkbox status-chk" id="chk-${ordem.id}" ${isFechada ? 'checked' : ''} data-id="${ordem.id}">
                            <label for="chk-${ordem.id}" class="checkbox-label-styled"></label>
                        </div>
                        <span class="card-numero">Nº ${esc(ordem.numero_ordem)}</span>
                    </div>
                    <span class="badge-status ${ordem.status}">${up(ordem.status)}</span>
                </div>
                <div class="card-grid">
                    <div class="card-cell"><span class="cell-label">Responsável</span><span class="cell-value">${esc(up(ordem.responsavel))}</span></div>
                    <div class="card-cell"><span class="cell-label">Data</span><span class="cell-value">${esc(formatDate(ordem.data_ordem))}</span></div>
                    <div class="card-cell full"><span class="cell-label">Fornecedor</span><span class="cell-value">${esc(up(ordem.razao_social))}</span></div>
                    <div class="card-cell full"><span class="cell-label">Valor Total</span><span class="cell-value valor">${esc(ordem.valor_total)}</span></div>
                </div>
                <div class="card-actions">
                    <button type="button" class="action-btn edit" data-edit="${ordem.id}">Editar</button>
                    <button type="button" class="action-btn pdf" data-pdf="${ordem.id}">PDF</button>
                    <button type="button" class="action-btn delete" data-del="${ordem.id}">Excluir</button>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); editOrdem(b.dataset.edit); }));
    container.querySelectorAll('[data-pdf]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); generatePDF(b.dataset.pdf); }));
    container.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); confirmDeleteFlow(b.dataset.del); }));
    
    container.querySelectorAll('.status-chk').forEach(chk => {
        chk.addEventListener('change', async e => {
            e.stopPropagation();
            await toggleStatus(chk.dataset.id, chk.checked, chk);
        });
        chk.addEventListener('click', e => e.stopPropagation());
    });

    container.querySelectorAll('.order-card').forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.closest('button') || e.target.closest('.checkbox-wrapper')) return;
            viewOrdem(card.dataset.id);
        });
    });
}

async function toggleStatus(id, isChecked, chkEl) {
    const ordem = ordens.find(o => String(o.id) === String(id));
    if (!ordem) return;
    const novoStatus = isChecked ? 'fechada' : 'aberta';
    ordem.status = novoStatus;
    
    const card = chkEl.closest('.order-card');
    if (card) {
        card.classList.toggle('row-fechada', isChecked);
        const badge = card.querySelector('.badge-status');
        if (badge) { badge.className = `badge-status ${novoStatus}`; badge.textContent = up(novoStatus); }
    }

    try {
        await api(`${API_URL}/ordens/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: novoStatus }) });
        showToast(`Ordem Nº ${ordem.numero_ordem} ${novoStatus === 'fechada' ? 'fechada' : 'aberta'}`, 'success');
        updateDashboard();
    } catch (error) {
        ordem.status = isChecked ? 'aberta' : 'fechada';
        if (chkEl) chkEl.checked = !isChecked;
        updateTable();
        showToast('Erro ao atualizar status', 'error');
    }
}

function getNextOrderNumber() {
    return ultimoNumeroGlobal > 0 ? (ultimoNumeroGlobal + 1).toString() : '1250';
}

/* ─── FORM MODAL ─── */
function openFormModal() {
    editingId = null;
    $('ordemForm').reset();
    $('editId').value = '';
    $('formTitle').textContent = 'Nova Ordem';
    $('numeroOrdem').value = getNextOrderNumber();
    $('dataOrdem').value = new Date().toISOString().split('T')[0];
    $('responsavel').value = detectResponsavelFromUser(currentUserName);
    $('itemsBody').innerHTML = '';
    itemCounter = 0;
    
    // Reseta abas
    document.querySelectorAll('.modal-tab[data-tab]').forEach((t, i) => t.classList.toggle('active', i === 0));
    document.querySelectorAll('.tab-pane[data-pane]').forEach((p, i) => p.classList.toggle('active', i === 0));

    addItem();
    open('formModal');
}

async function editOrdem(id) {
    const ordem = ordens.find(o => String(o.id) === String(id));
    if (!ordem) return;
    
    editingId = id;
    $('editId').value = id;
    $('formTitle').textContent = 'Editar Ordem';
    $('numeroOrdem').value = ordem.numero_ordem || '';
    $('responsavel').value = up(ordem.responsavel || '');
    $('dataOrdem').value = ordem.data_ordem || '';
    $('razaoSocial').value = up(ordem.razao_social || '');
    $('nomeFantasia').value = up(ordem.nome_fantasia || '');
    $('cnpj').value = ordem.cnpj || '';
    $('enderecoFornecedor').value = up(ordem.endereco_fornecedor || '');
    $('site').value = ordem.site || '';
    $('contato').value = up(ordem.contato || '');
    $('telefone').value = ordem.telefone || '';
    $('email').value = ordem.email || '';
    $('valorTotalOrdem').value = ordem.valor_total || 'R$ 0,00';
    $('frete').value = up(ordem.frete || 'CIF');
    $('localEntrega').value = up(ordem.local_entrega || 'RUA TADORNA Nº 472, SALA 2, NOVO HORIZONTE - SERRA/ES  |  CEP: 29.163-318');
    $('prazoEntrega').value = up(ordem.prazo_entrega || 'IMEDIATO');
    $('transporte').value = up(ordem.transporte || 'FORNECEDOR');
    $('formaPagamento').value = up(ordem.forma_pagamento || '');
    $('dadosBancarios').value = up(ordem.dados_bancarios || '');
    $('prazoPagamento').value = up(ordem.prazo_pagamento || '');

    $('itemsBody').innerHTML = '';
    itemCounter = 0;
    
    if (ordem.items && ordem.items.length > 0) {
        ordem.items.forEach(item => {
            addItem();
            const card = $('itemsBody').lastElementChild;
            card.querySelector('.item-especificacao').value = up(item.especificacao || '');
            card.querySelector('.item-qtd').value = item.quantidade || 1;
            card.querySelector('.item-unid').value = up(item.unidade || 'UN');
            card.querySelector('.item-valor').value = item.valor_unitario || 0;
            card.querySelector('.item-ipi').value = item.ipi || '';
            card.querySelector('.item-st').value = up(item.st || '');
        });
        recalculateOrderTotal();
    } else {
        addItem();
    }

    document.querySelectorAll('.modal-tab[data-tab]').forEach((t, i) => t.classList.toggle('active', i === 0));
    document.querySelectorAll('.tab-pane[data-pane]').forEach((p, i) => p.classList.toggle('active', i === 0));

    open('formModal');
}

function addItem() {
    itemCounter++;
    const div = document.createElement('div');
    div.className = 'item-row-card';
    div.innerHTML = `
        <div class="item-row-top">
            <span class="item-row-num">Item ${itemCounter}</span>
            <button type="button" class="btn-del-item" onclick="this.closest('.item-row-card').remove(); recalculateOrderTotal();">Excluir</button>
        </div>
        <div class="field"><label>Especificação</label><textarea class="item-especificacao" rows="2" placeholder="Descrição detalhada..."></textarea></div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div class="field"><label>QTD</label><input type="number" class="item-qtd" value="1" min="0" step="0.01" onchange="calculateItemTotal(this)"></div>
            <div class="field"><label>UNID</label><input type="text" class="item-unid" value="UN"></div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div class="field"><label>Valor UN (R$)</label><input type="number" class="item-valor" value="0" min="0" step="0.01" onchange="calculateItemTotal(this)"></div>
            <div class="field"><label>IPI</label><input type="text" class="item-ipi" placeholder="Ex: 15.50"></div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div class="field"><label>ST</label><input type="text" class="item-st" placeholder="Ex: Não incluído"></div>
            <div class="field"><label>Total</label><input type="text" class="item-total" readonly value="R$ 0,00" style="background:#E5E7EB;font-weight:bold;"></div>
        </div>
    `;
    $('itemsBody').appendChild(div);
    
    div.querySelectorAll('input[type="text"], textarea').forEach(input => {
        input.addEventListener('input', function() {
            const start = this.selectionStart;
            this.value = this.value.toUpperCase();
            this.setSelectionRange(start, start);
        });
    });
}

$('btnAddItem').addEventListener('click', () => addItem());

window.calculateItemTotal = function(input) {
    const card = input.closest('.item-row-card');
    const qtd = parseFloat(card.querySelector('.item-qtd').value) || 0;
    const valor = parseFloat(card.querySelector('.item-valor').value) || 0;
    const ipiStr = card.querySelector('.item-ipi').value;
    const ipiNum = parseFloat(ipiStr);
    let total = qtd * valor;
    if (!isNaN(ipiNum)) total += ipiNum;
    card.querySelector('.item-total').value = formatCurrency(total);
    recalculateOrderTotal();
};

window.recalculateOrderTotal = function() {
    let sum = 0;
    document.querySelectorAll('.item-total').forEach(input => {
        const value = input.value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        sum += parseFloat(value) || 0;
    });
    $('valorTotalOrdem').value = formatCurrency(sum);
};

$('ordemForm').addEventListener('submit', async e => {
    e.preventDefault();
    const items = [];
    document.querySelectorAll('.item-row-card').forEach((card, index) => {
        items.push({
            item: index + 1,
            especificacao: up(card.querySelector('.item-especificacao').value),
            quantidade: parseFloat(card.querySelector('.item-qtd').value) || 0,
            unidade: up(card.querySelector('.item-unid').value),
            valorUnitario: parseFloat(card.querySelector('.item-valor').value) || 0,
            ipi: card.querySelector('.item-ipi').value,
            st: up(card.querySelector('.item-st').value),
            valorTotal: card.querySelector('.item-total').value
        });
    });

    const formData = {
        numeroOrdem: $('numeroOrdem').value,
        responsavel: up($('responsavel').value),
        dataOrdem: $('dataOrdem').value,
        razaoSocial: up($('razaoSocial').value),
        nomeFantasia: up($('nomeFantasia').value),
        cnpj: $('cnpj').value,
        enderecoFornecedor: up($('enderecoFornecedor').value),
        site: $('site').value,
        contato: up($('contato').value),
        telefone: $('telefone').value,
        email: $('email').value,
        items: items,
        valorTotal: $('valorTotalOrdem').value,
        frete: up($('frete').value),
        localEntrega: up($('localEntrega').value),
        prazoEntrega: up($('prazoEntrega').value),
        transporte: up($('transporte').value),
        formaPagamento: up($('formaPagamento').value),
        dadosBancarios: up($('dadosBancarios').value),
        prazoPagamento: up($('prazoPagamento').value),
        status: 'aberta'
    };

    const btn = $('btnSave');
    btn.disabled = true;
    btn.textContent = 'Aguarde...';

    try {
        const url = editingId ? `${API_URL}/ordens/${editingId}` : `${API_URL}/ordens`;
        const method = editingId ? 'PUT' : 'POST';
        const savedData = await api(url, { method, body: JSON.stringify(formData) });
        
        if (editingId) {
            const idx = ordens.findIndex(o => String(o.id) === String(editingId));
            if (idx !== -1) ordens[idx] = savedData;
            showToast(`Ordem Nº ${savedData.numero_ordem} atualizada`, 'success');
        } else {
            ordens.push(savedData);
            showToast(`Ordem Nº ${savedData.numero_ordem} aberta`, 'success');
        }
        
        close('formModal');
        await loadUltimoNumero();
        updateDisplay();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar';
    }
});

/* ─── VIEW MODAL ─── */
function viewOrdem(id) {
    const ordem = ordens.find(o => String(o.id) === String(id));
    if (!ordem) return;
    $('viewNumero').textContent = ordem.numero_ordem || '';

    $('vgeral').innerHTML = `
        <div class="info-section">
            <h4>Informações Gerais</h4>
            <p><strong>Responsável:</strong> ${esc(up(ordem.responsavel))}</p>
            <p><strong>Data:</strong> ${esc(formatDate(ordem.data_ordem))}</p>
            <p><strong>Status:</strong> <span class="badge-status ${ordem.status}">${up(ordem.status)}</span></p>
        </div>`;
    
    $('vfornecedor').innerHTML = `
        <div class="info-section">
            <h4>Dados do Fornecedor</h4>
            <p><strong>Razão Social:</strong> ${esc(up(ordem.razao_social))}</p>
            ${ordem.nome_fantasia ? `<p><strong>Nome Fantasia:</strong> ${esc(up(ordem.nome_fantasia))}</p>` : ''}
            <p><strong>CNPJ:</strong> ${esc(ordem.cnpj)}</p>
            ${ordem.endereco_fornecedor ? `<p><strong>Endereço:</strong> ${esc(up(ordem.endereco_fornecedor))}</p>` : ''}
            ${ordem.contato ? `<p><strong>Contato:</strong> ${esc(up(ordem.contato))}</p>` : ''}
            ${ordem.telefone ? `<p><strong>Telefone:</strong> ${esc(ordem.telefone)}</p>` : ''}
            ${ordem.email ? `<p><strong>E-mail:</strong> ${esc(ordem.email)}</p>` : ''}
        </div>`;

    const itemsHtml = (ordem.items || []).map(item => `
        <tr>
            <td>${item.item}</td>
            <td style="text-align:left;">${esc(up(item.especificacao))}</td>
            <td>${item.quantidade}</td>
            <td>${esc(up(item.unidade))}</td>
            <td>${formatCurrency(item.valorUnitario)}</td>
            <td>${item.valorTotal}</td>
        </tr>`).join('');

    $('vpedido').innerHTML = `
        <div class="info-section">
            <h4>Itens do Pedido</h4>
            <table>
                <thead><tr><th>Item</th><th>Especificação</th><th>QTD</th><th>UN</th><th>V. UN</th><th>Total</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <p style="margin-top:10px;"><strong>Valor Total:</strong> ${esc(ordem.valor_total)}</p>
            ${ordem.frete ? `<p><strong>Frete:</strong> ${esc(up(ordem.frete))}</p>` : ''}
        </div>`;

    $('ventrega').innerHTML = `
        <div class="info-section">
            <h4>Informações de Entrega</h4>
            <p><strong>Local de Entrega:</strong> ${esc(up(ordem.local_entrega))}</p>
            <p><strong>Prazo de Entrega:</strong> ${esc(up(ordem.prazo_entrega))}</p>
            <p><strong>Transporte:</strong> ${esc(up(ordem.transporte))}</p>
        </div>`;

    $('vpagamento').innerHTML = `
        <div class="info-section">
            <h4>Dados de Pagamento</h4>
            <p><strong>Forma de Pagamento:</strong> ${esc(up(ordem.forma_pagamento))}</p>
            <p><strong>Prazo de Pagamento:</strong> ${esc(up(ordem.prazo_pagamento))}</p>
            ${ordem.dados_bancarios ? `<p><strong>Dados Bancários:</strong> ${esc(up(ordem.dados_bancarios))}</p>` : ''}
        </div>`;

    document.querySelectorAll('.modal-tab[data-vtab]').forEach((t, i) => t.classList.toggle('active', i === 0));
    document.querySelectorAll('.tab-pane[data-vpane]').forEach((p, i) => p.classList.toggle('active', i === 0));
    open('viewModal');
}

/* ─── DELETE MODAL ─── */
function confirmDeleteFlow(id) {
    const ordem = ordens.find(o => String(o.id) === String(id));
    if (!ordem) return;
    const btn = $('confirmDeleteBtn');
    btn.onclick = () => executeDelete(id, ordem.numero_ordem);
    open('deleteModal');
}

async function executeDelete(id, numero) {
    close('deleteModal');
    try {
        await api(`${API_URL}/ordens/${id}`, { method: 'DELETE' });
        ordens = ordens.filter(o => String(o.id) !== String(id));
        updateDisplay();
        await loadUltimoNumero();
        showToast(`Ordem Nº ${numero} excluída`, 'success');
    } catch (error) {
        showToast('Erro ao excluir ordem', 'error');
    }
}

/* ─── DUPLICATE MODAL ─── */
function abrirModalDuplicar() {
    $('duplicateInput').value = '';
    $('duplicateError').style.display = 'none';
    open('duplicateModal');
    setTimeout(() => $('duplicateInput').focus(), 100);
}

$('duplicateInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('confirmDuplicateBtn').click();
});

$('confirmDuplicateBtn').addEventListener('click', async () => {
    const numero = $('duplicateInput').value.trim();
    if (!numero) return;

    try {
        const original = await api(`${API_URL}/ordens/numero/${numero}`);
        close('duplicateModal');

        const dadosCopia = {
            numeroOrdem: original.numero_ordem,
            responsavel: original.responsavel || '',
            dataOrdem: new Date().toISOString().split('T')[0],
            razaoSocial: original.razao_social || '',
            nomeFantasia: original.nome_fantasia || '',
            cnpj: original.cnpj || '',
            enderecoFornecedor: original.endereco_fornecedor || '',
            site: original.site || '',
            contato: original.contato || '',
            telefone: original.telefone || '',
            email: original.email || '',
            items: (original.items || []).map(item => ({
                item: item.item || 0,
                especificacao: item.especificacao || '',
                quantidade: item.quantidade || 0,
                unidade: item.unidade || 'UN',
                valorUnitario: item.valor_unitario || 0,
                ipi: item.ipi || '',
                st: item.st || '',
                valorTotal: item.valor_total || 'R$ 0,00'
            })),
            valorTotal: original.valor_total || 'R$ 0,00',
            frete: original.frete || 'CIF',
            localEntrega: original.local_entrega || '',
            prazoEntrega: original.prazo_entrega || 'IMEDIATO',
            transporte: original.transporte || 'FORNECEDOR',
            formaPagamento: original.forma_pagamento || '',
            prazoPagamento: original.prazo_pagamento || '',
            dadosBancarios: original.dados_bancarios || '',
            status: 'aberta'
        };

        const novaOrdem = await api(`${API_URL}/ordens`, { method: 'POST', body: JSON.stringify(dadosCopia) });
        ordens.push(novaOrdem);
        updateDisplay();
        await loadUltimoNumero();
        showToast(`Ordem Nº ${novaOrdem.numero_ordem} duplicada!`, 'success');
    } catch (error) {
        if (error.message.includes('404') || error.message.includes('não encontrada')) {
            $('duplicateError').style.display = 'block';
        } else {
            showToast(error.message, 'error');
        }
    }
});

/* ─── PDF GENERATION ─── */
function generatePDF(id) {
    const ordem = ordens.find(o => String(o.id) === String(id));
    if (!ordem) { showToast('Ordem não encontrada!', 'error'); return; }
    if (typeof window.jspdf === 'undefined') {
        showToast('Biblioteca PDF não carregou. Recarregue a página.', 'error');
        return;
    }
    generatePDFForOrdem(ordem);
}

function drawPageHeader(doc, ordem, pageWidth, logoImage, includeTitle = true) {
    let y = 3;
    if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
        try {
            const logoWidth = 40;
            const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
            doc.setGState(new doc.GState({ opacity: 0.3 }));
            doc.addImage(logoImage, 'PNG', 5, y, logoWidth, logoHeight);
            doc.setGState(new doc.GState({ opacity: 1.0 }));
            const fontSize = logoHeight * 0.5;
            doc.setFontSize(fontSize);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(150, 150, 150);
            const textX = 5 + logoWidth + 1.2;
            const lineSpacing = fontSize * 0.5;
            const textY1 = y + fontSize * 0.85;
            doc.text('I.R COMÉRCIO E', textX, textY1);
            doc.text('MATERIAIS ELÉTRICOS LTDA', textX, textY1 + lineSpacing);
            doc.setTextColor(0, 0, 0);
            y = y + logoHeight + 8;
        } catch (e) { y = 25; }
    } else { y = 25; }

    if (!includeTitle) return y + 2;

    doc.setFontSize(18); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 0, 0);
    doc.text('ORDEM DE COMPRA', pageWidth / 2, y, { align: 'center' }); y += 8;
    doc.setFontSize(14);
    doc.text(`Nº ${ordem.numero_ordem}`, pageWidth / 2, y, { align: 'center' }); y += 12;
    return y;
}

function generatePDFForOrdem(ordem) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 5;
    const maxWidth = pageWidth - (2 * margin);

    const logoHeader = new Image();
    logoHeader.crossOrigin = 'anonymous';
    logoHeader.src = '/apps/imagens/I.R.-COMERCIO-E-MATERIAIS-ELETRICOS-LTDA-PDF.png';
    
    const onLogoLoad = () => {
        const y = drawPageHeader(doc, ordem, pageWidth, logoHeader, true);
        continuarGeracaoPDF(doc, ordem, y, margin, pageWidth, pageHeight, lineHeight, maxWidth, logoHeader);
    };
    logoHeader.onload = onLogoLoad;
    logoHeader.onerror = () => {
        const y = drawPageHeader(doc, ordem, pageWidth, null, true);
        continuarGeracaoPDF(doc, ordem, y, margin, pageWidth, pageHeight, lineHeight, maxWidth, null);
    };
}

function continuarGeracaoPDF(doc, ordem, startY, margin, pageWidth, pageHeight, lineHeight, maxWidth, logoImage) {
    let y = startY;
    const drawHeader = () => drawPageHeader(doc, ordem, pageWidth, logoImage, false);
    const ensureSpace = (currentY, needed) => { if (currentY + needed > pageHeight - 30) { doc.addPage(); return drawHeader(); } return currentY; };

    const addTextWithWrap = function (text, x, yStart, maxW, lineH = 5) {
        const lines = doc.splitTextToSize(text, maxW);
        let currentY = yStart;
        for (let i = 0; i < lines.length; i++) {
            currentY = ensureSpace(currentY, lineH);
            doc.text(lines[i], x, currentY);
            currentY += lineH;
        }
        return currentY;
    };

    const tableWidth = pageWidth - (2 * margin);
    const colWidths = { item: tableWidth * 0.05, especificacao: tableWidth * 0.35, qtd: tableWidth * 0.08, unid: tableWidth * 0.08, valorUn: tableWidth * 0.12, ipi: tableWidth * 0.10, st: tableWidth * 0.10, total: tableWidth * 0.12 };
    const itemRowHeight = 10;
    const headers = ['ITEM', 'ESPECIFICAÇÃO', 'QTD', 'UNID', 'VALOR UN', 'IPI', 'ST', 'TOTAL'];
    const colKeys = ['item', 'especificacao', 'qtd', 'unid', 'valorUn', 'ipi', 'st', 'total'];

    const drawTableHeader = (yPos) => {
        doc.setFillColor(108, 117, 125); doc.setDrawColor(180, 180, 180);
        doc.rect(margin, yPos, tableWidth, itemRowHeight, 'FD');
        doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont(undefined, 'bold');
        let xPos = margin;
        colKeys.forEach((key, i) => {
            doc.line(xPos, yPos, xPos, yPos + itemRowHeight);
            doc.text(headers[i], xPos + (colWidths[key] / 2), yPos + 6.5, { align: 'center' });
            xPos += colWidths[key];
        });
        doc.line(xPos, yPos, xPos, yPos + itemRowHeight);
        doc.setTextColor(0, 0, 0); doc.setFontSize(8); doc.setFont(undefined, 'normal');
        return yPos + itemRowHeight;
    };

    doc.setFontSize(11); doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold'); doc.text('DADOS PARA FATURAMENTO', margin, y); y += lineHeight + 1;
    doc.text('I.R. COMÉRCIO E MATERIAIS ELÉTRICOS LTDA', margin, y); y += lineHeight + 1;
    doc.setFont(undefined, 'normal');
    doc.text('CNPJ: 33.149.502/0001-38  |  IE: 083.780.74-2', margin, y); y += lineHeight + 1;
    doc.text('RUA TADORNA Nº 472, SALA 2', margin, y); y += lineHeight + 1;
    doc.text('NOVO HORIZONTE - SERRA/ES  |  CEP: 29.163-318', margin, y); y += lineHeight + 1;
    doc.text('TELEFAX: (27) 3209-4291  |  E-MAIL: COMERCIAL.IRCOMERCIO@GMAIL.COM', margin, y); y += 10;

    doc.setFont(undefined, 'bold'); doc.text('DADOS DO FORNECEDOR', margin, y); y += lineHeight + 1;
    doc.setFont(undefined, 'normal');
    doc.text('RAZÃO SOCIAL: ', margin, y);
    doc.setFont(undefined, 'bold');
    const razaoSocialTexto = up(ordem.razao_social);
    const razaoLines = doc.splitTextToSize(razaoSocialTexto, maxWidth - doc.getTextWidth('RAZÃO SOCIAL: '));
    doc.text(razaoLines[0], margin + doc.getTextWidth('RAZÃO SOCIAL: '), y);
    y += lineHeight;
    for (let i = 1; i < razaoLines.length; i++) {
        y = ensureSpace(y, lineHeight);
        doc.setFont(undefined, 'bold');
        doc.text(razaoLines[i], margin, y);
        y += lineHeight;
    }

    doc.setFont(undefined, 'normal');
    if (ordem.nome_fantasia) {
        y = ensureSpace(y, lineHeight + 1);
        doc.text('NOME FANTASIA: ', margin, y);
        doc.text(up(ordem.nome_fantasia), margin + doc.getTextWidth('NOME FANTASIA: '), y);
        y += lineHeight;
    }
    y = ensureSpace(y, lineHeight);
    doc.text('CNPJ: ', margin, y);
    doc.setFont(undefined, 'bold');
    doc.text(`${ordem.cnpj}`, margin + doc.getTextWidth('CNPJ: '), y);
    y += lineHeight;
    doc.setFont(undefined, 'normal');
    
    if (ordem.endereco_fornecedor) {
        y = ensureSpace(y, lineHeight + 1);
        doc.text('ENDEREÇO: ', margin, y);
        const endLines = doc.splitTextToSize(up(ordem.endereco_fornecedor), maxWidth - doc.getTextWidth('ENDEREÇO: '));
        doc.text(endLines[0], margin + doc.getTextWidth('ENDEREÇO: '), y);
        y += lineHeight;
        for (let i = 1; i < endLines.length; i++) {
            y = ensureSpace(y, lineHeight);
            doc.text(endLines[i], margin, y);
            y += lineHeight;
        }
    }
    if (ordem.site) { y = ensureSpace(y, lineHeight + 1); doc.text('SITE: ', margin, y); doc.text(ordem.site, margin + doc.getTextWidth('SITE: '), y); y += lineHeight; }
    if (ordem.contato) { y = ensureSpace(y, lineHeight + 1); doc.text('CONTATO: ', margin, y); doc.text(up(ordem.contato), margin + doc.getTextWidth('CONTATO: '), y); y += lineHeight; }
    if (ordem.telefone) { y = ensureSpace(y, lineHeight + 1); doc.text('TELEFONE: ', margin, y); doc.text(`${ordem.telefone}`, margin + doc.getTextWidth('TELEFONE: '), y); y += lineHeight; }
    if (ordem.email) { y = ensureSpace(y, lineHeight + 1); doc.text('E-MAIL: ', margin, y); doc.text(ordem.email, margin + doc.getTextWidth('E-MAIL: '), y); y += lineHeight; }
    y += 8;

    doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.text('ITENS DO PEDIDO', margin, y); y += 6;
    y = drawTableHeader(y);

    (ordem.items || []).forEach((item, index) => {
        const especLines = doc.splitTextToSize(up(item.especificacao), colWidths.especificacao - 6);
        const necessaryHeight = Math.max(itemRowHeight, especLines.length * 4 + 4);

        if (y + necessaryHeight > pageHeight - 30) {
            doc.addPage();
            y = drawHeader();
            doc.setFontSize(11); doc.setFont(undefined, 'bold');
            doc.text('ITENS DO PEDIDO (CONTINUAÇÃO)', margin, y); y += 6;
            y = drawTableHeader(y);
        }

        if (index % 2 !== 0) { doc.setFillColor(240, 240, 240); doc.rect(margin, y, tableWidth, necessaryHeight, 'F'); }

        let xPos = margin;
        doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
        doc.line(xPos, y, xPos, y + necessaryHeight);
        doc.text(item.item.toString(), xPos + (colWidths.item / 2), y + (necessaryHeight / 2) + 1.5, { align: 'center' });
        xPos += colWidths.item; doc.line(xPos, y, xPos, y + necessaryHeight);
        doc.text(especLines, xPos + 3, y + 4); xPos += colWidths.especificacao; doc.line(xPos, y, xPos, y + necessaryHeight);
        doc.text(item.quantidade.toString(), xPos + (colWidths.qtd / 2), y + (necessaryHeight / 2) + 1.5, { align: 'center' });
        xPos += colWidths.qtd; doc.line(xPos, y, xPos, y + necessaryHeight);
        doc.text(up(item.unidade), xPos + (colWidths.unid / 2), y + (necessaryHeight / 2) + 1.5, { align: 'center' });
        xPos += colWidths.unid; doc.line(xPos, y, xPos, y + necessaryHeight);
        
        const valorUn = item.valor_unitario || item.valorUnitario || 0;
        doc.text(formatCurrency(valorUn), xPos + (colWidths.valorUn / 2), y + (necessaryHeight / 2) + 1.5, { align: 'center' });
        xPos += colWidths.valorUn; doc.line(xPos, y, xPos, y + necessaryHeight);
        
        let ipiDisplay = '-';
        if (item.ipi && item.ipi.trim() !== '') {
            const ipiNum = parseFloat(item.ipi);
            ipiDisplay = !isNaN(ipiNum) ? formatCurrency(ipiNum) : up(item.ipi);
        }
        doc.text(ipiDisplay, xPos + (colWidths.ipi / 2), y + (necessaryHeight / 2) + 1.5, { align: 'center' });
        xPos += colWidths.ipi; doc.line(xPos, y, xPos, y + necessaryHeight);
        doc.text(up(item.st || '-'), xPos + (colWidths.st / 2), y + (necessaryHeight / 2) + 1.5, { align: 'center' });
        xPos += colWidths.st; doc.line(xPos, y, xPos, y + necessaryHeight);
        doc.text(item.valor_total || item.valorTotal || 'R$ 0,00', xPos + (colWidths.total / 2), y + (necessaryHeight / 2) + 1.5, { align: 'center' });
        xPos += colWidths.total; doc.line(xPos, y, xPos, y + necessaryHeight);
        doc.line(margin, y + necessaryHeight, margin + tableWidth, y + necessaryHeight);
        y += necessaryHeight;
    });

    y += 8;

    y = ensureSpace(y, 10);
    doc.setFontSize(11); doc.setFont(undefined, 'bold');
    doc.text(`VALOR TOTAL: ${ordem.valor_total}`, margin, y); y += 10;

    y = ensureSpace(y, 15);
    doc.setFontSize(11); doc.setFont(undefined, 'bold');
    doc.text('LOCAL DE ENTREGA:', margin, y); y += 5;
    doc.setFontSize(10); doc.setFont(undefined, 'normal');
    const localEntrega = up(ordem.local_entrega) || 'RUA TADORNA Nº 472, SALA 2, NOVO HORIZONTE - SERRA/ES  |  CEP: 29.163-318';
    y = addTextWithWrap(localEntrega, margin, y, maxWidth); y += 10;

    y = ensureSpace(y, 12);
    doc.setFontSize(10); doc.setFont(undefined, 'bold');
    doc.text('PRAZO DE ENTREGA:', margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(up(ordem.prazo_entrega || '-'), margin + 42, y);
    doc.setFont(undefined, 'bold');
    doc.text('FRETE:', pageWidth - margin - 35, y);
    doc.setFont(undefined, 'normal');
    doc.text(up(ordem.frete || '-'), pageWidth - margin - 20, y);
    y += 6;
    doc.setFont(undefined, 'bold');
    doc.text('TRANSPORTE:', margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(up(ordem.transporte || '-'), margin + 30, y);
    y += 10;

    y = ensureSpace(y, 15);
    doc.setFontSize(11); doc.setFont(undefined, 'bold');
    doc.text('CONDIÇÕES DE PAGAMENTO:', margin, y); y += 5;
    doc.setFontSize(10); doc.setFont(undefined, 'normal');
    doc.text(`FORMA: ${up(ordem.forma_pagamento)}`, margin, y); y += 5;
    doc.text(`PRAZO: ${up(ordem.prazo_pagamento)}`, margin, y);
    if (ordem.dados_bancarios) {
        y += 5;
        doc.setFont(undefined, 'bold');
        doc.text('DADOS BANCÁRIOS:', margin, y);
        y += 5;
        doc.setFont(undefined, 'normal');
        y = addTextWithWrap(up(ordem.dados_bancarios), margin, y, maxWidth);
    }
    y += 15;

    y = ensureSpace(y, 110);

    const dataAtual = new Date();
    const dia = dataAtual.getDate();
    const meses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    doc.setFontSize(10); doc.setFont(undefined, 'normal');
    doc.text(`SERRA/ES, ${dia} DE ${meses[dataAtual.getMonth()]} DE ${dataAtual.getFullYear()}`, pageWidth / 2, y, { align: 'center' });
    y += 5;

    const assinatura = new Image();
    assinatura.crossOrigin = 'anonymous';
    assinatura.src = '/apps/imagens/assinatura.png';
    assinatura.onload = function () {
        try {
            const imgWidth = 50;
            const imgHeight = (assinatura.height / assinatura.width) * imgWidth;
            doc.addImage(assinatura, 'PNG', (pageWidth / 2) - (imgWidth / 2), y + 2, imgWidth, imgHeight);
            let yFinal = y + imgHeight + 10;
            doc.setFontSize(10); doc.setFont(undefined, 'bold');
            doc.text('ROSEMEIRE BICALHO DE LIMA GRAVINO', pageWidth / 2, yFinal, { align: 'center' }); yFinal += 5;
            doc.setFontSize(9); doc.setFont(undefined, 'normal');
            doc.text('MG-10.078.568 / CPF: 045.160.616-78', pageWidth / 2, yFinal, { align: 'center' }); yFinal += 5;
            doc.text('DIRETORA', pageWidth / 2, yFinal, { align: 'center' }); yFinal += 12;
            adicionarRodapePDF(doc, ordem, yFinal, margin, pageWidth, pageHeight, logoImage);
        } catch (e) { gerarPDFSemAssinatura(); }
    };
    assinatura.onerror = function () { gerarPDFSemAssinatura(); };

    function gerarPDFSemAssinatura() {
        let yFinal = y + 10;
        doc.setFontSize(10); doc.setFont(undefined, 'bold');
        doc.text('ROSEMEIRE BICALHO DE LIMA GRAVINO', pageWidth / 2, yFinal, { align: 'center' }); yFinal += 5;
        doc.setFontSize(9); doc.setFont(undefined, 'normal');
        doc.text('MG-10.078.568 / CPF: 045.160.616-78', pageWidth / 2, yFinal, { align: 'center' }); yFinal += 5;
        doc.text('DIRETORA', pageWidth / 2, yFinal, { align: 'center' }); yFinal += 12;
        adicionarRodapePDF(doc, ordem, yFinal, margin, pageWidth, pageHeight, logoImage);
    }
}

function adicionarRodapePDF(doc, ordem, yFinal, margin, pageWidth, pageHeight, logoImage) {
    if (yFinal > pageHeight - 30) {
        doc.addPage();
        yFinal = drawPageHeader(doc, ordem, pageWidth, logoImage, false);
    }
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yFinal, pageWidth - (2 * margin), 22, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yFinal, pageWidth - (2 * margin), 22, 'S');
    yFinal += 6;
    doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(255, 82, 29);
    doc.text('ATENÇÃO SR. FORNECEDOR:', margin + 5, yFinal); yFinal += 5;
    doc.setTextColor(0, 0, 0); doc.setFont(undefined, 'normal'); doc.setFontSize(9);
    doc.text(`1) GENTILEZA MENCIONAR NA NOTA FISCAL O Nº ${ordem.numero_ordem}`, margin + 5, yFinal); yFinal += 5;
    doc.text('2) FAVOR ENVIAR A NOTA FISCAL ELETRÔNICA (ARQUIVO .XML) PARA: FINANCEIRO.IRCOMERCIO@GMAIL.COM', margin + 5, yFinal);
    doc.save(`${up(ordem.razao_social)}-${ordem.numero_ordem}.pdf`);
    showToast(`Ordem Nº ${ordem.numero_ordem} emitida`, 'success');
}

})();

// ============================================================
// Ordens de Compra · Desktop · I.R. Comércio
// ============================================================

const API_URL = window.location.origin + '/api';

let accessToken = null;
let currentUserName = null;
let currentUserIsAdmin = false;

let ordens = [];
let currentMonth = new Date();
let editingId = null;
let itemCounter = 0;
let currentTab = 0;
let fornecedoresCache = {};
let ultimoNumeroGlobal = 0;
let currentFetchController = null;
let primeiraCargaFeita = false;

const KNOWN_RESPONSAVEIS = ['ROBERTO', 'ISAQUE', 'MIGUEL'];
const tabs = ['tab-geral', 'tab-fornecedor', 'tab-pedido', 'tab-entrega', 'tab-pagamento'];

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
        <div style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#F4F5F7;color:#111;font-family:'Inter',system-ui,sans-serif;text-align:center;padding:2rem;z-index:2147483647;">
            <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:.75rem;">${msg || 'SEM ACESSO'}</h1>
            <p style="color:#5B6470;font-size:.95rem;">Você não tem permissão para acessar este módulo.</p>
        </div>
    `;
}

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
    const n = parseFloat(v);
    return isNaN(n) ? 'R$ 0,00' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(d) {
    if (!d) return '-';
    const dt = new Date(d + 'T00:00:00');
    return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('pt-BR');
}

function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function showToast(msg, type) {
    type = type || 'success';
    document.querySelectorAll('.floating-message').forEach(m => m.remove());
    const div = document.createElement('div');
    div.className = 'floating-message ' + type;
    div.textContent = String(msg || '');
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.transition = 'opacity 0.3s';
        div.style.opacity = '0';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

// ─── ESTADO VISUAL: "CARREGANDO..." NA TABELA ───────────────
function mostrarCarregando() {
    const c = document.getElementById('ordensContainer');
    if (!c) return;
    c.innerHTML = `
        <tr>
            <td colspan="8" style="text-align:center;padding:2.5rem;">
                <div style="display:inline-flex;align-items:center;gap:.6rem;color:#5B6470;font-size:.9rem;">
                    <span style="
                        width:18px;height:18px;border:3px solid rgba(255,82,29,.15);
                        border-top-color:#FF521D;border-radius:50%;
                        animation:spinLoad .8s linear infinite;display:inline-block;
                    "></span>
                    Carregando ordens...
                </div>
            </td>
        </tr>
        <style>@keyframes spinLoad{to{transform:rotate(360deg)}}</style>
    `;
}

document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { showDenied('SESSÃO EXPIRADA'); return; }

    updateMonthDisplay();
    mostrarCarregando();

    await fetchSessionUser();
    await carregarTudo();
    primeiraCargaFeita = true;

    // Depois da primeira carga, o refresh automático só recarrega as ordens,
    // a cada 60s (não precisa re-buscar fornecedores nem último número toda hora).
    setInterval(() => {
        if (!document.hidden) loadOrdens();
    }, 60000);
});

async function fetchSessionUser() {
    try {
        const res = await fetch('/api/portal/modules', { headers: getHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (data.user) {
            currentUserName = data.user.name || data.user.username || null;
            currentUserIsAdmin = !!data.user.is_admin;
        }
    } catch (e) {}
}

async function carregarTudo() {
    try {
        // Dispara os 3 fetches em paralelo. O que importa é que o loadOrdens
        // resolva rápido pra tabela parar de mostrar "Carregando...".
        await Promise.all([
            loadOrdens(),
            loadUltimoNumero(),
            loadFornecedoresGlobal()
        ]);
    } catch (err) {
        console.error('[compra] carregarTudo:', err);
    } finally {
        updateAuditBtn();
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'ir-module-ready', module: 'compra' }, '*');
            }
        } catch (e) {}
    }
}

async function loadOrdens() {
    if (currentFetchController) currentFetchController.abort();
    currentFetchController = new AbortController();
    const signal = currentFetchController.signal;

    const mes = currentMonth.getMonth();
    const ano = currentMonth.getFullYear();

    try {
        const res = await fetch(`${API_URL}/ordens?mes=${mes}&ano=${ano}`, {
            method: 'GET',
            headers: getHeaders(),
            cache: 'no-cache',
            signal
        });

        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (!res.ok) throw new Error('Erro ' + res.status);

        const data = await res.json();
        if (mes !== currentMonth.getMonth() || ano !== currentMonth.getFullYear()) return;

        ordens = Array.isArray(data) ? data : [];
        mesclarCacheFornecedores(ordens);
        updateDisplay();
    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[compra] loadOrdens:', err);
    } finally {
        currentFetchController = null;
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
            const razao = (f.razao_social || '').trim().toUpperCase();
            if (razao && !fornecedoresCache[razao]) {
                fornecedoresCache[razao] = {
                    razaoSocial: razao,
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
        const razao = toUpperCase(o.razao_social || '').trim();
        if (!razao) return;
        fornecedoresCache[razao] = {
            razaoSocial: razao,
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

function buscarFornecedoresSimilares(termo) {
    termo = toUpperCase(termo).trim();
    if (termo.length < 2) return [];
    return Object.keys(fornecedoresCache)
        .filter(k => k.includes(termo))
        .map(k => fornecedoresCache[k])
        .slice(0, 6);
}

function preencherDadosFornecedor(f) {
    document.getElementById('razaoSocial').value = f.razaoSocial;
    document.getElementById('nomeFantasia').value = f.nomeFantasia;
    document.getElementById('cnpj').value = f.cnpj;
    document.getElementById('enderecoFornecedor').value = f.enderecoFornecedor;
    document.getElementById('site').value = f.site;
    document.getElementById('contato').value = f.contato;
    document.getElementById('telefone').value = f.telefone;
    document.getElementById('email').value = f.email;
    const s = document.getElementById('fornecedorSuggestions');
    if (s) s.remove();
    showToast('Dados do fornecedor preenchidos', 'success');
}

function setupFornecedorAutocomplete() {
    const input = document.getElementById('razaoSocial');
    if (!input) return;
    const clone = input.cloneNode(true);
    input.parentNode.replaceChild(clone, input);

    clone.addEventListener('input', function (e) {
        const termo = e.target.value;
        let box = document.getElementById('fornecedorSuggestions');
        if (box) box.remove();
        if (termo.length < 2) return;
        const list = buscarFornecedoresSimilares(termo);
        if (!list.length) return;

        box = document.createElement('div');
        box.id = 'fornecedorSuggestions';
        box.style.cssText = `position:absolute;z-index:1000;background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);max-height:260px;overflow-y:auto;width:100%;margin-top:4px;left:0;`;
        list.forEach(f => {
            const item = document.createElement('div');
            item.style.cssText = 'padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--border-color);';
            item.innerHTML = `
                <div style="font-weight:600;font-size:.88rem;">${escHtml(f.razaoSocial)}</div>
                <div style="font-size:.78rem;color:var(--text-secondary);">${escHtml(f.cnpj)}${f.nomeFantasia ? ' · ' + escHtml(f.nomeFantasia) : ''}</div>
            `;
            item.addEventListener('click', () => preencherDadosFornecedor(f));
            box.appendChild(item);
        });
        const group = clone.closest('.form-group');
        group.style.position = 'relative';
        group.appendChild(box);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.form-group')) {
            const s = document.getElementById('fornecedorSuggestions');
            if (s) s.remove();
        }
    });
}

function changeMonth(direction) {
    currentMonth.setMonth(currentMonth.getMonth() + direction);
    ordens = [];
    updateMonthDisplay();
    mostrarCarregando();
    loadOrdens();
}

function updateMonthDisplay() {
    const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const el = document.getElementById('currentMonth');
    if (el) el.textContent = `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
}

async function syncData() {
    const btn = document.getElementById('syncBtn');
    if (btn) { btn.classList.add('spinning'); btn.disabled = true; }
    try {
        await carregarTudo();
        showToast('Dados sincronizados', 'success');
    } catch (err) {
        showToast('Erro ao sincronizar', 'error');
    } finally {
        setTimeout(() => {
            if (btn) { btn.classList.remove('spinning'); btn.disabled = false; }
        }, 600);
    }
}

function updateDisplay() {
    updateMonthDisplay();
    updateDashboard();
    updateTable();
    updateResponsaveisFilter();
    updateAuditBtn();
}

function updateAuditBtn() {
    const btn = document.getElementById('auditBtn');
    if (!btn) return;
    btn.style.display = currentUserIsAdmin ? 'inline-flex' : 'none';
}

function updateDashboard() {
    const totalFechadas = ordens.filter(o => o.status === 'fechada').length;
    const totalAbertas  = ordens.filter(o => o.status === 'aberta').length;

    const elTotal = document.getElementById('totalOrdens');
    const elFech  = document.getElementById('totalFechadas');
    const elAbert = document.getElementById('totalAbertas');
    const elValor = document.getElementById('valorTotal');
    if (elTotal) elTotal.textContent = ordens.length;
    if (elFech)  elFech.textContent  = totalFechadas;
    if (elAbert) elAbert.textContent = totalAbertas;

    let total = 0;
    ordens.forEach(o => {
        const v = (o.valor_total || '0').replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        total += parseFloat(v) || 0;
    });
    if (elValor) elValor.textContent = formatCurrency(total);
}

function updateTable() {
    const c = document.getElementById('ordensContainer');
    if (!c) return;

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
        c.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;">Nenhuma ordem encontrada</td></tr>';
        return;
    }

    lista.sort((a, b) => parseInt(b.numero_ordem || 0) - parseInt(a.numero_ordem || 0));

    c.innerHTML = lista.map(o => `
        <tr class="${o.status === 'fechada' ? 'row-fechada' : ''}" onclick="handleRowClick(event, '${o.id}')">
            <td style="text-align:center;">
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="check-${o.id}" ${o.status === 'fechada' ? 'checked' : ''} onchange="toggleStatus('${o.id}')" class="styled-checkbox">
                    <label for="check-${o.id}" class="checkbox-label-styled"></label>
                </div>
            </td>
            <td><strong>${escHtml(o.numero_ordem)}</strong></td>
            <td>${escHtml(toUpperCase(o.responsavel))}</td>
            <td>${escHtml(toUpperCase(o.razao_social))}</td>
            <td>${formatDate(o.data_ordem)}</td>
            <td><strong>${escHtml(o.valor_total || '-')}</strong></td>
            <td><span class="badge ${o.status}">${o.status.toUpperCase()}</span></td>
            <td class="actions-cell" style="text-align:center;">
                <button onclick="event.stopPropagation();editOrdem('${o.id}')" class="action-btn edit">Editar</button>
                <button onclick="event.stopPropagation();generatePDF('${o.id}')" class="action-btn success">PDF</button>
                <button onclick="event.stopPropagation();deleteOrdem('${o.id}')" class="action-btn delete">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function updateResponsaveisFilter() {
    const select = document.getElementById('filterResponsavel');
    if (!select) return;
    const current = select.value;
    const set = new Set();
    ordens.forEach(o => { if (o.responsavel?.trim()) set.add(o.responsavel.trim()); });
    select.innerHTML = '<option value="">Responsável</option>';
    Array.from(set).sort().forEach(r => {
        const opt = document.createElement('option');
        opt.value = r; opt.textContent = toUpperCase(r);
        select.appendChild(opt);
    });
    select.value = current;
}

function filterOrdens() { updateTable(); }

function handleRowClick(e, id) {
    if (e.target.closest('button') || e.target.closest('input')) return;
    viewOrdem(id);
}

function viewOrdem(id) {
    const o = ordens.find(x => String(x.id) === String(id));
    if (!o) return;

    document.getElementById('modalNumero').textContent = o.numero_ordem || '';

    document.getElementById('info-tab-geral').innerHTML = `
        <div class="info-section">
            <h4>Informações Gerais</h4>
            <p><strong>Responsável:</strong> ${escHtml(toUpperCase(o.responsavel))}</p>
            <p><strong>Data:</strong> ${formatDate(o.data_ordem)}</p>
            <p><strong>Status:</strong> <span class="badge ${o.status}">${o.status.toUpperCase()}</span></p>
        </div>
    `;

    document.getElementById('info-tab-fornecedor').innerHTML = `
        <div class="info-section">
            <h4>Dados do Fornecedor</h4>
            <p><strong>Razão Social:</strong> ${escHtml(toUpperCase(o.razao_social))}</p>
            ${o.nome_fantasia ? `<p><strong>Nome Fantasia:</strong> ${escHtml(toUpperCase(o.nome_fantasia))}</p>` : ''}
            <p><strong>CNPJ:</strong> ${escHtml(o.cnpj)}</p>
            ${o.endereco_fornecedor ? `<p><strong>Endereço:</strong> ${escHtml(toUpperCase(o.endereco_fornecedor))}</p>` : ''}
            ${o.contato ? `<p><strong>Contato:</strong> ${escHtml(toUpperCase(o.contato))}</p>` : ''}
            ${o.telefone ? `<p><strong>Telefone:</strong> ${escHtml(o.telefone)}</p>` : ''}
            ${o.email ? `<p><strong>E-mail:</strong> ${escHtml(o.email)}</p>` : ''}
        </div>
    `;

    const items = Array.isArray(o.items) ? o.items : [];
    document.getElementById('info-tab-pedido').innerHTML = `
        <div class="info-section">
            <h4>Itens do Pedido</h4>
            <div style="overflow-x:auto;">
                <table style="width:100%;">
                    <thead>
                        <tr>
                            <th>Item</th><th>Especificação</th><th>QTD</th><th>Unid</th>
                            <th>Valor UN</th><th>IPI</th><th>ST</th><th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(it => `
                            <tr>
                                <td>${escHtml(it.item)}</td>
                                <td>${escHtml(toUpperCase(it.especificacao))}</td>
                                <td>${escHtml(it.quantidade)}</td>
                                <td>${escHtml(toUpperCase(it.unidade))}</td>
                                <td>${formatCurrency(it.valorUnitario || 0)}</td>
                                <td>${escHtml(it.ipi || '-')}</td>
                                <td>${escHtml(toUpperCase(it.st || '-'))}</td>
                                <td>${escHtml(it.valorTotal || '-')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <p style="margin-top:1rem;"><strong>Valor Total:</strong> ${escHtml(o.valor_total)}</p>
            ${o.frete ? `<p><strong>Frete:</strong> ${escHtml(toUpperCase(o.frete))}</p>` : ''}
        </div>
    `;

    document.getElementById('info-tab-entrega').innerHTML = `
        <div class="info-section">
            <h4>Informações de Entrega</h4>
            ${o.local_entrega ? `<p><strong>Local de Entrega:</strong> ${escHtml(toUpperCase(o.local_entrega))}</p>` : ''}
            ${o.prazo_entrega ? `<p><strong>Prazo de Entrega:</strong> ${escHtml(toUpperCase(o.prazo_entrega))}</p>` : ''}
            ${o.transporte ? `<p><strong>Transporte:</strong> ${escHtml(toUpperCase(o.transporte))}</p>` : ''}
        </div>
    `;

    document.getElementById('info-tab-pagamento').innerHTML = `
        <div class="info-section">
            <h4>Dados de Pagamento</h4>
            <p><strong>Forma de Pagamento:</strong> ${escHtml(toUpperCase(o.forma_pagamento))}</p>
            <p><strong>Prazo de Pagamento:</strong> ${escHtml(toUpperCase(o.prazo_pagamento))}</p>
            ${o.dados_bancarios ? `<p><strong>Dados Bancários:</strong> ${escHtml(toUpperCase(o.dados_bancarios))}</p>` : ''}
        </div>
    `;

    document.querySelectorAll('#infoModal .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#infoModal .tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('#infoModal .tab-btn')[0].classList.add('active');
    document.getElementById('info-tab-geral').classList.add('active');

    document.getElementById('infoModal').classList.add('show');
}

function closeInfoModal() {
    document.getElementById('infoModal').classList.remove('show');
}

function switchInfoTab(id, btn) {
    document.querySelectorAll('#infoModal .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#infoModal .tab-content').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById(id).classList.add('active');
}

function openFormModal() {
    editingId = null;
    currentTab = 0;
    itemCounter = 0;

    const nextNumber = ultimoNumeroGlobal > 0 ? (ultimoNumeroGlobal + 1).toString() : '1';
    const today = new Date().toISOString().split('T')[0];
    const autoResp = detectResponsavelFromUser(currentUserName) || '';

    document.getElementById('formModalHost')?.remove();
    const host = document.createElement('div');
    host.id = 'formModalHost';
    host.innerHTML = renderFormModal({
        title: 'Nova Ordem de Compra',
        editId: '',
        numeroOrdem: nextNumber,
        responsavel: autoResp,
        dataOrdem: today,
        ordem: null
    });
    document.body.appendChild(host);

    addItem();
    setTimeout(() => {
        setupFornecedorAutocomplete();
        setupUpperCaseInputs();
        updateNavButtons();
        document.getElementById('numeroOrdem')?.focus();
    }, 100);
}

async function editOrdem(id) {
    const o = ordens.find(x => String(x.id) === String(id));
    if (!o) return showToast('Ordem não encontrada', 'error');

    editingId = id;
    currentTab = 0;
    itemCounter = 0;

    document.getElementById('formModalHost')?.remove();
    const host = document.createElement('div');
    host.id = 'formModalHost';
    host.innerHTML = renderFormModal({
        title: 'Editar Ordem de Compra',
        editId: id,
        numeroOrdem: o.numero_ordem,
        responsavel: o.responsavel,
        dataOrdem: o.data_ordem,
        ordem: o
    });
    document.body.appendChild(host);

    setTimeout(() => {
        setupFornecedorAutocomplete();
        setupUpperCaseInputs();
        updateNavButtons();
    }, 100);

    if (Array.isArray(o.items) && o.items.length) {
        o.items.forEach(it => {
            addItem();
            const row = document.querySelector('#itemsBody tr:last-child');
            if (!row) return;
            row.querySelector('.item-especificacao').value = toUpperCase(it.especificacao || '');
            row.querySelector('.item-qtd').value = it.quantidade || 1;
            row.querySelector('.item-unid').value = toUpperCase(it.unidade || 'UN');
            row.querySelector('.item-valor').value = it.valorUnitario || 0;
            row.querySelector('.item-ipi').value = it.ipi || '';
            row.querySelector('.item-st').value = toUpperCase(it.st || '');
            calculateItemTotal(row.querySelector('.item-valor'));
        });
    } else {
        addItem();
    }
}

function renderFormModal(cfg) {
    const o = cfg.ordem;
    const showResp = cfg.responsavel || '';
    return `
        <div class="modal-overlay show" id="formModal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3 class="modal-title">${cfg.title}</h3>
                    <button class="close-modal" onclick="closeFormModal(true)">✕</button>
                </div>
                <div class="tabs-container">
                    <div class="tabs-nav">
                        <button type="button" class="tab-btn active" onclick="switchTab('tab-geral', this)">Geral</button>
                        <button type="button" class="tab-btn" onclick="switchTab('tab-fornecedor', this)">Fornecedor</button>
                        <button type="button" class="tab-btn" onclick="switchTab('tab-pedido', this)">Pedido</button>
                        <button type="button" class="tab-btn" onclick="switchTab('tab-entrega', this)">Entrega</button>
                        <button type="button" class="tab-btn" onclick="switchTab('tab-pagamento', this)">Pagamento</button>
                    </div>
                    <form id="ordemForm" onsubmit="handleSubmit(event)">
                        <input type="hidden" id="editId" value="${cfg.editId}">

                        <div class="tab-content active" id="tab-geral">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Número da Ordem *</label>
                                    <input type="text" id="numeroOrdem" value="${escHtml(cfg.numeroOrdem)}" required>
                                </div>
                                <div class="form-group">
                                    <label>Responsável</label>
                                    <input type="text" id="responsavel" value="${escHtml(showResp)}" readonly>
                                </div>
                                <div class="form-group">
                                    <label>Data da Ordem *</label>
                                    <input type="date" id="dataOrdem" value="${escHtml(cfg.dataOrdem || '')}" required>
                                </div>
                            </div>
                        </div>

                        <div class="tab-content" id="tab-fornecedor">
                            <div class="form-grid">
                                <div class="form-group"><label>Razão Social *</label><input type="text" id="razaoSocial" value="${o ? escHtml(o.razao_social) : ''}" required></div>
                                <div class="form-group"><label>Nome Fantasia</label><input type="text" id="nomeFantasia" value="${o ? escHtml(o.nome_fantasia || '') : ''}"></div>
                                <div class="form-group"><label>CNPJ *</label><input type="text" id="cnpj" value="${o ? escHtml(o.cnpj || '') : ''}" required></div>
                                <div class="form-group"><label>Endereço</label><input type="text" id="enderecoFornecedor" value="${o ? escHtml(o.endereco_fornecedor || '') : ''}"></div>
                                <div class="form-group"><label>Site</label><input type="text" id="site" value="${o ? escHtml(o.site || '') : ''}"></div>
                                <div class="form-group"><label>Contato</label><input type="text" id="contato" value="${o ? escHtml(o.contato || '') : ''}"></div>
                                <div class="form-group"><label>Telefone</label><input type="text" id="telefone" value="${o ? escHtml(o.telefone || '') : ''}"></div>
                                <div class="form-group"><label>E-mail</label><input type="email" id="email" value="${o ? escHtml(o.email || '') : ''}"></div>
                            </div>
                        </div>

                        <div class="tab-content" id="tab-pedido">
                            <button type="button" onclick="addItem()" class="small success" style="margin-bottom: 1rem;">+ Adicionar Item</button>
                            <div style="overflow-x: auto;">
                                <table class="items-table">
                                    <thead>
                                        <tr>
                                            <th>Item</th><th>Especificação</th><th>QTD</th><th>Unid</th>
                                            <th>Valor UN</th><th>IPI</th><th>ST</th><th>Total</th><th></th>
                                        </tr>
                                    </thead>
                                    <tbody id="itemsBody"></tbody>
                                </table>
                            </div>
                            <div class="double-field-row">
                                <div class="form-group"><label>Valor Total da Ordem</label><input type="text" id="valorTotalOrdem" readonly value="${o ? escHtml(o.valor_total || 'R$ 0,00') : 'R$ 0,00'}"></div>
                                <div class="form-group"><label>Frete</label><input type="text" id="frete" value="${o ? escHtml(o.frete || 'CIF') : 'CIF'}"></div>
                            </div>
                        </div>

                        <div class="tab-content" id="tab-entrega">
                            <div class="form-grid">
                                <div class="form-group full-width"><label>Local de Entrega</label><input type="text" id="localEntrega" value="${o ? escHtml(o.local_entrega || '') : 'RUA TADORNA Nº 472, SALA 2, NOVO HORIZONTE - SERRA/ES  |  CEP: 29.163-318'}"></div>
                                <div class="form-group"><label>Prazo de Entrega</label><input type="text" id="prazoEntrega" value="${o ? escHtml(o.prazo_entrega || 'IMEDIATO') : 'IMEDIATO'}"></div>
                                <div class="form-group"><label>Transporte</label><input type="text" id="transporte" value="${o ? escHtml(o.transporte || 'FORNECEDOR') : 'FORNECEDOR'}"></div>
                            </div>
                        </div>

                        <div class="tab-content" id="tab-pagamento">
                            <div class="form-grid">
                                <div class="form-group"><label>Forma de Pagamento *</label><input type="text" id="formaPagamento" value="${o ? escHtml(o.forma_pagamento || '') : ''}" required></div>
                                <div class="form-group"><label>Prazo de Pagamento *</label><input type="text" id="prazoPagamento" value="${o ? escHtml(o.prazo_pagamento || '') : ''}" required></div>
                                <div class="form-group full-width"><label>Dados Bancários</label><textarea id="dadosBancarios" rows="3">${o ? escHtml(o.dados_bancarios || '') : ''}</textarea></div>
                            </div>
                        </div>

                        <div class="modal-actions">
                            <button type="button" id="btnPrevious" onclick="previousTab()" class="secondary" style="display:none;">Anterior</button>
                            <button type="button" id="btnNext" onclick="nextTab()" class="secondary">Próximo</button>
                            <button type="submit" id="btnSave" class="save" style="display:none;">Salvar</button>
                            <button type="button" onclick="closeFormModal(true)" class="secondary">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

function closeFormModal(cancelado) {
    const host = document.getElementById('formModalHost');
    if (host) host.remove();
    if (cancelado) {
        const id = editingId;
        showToast(id ? 'Atualização cancelada' : 'Registro cancelado', 'error');
    }
    editingId = null;
}

function switchTab(id, btn) {
    const i = tabs.indexOf(id);
    if (i !== -1) currentTab = i;
    document.querySelectorAll('#formModal .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#formModal .tab-content').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById(id).classList.add('active');
    updateNavButtons();
}

function updateNavButtons() {
    const prev = document.getElementById('btnPrevious');
    const next = document.getElementById('btnNext');
    const save = document.getElementById('btnSave');
    if (!prev || !next || !save) return;
    prev.style.display = currentTab > 0 ? 'inline-flex' : 'none';
    next.style.display = currentTab < tabs.length - 1 ? 'inline-flex' : 'none';
    save.style.display = currentTab === tabs.length - 1 ? 'inline-flex' : 'none';
}

function nextTab() {
    if (currentTab < tabs.length - 1) {
        currentTab++;
        switchTab(tabs[currentTab], document.querySelectorAll('#formModal .tab-btn')[currentTab]);
    }
}
function previousTab() {
    if (currentTab > 0) {
        currentTab--;
        switchTab(tabs[currentTab], document.querySelectorAll('#formModal .tab-btn')[currentTab]);
    }
}

function setupUpperCaseInputs() {
    const inputs = document.querySelectorAll('#formModal input[type="text"]:not([readonly]), #formModal textarea');
    inputs.forEach(input => {
        input.addEventListener('input', function () {
            const start = this.selectionStart, end = this.selectionEnd;
            this.value = toUpperCase(this.value);
            this.setSelectionRange(start, end);
        });
    });
}

function addItem() {
    itemCounter++;
    const tbody = document.getElementById('itemsBody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td style="text-align:center;">${itemCounter}</td>
        <td><textarea class="item-especificacao" placeholder="Descrição do item..." rows="2"></textarea></td>
        <td><input type="number" class="item-qtd" min="0" step="0.01" value="1" onchange="calculateItemTotal(this)"></td>
        <td><input type="text" class="item-unid" value="UN" placeholder="UN"></td>
        <td><input type="number" class="item-valor" min="0" step="0.01" value="0" onchange="calculateItemTotal(this)"></td>
        <td><input type="text" class="item-ipi" placeholder="0,00" onchange="calculateItemTotal(this)"></td>
        <td><input type="text" class="item-st" placeholder="Não incluído"></td>
        <td><input type="text" class="item-total" readonly value="R$ 0,00"></td>
        <td style="text-align:center;"><button type="button" class="danger small" onclick="removeItem(this)">×</button></td>
    `;
    tbody.appendChild(tr);
    setTimeout(setupUpperCaseInputs, 30);
}

function removeItem(btn) {
    btn.closest('tr').remove();
    recalculateOrderTotal();
    renumberItems();
}

function renumberItems() {
    const rows = document.querySelectorAll('#itemsBody tr');
    rows.forEach((row, i) => { row.cells[0].textContent = i + 1; });
    itemCounter = rows.length;
}

function calculateItemTotal(input) {
    const row = input.closest('tr');
    const qtd = parseFloat(row.querySelector('.item-qtd').value) || 0;
    const valor = parseFloat(row.querySelector('.item-valor').value) || 0;
    const ipiStr = row.querySelector('.item-ipi').value;
    const ipi = parseFloatLocale(ipiStr);
    let total = qtd * valor;
    if (!isNaN(ipi)) total += ipi;
    row.querySelector('.item-total').value = formatCurrency(total);
    recalculateOrderTotal();
}

function recalculateOrderTotal() {
    const totals = document.querySelectorAll('.item-total');
    let sum = 0;
    totals.forEach(i => {
        const v = i.value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        sum += parseFloat(v) || 0;
    });
    const out = document.getElementById('valorTotalOrdem');
    if (out) out.value = formatCurrency(sum);
}

async function handleSubmit(e) {
    e.preventDefault();

    const items = [];
    document.querySelectorAll('#itemsBody tr').forEach((row, i) => {
        items.push({
            item: i + 1,
            especificacao: toUpperCase(row.querySelector('.item-especificacao').value),
            quantidade: parseFloat(row.querySelector('.item-qtd').value) || 0,
            unidade: toUpperCase(row.querySelector('.item-unid').value),
            valorUnitario: parseFloat(row.querySelector('.item-valor').value) || 0,
            ipi: row.querySelector('.item-ipi').value,
            st: toUpperCase(row.querySelector('.item-st').value || ''),
            valorTotal: row.querySelector('.item-total').value
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
        site: document.getElementById('site').value,
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

        const res = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Erro ' + res.status);
        }

        const saved = await res.json();
        showToast(editingId ? `Ordem Nº ${saved.numero_ordem} atualizada` : `Ordem Nº ${saved.numero_ordem} criada`, 'success');

        closeFormModal(false);
        await carregarTudo();
    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Salvar'; }
    }
}

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
    } catch (err) {
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
        <div class="modal-overlay show" id="deleteModal">
            <div class="modal-content small">
                <div class="modal-header">
                    <h3 class="modal-title">Excluir Ordem</h3>
                    <button class="close-modal" onclick="closeDeleteModal()">✕</button>
                </div>
                <p style="text-align:center; padding: 1.5rem 0; font-size: 1.05rem;">
                    Tem certeza que deseja excluir a ordem <strong>Nº ${escHtml(o.numero_ordem)}</strong>?
                </p>
                <div class="modal-actions" style="justify-content:center;">
                    <button onclick="confirmDelete('${o.id}')" class="danger">Sim, excluir</button>
                    <button onclick="closeDeleteModal()" class="secondary">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(host);
}

function closeDeleteModal() {
    document.getElementById('deleteModalHost')?.remove();
}

async function confirmDelete(id) {
    closeDeleteModal();
    try {
        const res = await fetch(`${API_URL}/ordens/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (!res.ok && res.status !== 204) throw new Error('Erro ' + res.status);
        showToast('Ordem excluída', 'success');
        await carregarTudo();
    } catch (err) {
        showToast('Erro ao excluir', 'error');
    }
}

function abrirModalDuplicar() {
    document.getElementById('duplicarModalHost')?.remove();
    const host = document.createElement('div');
    host.id = 'duplicarModalHost';
    host.innerHTML = `
        <div class="modal-overlay show" id="duplicarModal">
            <div class="modal-content small">
                <div class="modal-header">
                    <h3 class="modal-title">Duplicar Ordem</h3>
                    <button class="close-modal" onclick="closeDuplicar()">✕</button>
                </div>
                <div style="padding: 1rem 0.5rem;">
                    <label style="text-align:center; display:block; margin-bottom: 1rem;">Número da ordem a duplicar</label>
                    <input type="text" id="numeroDuplicar" placeholder="Ex: 1250" style="text-align:center; font-size:1.1rem;">
                    <div id="duplicarErro" style="color:#EF4444; font-size:0.85rem; margin-top:0.5rem; display:none; text-align:center;"></div>
                </div>
                <div class="modal-actions" style="justify-content:center;">
                    <button onclick="confirmarDuplicacao()" class="success">Confirmar</button>
                    <button onclick="closeDuplicar()" class="secondary">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(host);
    const input = document.getElementById('numeroDuplicar');
    input.focus();
    input.addEventListener('keydown', e => { if (e.key === 'Enter') confirmarDuplicacao(); });
}

function closeDuplicar() {
    document.getElementById('duplicarModalHost')?.remove();
}

async function confirmarDuplicacao() {
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

        const original = await res.json();
        closeDuplicar();

        const dataAtual = new Date().toISOString().split('T')[0];
        const nova = {
            numeroOrdem: original.numero_ordem,
            responsavel: original.responsavel || '',
            dataOrdem: dataAtual,
            razaoSocial: original.razao_social || '',
            nomeFantasia: original.nome_fantasia || '',
            cnpj: original.cnpj || '',
            enderecoFornecedor: original.endereco_fornecedor || '',
            site: original.site || '',
            contato: original.contato || '',
            telefone: original.telefone || '',
            email: original.email || '',
            items: (original.items || []).map(it => ({
                item: it.item,
                especificacao: it.especificacao,
                quantidade: it.quantidade,
                unidade: it.unidade,
                valorUnitario: it.valorUnitario || 0,
                ipi: it.ipi || '',
                st: it.st || '',
                valorTotal: it.valorTotal || 'R$ 0,00'
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

// ─── PDF (formato idêntico ao antigo) ───────────────────────
function generatePDF(id) {
    const o = ordens.find(x => String(x.id) === String(id));
    if (!o) return showToast('Ordem não encontrada', 'error');
    if (typeof window.jspdf === 'undefined') {
        return showToast('Biblioteca PDF não carregada', 'error');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const maxWidth = pageWidth - 2 * margin;

    // ── CABEÇALHO com logo-cabecalho.png ──
    const logoHeader = new Image();
    logoHeader.crossOrigin = 'anonymous';
    logoHeader.src = '/imagens/logo-cabecalho.png';

    const desenharCabecalho = () => {
        const headerY = 10;
        let headerFim = 30;

        if (logoHeader.complete && logoHeader.naturalHeight > 0) {
            const logoWidth = 45;
            const logoHeight = (logoHeader.height / logoHeader.width) * logoWidth;
            try {
                doc.setGState(new doc.GState({ opacity: 0.3 }));
                doc.addImage(logoHeader, 'PNG', 5, headerY, logoWidth, logoHeight);
                doc.setGState(new doc.GState({ opacity: 1.0 }));
            } catch (e) {}

            const fontSize = Math.max(logoHeight * 0.42, 11);
            doc.setFontSize(fontSize);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(150, 150, 150);
            const textX = 5 + logoWidth + 3;
            const lineSpacing = fontSize * 0.55;
            const textY1 = headerY + fontSize * 0.9;
            doc.text('I.R COMÉRCIO E', textX, textY1);
            doc.text('MATERIAIS ELÉTRICOS LTDA', textX, textY1 + lineSpacing);
            doc.setTextColor(0, 0, 0);
            headerFim = Math.max(headerY + logoHeight + 8, textY1 + lineSpacing + 6);
        }
        return headerFim;
    };

    const desenhar = () => {
        let y = desenharCabecalho();

        // ── TÍTULO ──
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('ORDEM DE COMPRA', pageWidth / 2, y, { align: 'center' });
        y += 8;
        doc.setFontSize(14);
        doc.text(`Nº ${o.numero_ordem || ''}`, pageWidth / 2, y, { align: 'center' });
        y += 12;

        // ── DADOS PARA FATURAMENTO ──
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('DADOS PARA FATURAMENTO', margin, y); y += 6;
        doc.text('I.R. COMÉRCIO E MATERIAIS ELÉTRICOS LTDA', margin, y); y += 5;
        doc.setFont(undefined, 'normal');
        doc.text('CNPJ: 33.149.502/0001-38  |  IE: 083.780.74-2', margin, y); y += 5;
        doc.text('RUA TADORNA Nº 472, SALA 2', margin, y); y += 5;
        doc.text('NOVO HORIZONTE - SERRA/ES  |  CEP: 29.163-318', margin, y); y += 5;
        doc.text('TELEFAX: (27) 3209-4291  |  E-MAIL: COMERCIAL.IRCOMERCIO@GMAIL.COM', margin, y); y += 10;

        // ── DADOS DO FORNECEDOR ──
        doc.setFont(undefined, 'bold');
        doc.text('DADOS DO FORNECEDOR', margin, y); y += 6;

        const linhaDupla = (label, valor, bold = true) => {
            doc.setFont(undefined, 'normal');
            doc.text(label, margin, y);
            const w = doc.getTextWidth(label);
            doc.setFont(undefined, bold ? 'bold' : 'normal');
            const linhas = doc.splitTextToSize(String(valor || ''), maxWidth - w);
            doc.text(linhas[0], margin + w, y);
            y += 5;
            for (let i = 1; i < linhas.length; i++) { doc.text(linhas[i], margin, y); y += 5; }
        };

        linhaDupla('RAZÃO SOCIAL: ', toUpperCase(o.razao_social));
        if (o.nome_fantasia) linhaDupla('NOME FANTASIA:', toUpperCase(o.nome_fantasia));
        linhaDupla('CNPJ: ', o.cnpj || '');
        if (o.endereco_fornecedor) linhaDupla('ENDEREÇO: ', toUpperCase(o.endereco_fornecedor));
        if (o.site)   linhaDupla('SITE: ', o.site);
        if (o.contato) linhaDupla('CONTATO:', toUpperCase(o.contato));
        if (o.telefone) linhaDupla('TELEFONE: ', o.telefone);
        if (o.email)  linhaDupla('E-MAIL: ', o.email);

        y += 4;

        // ── ITENS DO PEDIDO ──
        if (y > pageHeight - 60) { doc.addPage(); y = desenharCabecalho(); }
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text('ITENS DO PEDIDO', margin, y); y += 4;

        const tableWidth = pageWidth - 2 * margin;
        const colW = {
            item:     tableWidth * 0.06,
            espec:    tableWidth * 0.40,
            qtd:      tableWidth * 0.08,
            unid:     tableWidth * 0.08,
            valorUn:  tableWidth * 0.12,
            ipi:      tableWidth * 0.09,
            st:       tableWidth * 0.09,
            total:    tableWidth * 0.08
        };
        const rowH = 8;

        // Cabeçalho da tabela (cinza escuro, texto branco)
        doc.setFillColor(108, 117, 125);
        doc.setDrawColor(180, 180, 180);
        doc.rect(margin, y, tableWidth, rowH, 'FD');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');

        let x = margin;
        const headers = [
            ['ITEM', colW.item],
            ['ESPECIFICAÇÃO', colW.espec],
            ['QTD', colW.qtd],
            ['UNID', colW.unid],
            ['VALOR UN', colW.valorUn],
            ['IPI', colW.ipi],
            ['ST', colW.st],
            ['TOTAL', colW.total]
        ];
        headers.forEach(([label, w]) => {
            doc.line(x, y, x, y + rowH);
            doc.text(label, x + w / 2, y + 5.5, { align: 'center' });
            x += w;
        });
        doc.line(x, y, x, y + rowH);
        y += rowH;
        doc.setTextColor(0, 0, 0);

        // Corpo
        const items = Array.isArray(o.items) ? o.items : [];
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');

        items.forEach((it, idx) => {
            const espec = toUpperCase(it.especificacao || '');
            const especLines = doc.splitTextToSize(espec, colW.espec - 4);
            const alturaNecessaria = Math.max(rowH, especLines.length * 3.5 + 4);

            if (y + alturaNecessaria > pageHeight - 30) { doc.addPage(); y = desenharCabecalho(); }

            if (idx % 2 !== 0) {
                doc.setFillColor(240, 240, 240);
                doc.rect(margin, y, tableWidth, alturaNecessaria, 'F');
            }

            x = margin;
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.3);

            // ITEM
            doc.line(x, y, x, y + alturaNecessaria);
            doc.text(String(it.item || idx + 1), x + colW.item / 2, y + alturaNecessaria / 2 + 1.5, { align: 'center' });
            x += colW.item;

            // ESPECIFICAÇÃO
            doc.line(x, y, x, y + alturaNecessaria);
            doc.text(especLines, x + 2, y + 4);
            x += colW.espec;

            // QTD
            doc.line(x, y, x, y + alturaNecessaria);
            doc.text(String(it.quantidade || ''), x + colW.qtd / 2, y + alturaNecessaria / 2 + 1.5, { align: 'center' });
            x += colW.qtd;

            // UNID
            doc.line(x, y, x, y + alturaNecessaria);
            doc.text(toUpperCase(it.unidade || ''), x + colW.unid / 2, y + alturaNecessaria / 2 + 1.5, { align: 'center' });
            x += colW.unid;

            // VALOR UN
            doc.line(x, y, x, y + alturaNecessaria);
            const valorUn = parseFloat(it.valorUnitario || 0);
            const valorUnStr = valorUn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            doc.text(valorUnStr, x + colW.valorUn / 2, y + alturaNecessaria / 2 + 1.5, { align: 'center' });
            x += colW.valorUn;

            // IPI
            doc.line(x, y, x, y + alturaNecessaria);
            let ipiDisplay = '-';
            if (it.ipi && String(it.ipi).trim() !== '') {
                const n = parseFloatLocale(String(it.ipi));
                ipiDisplay = !isNaN(n)
                    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : toUpperCase(it.ipi);
            }
            doc.text(ipiDisplay, x + colW.ipi / 2, y + alturaNecessaria / 2 + 1.5, { align: 'center' });
            x += colW.ipi;

            // ST
            doc.line(x, y, x, y + alturaNecessaria);
            doc.text(toUpperCase(it.st || '-'), x + colW.st / 2, y + alturaNecessaria / 2 + 1.5, { align: 'center' });
            x += colW.st;

            // TOTAL
            doc.line(x, y, x, y + alturaNecessaria);
            doc.text(it.valorTotal || '', x + colW.total / 2, y + alturaNecessaria / 2 + 1.5, { align: 'center' });
            x += colW.total;

            doc.line(margin, y + alturaNecessaria, margin + tableWidth, y + alturaNecessaria);
            y += alturaNecessaria;
        });

        y += 6;
        if (y > pageHeight - 40) { doc.addPage(); y = desenharCabecalho(); }
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`VALOR TOTAL: ${o.valor_total || ''}`, margin, y); y += 10;

        // ── LOCAL DE ENTREGA ──
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('LOCAL DE ENTREGA:', margin, y); y += 5;
        doc.setFont(undefined, 'normal');
        const localPadrao = 'RUA TADORNA Nº 472, SALA 2, NOVO HORIZONTE - SERRA/ES  |  CEP: 29.163-318';
        const local = toUpperCase(o.local_entrega || '') || localPadrao;
        const localLines = doc.splitTextToSize(local, maxWidth);
        doc.text(localLines, margin, y); y += localLines.length * 5 + 4;

        // ── PRAZO / FRETE / TRANSPORTE ──
        if (y > pageHeight - 40) { doc.addPage(); y = desenharCabecalho(); }
        doc.setFont(undefined, 'bold');
        doc.text('PRAZO DE ENTREGA:', margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(toUpperCase(o.prazo_entrega || '-'), margin + 40, y);

        doc.setFont(undefined, 'bold');
        doc.text('FRETE:', pageWidth - margin - 30, y, { align: 'right' });
        doc.setFont(undefined, 'normal');
        doc.text(toUpperCase(o.frete || '-'), pageWidth - margin, y, { align: 'right' });
        y += 6;

        doc.setFont(undefined, 'bold');
        doc.text('TRANSPORTE:', margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(toUpperCase(o.transporte || '-'), margin + 30, y);
        y += 12;

        // ── CONDIÇÕES DE PAGAMENTO ──
        if (y > pageHeight - 80) { doc.addPage(); y = desenharCabecalho(); }
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('CONDIÇÕES DE PAGAMENTO:', margin, y); y += 6;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`FORMA: ${toUpperCase(o.forma_pagamento || '')}`, margin, y); y += 5;
        doc.text(`PRAZO: ${toUpperCase(o.prazo_pagamento || '')}`, margin, y); y += 5;
        if (o.dados_bancarios) {
            y += 2;
            doc.setFont(undefined, 'bold');
            doc.text('DADOS BANCÁRIOS:', margin, y); y += 5;
            doc.setFont(undefined, 'normal');
            const dadosLines = doc.splitTextToSize(toUpperCase(o.dados_bancarios), maxWidth);
            doc.text(dadosLines, margin, y); y += dadosLines.length * 5;
        }

        // ── DATA POR EXTENSO ──
        y += 14;
        if (y > pageHeight - 90) { doc.addPage(); y = desenharCabecalho(); }
        const meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
                       'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
        const hoje = new Date();
        const dia = hoje.getDate();
        const mes = meses[hoje.getMonth()];
        const ano = hoje.getFullYear();
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`SERRA/ES, ${dia} DE ${mes} DE ${ano}`, pageWidth / 2, y, { align: 'center' });
        y += 15;

        // ── ASSINATURA (ass.png) ──
        const assImg = new Image();
        assImg.crossOrigin = 'anonymous';
        assImg.src = '/imagens/ass.png';

        const desenharAssinatura = () => {
            if (assImg.complete && assImg.naturalHeight > 0) {
                const w = 50;
                const h = (assImg.height / assImg.width) * w;
                try { doc.addImage(assImg, 'PNG', (pageWidth / 2) - (w / 2), y, w, h); y += h + 5; }
                catch (e) { y += 5; }
            }
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('ROSEMEIRE BICALHO DE LIMA GRAVINO', pageWidth / 2, y, { align: 'center' }); y += 5;
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text('MG-10.078.568 / CPF: 045.160.616-78', pageWidth / 2, y, { align: 'center' }); y += 5;
            doc.text('DIRETORA', pageWidth / 2, y, { align: 'center' }); y += 14;

            // ── RODAPÉ ──
            if (y > pageHeight - 30) { doc.addPage(); y = desenharCabecalho(); }
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y, maxWidth, 22, 'F');
            doc.setDrawColor(200, 200, 200);
            doc.rect(margin, y, maxWidth, 22, 'S');
            let yf = y + 6;
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 82, 29);
            doc.text('ATENÇÃO SR. FORNECEDOR:', margin + 5, yf);
            yf += 5;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text(`1) GENTILEZA MENCIONAR NA NOTA FISCAL O Nº ${o.numero_ordem || ''}`, margin + 5, yf);
            yf += 5;
            doc.text('2) FAVOR ENVIAR A NOTA FISCAL ELETRÔNICA (ARQUIVO .XML) PARA: FINANCEIRO.IRCOMERCIO@GMAIL.COM', margin + 5, yf);

            const nomeArquivo = `${toUpperCase(o.razao_social || 'ORDEM')}-${o.numero_ordem || ''}.pdf`;
            doc.save(nomeArquivo);
            showToast(`Ordem Nº ${o.numero_ordem} emitida`, 'success');
        };

        if (assImg.complete) {
            desenharAssinatura();
        } else {
            assImg.onload  = desenharAssinatura;
            assImg.onerror = () => { desenharAssinatura(); };
        }
    };

    if (logoHeader.complete) {
        desenhar();
    } else {
        logoHeader.onload  = () => desenhar();
        logoHeader.onerror = () => desenhar();
    }
}

// ─── AUDITORIA (PDF) ────────────────────────────────────────
async function abrirAuditoria() {
    if (!currentUserIsAdmin) return showToast('Apenas administradores', 'error');

    const responsavel = document.getElementById('filterResponsavel')?.value || '';
    if (!responsavel) {
        showToast('Selecione um responsável', 'error');
        return;
    }

    const mes = currentMonth.getMonth();
    const ano = currentMonth.getFullYear();

    try {
        const url = `${API_URL}/ordens/auditoria?responsavel=${encodeURIComponent(responsavel)}&mes=${mes}&ano=${ano}`;
        const res = await fetch(url, { headers: getHeaders() });

        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (res.status === 400) {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'Selecione um responsável', 'error');
            return;
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Erro ' + res.status);
        }

        const logs = await res.json();
        if (!Array.isArray(logs) || logs.length === 0) {
            showToast(`Nenhuma atividade de ${responsavel} neste mês`, 'error');
            return;
        }

        gerarPDFAuditoria(logs, responsavel, mes, ano);
    } catch (err) {
        showToast('Erro ao buscar atividades: ' + err.message, 'error');
    }
}

function gerarPDFAuditoria(logs, responsavel, mes, ano) {
    if (!window.jspdf) return showToast('Biblioteca PDF não carregada', 'error');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth  = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let y = 20;

    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const mesNome = meses[mes] || '';

    const agora = new Date();
    const emissao = agora.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('RELATÓRIO DE ATIVIDADES', pageWidth / 2, y, { align: 'center' }); y += 8;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('Ordens de Compra', pageWidth / 2, y, { align: 'center' }); y += 5;
    doc.text(`Atividades de ${responsavel}`, pageWidth / 2, y, { align: 'center' }); y += 5;
    doc.text(`Período: ${mesNome} ${ano}`, pageWidth / 2, y, { align: 'center' }); y += 5;
    doc.text(`Emitido em: ${emissao}`, pageWidth / 2, y, { align: 'center' }); y += 12;

    const grupos = {};
    logs.forEach(l => {
        const d = new Date(l.created_at);
        const dia = isNaN(d) ? 'Sem data' : d.toLocaleDateString('pt-BR');
        if (!grupos[dia]) grupos[dia] = [];
        grupos[dia].push(l);
    });

    const dias = Object.keys(grupos).sort((a, b) => {
        const pa = a.split('/').reverse().join('-');
        const pb = b.split('/').reverse().join('-');
        return pb.localeCompare(pa);
    });

    dias.forEach(dia => {
        if (y > pageHeight - 40) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(dia, margin, y); y += 6;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        grupos[dia].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        grupos[dia].forEach(l => {
            if (y > pageHeight - 20) { doc.addPage(); y = 20; }
            const hora = new Date(l.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const nome = l.username || '—';
            const ordem = l.target_code || '—';
            const acao = traduzirAcao(l.action);
            doc.text(`${hora}  ·  ${nome} ${acao} ${ordem}`, margin + 4, y);
            y += 5;
        });

        y += 6;
    });

    if (!dias.length) {
        doc.setFontSize(11);
        doc.text('Nenhuma atividade registrada.', margin, y);
    }

    const nome = `atividades-compra-${responsavel.toLowerCase()}-${mesNome.toLowerCase()}-${ano}.pdf`;
    doc.save(nome);
    showToast('Relatório gerado', 'success');
}

function traduzirAcao(a) {
    switch (a) {
        case 'create': return 'ABRIU A ORDEM DE COMPRA';
        case 'update': return 'ATUALIZOU A ORDEM DE COMPRA';
        case 'delete': return 'EXCLUIU A ORDEM DE COMPRA';
        case 'status': return 'ALTEROU O STATUS DA ORDEM DE COMPRA';
        default: return a || '';
    }
}

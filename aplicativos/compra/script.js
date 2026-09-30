// ============================================================
// Ordens de Compra · Desktop · I.R. Comércio
// ============================================================

const API_URL = window.location.origin + '/api';

console.log('[compra-front] script carregado');

let accessToken = null;
let currentUserName = null;

let ordens = [];
let currentMonth = new Date();
let editingId = null;
let itemCounter = 0;
let currentTab = 0;
let fornecedoresCache = {};
let ultimoNumeroGlobal = 0;
let currentFetchController = null;

const KNOWN_RESPONSAVEIS = ['ROBERTO', 'ISAQUE', 'MIGUEL'];
const tabs = ['tab-geral', 'tab-fornecedor', 'tab-pedido', 'tab-entrega', 'tab-pagamento'];

function resolveToken() {
    const p = new URLSearchParams(window.location.search);
    const fromUrl = p.get('access_token');
    if (fromUrl) {
        sessionStorage.setItem('irToken', fromUrl);
        window.history.replaceState({}, '', window.location.pathname);
        console.log('[compra-front] token vindo da URL');
        return fromUrl;
    }
    const t = sessionStorage.getItem('irToken');
    console.log('[compra-front] token vindo do sessionStorage:', t ? 'SIM' : 'NÃO');
    return t;
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
            <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem;">${msg || 'SEM ACESSO'}</h1>
            <p style="color: #5B6470; margin-bottom: 2rem; font-size: 0.95rem;">Você não tem permissão para acessar este módulo.</p>
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

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[compra-front] DOMContentLoaded');
    accessToken = resolveToken();
    if (!accessToken) {
        console.log('[compra-front] ✗ sem token');
        showDenied('SESSÃO EXPIRADA');
        return;
    }

    await fetchSessionUser();
    updateMonthDisplay();
    await carregarTudo();
    setInterval(() => carregarTudo(), 30000);
});

async function fetchSessionUser() {
    try {
        const res = await fetch('/api/portal/modules', { headers: getHeaders() });
        console.log('[compra-front] /api/portal/modules status:', res.status);
        if (!res.ok) return;
        const data = await res.json();
        if (data.user) currentUserName = data.user.name || data.user.username || null;
        console.log('[compra-front] usuário:', currentUserName);
    } catch (e) {
        console.log('[compra-front] erro fetchSessionUser:', e.message);
    }
}

async function carregarTudo() {
    console.log('[compra-front] carregarTudo início');
    try {
        await loadOrdens();
        await loadUltimoNumero();
        await loadFornecedoresGlobal();
        console.log('[compra-front] carregarTudo fim ✓');
    } catch (err) {
        console.error('[compra-front] carregarTudo erro:', err);
    } finally {
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
    const url = `${API_URL}/ordens?mes=${mes}&ano=${ano}`;

    console.log('[compra-front] GET', url);

    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: getHeaders(),
            cache: 'no-cache',
            signal
        });
        console.log('[compra-front] /ordens status:', res.status);

        if (res.status === 401 || res.status === 403) {
            console.log('[compra-front] ✗ sem acesso');
            showDenied('SEM ACESSO');
            return;
        }
        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            console.log('[compra-front] ✗ erro HTTP:', res.status, txt.slice(0, 300));
            throw new Error('Erro ' + res.status);
        }

        const data = await res.json();
        console.log('[compra-front] /ordens retornou', Array.isArray(data) ? data.length : 'não-array', 'itens');

        if (mes !== currentMonth.getMonth() || ano !== currentMonth.getFullYear()) {
            console.log('[compra-front] mês mudou durante o fetch, descartando');
            return;
        }

        ordens = Array.isArray(data) ? data : [];
        mesclarCacheFornecedores(ordens);
        updateDisplay();
        console.log('[compra-front] render concluído com', ordens.length, 'ordens');
    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[compra-front] loadOrdens erro:', err);
    } finally {
        currentFetchController = null;
    }
}

async function loadUltimoNumero() {
    try {
        const res = await fetch(`${API_URL}/ordens/ultimo-numero`, { headers: getHeaders(), cache: 'no-cache' });
        console.log('[compra-front] /ordens/ultimo-numero status:', res.status);
        if (!res.ok) return;
        const data = await res.json();
        ultimoNumeroGlobal = data.ultimoNumero || 0;
        console.log('[compra-front] último número:', ultimoNumeroGlobal);
    } catch (e) {
        console.log('[compra-front] erro loadUltimoNumero:', e.message);
    }
}

async function loadFornecedoresGlobal() {
    try {
        const res = await fetch(`${API_URL}/fornecedores`, { headers: getHeaders(), cache: 'no-cache' });
        console.log('[compra-front] /fornecedores status:', res.status);
        if (!res.ok) return;
        const lista = await res.json();
        console.log('[compra-front] /fornecedores retornou', Array.isArray(lista) ? lista.length : 'não-array');
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
    } catch (e) {
        console.log('[compra-front] erro loadFornecedoresGlobal:', e.message);
    }
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
        box.style.cssText = `
            position: absolute; z-index: 1000; background: var(--bg-card);
            border: 1px solid var(--border-color); border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-height: 260px;
            overflow-y: auto; width: 100%; margin-top: 4px; left: 0;
        `;
        list.forEach(f => {
            const item = document.createElement('div');
            item.style.cssText = 'padding: 10px 12px; cursor: pointer; border-bottom: 1px solid var(--border-color);';
            item.innerHTML = `
                <div style="font-weight: 600; font-size: 0.88rem;">${escHtml(f.razaoSocial)}</div>
                <div style="font-size: 0.78rem; color: var(--text-secondary);">${escHtml(f.cnpj)}${f.nomeFantasia ? ' · ' + escHtml(f.nomeFantasia) : ''}</div>
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
    const c = document.getElementById('ordensContainer');
    if (c) c.innerHTML = '';
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
}

function updateDashboard() {
    const totalFechadas = ordens.filter(o => o.status === 'fechada').length;
    const totalAbertas = ordens.filter(o => o.status === 'aberta').length;

    document.getElementById('totalOrdens').textContent = ordens.length;
    document.getElementById('totalFechadas').textContent = totalFechadas;
    document.getElementById('totalAbertas').textContent = totalAbertas;

    let total = 0;
    ordens.forEach(o => {
        const v = (o.valor_total || '0').replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        total += parseFloat(v) || 0;
    });
    document.getElementById('valorTotal').textContent = formatCurrency(total);
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

    lista.sort((a, b) => parseInt(a.numero_ordem) - parseInt(b.numero_ordem));

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
            ${o.site ? `<p><strong>Site:</strong> ${escHtml(o.site)}</p>` : ''}
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
    let y = 20;

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('ORDEM DE COMPRA', pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(13);
    doc.text(`Nº ${o.numero_ordem}`, pageWidth / 2, y, { align: 'center' });
    y += 12;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('DADOS DO FORNECEDOR', margin, y); y += 6;
    doc.setFont(undefined, 'normal');
    doc.text(`Razão Social: ${o.razao_social || ''}`, margin, y); y += 5;
    if (o.nome_fantasia) { doc.text(`Nome Fantasia: ${o.nome_fantasia}`, margin, y); y += 5; }
    doc.text(`CNPJ: ${o.cnpj || ''}`, margin, y); y += 5;
    if (o.endereco_fornecedor) { doc.text(`Endereço: ${o.endereco_fornecedor}`, margin, y); y += 5; }
    if (o.contato) { doc.text(`Contato: ${o.contato}`, margin, y); y += 5; }
    if (o.telefone) { doc.text(`Telefone: ${o.telefone}`, margin, y); y += 5; }
    if (o.email) { doc.text(`E-mail: ${o.email}`, margin, y); y += 5; }

    y += 4;
    doc.setFont(undefined, 'bold');
    doc.text('ITENS DO PEDIDO', margin, y); y += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');

    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach(it => {
        if (y > pageHeight - 30) { doc.addPage(); y = 20; }
        doc.text(`${it.item}. ${it.especificacao || ''}`, margin, y); y += 4;
        doc.text(`QTD: ${it.quantidade} ${it.unidade || ''}  ·  Vlr UN: ${formatCurrency(it.valorUnitario || 0)}  ·  Total: ${it.valorTotal || ''}`, margin + 4, y);
        y += 5;
    });

    y += 4;
    if (y > pageHeight - 40) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`VALOR TOTAL: ${o.valor_total || ''}`, margin, y); y += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('CONDIÇÕES DE PAGAMENTO', margin, y); y += 6;
    doc.setFont(undefined, 'normal');
    doc.text(`Forma: ${o.forma_pagamento || '-'}`, margin, y); y += 5;
    doc.text(`Prazo: ${o.prazo_pagamento || '-'}`, margin, y); y += 5;
    if (o.dados_bancarios) { doc.text(`Dados bancários: ${o.dados_bancarios}`, margin, y); y += 5; }

    y += 6;
    if (y > pageHeight - 40) { doc.addPage(); y = 20; }
    doc.setFont(undefined, 'bold');
    doc.text('LOCAL DE ENTREGA', margin, y); y += 6;
    doc.setFont(undefined, 'normal');
    const local = doc.splitTextToSize(o.local_entrega || '', maxWidth);
    doc.text(local, margin, y);
    y += local.length * 5 + 4;
    doc.text(`Prazo: ${o.prazo_entrega || '-'}`, margin, y); y += 5;
    doc.text(`Transporte: ${o.transporte || '-'}`, margin, y); y += 10;

    doc.save(`OC-${o.numero_ordem}.pdf`);
    showToast(`Ordem Nº ${o.numero_ordem} emitida`, 'success');
}

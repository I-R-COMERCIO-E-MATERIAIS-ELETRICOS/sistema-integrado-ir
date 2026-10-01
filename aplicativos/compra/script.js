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
        if (data.user) {
            currentUserName = data.user.name || data.user.username || null;
            currentUserIsAdmin = !!data.user.is_admin;
        }
    } catch (e) {}
}

async function carregarTudo() {
    try {
        await loadOrdens();
        await loadUltimoNumero();
        await loadFornecedoresGlobal();
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
                <button onclick="event.stopPropagation();editOrdem('${o.id}')" class="action-btn edit">Editar</

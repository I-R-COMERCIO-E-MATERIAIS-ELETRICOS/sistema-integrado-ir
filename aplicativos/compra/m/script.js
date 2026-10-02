// ============================================================
// Ordens de Compra · Mobile · I.R. Comércio
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

const KNOWN_RESPONSAVEIS = ['ROBERTO', 'ISAQUE', 'MIGUEL'];

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

function toUpperCase(v) { return v ? String(v).toUpperCase() : ''; }

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

document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { showDenied('SESSÃO EXPIRADA'); return; }

    initCarousel();
    updateMonthDisplay();

    await fetchSessionUser();
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
    } catch (e) {
        console.error('[compra m] carregarTudo:', e);
    } finally {
        updateAuditBtn();
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'ir-module-ready', module: 'compra' }, '*');
            }
        } catch (e) {}
    }
}

// ─── CARROSSEL ──────────────────────────────────────────────
const CAROUSEL_VISIBLE = 3;
let carouselPage = 0;
let carouselTotalPages = 1;
let touchStartX = 0;
let touchDeltaX = 0;
let isDragging = false;

function initCarousel() {
    const track = document.getElementById('dashTrack');
    if (!track) return;

    const totalCards = track.children.length;
    carouselTotalPages = Math.max(1, Math.ceil(totalCards / CAROUSEL_VISIBLE));

    renderDots();
    updateCarouselPosition(0);

    track.addEventListener('touchstart', onTouchStart, { passive: true });
    track.addEventListener('touchmove',  onTouchMove,  { passive: true });
    track.addEventListener('touchend',   onTouchEnd,   { passive: true });

    track.addEventListener('mousedown', onTouchStart);
    window.addEventListener('mousemove', onTouchMove);
    window.addEventListener('mouseup',   onTouchEnd);

    window.addEventListener('resize', () => updateCarouselPosition(carouselPage));
}

function renderDots() {
    const dots = document.getElementById('dashDots');
    if (!dots) return;
    dots.innerHTML = '';
    for (let i = 0; i < carouselTotalPages; i++) {
        const d = document.createElement('span');
        d.className = 'm-carousel-dot';
        dots.appendChild(d);
    }
}

function updateCarouselPosition(page) {
    const track = document.getElementById('dashTrack');
    if (!track) return;

    if (page >= carouselTotalPages) page = 0;
    if (page < 0) page = carouselTotalPages - 1;
    carouselPage = page;

    const offset = page * 100;
    track.style.transform = `translateX(-${offset}%)`;

    document.querySelectorAll('.m-carousel-dot').forEach((d, i) => {
        d.classList.toggle('active', i === carouselPage);
    });
}

function onTouchStart(e) {
    const p = e.touches ? e.touches[0] : e;
    touchStartX = p.clientX;
    touchDeltaX = 0;
    isDragging = true;
}

function onTouchMove(e) {
    if (!isDragging) return;
    const p = e.touches ? e.touches[0] : e;
    touchDeltaX = p.clientX - touchStartX;
}

function onTouchEnd() {
    if (!isDragging) return;
    isDragging = false;

    const threshold = 40;
    if (touchDeltaX > threshold) {
        updateCarouselPosition(carouselPage - 1);
    } else if (touchDeltaX < -threshold) {
        updateCarouselPosition(carouselPage + 1);
    }
    touchStartX = 0;
    touchDeltaX = 0;
}

// ─── MÊS ────────────────────────────────────────────────────
function changeMonth(direction) {
    currentMonth.setMonth(currentMonth.getMonth() + direction);
    ordens = [];
    updateMonthDisplay();
    const root = document.getElementById('ordensList');
    if (root) root.innerHTML = '';
    loadOrdens();
}

function updateMonthDisplay() {
    const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const el = document.getElementById('currentMonth');
    if (el) el.textContent = `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
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
        showToast('Erro ao carregar ordens', 'error');
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

async function syncData() {
    const btn = document.getElementById('syncBtn');
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

function updateDisplay() {
    updateStats();
    updateList();
    updateResponsaveisFilter();
    updateAuditBtn();
}

function updateStats() {
    const fechadas = ordens.filter(o => o.status === 'fechada').length;
    const abertas  = ordens.filter(o => o.status === 'aberta').length;

    let total = 0;
    ordens.forEach(o => {
        const v = (o.valor_total || '0').replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        total += parseFloat(v) || 0;
    });

    const t = document.getElementById('m-total');
    const f = document.getElementById('m-fechadas');
    const a = document.getElementById('m-abertas');
    const v = document.getElementById('m-valor');
    if (t) t.textContent = ordens.length;
    if (f) f.textContent = fechadas;
    if (a) a.textContent = abertas;
    if (v) v.textContent = formatCurrency(total);
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

    lista.sort((a, b) => parseInt(b.numero_ordem || 0) - parseInt(a.numero_ordem || 0));

    root.innerHTML = lista.map(o => {
        const fechada = o.status === 'fechada';
        return `
            <div class="m-card ${fechada ? 'fechada' : ''}" onclick="viewOrdem('${o.id}')">
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
                    <button class="m-btn ${fechada ? 'reabrir' : 'pdf'}" onclick="event.stopPropagation();toggleStatus('${o.id}')">${fechada ? 'Reabrir' : 'Fechar'}</button>
                    <button class="m-btn del" onclick="event.stopPropagation();deleteOrdem('${o.id}')">Excluir</button>
                </div>
            </div>
        `;
    }).join('');
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

function updateAuditBtn() {
    const btn = document.getElementById('auditBtn');
    if (!btn) return;
    btn.style.display = currentUserIsAdmin ? 'flex' : 'none';
}

function viewOrdem(id) {
    const o = ordens.find(x => String(x.id) === String(id));
    if (!o) return;

    const items = Array.isArray(o.items) ? o.items : [];
    const itemsHtml = items.length
        ? items.map(it => `
            <p><strong>${escHtml(it.item)}. ${escHtml(toUpperCase(it.especificacao))}</strong><br>
            ${escHtml(it.quantidade)} ${escHtml(toUpperCase(it.unidade))} × ${formatCurrency(it.valorUnitario || 0)} = ${escHtml(it.valorTotal || '')}</p>
        `).join('')
        : '<p>—</p>';

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
                    ${itemsHtml}
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
                    <button type="button" class="m-tab active" onclick="switchTab(0,this)">Geral</button>
                    <button type="button" class="m-tab" onclick="switchTab(1,this)">Fornecedor</button>
                    <button type="button" class="m-tab" onclick="switchTab(2,this)">Itens</button>
                    <button type="button" class="m-tab" onclick="switchTab(3,this)">Entrega</button>
                    <button type="button" class="m-tab" onclick="switchTab(4,this)">Pagamento</button>
                </div>

                <form class="m-form" onsubmit="handleSubmit(event)">
                    <input type="hidden" id="editId" value="${cfg.editId}">

                    <div class="m-pane active" data-pane="0">
                        <div><label>Número da Ordem *</label><input type="text" id="numeroOrdem" value="${escHtml(cfg.numeroOrdem)}" required></div>
                        <div><label>Responsável</label><input type="text" id="responsavel" value="${escHtml(cfg.responsavel || '')}" readonly></div>
                        <div><label>Data da Ordem *</label><input type="date" id="dataOrdem" value="${escHtml(cfg.dataOrdem || '')}" required></div>
                    </div>

                    <div class="m-pane" data-pane="1">
                        <div><label>Razão Social *</label><input type="text" id="razaoSocial" value="${o ? escHtml(o.razao_social) : ''}" required></div>
                        <div><label>Nome Fantasia</label><input type="text" id="nomeFantasia" value="${o ? escHtml(o.nome_fantasia || '') : ''}"></div>
                        <div><label>CNPJ *</label><input type="text" id="cnpj" value="${o ? escHtml(o.cnpj || '') : ''}" required></div>
                        <div><label>Endereço</label><input type="text" id="enderecoFornecedor" value="${o ? escHtml(o.endereco_fornecedor || '') : ''}"></div>
                        <div><label>Contato</label><input type="text" id="contato" value="${o ? escHtml(o.contato || '') : ''}"></div>
                        <div><label>Telefone</label><input type="text" id="telefone" value="${o ? escHtml(o.telefone || '') : ''}"></div>
                        <div><label>E-mail</label><input type="email" id="email" value="${o ? escHtml(o.email || '') : ''}"></div>
                    </div>

                    <div class="m-pane" data-pane="2">
                        <button type="button" class="m-btn blue" onclick="addItem()" style="width:100%; margin-bottom:0.5rem;">+ Adicionar Item</button>
                        <div id="itemsBody"></div>
                        <div><label>Valor Total</label><input type="text" id="valorTotalOrdem" readonly value="${o ? escHtml(o.valor_total || 'R$ 0,00') : 'R$ 0,00'}"></div>
                        <div><label>Frete</label><input type="text" id="frete" value="${o ? escHtml(o.frete || 'CIF') : 'CIF'}"></div>
                    </div>

                    <div class="m-pane" data-pane="3">
                        <div><label>Local de Entrega</label><input type="text" id="localEntrega" value="${o ? escHtml(o.local_entrega || '') : 'RUA TADORNA Nº 472, SALA 2, NOVO HORIZONTE - SERRA/ES  |  CEP: 29.163-318'}"></div>
                        <div><label>Prazo de Entrega</label><input type="text" id="prazoEntrega" value="${o ? escHtml(o.prazo_entrega || 'IMEDIATO') : 'IMEDIATO'}"></div>
                        <div><label>Transporte</label><input type="text" id="transporte" value="${o ? escHtml(o.transporte || 'FORNECEDOR') : 'FORNECEDOR'}"></div>
                    </div>

                    <div class="m-pane" data-pane="4">
                        <div><label>Forma de Pagamento *</label><input type="text" id="formaPagamento" value="${o ? escHtml(o.forma_pagamento || '') : ''}" required></div>
                        <div><label>Prazo de Pagamento *</label><input type="text" id="prazoPagamento" value="${o ? escHtml(o.prazo_pagamento || '') : ''}" required></div>
                        <div><label>Dados Bancários</label><textarea id="dadosBancarios" rows="3">${o ? escHtml(o.dados_bancarios || '') : ''}</textarea></div>
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
            const rows = document.querySelectorAll('#itemsBody .m-item-row');
            const last = rows[rows.length - 1];
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
        <div class="m-item-row-title">Item ${itemCounter}</div>
        <div class="m-item-grid">
            <div class="full"><label>Especificação</label><input type="text" class="it-espec" placeholder="Descrição"></div>
            <div><label>QTD</label><input type="number" class="it-qtd" min="0" step="0.01" value="1" oninput="recalcItem(this)"></div>
            <div><label>Unidade</label><input type="text" class="it-unid" value="UN"></div>
            <div><label>Valor UN</label><input type="number" class="it-valor" min="0" step="0.01" value="0" oninput="recalcItem(this)"></div>
            <div><label>Total</label><input type="text" class="it-total" readonly value="R$ 0,00"></div>
            <div class="full"><button type="button" class="m-btn del" onclick="this.closest('.m-item-row').remove(); recalcTotal();" style="width:100%;">Remover item</button></div>
        </div>
    `;
    root.appendChild(div);

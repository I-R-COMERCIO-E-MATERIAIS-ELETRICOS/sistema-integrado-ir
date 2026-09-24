const API_URL = window.location.origin + '/api/usuarios';

let state = {
    users: [],
    filtered: [],
    searchTerm: '',
    sector: 'TODOS',
    modulesCatalog: []
};
let accessToken = null;

// ─── TOKEN ────────────────────────────────────────────────────
function resolveToken() {
    const p = new URLSearchParams(window.location.search);
    const fromUrl = p.get('access_token');
    if (fromUrl) {
        sessionStorage.setItem('irAccessToken', fromUrl);
        window.history.replaceState({}, '', window.location.pathname);
        return fromUrl;
    }
    return sessionStorage.getItem('irAccessToken');
}

function showDenied(msg) {
    document.body.innerHTML = `
        <div class="m-denied">
            <h1>${msg || 'ACESSO NEGADO'}</h1>
            <p>Somente administradores podem acessar esta área.</p>
            <a href="/">Voltar ao Login</a>
        </div>`;
}

function getHeaders() {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    };
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { showDenied('SESSÃO EXPIRADA'); return; }
    await carregarModulos();
    await carregarUsuarios();
});

async function carregarModulos() {
    try {
        const res = await fetch(`${API_URL}/meta/modules`, { headers: getHeaders() });
        if (res.status === 401 || res.status === 403) { showDenied('ACESSO NEGADO'); return; }
        if (!res.ok) throw new Error('Erro ' + res.status);
        state.modulesCatalog = await res.json();
    } catch (err) {
        console.error('Erro ao carregar módulos:', err);
    }
}

async function carregarUsuarios() {
    try {
        const res = await fetch(API_URL, { headers: getHeaders() });
        if (res.status === 401 || res.status === 403) { showDenied('ACESSO NEGADO'); return; }
        if (!res.ok) throw new Error('Erro ' + res.status);
        state.users = await res.json();
        aplicarFiltros();
    } catch (err) {
        console.error(err);
        showToast('Erro ao carregar usuários', 'error');
    }
}

// ─── FILTROS ──────────────────────────────────────────────────
window.filterUsers = function() {
    state.searchTerm = document.getElementById('search').value.trim().toLowerCase();
    aplicarFiltros();
};

window.filterBySector = function(s) {
    state.sector = s;
    aplicarFiltros();
};

function aplicarFiltros() {
    state.filtered = state.users.filter(u => {
        if (state.sector !== 'TODOS' && u.sector !== state.sector) return false;
        if (state.searchTerm) {
            const hay = `${u.name} ${u.username} ${u.sector}`.toLowerCase();
            if (!hay.includes(state.searchTerm)) return false;
        }
        return true;
    });
    renderUsers();
}

// ─── RENDER ───────────────────────────────────────────────────
function renderUsers() {
    const root = document.getElementById('usersList');
    if (!state.filtered.length) {
        root.innerHTML = '<div class="m-empty">Nenhum usuário encontrado</div>';
        return;
    }
    root.innerHTML = state.filtered.map(u => `
        <div class="m-card" onclick="editUser('${u.id}')">
            <div class="m-card-header">
                <div class="m-avatar">${escHtml((u.name || '?').charAt(0).toUpperCase())}</div>
                <div class="m-card-title">
                    <div class="m-name">${escHtml(u.name)}</div>
                    <div class="m-username">@${escHtml(u.username || '—')}</div>
                </div>
                <span class="m-badge ${u.is_active ? 'on' : 'off'}">${u.is_active ? 'Ativo' : 'Inativo'}</span>
            </div>
            <div class="m-card-body">
                <div class="m-row"><span>Setor</span><strong>${escHtml(u.sector || '—')}</strong></div>
                ${u.contact_email ? `<div class="m-row"><span>E-mail</span><strong>${escHtml(u.contact_email)}</strong></div>` : ''}
                <div class="m-modules-row">
                    ${renderModulesChips(u)}
                </div>
            </div>
            <div class="m-card-actions">
                <button class="m-btn edit" onclick="event.stopPropagation();editUser('${u.id}')">Editar</button>
                <button class="m-btn del"  onclick="event.stopPropagation();deleteUser('${u.id}')">Excluir</button>
            </div>
        </div>
    `).join('');
}

function renderModulesChips(u) {
    if (u.is_admin) return '<span class="m-chip all">Acesso total</span>';
    const apps = Array.isArray(u.apps) ? u.apps : [];
    if (!apps.length) return '<span class="m-chip none">Nenhum módulo</span>';
    return apps.map(id => {
        const mod = state.modulesCatalog.find(m => m.id === id);
        return `<span class="m-chip">${escHtml(mod ? mod.name : id)}</span>`;
    }).join('');
}

function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ─── MODAL ────────────────────────────────────────────────────
window.toggleForm = function() { showFormModal(null); };

function showFormModal(editId) {
    const existing = document.getElementById('formModal');
    if (existing) existing.remove();

    const isEditing = !!editId;
    const u = isEditing ? state.users.find(x => x.id === editId) : null;
    const userApps = Array.isArray(u?.apps) ? u.apps : [];
    const isAdmin = u?.is_admin === true;

    document.body.insertAdjacentHTML('beforeend', `
        <div class="m-modal-overlay" id="formModal">
            <div class="m-modal">
                <div class="m-modal-header">
                    <h2>${isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                    <button class="m-close" onclick="closeFormModal()">✕</button>
                </div>
                <form id="mUserForm" onsubmit="handleSubmit(event)" class="m-form">
                    <input type="hidden" id="modalEditId" value="${editId || ''}">

                    <label>Nome do funcionário *</label>
                    <input type="text" id="modalName" value="${u ? escHtml(u.name) : ''}" required>

                    <label>Nome de usuário *</label>
                    <input type="text" id="modalUsername" value="${u ? escHtml(u.username || '') : ''}"
                           ${isEditing ? 'disabled' : ''} required>

                    <label>Setor *</label>
                    <select id="modalSector" required onchange="onSectorChange()">
                        ${['Administrador','Vendas','Almoxarifado','Financeiro'].map(s =>
                            `<option value="${s}" ${u?.sector === s ? 'selected' : ''}>${s}</option>`
                        ).join('')}
                    </select>

                    <label>Senha ${isEditing ? '(deixe em branco para manter)' : '*'}</label>
                    <input type="password" id="modalPassword" ${isEditing ? '' : 'required'}>

                    <label>E-mail de contato (opcional)</label>
                    <input type="email" id="modalContactEmail" value="${u ? escHtml(u.contact_email || '') : ''}">

                    <div class="m-toggle-row">
                        <div class="m-switch ${u?.is_active !== false ? 'active' : ''}" id="mActiveSwitch"></div>
                        <span>Usuário ativo</span>
                        <input type="checkbox" id="modalActive" ${u?.is_active !== false ? 'checked' : ''} style="display:none;">
                    </div>

                    <label>Módulos liberados</label>
                    <div class="m-modules-picker ${isAdmin ? 'disabled' : ''}" id="modulesPicker">
                        ${state.modulesCatalog.map(m => `
                            <label class="m-module-check ${userApps.includes(m.id) ? 'checked' : ''}">
                                <input type="checkbox" value="${m.id}"
                                    ${userApps.includes(m.id) ? 'checked' : ''}
                                    ${isAdmin ? 'disabled' : ''}
                                    onchange="this.parentElement.classList.toggle('checked', this.checked)">
                                <span>${escHtml(m.name)}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="m-hint" id="modulesHint">
                        ${isAdmin
                            ? 'Administrador tem acesso automático a todos os módulos.'
                            : 'Selecione os módulos que este usuário poderá acessar.'}
                    </div>

                    <div class="m-form-actions">
                        <

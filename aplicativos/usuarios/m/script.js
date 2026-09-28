const API_URL = window.location.origin + '/api/usuarios';

let state = {
    users: [],
    filtered: [],
    searchTerm: '',
    sector: 'TODOS',
    employeeId: 'TODOS',
    modulesCatalog: [],
    employeesCatalog: [],
    editingId: null,
    selectedModules: [],
    userActive: true,
    adminMode: false
};
let accessToken = null;
let deleteTargetId = null;

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
    document.body.innerHTML = `
        <div class="m-denied">
            <h1>${msg || 'ACESSO NEGADO'}</h1>
            <p>Somente administradores podem acessar esta área.</p>
            <a href="/portal/m/">Voltar ao Portal</a>
        </div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { showDenied('SESSÃO EXPIRADA'); return; }
    await carregarModulos();
    await carregarEmployees();
    await carregarUsuarios();
});

async function carregarModulos() {
    try {
        const res = await fetch(`${API_URL}/meta/modules`, { headers: getHeaders() });
        if (res.status === 401 || res.status === 403) { showDenied('ACESSO NEGADO'); return; }
        if (!res.ok) throw new Error('Erro ' + res.status);
        state.modulesCatalog = await res.json();
    } catch (err) { console.error('Erro ao carregar módulos:', err); }
}

async function carregarEmployees() {
    try {
        const res = await fetch(`${API_URL}/employees`, { headers: getHeaders() });
        if (res.status === 401 || res.status === 403) { showDenied('ACESSO NEGADO'); return; }
        if (!res.ok) throw new Error('Erro ' + res.status);
        state.employeesCatalog = await res.json();
        popularEmployees();
    } catch (err) { console.error('Erro ao carregar funcionários:', err); }
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

function popularEmployees() {
    const sel = document.getElementById('employeeSelect');
    if (!sel) return;
    const atual = sel.value || 'TODOS';
    sel.innerHTML = '<option value="TODOS">Todos os Funcionários</option>';
    state.employeesCatalog.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.name;
        sel.appendChild(opt);
    });
    sel.value = atual;
}

window.filterUsers = function () {
    state.searchTerm = document.getElementById('search').value.trim().toLowerCase();
    aplicarFiltros();
};
window.filterBySector = function (v) { state.sector = v; aplicarFiltros(); };
window.filterByEmployee = function (v) { state.employeeId = v; aplicarFiltros(); };

function aplicarFiltros() {
    state.filtered = state.users.filter(u => {
        if (state.sector !== 'TODOS' && u.sector !== state.sector) return false;
        if (state.employeeId !== 'TODOS' && u.id !== state.employeeId) return false;
        if (state.searchTerm) {
            const hay = `${u.code || ''} ${u.name} ${u.username || ''}`.toLowerCase();
            if (!hay.includes(state.searchTerm)) return false;
        }
        return true;
    });
    renderUsers();
}

function renderUsers() {
    const root = document.getElementById('usersList');
    if (!state.filtered.length) {
        root.innerHTML = '<div class="m-empty">Nenhum usuário encontrado</div>';
        return;
    }
    root.innerHTML = state.filtered.map(u => `
        <div class="m-card" onclick="editUser('${u.id}')">
            <div class="m-card-header">
                <span class="m-code">${u.code != null ? u.code : '—'}</span>
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
                ${u.contact_phone ? `<div class="m-row"><span>Telefone</span><strong>${escHtml(u.contact_phone)}</strong></div>` : ''}
            </div>
            <div class="m-card-actions">
                <button class="m-btn edit" onclick="event.stopPropagation();editUser('${u.id}')">Editar</button>
                <button class="m-btn del"  onclick="event.stopPropagation();abrirModalExclusao('${u.id}')">Excluir</button>
            </div>
        </div>
    `).join('');
}

function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

window.toggleForm = function () { abrirModalUsuario(null); };

function abrirModalUsuario(editId) {
    const existing = document.getElementById('formModal');
    if (existing) existing.remove();

    state.editingId = editId || null;
    const u = editId ? state.users.find(x => x.id === editId) : null;
    state.adminMode = u?.is_admin === true;
    state.userActive = u ? (u.is_active !== false) : true;
    state.selectedModules = Array.isArray(u?.apps) ? u.apps.slice() : [];
    if (state.adminMode) state.selectedModules = state.modulesCatalog.map(m => m.id);

    const userApps = state.selectedModules;

    document.body.insertAdjacentHTML('beforeend', `
        <div class="m-modal-overlay" id="formModal">
            <div class="m-modal">
                <div class="m-modal-header">
                    <h2>${editId ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                    <button class="m-close" onclick="fecharModalUsuario(true)">✕</button>
                </div>

                <div class="m-tabs">
                    <button class="m-tab-btn active" data-tab="info" onclick="mostrarTab('info')">Informações</button>
                    <button class="m-tab-btn" data-tab="modules" onclick="mostrarTab('modules')">Módulos</button>
                    <button class="m-tab-btn" data-tab="credentials" onclick="mostrarTab('credentials')">Credenciais</button>
                </div>

                <form id="modalUserForm" onsubmit="handleSubmit(event)" class="m-form">
                    <input type="hidden" id="modalEditId" value="${editId || ''}">

                    <div class="m-tab-content active" data-pane="info">
                        <label>Nome do funcionário *</label>
                        <input type="text" id="modalName" value="${u ? escHtml(u.name) : ''}" required>

                        <label>Setor *</label>
                        <select id="modalSector" onchange="onSectorChange()">
                            ${['Administrador','Vendas','Almoxarifado','Financeiro'].map(s =>
                                `<option value="${s}" ${u?.sector === s ? 'selected' : ''}>${s}</option>`
                            ).join('')}
                        </select>

                        <label>E-mail</label>
                        <input type="email" id="modalContactEmail" value="${u ? escHtml(u.contact_email || '') : ''}">

                        <label>Telefone</label>
                        <input type="tel" id="modalContactPhone" value="${u ? escHtml(u.contact_phone || '') : ''}">
                    </div>

                    <div class="m-tab-content" data-pane="modules">
                        <p class="m-hint" style="margin-bottom: 0.75rem; font-style: normal;">Selecione os módulos que este usuário poderá acessar:</p>
                        <div class="m-modules-picker ${state.adminMode ? 'disabled' : ''}" id="modulesPicker">
                            ${state.modulesCatalog.map(m => `
                                <div class="m-module-check ${userApps.includes(m.id) ? 'checked' : ''}"
                                     data-module-id="${m.id}"
                                     onclick="toggleModuloMobile('${m.id}')">${escHtml(m.name)}</div>
                            `).join('')}
                        </div>
                        <p class="m-hint ${state.adminMode ? '' : 'hidden'}" id="modulesHint">O administrador tem acesso a todos os módulos.</p>
                    </div>

                    <div class="m-tab-content" data-pane="credentials">
                        <div class="m-form-row-2">
                            <div>
                                <label>Nome de usuário *</label>
                                <input type="text" id="modalUsername" value="${u ? escHtml(u.username || '') : ''}"
                                       ${editId ? 'disabled' : ''} required>
                            </div>
                            <div>
                                <label>Senha ${editId ? '' : '*'}</label>
                                <input type="password" id="modalPassword" ${editId ? '' : 'required'} placeholder="${editId ? 'Manter' : ''}">
                            </div>
                        </div>

                        <div style="margin-top: 1rem;">
                            <label>Status do usuário</label>
                            <div class="m-status-card ${state.userActive ? 'active' : 'inactive'} ${state.adminMode ? 'disabled' : ''}"
                                 id="statusCard" onclick="toggleStatusUsuario()">
                                <span id="statusCardText">${state.userActive ? 'Selecione para desativar' : 'Selecione para ativar'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="m-form-actions">
                        <button type="button" class="m-btn secondary" onclick="fecharModalUsuario(true)">Cancelar</button>
                        <button type="submit" class="m-btn primary" id="modalSubmitBtn">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    `);
}

window.fecharModalUsuario = function (cancelado) {
    const m = document.getElementById('formModal');
    if (m) m.remove();
    if (cancelado) {
        showToast(state.editingId ? 'Atualização cancelada' : 'Registro cancelado', 'error');
    }
};

window.mostrarTab = function (tab) {
    document.querySelectorAll('#formModal .m-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('#formModal .m-tab-content').forEach(c => {
        c.classList.toggle('active', c.dataset.pane === tab);
    });
};

window.toggleStatusUsuario = function () {
    if (state.adminMode) return;
    state.userActive = !state.userActive;
    const card = document.getElementById('statusCard');
    const text = document.getElementById('statusCardText');
    card.classList.toggle('active', state.userActive);
    card.classList.toggle('inactive', !state.userActive);
    text.textContent = state.userActive ? 'Selecione para desativar' : 'Selecione para ativar';
};

window.toggleModuloMobile = function (id) {
    if (state.adminMode) return;
    const idx = state.selectedModules.indexOf(id);
    if (idx >= 0) state.selectedModules.splice(idx, 1);
    else state.selectedModules.push(id);

    const el = document.querySelector(`#modulesPicker .m-module-check[data-module-id="${id}"]`);
    if (el) el.classList.toggle('checked', state.selectedModules.includes(id));
};

window.onSectorChange = function () {
    const sector = document.getElementById('modalSector').value;
    state.adminMode = sector === 'Administrador';
    const picker = document.getElementById('modulesPicker');
    const hint = document.getElementById('modulesHint');
    if (state.adminMode) {
        state.selectedModules = state.modulesCatalog.map(m => m.id);
        picker.classList.add('disabled');
        hint.classList.remove('hidden');
    } else {
        picker.classList.remove('disabled');
        hint.classList.add('hidden');
    }
    document.querySelectorAll('#modulesPicker .m-module-check').forEach(el => {
        el.classList.toggle('checked', state.selectedModules.includes(el.dataset.moduleId));
    });
    document.getElementById('statusCard').classList.toggle('disabled', state.adminMode);
};

window.editUser = function (id) { abrirModalUsuario(id); };

window.handleSubmit = async function (e) {
    e.preventDefault();
    const editId = document.getElementById('modalEditId').value.trim();
    const name = document.getElementById('modalName').value.trim();
    const sector = document.getElementById('modalSector').value;
    const contact_email = document.getElementById('modalContactEmail').value.trim();
    const contact_phone = document.getElementById('modalContactPhone').value.trim();
    const username = document.getElementById('modalUsername').value.trim();
    const password = document.getElementById('modalPassword').value;

    if (!name || !sector) { showToast('Preencha os campos obrigatórios', 'error'); return; }
    if (!editId && (!username || !password)) { showToast('Usuário e senha obrigatórios', 'error'); return; }

    const isAdmin = sector === 'Administrador';
    const apps = isAdmin ? [] : state.selectedModules.slice();
    const body = { name, sector, is_active: state.userActive, apps };
    if (!editId) body.username = username;
    if (password) body.password = password;
    if (contact_email) body.contact_email = contact_email;
    if (contact_phone) body.contact_phone = contact_phone;

    const btn = document.getElementById('modalSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Aguarde...';

    try {
        const url = editId ? `${API_URL}/${editId}` : API_URL;
        const method = editId ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(body) });

        if (res.status === 401 || res.status === 403) { showDenied('ACESSO NEGADO'); return; }
        if (res.status === 409) { showToast('Usuário já existe', 'error'); return; }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Erro ' + res.status);
        }

        document.getElementById('formModal').remove();
        showToast(editId ? 'Usuário atualizado' : 'Usuário criado', 'success');
        await carregarEmployees();
        await carregarUsuarios();
    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar';
    }
};

window.abrirModalExclusao = function (id) {
    deleteTargetId = id;
    const existing = document.getElementById('deleteModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', `
        <div class="m-modal-overlay" id="deleteModal">
            <div class="m-modal">
                <div class="m-modal-header">
                    <h2>Excluir</h2>
                    <button class="m-close" onclick="fecharModalExclusao()">✕</button>
                </div>
                <p class="m-confirm-msg">Tem certeza que deseja excluir este usuário?</p>
                <div class="m-form-actions centered">
                    <button type="button" class="m-btn danger" onclick="fecharModalExclusao()">Não</button>
                    <button type="button" class="m-btn success" onclick="confirmarExclusao()">Sim</button>
                </div>
            </div>
        </div>
    `);
};

window.fecharModalExclusao = function () {
    deleteTargetId = null;
    const m = document.getElementById('deleteModal');
    if (m) m.remove();
};

window.confirmarExclusao = async function () {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    fecharModalExclusao();
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (res.status === 400) {
            const err = await res.json();
            showToast(err.error || 'Não foi possível excluir', 'error');
            return;
        }
        if (!res.ok && res.status !== 204) throw new Error('Erro ' + res.status);
        showToast('Usuário excluído', 'success');
        await carregarEmployees();
        await carregarUsuarios();
    } catch {
        showToast('Erro ao excluir', 'error');
    }
};

window.sincronizarDados = async function () {
    const btn = document.querySelector('.m-sync-btn');
    if (!btn) return;
    btn.classList.add('spinning');
    btn.disabled = true;
    try {
        await carregarModulos();
        await carregarEmployees();
        await carregarUsuarios();
        showToast('Sincronização concluída', 'success');
    } catch {
        showToast('Erro na sincronização', 'error');
    } finally {
        setTimeout(() => {
            btn.classList.remove('spinning');
            btn.disabled = false;
        }, 600);
    }
};

function showToast(msg, type) {
    document.querySelectorAll('.m-toast').forEach(t => t.remove());
    const el = document.createElement('div');
    el.className = 'm-toast ' + type;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.transition = 'opacity 0.3s';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

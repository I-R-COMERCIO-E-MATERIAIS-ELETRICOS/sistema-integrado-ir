// ============================================================
// Usuários · Mobile (padrão para os demais módulos em m/)
// Cores, mensagens e efeitos idênticos ao desktop.
// ============================================================

const API = '/api/usuarios';

let accessToken = null;
let state = {
    users: [],
    filtered: [],
    search: '',
    sector: 'TODOS',
    employeeId: 'TODOS',
    modulesCatalog: [],
    employeesCatalog: [],
    editingId: null,
    selectedModules: [],
    userActive: true,
    adminMode: false,
};

document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { location.replace('/'); return; }
    try { IR.setToken(accessToken); } catch (_) {}

    wireUI();

    try {
        await carregarModulos();
        await carregarEmployees();
        await carregarUsuarios();
    } catch (err) {
        console.error('[usuarios/m]', err);
    }
});

function resolveToken() {
    const p = new URLSearchParams(location.search);
    const fromUrl = p.get('access_token') || p.get('sessionToken');
    if (fromUrl) {
        try { sessionStorage.setItem('irToken', fromUrl); } catch (_) {}
        history.replaceState({}, '', location.pathname);
        return fromUrl;
    }
    return sessionStorage.getItem('irToken');
}

/* ─── FETCH WRAPPER ─────────────────────────────────────────── */
async function api(path, opts = {}) {
    const r = await IR.fetchJSON(API + path, {
        ...opts,
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            ...(opts.headers || {})
        }
    });

    if (!r) return null;

    if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `Erro ${r.status}`);
    }
    if (r.status === 204) return { ok: true };
    return r.json().catch(() => ({}));
}

/* ─── WIRE UI ──────────────────────────────────────────────── */
function wireUI() {
    document.getElementById('addBtn').addEventListener('click', () => abrirForm(null));
    document.getElementById('closeModalBtn').addEventListener('click', fecharForm);
    document.getElementById('syncBtn').addEventListener('click', sincronizar);
    document.getElementById('saveBtn').addEventListener('click', salvar);
    document.getElementById('deleteBtn').addEventListener('click', excluirUsuario);
    document.getElementById('statusCard').addEventListener('click', toggleStatus);

    document.getElementById('searchInput').addEventListener('input', (e) => {
        state.search = e.target.value.trim().toLowerCase();
        aplicarFiltros();
    });
    document.getElementById('sectorFilter').addEventListener('change', (e) => {
        state.sector = e.target.value;
        aplicarFiltros();
    });
    document.getElementById('employeeFilter').addEventListener('change', (e) => {
        state.employeeId = e.target.value;
        aplicarFiltros();
    });

    document.querySelectorAll('.modal-tab').forEach(t => {
        t.addEventListener('click', () => ativarAba(t.dataset.tab));
    });

    document.getElementById('mSector').addEventListener('change', () => {
        state.adminMode = document.getElementById('mSector').value === 'Administrador';
        atualizarModoAdmin();
    });
}

/* ─── CARREGAR ─────────────────────────────────────────────── */
async function carregarModulos() {
    try {
        const data = await api('/meta/modules');
        state.modulesCatalog = Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('[usuarios/m] módulos:', err.message);
    }
}

async function carregarEmployees() {
    try {
        const data = await api('/employees');
        state.employeesCatalog = Array.isArray(data) ? data : [];
        popularEmployees();
    } catch (err) {
        console.error('[usuarios/m] employees:', err.message);
    }
}

async function carregarUsuarios() {
    try {
        const data = await api('');
        if (data === null) return;
        state.users = Array.isArray(data) ? data : [];
        aplicarFiltros();
    } catch (err) {
        console.error('[usuarios/m] usuários:', err.message);
        IR.toast('Erro ao carregar usuários', 'error');
    }
}

function popularEmployees() {
    const sel = document.getElementById('employeeFilter');
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

/* ─── FILTROS E LISTA ──────────────────────────────────────── */
function aplicarFiltros() {
    const t = state.search;
    state.filtered = state.users.filter(u => {
        if (state.sector !== 'TODOS' && u.sector !== state.sector) return false;
        if (state.employeeId !== 'TODOS' && u.id !== state.employeeId) return false;
        if (t) {
            const hay = `${u.code || ''} ${u.name || ''} ${u.username || ''}`.toLowerCase();
            if (!hay.includes(t)) return false;
        }
        return true;
    });
    renderList();
}

function renderList() {
    const list = document.getElementById('userList');
    const empty = document.getElementById('emptyState');
    list.innerHTML = '';

    if (!state.filtered.length) {
        empty.hidden = false;
        return;
    }
    empty.hidden = true;

    state.filtered.forEach(u => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'user-card';
        const inicial = (u.name || u.username || '?').charAt(0).toUpperCase();
        card.innerHTML = `
            <div class="user-avatar">${inicial}</div>
            <div class="user-info">
                <div class="user-name">${esc(u.name || u.username || '—')}</div>
                <div class="user-meta">${esc(u.username || '')}${u.sector ? ' · ' + esc(u.sector) : ''}</div>
            </div>
            <div class="user-badge ${u.is_active ? 'active' : 'inactive'}">
                ${u.is_active ? 'Ativo' : 'Inativo'}
            </div>`;
        card.addEventListener('click', () => abrirForm(u));
        list.appendChild(card);
    });
}

/* ─── FORM ─────────────────────────────────────────────────── */
function abrirForm(u) {
    state.editingId = u ? u.id : null;
    state.adminMode = u?.is_admin === true;

    document.getElementById('modalTitle').textContent = u ? 'Editar Usuário' : 'Novo Usuário';

    document.getElementById('mName').value = u?.name || '';
    document.getElementById('mSector').value = u?.sector || 'Almoxarifado';
    document.getElementById('mEmail').value = u?.contact_email || '';
    document.getElementById('mPhone').value = u?.contact_phone || '';
    document.getElementById('mUsername').value = u?.username || '';
    document.getElementById('mUsername').disabled = !!u;
    document.getElementById('mPassword').value = '';
    document.getElementById('pwdHint').textContent = u ? '(deixe em branco para manter)' : '';

    state.userActive = u ? (u.is_active !== false) : true;
    atualizarStatusCard();

    state.selectedModules = Array.isArray(u?.apps) ? u.apps.slice() : [];
    renderModulos();
    atualizarModoAdmin();

    document.getElementById('deleteBtn').hidden = !u;

    ativarAba('info');
    document.getElementById('userModal').classList.add('show');
    document.getElementById('userModal').setAttribute('aria-hidden', 'false');
}

function fecharForm() {
    document.getElementById('userModal').classList.remove('show');
    document.getElementById('userModal').setAttribute('aria-hidden', 'true');
    state.editingId = null;
}

function ativarAba(tab) {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === tab));
}

/* ─── MÓDULOS ──────────────────────────────────────────────── */
function renderModulos() {
    const grid = document.getElementById('modulesGrid');
    grid.innerHTML = '';
    state.modulesCatalog.forEach(m => {
        const selected = state.selectedModules.includes(m.id);
        const el = document.createElement('div');
        el.className = 'module-card' + (selected ? ' selected' : '');
        el.textContent = m.name;
        el.addEventListener('click', () => {
            if (state.adminMode) return;
            toggleModulo(m.id);
        });
        grid.appendChild(el);
    });
}

function toggleModulo(id) {
    const idx = state.selectedModules.indexOf(id);
    if (idx >= 0) state.selectedModules.splice(idx, 1);
    else state.selectedModules.push(id);
    renderModulos();
}

function atualizarModoAdmin() {
    const note = document.getElementById('modulesNote');
    const grid = document.getElementById('modulesGrid');
    if (state.adminMode) {
        note.classList.remove('hidden');
        state.selectedModules = state.modulesCatalog.map(m => m.id);
        renderModulos();
        grid.classList.add('admin-mode');
    } else {
        note.classList.add('hidden');
        grid.classList.remove('admin-mode');
        renderModulos();
    }
    atualizarStatusCard();
}

/* ─── STATUS TOGGLE ────────────────────────────────────────── */
function toggleStatus() {
    if (state.adminMode) return;
    state.userActive = !state.userActive;
    atualizarStatusCard();
}

function atualizarStatusCard() {
    const card = document.getElementById('statusCard');
    const text = document.getElementById('statusCardText');
    if (state.userActive) {
        card.classList.remove('inactive');
        card.classList.add('active');
        text.textContent = 'Selecione para desativar';
    } else {
        card.classList.remove('active');
        card.classList.add('inactive');
        text.textContent = 'Selecione para ativar';
    }
    card.classList.toggle('disabled', state.adminMode);
}

/* ─── SALVAR ───────────────────────────────────────────────── */
async function salvar() {
    const name = document.getElementById('mName').value.trim();
    const sector = document.getElementById('mSector').value;
    const contact_email = document.getElementById('mEmail').value.trim();
    const contact_phone = document.getElementById('mPhone').value.trim();
    const username = document.getElementById('mUsername').value.trim().toLowerCase();
    const password = document.getElementById('mPassword').value;

    if (!name || !sector) {
        return IR.toast('Verifique se todas as informações obrigatórias estão preenchidas', 'error');
    }
    if (!state.editingId && (!username || !password)) {
        return IR.toast('Verifique se todas as informações obrigatórias estão preenchidas', 'error');
    }

    const isAdmin = sector === 'Administrador';
    const apps = isAdmin ? [] : state.selectedModules.slice();

    const body = { name, sector, is_active: state.userActive, apps };
    if (!state.editingId) body.username = username;
    if (password) body.password = password;
    body.contact_email = contact_email;
    body.contact_phone = contact_phone;

    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        await api(state.editingId ? `/${state.editingId}` : '', {
            method: state.editingId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        IR.toast(state.editingId ? 'Usuário atualizado' : 'Usuário criado', 'success');
        fecharForm();
        await carregarEmployees();
        await carregarUsuarios();
    } catch (err) {
        IR.toast(err.message || 'Erro ao salvar', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar';
    }
}

/* ─── EXCLUIR ──────────────────────────────────────────────── */
async function excluirUsuario() {
    if (!state.editingId) return;
    const ok = await IR.confirm('Tem certeza que deseja excluir este usuário?', {
        confirmText: 'Sim',
        cancelText: 'Não'
    });
    if (!ok) return;

    const btn = document.getElementById('deleteBtn');
    btn.disabled = true;
    btn.textContent = 'Excluindo...';

    try {
        await api(`/${state.editingId}`, { method: 'DELETE' });
        IR.toast('Usuário excluído', 'success');
        fecharForm();
        await carregarEmployees();
        await carregarUsuarios();
    } catch (err) {
        IR.toast(err.message || 'Erro ao excluir', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Excluir';
    }
}

/* ─── SINCRONIZAR ──────────────────────────────────────────── */
async function sincronizar() {
    const btn = document.getElementById('syncBtn');
    btn.classList.add('spinning');
    btn.disabled = true;
    try {
        await carregarModulos();
        await carregarEmployees();
        await carregarUsuarios();
        IR.toast('Dados sincronizados.', 'success');
    } catch {
        IR.toast('Erro na sincronização', 'error');
    } finally {
        setTimeout(() => {
            btn.classList.remove('spinning');
            btn.disabled = false;
        }, 600);
    }
}

/* ─── UTILS ────────────────────────────────────────────────── */
function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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
        <div class="access-denied">
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
    const tbody = document.getElementById('usersTableBody');
    if (!state.filtered.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;">Nenhum usuário encontrado</td></tr>';
        return;
    }
    tbody.innerHTML = state.filtered.map(u => `
        <tr>
            <td><strong>${escHtml(u.name)}</strong></td>
            <td>${escHtml(u.username || '—')}</td>
            <td>${escHtml(u.sector || '—')}</td>
            <td>${renderModulesCell(u)}</td>
            <td><span class="badge ${u.is_active ? 'ativo' : 'inativo'}">${u.is_active ? 'Ativo' : 'Inativo'}</span></td>
            <td>${formatDate(u.created_at)}</td>
            <td style="text-align:center;">
                <button onclick="editUser('${u.id}')" class="action-btn edit">Editar</button>
                <button onclick="deleteUser('${u.id}')" class="action-btn delete">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function renderModulesCell(u) {
    if (u.is_admin) return '<span class="module-chip all">Acesso total</span>';
    const apps = Array.isArray(u.apps) ? u.apps : [];
    if (!apps.length) return '<span class="module-chip none">Nenhum</span>';
    return `<div class="module-chips">${apps.map(id => {
        const mod = state.modulesCatalog.find(m => m.id === id);
        return `<span class="module-chip">${escHtml(mod ? mod.name : id)}</span>`;
    }).join('')}</div

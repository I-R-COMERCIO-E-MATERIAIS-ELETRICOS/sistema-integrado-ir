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

// ─── TOKEN ─────────────────────────────────────────────────
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
        <div class="access-denied">
            <h1>${msg || 'ACESSO NEGADO'}</h1>
            <p>Somente administradores podem acessar esta área.</p>
            <a href="/">Voltar ao Login</a>
        </div>`;
}

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
    } catch (err) { console.error('Erro ao carregar módulos:', err); }
}

async function carregarUsuarios() {
    try {
        const res = await fetch(API_URL, { headers: getHeaders() });
        if (res.status === 401 || res.status === 403) { showDenied('ACESSO NEGADO'); return; }
        if (!res.ok) throw new Error('Erro ' + res.status);
        state.users = await res.json();
        state.employeesCatalog = state.users;
        popularEmployees();
        aplicarFiltros();
    } catch (err) {
        console.error(err);
        showToast('Erro ao carregar usuários', 'error');
    }
}

function popularEmployees() {
    const sel = document.getElementById('employeeSelect');
    const atual = sel.value;
    sel.innerHTML = '<option value="TODOS">Todos os Funcionários</option>';
    state.employeesCatalog.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.name;
        sel.appendChild(opt);
    });
    sel.value = atual || 'TODOS';
}

window.filterUsers = function() {
    state.searchTerm = document.getElementById('search').value.trim().toLowerCase();
    aplicarFiltros();
};
window.filterBySector = function(v) { state.sector = v; aplicarFiltros(); };
window.filterByEmployee = function(v) { state.employeeId = v; aplicarFiltros(); };

function aplicarFiltros() {
    state.filtered = state.users.filter(u => {
        if (state.sector !== 'TODOS' && u.sector !== state.sector) return false;
        if (state.employeeId !== 'TODOS' && u.id !== state.employeeId) return false;
        if (state.searchTerm) {
            const hay = `${u.name} ${u.username}`.toLowerCase();
            if (!hay.includes(state.searchTerm)) return false;
        }
        return true;
    });
    renderUsers();
}

function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!state.filtered.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">Nenhum usuário encontrado</td></tr>';
        return;
    }
    tbody.innerHTML = state.filtered.map(u => `
        <tr>
            <td><strong>${escHtml(u.name)}</strong></td>
            <td>${escHtml(u.username || '—')}</td>
            <td>${escHtml(u.sector || '—')}</td>
            <td><span class="badge ${u.is_active ? 'ativo' : 'inativo'}">${u.is_active ? 'Ativo' : 'Inativo'}</span></td>
            <td>${formatDate(u.created_at)}</td>
            <td style="text-align:center;">
                <button onclick="editUser('${u.id}')" class="action-btn edit">Editar</button>
                <button onclick="abrirModalExclusao('${u.id}')" class="action-btn delete">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
}

// ─── MODAL CADASTRO ────────────────────────────────────────
window.toggleForm = function() { abrirModalUsuario(null); };

function abrirModalUsuario(editId) {
    state.editingId = editId || null;
    const u = editId ? state.users.find(x => x.id === editId) : null;
    state.adminMode = u?.is_admin === true;

    document.getElementById('userModalTitle').textContent = editId ? 'Editar Usuário' : 'Novo Usuário';
    document.getElementById('modalName').value = u?.name || '';
    document.getElementById('modalSector').value = u?.sector || 'Vendas';
    document.getElementById('modalContactEmail').value = u?.contact_email || '';
    document.getElementById('modalContactPhone').value = u?.contact_phone || '';
    document.getElementById('modalUsername').value = u?.username || '';
    document.getElementById('modalUsername').disabled = !!editId;
    document.getElementById('modalPassword').value = '';
    document.getElementById('passwordHint').textContent = editId ? '(deixe em branco para manter)' : '';

    state.userActive = u ? (u.is_active !== false) : true;
    atualizarCardStatus();

    state.selectedModules = Array.isArray(u?.apps) ? u.apps.slice() : [];
    renderModulosDashboard();
    atualizarModoAdmin();

    mostrarTab('info');
    document.getElementById('userModal').classList.add('show');
}

window.fecharModalUsuario = function(cancelado) {
    document.getElementById('userModal').classList.remove('show');
    if (cancelado) {
        showToast(state.editingId ? 'Atualização cancelada' : 'Registro cancelado', 'error');
    }
};

window.mostrarTab = function(tab) {
    document.querySelectorAll('#userModal .tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('#userModal .tab-content').forEach(c => {
        c.classList.toggle('active', c.dataset.pane === tab);
    });
};

window.toggleStatusUsuario = function() {
    if (state.adminMode) return;
    state.userActive = !state.userActive;
    atualizarCardStatus();
};

function atualizarCardStatus() {
    const card = document.getElementById('statusCard');
    const text = document.getElementById('statusCardText');
    if (!card) return;
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

function renderModulosDashboard() {
    const wrap = document.getElementById('modulesDashboard');
    wrap.innerHTML = '';

    state.modulesCatalog.forEach(m => {
        const selected = state.selectedModules.includes(m.id);
        const el = document.createElement('div');
        el.className = 'dashboard-card module-card' + (selected ? ' selected' : '');
        el.dataset.moduleId = m.id;
        el.textContent = m.name;
        el.onclick = () => {
            if (state.adminMode) return;
            toggleModulo(m.id);
        };
        wrap.appendChild(el);
    });
}

function toggleModulo(id) {
    const idx = state.selectedModules.indexOf(id);
    if (idx >= 0) state.selectedModules.splice(idx, 1);
    else state.selectedModules.push(id);
    renderModulosDashboard();
}

window.onSectorChange = function() {
    const sector = document.getElementById('modalSector').value;
    state.adminMode = sector === 'Administrador';
    atualizarModoAdmin();
};

function atualizarModoAdmin() {
    const hint = document.getElementById('modulesHint');
    const wrap = document.getElementById('modulesDashboard');

    if (state.adminMode) {
        hint.classList.remove('hidden');
        state.selectedModules = state.modulesCatalog.map(m => m.id);
        renderModulosDashboard();
        wrap.classList.add('admin-mode');
    } else {
        hint.classList.add('hidden');
        wrap.classList.remove('admin-mode');
        renderModulosDashboard();
    }
    atualizarCardStatus();
}

window.handleSubmit = async function(e) {
    e.preventDefault();

    const name = document.getElementById('modalName').value.trim();
    const sector = document.getElementById('modalSector').value;
    const contact_email = document.getElementById('modalContactEmail').value.trim();
    const contact_phone = document.getElementById('modalContactPhone').value.trim();
    const username = document.getElementById('modalUsername').value.trim();
    const password = document.getElementById('modalPassword').value;

    if (!name || !sector) { showToast('Preencha os campos obrigatórios', 'error'); return; }
    if (!state.editingId && (!username || !password)) {
        showToast('Usuário e senha obrigatórios', 'error');
        return;
    }

    const isAdmin = sector === 'Administrador';
    const apps = isAdmin ? [] : state.selectedModules.slice();

    const body = { name, sector, is_active: state.userActive, apps };
    if (!state.editingId) body.username = username;
    if (password) body.password = password;
    if (contact_email) body.contact_email = contact_email;
    if (contact_phone) body.contact_phone = contact_phone;

    const btn = document.getElementById('modalSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Aguarde...';

    try {
        const url = state.editingId ? `${API_URL}/${state.editingId}` : API_URL;
        const method = state.editingId ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(body) });

        if (res.status === 401 || res.status === 403) { showDenied('ACESSO NEGADO'); return; }
        if (res.status === 409) { showToast('Usuário já existe', 'error'); return; }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Erro ' + res.status);
        }

        document.getElementById('userModal').classList.remove('show');
        showToast(state.editingId ? 'Usuário atualizado' : 'Usuário criado', 'success');
        await carregarUsuarios();
    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar';
    }
};

window.editUser = function(id) { abrirModalUsuario(id); };

// ─── EXCLUSÃO ──────────────────────────────────────────────
window.abrirModalExclusao = function(id) {
    deleteTargetId = id;
    document.getElementById('deleteModal').classList.add('show');
};

window.fecharModalExclusao = function() {
    deleteTargetId = null;
    document.getElementById('deleteModal').classList.remove('show');
};

window.confirmarExclusao = async function() {
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
        await carregarUsuarios();
    } catch {
        showToast('Erro ao excluir', 'error');
    }
};

// ─── RELATÓRIO PDF ─────────────────────────────────────────
window.abrirModalRelatorio = function() {
    if (state.employeeId === 'TODOS') {
        showToast('Selecione um funcionário específico em "Todos os Funcionários"', 'error');
        return;
    }
    document.getElementById('reportModal').classList.add('show');
};

window.fecharModalRelatorio = function() {
    document.getElementById('reportModal').classList.remove('show');
};

window.emitirRelatorio = async function(type) {
    fecharModalRelatorio();
    try {
        const res = await fetch(`${API_URL}/report/${state.employeeId}?type=${type}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Erro ' + res.status);
        const data = await res.json();
        gerarPDF(data, type);
    } catch {
        showToast('Erro ao emitir relatório', 'error');
    }
};

async function gerarPDF(data, type) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    try {
        const logoImg = await carregarImagem('/imagens/logo-documento.png');
        doc.setGState(new doc.GState({ opacity: 0.08 }));
        doc.addImage(logoImg, 'PNG', 130, 8, 60, 30);
        doc.setGState(new doc.GState({ opacity: 1 }));
    } catch {}

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    const titulo = type === 'logins' ? 'Relatório de Logins'
                  : type === 'atividades' ? 'Relatório de Atividades'
                  : 'Relatório de Logins + Atividades';
    doc.text(titulo, 15, 20);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Funcionário: ${data.funcionario.name} (${data.funcionario.username})`, 15, 28);
    doc.text(`Setor: ${data.funcionario.sector || '—'}`, 15, 34);
    doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, 15, 40);

    let y = 52;
    doc.setDrawColor(200);
    doc.line(15, 48, 195, 48);

    function escreveLinha(txt) {
        const linhas = doc.splitTextToSize(txt, 180);
        linhas.forEach(l => {
            if (y > 275) { doc.addPage(); y = 20; }
            doc.text(l, 15, y);
            y += 5;
        });
    }

    if (type !== 'atividades' && data.logins.length) {
        y += 4;
        doc.setFont(undefined, 'bold');
        escreveLinha('LOGINS');
        doc.setFont(undefined, 'normal');
        data.logins.forEach(l => {
            const dt = new Date(l.created_at).toLocaleString('pt-BR');
            escreveLinha(`${dt} | ${l.success ? 'OK' : 'FALHA'} | IP: ${l.ip_address || '—'}`);
        });
    }

    if (type !== 'logins' && data.atividades.length) {
        y += 6;
        doc.setFont(undefined, 'bold');
        escreveLinha('ATIVIDADES');
        doc.setFont(undefined, 'normal');
        data.atividades.forEach(a => {
            const dt = new Date(a.created_at).toLocaleString('pt-BR');
            escreveLinha(`${dt} | ${a.action.toUpperCase()} | ${a.module} | ${a.details ? JSON.stringify(a.details) : ''}`);
        });
    }

    doc.save(`relatorio_${type}_${data.funcionario.username}.pdf`);
}

function carregarImagem(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// ─── SINCRONIZAR ───────────────────────────────────────────
window.sincronizarDados = async function() {
    const btn = document.getElementById('syncBtn');
    if (!btn) return;

    btn.classList.add('spinning');
    btn.disabled = true;

    try {
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

// ─── TOAST ─────────────────────────────────────────────────
function showToast(msg, type) {
    document.querySelectorAll('.floating-message').forEach(m => m.remove());
    const el = document.createElement('div');
    el.className = 'floating-message ' + type;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, 3500);
}

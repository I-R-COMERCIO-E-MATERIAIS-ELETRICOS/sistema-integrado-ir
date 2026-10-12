const API_URL = window.location.origin + '/api/licitacoes';
let accessToken = null;
let rows = [];
let filtered = [];
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
        <div class="access-denied">
            <h1>${msg || 'ACESSO NEGADO'}</h1>
            <p>Você não tem permissão para acessar este módulo.</p>
            <a href="/portal">Voltar ao Portal</a>
        </div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { showDenied('SESSÃO EXPIRADA'); return; }
    await carregar();
});

async function carregar() {
    try {
        const res = await fetch(API_URL, { headers: getHeaders() });
        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (!res.ok) throw new Error('Erro ' + res.status);
        rows = await res.json();
        filtered = rows.slice();
        render();
    } catch (err) {
        console.error(err);
        showToast('Erro ao carregar', 'error');
    }
}

window.filterRows = function () {
    const q = document.getElementById('search').value.trim().toLowerCase();
    filtered = rows.filter(r =>
        (r.title || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
    );
    render();
};

function render() {
    const tbody = document.getElementById('tableBody');
    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">Nenhuma licitação encontrada</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(r => `
        <tr>
            <td><strong>${r.code != null ? r.code : '—'}</strong></td>
            <td>${escHtml(r.title || '—')}</td>
            <td>${escHtml(truncate(r.description, 80))}</td>
            <td><span class="badge ${r.status}">${labelStatus(r.status)}</span></td>
            <td>${formatDate(r.created_at)}</td>
            <td style="text-align:center;">
                <button onclick="editRow('${r.id}')" class="action-btn edit">Editar</button>
                <button onclick="abrirExclusao('${r.id}')" class="action-btn delete">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function truncate(s, n) {
    s = String(s || '');
    return s.length > n ? s.slice(0, n) + '...' : s;
}
function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
}
function labelStatus(s) {
    return { aberta: 'Aberta', em_analise: 'Em análise', encerrada: 'Encerrada', cancelada: 'Cancelada' }[s] || s;
}

window.toggleForm = function () { abrirForm(null); };

function abrirForm(editId) {
    document.getElementById('itemId').value = editId || '';
    document.getElementById('modalTitle').textContent = editId ? 'Editar Licitação' : 'Nova Licitação';

    const r = editId ? rows.find(x => x.id === editId) : null;
    document.getElementById('title').value = r?.title || '';
    document.getElementById('description').value = r?.description || '';
    document.getElementById('status').value = r?.status || 'aberta';

    document.getElementById('formModal').classList.add('show');
}

window.fecharForm = function (cancelado) {
    document.getElementById('formModal').classList.remove('show');
    if (cancelado) {
        showToast(document.getElementById('itemId').value ? 'Atualização cancelada' : 'Registro cancelado', 'error');
    }
};

window.editRow = function (id) { abrirForm(id); };

window.handleSubmit = async function (e) {
    e.preventDefault();
    const id = document.getElementById('itemId').value.trim();
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const status = document.getElementById('status').value;

    if (!title) { showToast('Título obrigatório', 'error'); return; }

    const body = { title, description, status };
    const url = id ? `${API_URL}/${id}` : API_URL;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(body) });
        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Erro ' + res.status);
        }
        fecharForm(false);
        showToast(id ? 'Licitação atualizada' : 'Licitação criada', 'success');
        await carregar();
    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
    }
};

window.abrirExclusao = function (id) {
    deleteTargetId = id;
    document.getElementById('deleteModal').classList.add('show');
};
window.fecharExclusao = function () {
    deleteTargetId = null;
    document.getElementById('deleteModal').classList.remove('show');
};
window.confirmarExclusao = async function () {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    fecharExclusao();
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (!res.ok && res.status !== 204) throw new Error('Erro ' + res.status);
        showToast('Licitação excluída', 'success');
        await carregar();
    } catch {
        showToast('Erro ao excluir', 'error');
    }
};

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

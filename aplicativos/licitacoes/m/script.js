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
        <div class="m-denied">
            <h1>${msg || 'ACESSO NEGADO'}</h1>
            <p>Você não tem permissão para acessar este módulo.</p>
            <a href="/portal/m/">Voltar ao Portal</a>
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
    const root = document.getElementById('list');
    if (!filtered.length) {
        root.innerHTML = '<div class="m-empty">Nenhuma licitação encontrada</div>';
        return;
    }
    root.innerHTML = filtered.map(r => `
        <div class="m-card" onclick="editRow('${r.id}')">
            <div class="m-card-header">
                <span class="m-code">${r.code != null ? r.code : '—'}</span>
                <span class="m-title">${escHtml(r.title || '—')}</span>
                <span class="m-badge ${r.status}">${labelStatus(r.status)}</span>
            </div>
            ${r.description ? `<div class="m-desc">${escHtml(r.description)}</div>` : ''}
            <div class="m-date">${formatDate(r.created_at)}</div>
            <div class="m-card-actions">
                <button class="m-btn edit" onclick="event.stopPropagation();editRow('${r.id}')">Editar</button>
                <button class="m-btn del" onclick="event.stopPropagation();abrirExclusao('${r.id}')">Excluir</button>
            </div>
        </div>
    `).join('');
}

function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
    const existing = document.getElementById('formModal');
    if (existing) existing.remove();

    const r = editId ? rows.find(x => x.id === editId) : null;

    document.body.insertAdjacentHTML('beforeend', `
        <div class="m-modal-overlay" id="formModal">
            <div class="m-modal">
                <div class="m-modal-header">
                    <h2>${editId ? 'Editar Licitação' : 'Nova Licitação'}</h2>
                    <button class="m-close" onclick="fecharForm(true)">✕</button>
                </div>
                <form class="m-form" onsubmit="handleSubmit(event)">
                    <input type="hidden" id="itemId" value="${editId || ''}">
                    <label>Título *</label>
                    <input type="text" id="title" value="${r ? escHtml(r.title || '') : ''}" required>
                    <label>Descrição</label>
                    <textarea id="description" rows="4">${r ? escHtml(r.description || '') : ''}</textarea>
                    <label>Status</label>
                    <select id="status">
                        <option value="aberta" ${r?.status === 'aberta' ? 'selected' : ''}>Aberta</option>
                        <option value="em_analise" ${r?.status === 'em_analise' ? 'selected' : ''}>Em análise</option>
                        <option value="encerrada" ${r?.status === 'encerrada' ? 'selected' : ''}>Encerrada</option>
                        <option value="cancelada" ${r?.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                    </select>
                    <div class="m-form-actions">
                        <button type="button" class="m-btn secondary" onclick="fecharForm(true)">Cancelar</button>
                        <button type="submit" class="m-btn primary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    `);
}

window.fecharForm = function (cancelado) {
    const m = document.getElementById('formModal');
    if (m) m.remove();
    if (cancelado) {
        showToast(document.getElementById('itemId')?.value ? 'Atualização cancelada' : 'Registro cancelado', 'error');
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
    const existing = document.getElementById('deleteModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', `
        <div class="m-modal-overlay" id="deleteModal">
            <div class="m-modal">
                <div class="m-modal-header">
                    <h2>Excluir</h2>
                    <button class="m-close" onclick="fecharExclusao()">✕</button>
                </div>
                <p style="text-align:center;font-weight:500;margin:1rem 0;">Tem certeza que deseja excluir este registro?</p>
                <div class="m-form-actions">
                    <button class="m-btn secondary" onclick="fecharExclusao()">Não</button>
                    <button class="m-btn primary" style="background:#22C55E;" onclick="confirmarExclusao()">Sim</button>
                </div>
            </div>
        </div>
    `);
};
window.fecharExclusao = function () {
    deleteTargetId = null;
    const m = document.getElementById('deleteModal');
    if (m) m.remove();
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

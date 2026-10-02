// ============================================================
// Transportadoras · Desktop · I.R. Comércio
// ============================================================

const API_URL = window.location.origin + '/api';

let transportadoras = [];
let editingId = null;
let currentTab = 0;
let accessToken = null;
let pendingDeleteId = null;

const tabs = ['tab-geral', 'tab-atendimento'];
const REGIOES_LISTA = ['NORTE', 'NORDESTE', 'SUDESTE', 'SUL', 'CENTRO-OESTE'];
const ESTADOS_LISTA = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

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

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

function showMessage(message, type) {
    type = type || 'success';
    document.querySelectorAll('.floating-message').forEach(m => m.remove());
    const div = document.createElement('div');
    div.className = `floating-message ${type}`;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.animation = 'slideOutBottom 0.3s ease forwards';
        setTimeout(() => div.remove(), 300);
    }, 2200);
}

document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { showDenied('SESSÃO EXPIRADA'); return; }

    await carregarTudo();
    setInterval(() => carregarTudo(), 30000);
});

async function carregarTudo() {
    try {
        await loadTransportadoras();
    } finally {
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'ir-module-ready', module: 'transportadoras' }, '*');
            }
        } catch (e) {}
    }
}

async function loadTransportadoras() {
    try {
        const res = await fetch(`${API_URL}/transportadoras`, {
            headers: getHeaders(),
            cache: 'no-cache'
        });
        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (!res.ok) throw new Error('Erro ' + res.status);
        const data = await res.json();
        transportadoras = Array.isArray(data) ? data : [];
        renderTable();
    } catch (e) {
        console.error('[transportadoras] load:', e);
    }
}

async function syncData() {
    const btn = document.getElementById('syncBtn');
    if (btn) { btn.classList.add('spinning'); btn.disabled = true; }
    try {
        await carregarTudo();
        showMessage('Dados sincronizados', 'success');
    } catch {
        showMessage('Erro ao sincronizar', 'error');
    } finally {
        setTimeout(() => {
            if (btn) { btn.classList.remove('spinning'); btn.disabled = false; }
        }, 600);
    }
}

function filterTransportadoras() { renderTable(); }

function renderTable() {
    const container = document.getElementById('transportadorasContainer');
    if (!container) return;

    const search = (document.getElementById('search')?.value || '').toLowerCase();

    let filtered = transportadoras;
    if (search) {
        filtered = filtered.filter(t =>
            (t.nome || '').toLowerCase().includes(search) ||
            (t.representante || '').toLowerCase().includes(search) ||
            (t.email || '').toLowerCase().includes(search) ||
            (t.regioes || []).join(' ').toLowerCase().includes(search) ||
            (t.estados || []).join(' ').toLowerCase().includes(search)
        );
    }

    if (!filtered.length) {
        container.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">Nenhuma transportadora encontrada</td></tr>`;
        return;
    }

    container.innerHTML = filtered.map(t => `
        <tr>
            <td><strong>${escapeHtml(t.nome)}</strong></td>
            <td>${escapeHtml(t.representante || '-')}</td>
            <td>${escapeHtml((t.telefones || []).join(', ') || '-')}</td>
            <td>${escapeHtml((t.celulares || []).join(', ') || '-')}</td>
            <td>${escapeHtml(t.email || '-')}</td>
            <td class="actions-cell" style="text-align:center;">
                <div class="actions">
                    <button onclick="editTransportadora('${t.id}')" class="action-btn edit">Editar</button>
                    <button onclick="deleteTransportadora('${t.id}', '${escapeHtml(t.nome).replace(/'/g, "\\'")}')" class="action-btn delete">Excluir</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function switchTab(tabId) {
    const i = tabs.indexOf(tabId);
    if (i !== -1) currentTab = i;
    document.querySelectorAll('#formModal .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#formModal .tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('#formModal .tab-btn')[currentTab]?.classList.add('active');
    document.getElementById(tabs[currentTab])?.classList.add('active');
    updateNavButtons();
}

function nextTab() { if (currentTab < tabs.length - 1) switchTab(tabs[currentTab + 1]); }
function previousTab() { if (currentTab > 0) switchTab(tabs[currentTab - 1]); }

function updateNavButtons() {
    const prev = document.getElementById('btnPrevious');
    const next = document.getElementById('btnNext');
    if (prev) prev.style.display = currentTab === 0 ? 'none' : 'inline-flex';
    if (next) next.style.display = currentTab === tabs.length - 1 ? 'none' : 'inline-flex';
}

function openFormModal() {
    editingId = null;
    document.getElementById('formTitle').textContent = 'Nova Transportadora';
    document.getElementById('btnSave').textContent = 'Salvar';
    resetForm();
    currentTab = 0;
    switchTab('tab-geral');
    updateNavButtons();
    document.getElementById('formModal').classList.add('show');
}

function closeFormModal(showCancelMessage) {
    const modal = document.getElementById('formModal');
    if (!modal) return;
    if (showCancelMessage) {
        showMessage(editingId !== null ? 'Atualização cancelada' : 'Registro cancelado', 'error');
    }
    modal.classList.remove('show');
    resetForm();
}

function resetForm() {
    document.querySelectorAll('#formModal input:not([type="hidden"])').forEach(el => el.value = '');
    renderRegioesSelectors([]);
    renderEstadosSelectors([]);
}

function renderRegioesSelectors(selected) {
    const container = document.getElementById('regioesContainer');
    if (!container) return;
    container.innerHTML = '';
    REGIOES_LISTA.forEach(reg => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = reg;
        btn.className = 'chip-selector';
        if (selected.includes(reg)) btn.classList.add('selected');
        btn.onclick = () => btn.classList.toggle('selected');
        container.appendChild(btn);
    });
}

function renderEstadosSelectors(selected) {
    const container = document.getElementById('estadosContainer');
    if (!container) return;
    container.innerHTML = '';
    ESTADOS_LISTA.forEach(uf => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = uf;
        btn.className = 'chip-selector';
        if (selected.includes(uf)) btn.classList.add('selected');
        btn.onclick = () => btn.classList.toggle('selected');
        container.appendChild(btn);
    });
}

function getSelectedRegioes() {
    return Array.from(document.querySelectorAll('#regioesContainer .chip-selector.selected'))
        .map(btn => btn.textContent);
}

function getSelectedEstados() {
    return Array.from(document.querySelectorAll('#estadosContainer .chip-selector.selected'))
        .map(btn => btn.textContent);
}

function editTransportadora(id) {
    const t = transportadoras.find(x => String(x.id) === String(id));
    if (!t) return;
    editingId = id;
    document.getElementById('formTitle').textContent = `Editar: ${t.nome}`;
    document.getElementById('btnSave').textContent = 'Atualizar';
    document.getElementById('nome').value = t.nome || '';
    document.getElementById('representante').value = t.representante || '';
    document.getElementById('email').value = t.email || '';
    document.getElementById('telefones').value = (t.telefones || []).join(', ');
    document.getElementById('celulares').value = (t.celulares || []).join(', ');
    renderRegioesSelectors(t.regioes || []);
    renderEstadosSelectors(t.estados || []);
    currentTab = 0;
    switchTab('tab-geral');
    updateNavButtons();
    document.getElementById('formModal').classList.add('show');
}

function parseArray(str) {
    if (!str || !str.trim()) return [];
    return str.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
}

async function saveTransportadora() {
    const nome = document.getElementById('nome').value.trim();
    if (!nome) {
        showMessage('Nome é obrigatório!', 'error');
        return;
    }

    const payload = {
        nome: nome.toUpperCase(),
        representante: document.getElementById('representante').value.trim().toUpperCase(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        telefones: parseArray(document.getElementById('telefones').value),
        celulares: parseArray(document.getElementById('celulares').value),
        regioes: getSelectedRegioes(),
        estados: getSelectedEstados()
    };

    const btn = document.getElementById('btnSave');
    btn.disabled = true;

    try {
        const url = editingId
            ? `${API_URL}/transportadoras/${editingId}`
            : `${API_URL}/transportadoras`;
        const method = editingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (response.status === 401 || response.status === 403) { showDenied('SEM ACESSO'); return; }
        if (!response.ok) throw new Error('Erro ao salvar');

        await carregarTudo();
        closeFormModal(false);
        showMessage(editingId ? `${payload.nome} atualizada` : `${payload.nome} registrada`, 'success');
    } catch (e) {
        showMessage('Erro ao salvar transportadora!', 'error');
    } finally {
        btn.disabled = false;
    }
}

function deleteTransportadora(id, nome) {
    pendingDeleteId = id;
    document.getElementById('deleteModalMessage').textContent =
        `Tem certeza que deseja excluir a transportadora "${nome}"?`;
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.onclick = confirmDelete;
    document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
    pendingDeleteId = null;
}

async function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    try {
        const response = await fetch(`${API_URL}/transportadoras/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erro ao excluir');
        const nome = transportadoras.find(t => String(t.id) === String(id))?.nome || 'Transportadora';
        await carregarTudo();
        closeDeleteModal();
        showMessage(`${nome} excluída`, 'error');
    } catch (e) {
        closeDeleteModal();
        showMessage('Erro ao excluir transportadora!', 'error');
    }
}

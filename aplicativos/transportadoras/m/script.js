// ============================================================
// Transportadoras · Mobile · I.R. Comércio
// ============================================================

const API_URL = window.location.origin + '/api';

let transportadoras = [];
let editingId = null;
let currentTab = 0;
let accessToken = null;
let pendingDeleteId = null;

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
            <h1 style="font-size:1.4rem;font-weight:700;margin-bottom:.75rem;">${msg || 'SEM ACESSO'}</h1>
            <p style="color:#5B6470;margin-bottom:2rem;font-size:.9rem;">Você não tem permissão para acessar este módulo.</p>
        </div>
    `;
}

function toUpperCase(v) { return v ? String(v).toUpperCase() : ''; }
function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
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
        const res = await fetch(`${API_URL}/transportadoras`, { headers: getHeaders(), cache: 'no-cache' });
        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (!res.ok) throw new Error('Erro ' + res.status);
        const data = await res.json();
        transportadoras = Array.isArray(data) ? data : [];
        renderList();
    } catch (e) {
        showToast('Erro ao carregar transportadoras', 'error');
    }
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

function filterTransportadoras() { renderList(); }

function renderList() {
    const root = document.getElementById('transportadorasList');
    if (!root) return;

    const search = (document.getElementById('search')?.value || '').toLowerCase().trim();

    let lista = [...transportadoras];
    if (search) {
        lista = lista.filter(t =>
            (t.nome || '').toLowerCase().includes(search) ||
            (t.representante || '').toLowerCase().includes(search) ||
            (t.email || '').toLowerCase().includes(search) ||
            (t.regioes || []).join(' ').toLowerCase().includes(search) ||
            (t.estados || []).join(' ').toLowerCase().includes(search)
        );
    }

    if (!lista.length) {
        root.innerHTML = '<div class="m-empty">Nenhuma transportadora encontrada</div>';
        return;
    }

    lista.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    root.innerHTML = lista.map(t => `
        <div class="m-card" onclick="editTransportadora('${t.id}')">
            <div class="m-card-header">
                <span class="m-nome">${escapeHtml(t.nome)}</span>
                ${t.estados && t.estados.length ? `<span class="m-badge">${escapeHtml(t.estados.join('/'))}</span>` : ''}
            </div>
            <div class="m-card-body">
                <div class="m-row"><span>Representante</span><strong>${escapeHtml(t.representante || '—')}</strong></div>
                <div class="m-row"><span>E-mail</span><strong>${escapeHtml(t.email || '—')}</strong></div>
                <div class="m-row"><span>Telefone</span><strong>${escapeHtml((t.telefones || []).join(', ') || '—')}</strong></div>
                <div class="m-row"><span>Celular</span><strong>${escapeHtml((t.celulares || []).join(', ') || '—')}</strong></div>
            </div>
            <div class="m-card-actions">
                <button class="m-btn edit" onclick="event.stopPropagation();editTransportadora('${t.id}')">Editar</button>
                <button class="m-btn del" onclick="event.stopPropagation();deleteTransportadora('${t.id}', '${escapeHtml(t.nome).replace(/'/g, "\\'")}')">Excluir</button>
            </div>
        </div>
    `).join('');
}

function toggleForm() {
    editingId = null;
    currentTab = 0;
    openFormModal({ title: 'Nova Transportadora', editId: '', dados: null });
}

function editTransportadora(id) {
    const t = transportadoras.find(x => String(x.id) === String(id));
    if (!t) return showToast('Transportadora não encontrada', 'error');
    editingId = id;
    currentTab = 0;
    openFormModal({ title: 'Editar Transportadora', editId: id, dados: t });
}

function openFormModal(cfg) {
    const t = cfg.dados;
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

                <div class="m-tabs">
                    <button type="button" class="m-tab active" onclick="switchTab(0,this)">Geral</button>
                    <button type="button" class="m-tab" onclick="switchTab(1,this)">Atendimento</button>
                </div>

                <form class="m-form" onsubmit="handleSubmit(event)">
                    <input type="hidden" id="editId" value="${cfg.editId}">

                    <div class="m-pane active" data-pane="0">
                        <div><label>Nome *</label><input type="text" id="nome" value="${t ? escapeHtml(t.nome) : ''}" required></div>
                        <div><label>Representante</label><input type="text" id="representante" value="${t ? escapeHtml(t.representante || '') : ''}"></div>
                        <div><label>E-mail</label><input type="email" id="email" value="${t ? escapeHtml(t.email || '') : ''}"></div>
                        <div><label>Telefones (separe por vírgula)</label><input type="text" id="telefones" value="${t ? escapeHtml((t.telefones || []).join(', ')) : ''}"></div>
                        <div><label>Celulares (separe por vírgula)</label><input type="text" id="celulares" value="${t ? escapeHtml((t.celulares || []).join(', ')) : ''}"></div>
                    </div>

                    <div class="m-pane" data-pane="1">
                        <div>
                            <label>Regiões</label>
                            <div class="m-chips" id="regioesContainer"></div>
                        </div>
                        <div>
                            <label>Estados</label>
                            <div class="m-chips" id="estadosContainer"></div>
                        </div>
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

    renderRegioesSelectors(t ? (t.regioes || []) : []);
    renderEstadosSelectors(t ? (t.estados || []) : []);
}

function renderRegioesSelectors(selected) {
    const c = document.getElementById('regioesContainer');
    if (!c) return;
    c.innerHTML = '';
    REGIOES_LISTA.forEach(reg => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'm-chip' + (selected.includes(reg) ? ' selected' : '');
        b.textContent = reg;
        b.onclick = () => b.classList.toggle('selected');
        c.appendChild(b);
    });
}

function renderEstadosSelectors(selected) {
    const c = document.getElementById('estadosContainer');
    if (!c) return;
    c.innerHTML = '';
    ESTADOS_LISTA.forEach(uf => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'm-chip' + (selected.includes(uf) ? ' selected' : '');
        b.textContent = uf;
        b.onclick = () => b.classList.toggle('selected');
        c.appendChild(b);
    });
}

function getSelectedRegioes() {
    return Array.from(document.querySelectorAll('#regioesContainer .m-chip.selected'))
        .map(b => b.textContent);
}

function getSelectedEstados() {
    return Array.from(document.querySelectorAll('#estadosContainer .m-chip.selected'))
        .map(b => b.textContent);
}

function switchTab(i, btn) {
    currentTab = i;
    document.querySelectorAll('#formModal .m-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#formModal .m-pane').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.querySelector(`#formModal .m-pane[data-pane="${i}"]`)?.classList.add('active');
}

function closeForm(cancelado) {
    document.getElementById('formModalHost')?.remove();
    if (cancelado) {
        showToast(editingId ? 'Atualização cancelada' : 'Registro cancelado', 'error');
    }
    editingId = null;
}

function parseArray(str) {
    if (!str || !str.trim()) return [];
    return str.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
}

async function handleSubmit(e) {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    if (!nome) {
        showToast('Nome é obrigatório', 'error');
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
        const url = editingId ? `${API_URL}/transportadoras/${editingId}` : `${API_URL}/transportadoras`;
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Erro ' + res.status);
        }

        showToast(editingId ? `${payload.nome} atualizada` : `${payload.nome} registrada`, 'success');
        closeForm(false);
        await carregarTudo();
    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

function deleteTransportadora(id, nome) {
    pendingDeleteId = id;
    document.getElementById('deleteHost')?.remove();
    const host = document.createElement('div');
    host.id = 'deleteHost';
    host.innerHTML = `
        <div class="m-modal-overlay" id="deleteModal">
            <div class="m-modal">
                <div class="m-modal-header">
                    <h2>Excluir Transportadora</h2>
                    <button class="m-close" onclick="closeDelete()">✕</button>
                </div>
                <p class="m-confirm-msg">Excluir "${nome}"?</p>
                <div class="m-form-actions centered">
                    <button class="m-btn secondary" onclick="closeDelete()">Não</button>
                    <button class="m-btn del" onclick="confirmDelete()">Sim</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(host);
}

function closeDelete() {
    document.getElementById('deleteHost')?.remove();
    pendingDeleteId = null;
}

async function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    closeDelete();
    try {
        const res = await fetch(`${API_URL}/transportadoras/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (!res.ok && res.status !== 204) throw new Error('Erro ' + res.status);
        const nome = transportadoras.find(t => String(t.id) === String(id))?.nome || 'Transportadora';
        showToast(`${nome} excluída`, 'error');
        await carregarTudo();
    } catch {
        showToast('Erro ao excluir', 'error');
    }
}

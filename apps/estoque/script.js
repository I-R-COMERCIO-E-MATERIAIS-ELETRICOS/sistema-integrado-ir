/* ============================================================================
 * apps/estoque/script.js — FRONTEND
 * ----------------------------------------------------------------------------
 * Responsável por toda a interação da página de Estoque:
 *   • Listagem e filtros
 *   • Cadastro / edição / exclusão de itens e grupos
 *   • Entrada / saída de estoque
 *   • Sincronização e geração de PDF
 * ========================================================================== */

// ─── Configuração ───────────────────────────────────────────────────────────
const API_BASE = '/api/estoque';
const SESSION_KEY = 'irUserSession';
const MODULE_SESSION_KEY = 'estoqueSession';
const PORTAL_URL = window.location.origin;

// ─── Estado ─────────────────────────────────────────────────────────────────
let allItems = [];
let grupos = [];
let editingId = null;
let filtros = { search: '', marca: '', grupo: '' };

// ─── Autenticação e API ─────────────────────────────────────────────────────
function getSessionToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('sessionToken');
    
    if (tokenFromUrl) {
        sessionStorage.setItem(MODULE_SESSION_KEY, tokenFromUrl);
        // Limpa a URL para não expor o token
        window.history.replaceState({}, document.title, window.location.pathname);
        return tokenFromUrl;
    }

    let token = sessionStorage.getItem(MODULE_SESSION_KEY);
    if (token) return token;

    try {
        const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            token = parsed.token || parsed.sessionToken || null;
            if (token) return token;
        }
    } catch (e) { /* silencioso */ }

    return null;
}

async function api(endpoint, options = {}) {
    const token = getSessionToken();
    
    const headers = {
        'Accept': 'application/json',
        ...options.headers
    };
    
    if (options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
        headers['X-Session-Token'] = token;
    }

    const response = await fetch(endpoint, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        console.error("Sessão expirada ou inválida.");
        sessionStorage.removeItem(MODULE_SESSION_KEY);
        if (window.IR && typeof IR.denied === 'function') {
            IR.denied('Sua sessão expirou.');
        } else {
            window.location.href = PORTAL_URL + '/?logout=1&reason=session';
        }
        throw new Error('Sessão expirada');
    }

    if (!response.ok) {
        let errData = {};
        try { errData = await response.json(); } catch {}
        throw new Error(errData.error || `Erro HTTP: ${response.status}`);
    }

    if (response.status === 204) return null;
    try { return await response.json(); } catch { return {}; }
}

// ─── Utilidades ─────────────────────────────────────────────────────────────
function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatCurrency(v) {
    return Number(v || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function notificar(msg, tipo) {
    if (typeof window.mostrarToast === 'function') {
        try { window.mostrarToast(msg, tipo || 'info'); return; } catch {}
    }
    if (tipo === 'error') console.error(msg);
    else console.log(msg);
    alert(msg);
}

// ─── Ciclo de vida dos modais ───────────────────────────────────────────────
function criarModal(htmlInterno) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = htmlInterno;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) fecharModal(overlay);
    });
    return overlay;
}

function fecharModal(overlay) {
    if (!overlay || !overlay.parentNode) return;
    overlay.style.animation = 'fadeOut 0.2s ease forwards';
    setTimeout(() => overlay.remove(), 200);
}

function fecharTodosModais() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
}

// ─── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const token = getSessionToken();
    if (!token) {
        if (window.IR && typeof IR.denied === 'function') {
            IR.denied('Sessão expirada.');
        } else {
            window.location.href = PORTAL_URL + '/?logout=1&reason=session';
        }
        return;
    }

    const tbody = document.getElementById('estoqueTableBody');
    if (tbody) {
        tbody.addEventListener('click', (e) => {
            const tr = e.target.closest('tr[data-id]');
            if (tr && !e.target.closest('button')) {
                openFormModal(tr.dataset.id);
            }
        });
    }
    carregarGrupos();
    carregarEstoque();
});

// ─── Carregamento ───────────────────────────────────────────────────────────
async function carregarGrupos() {
    try {
        // Usando api() no lugar do fetch() para enviar o Token
        grupos = await api(`${API_BASE}/grupos`);
        preencherFiltroGrupos();
    } catch (e) {
        console.error('Erro ao carregar grupos', e);
    }
}

async function carregarEstoque() {
    try {
        // Usando api() no lugar do fetch() para enviar o Token
        allItems = await api(API_BASE);
        preencherFiltroMarcas();
        renderTable();
    } catch (e) {
        console.error('Erro ao carregar estoque', e);
        notificar('Erro ao carregar estoque', 'error');
    }
}

function preencherFiltroGrupos() {
    const sel = document.getElementById('filterGrupo');
    if (!sel) return;
    const valorAtual = sel.value;
    sel.innerHTML = '<option value="">Todos os Grupos</option>';
    grupos.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.abreviacao;
        opt.textContent = `${g.nome} (${g.abreviacao})`;
        sel.appendChild(opt);
    });
    sel.value = valorAtual;
}

function preencherFiltroMarcas() {
    const sel = document.getElementById('filterMarca');
    if (!sel) return;
    const valorAtual = sel.value;
    const marcas = [...new Set(allItems.map(i => i.marca).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b));
    sel.innerHTML = '<option value="">Todas as Marcas</option>';
    marcas.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        sel.appendChild(opt);
    });
    sel.value = valorAtual;
}

// ─── Filtros e render ───────────────────────────────────────────────────────
function filterItems() {
    const el = document.getElementById('search');
    filtros.search = el ? el.value.toLowerCase().trim() : '';
    renderTable();
}

function selecionarMarca(value) {
    filtros.marca = value || '';
    renderTable();
}

function selecionarGrupo(value) {
    filtros.grupo = value || '';
    renderTable();
}

function getFilteredItems() {
    return allItems.filter(item => {
        if (filtros.marca && (item.marca || '') !== filtros.marca) return false;
        if (filtros.grupo && (item.grupo || '') !== filtros.grupo) return false;
        if (filtros.search) {
            const hay = [
                item.codigo, item.descricao, item.marca, item.modelo, item.grupo
            ].join(' ').toLowerCase();
            if (!hay.includes(filtros.search)) return false;
        }
        return true;
    });
}

function renderTable() {
    const tbody = document.getElementById('estoqueTableBody');
    if (!tbody) return;

    const items = getFilteredItems();

    if (!items.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-secondary);">
                    Nenhum item encontrado.
                </td>
            </tr>`;
    } else {
        tbody.innerHTML = items.map(item => `
            <tr data-id="${escapeHtml(item.id)}">
                <td class="id-cell"><strong>${escapeHtml(item.codigo)}</strong></td>
                <td>${escapeHtml(item.descricao || '')}</td>
                <td>${escapeHtml(item.grupo || '')}</td>
                <td>${formatCurrency(item.valor_unitario)}</td>
                <td>${Number(item.quantidade) || 0}</td>
                <td class="actions-cell" style="text-align:center;">
                    <button type="button" class="action-btn entry" onclick="event.stopPropagation(); openMovModal('${escapeHtml(item.id)}', 'entrada')">Entrada</button>
                    <button type="button" class="action-btn exit"  onclick="event.stopPropagation(); openMovModal('${escapeHtml(item.id)}', 'saida')">Saída</button>
                    <button type="button" class="action-btn edit"  onclick="event.stopPropagation(); openFormModal('${escapeHtml(item.id)}')">Editar</button>
                </td>
            </tr>
        `).join('');
    }

    updateTotals(items);
}

function updateTotals(items) {
    const totalQtd = items.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
    const totalValor = items.reduce(
        (s, i) => s + ((Number(i.valor_unitario) || 0) * (Number(i.quantidade) || 0)),
        0
    );
    const qEl = document.getElementById('totalQtd');
    const vEl = document.getElementById('totalValor');
    if (qEl) qEl.textContent = totalQtd;
    if (vEl) vEl.textContent = formatCurrency(totalValor);
}

// ─── Formulário de Item (novo / editar) ─────────────────────────────────────
function openFormModal(id) {
    editingId = id || null;
    const item = id ? allItems.find(i => String(i.id) === String(id)) : null;

    const campos = item ? `
        <div class="form-grid">
            <div class="form-group full-width">
                <label>Descrição *</label>
                <input type="text" id="fDescricao" required maxlength="255" value="${escapeHtml(item.descricao)}">
            </div>
            <div class="form-group">
                <label>Grupo *</label>
                <select id="fGrupo" required>
                    ${grupos.map(g => `
                        <option value="${escapeHtml(g.abreviacao)}" ${item.grupo === g.abreviacao ? 'selected' : ''}>
                            ${escapeHtml(g.nome)} (${escapeHtml(g.abreviacao)})
                        </option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Valor Unitário (R$)</label>
                <input type="number" step="0.01" min="0" id="fValor" value="${Number(item.valor_unitario) || 0}">
            </div>
        </div>
        <div class="info-section" style="margin-top:0.5rem;">
            <h4>Informações</h4>
            <div class="info-row"><span class="info-label">Código:</span><span class="info-value">${escapeHtml(item.codigo)}</span></div>
            <div class="info-row"><span class="info-label">Quantidade:</span><span class="info-value">${Number(item.quantidade) || 0}</span></div>
            <div class="info-row"><span class="info-label">Marca:</span><span class="info-value">${escapeHtml(item.marca || '-')}</span></div>
            <div class="info-row"><span class="info-label">Modelo:</span><span class="info-value">${escapeHtml(item.modelo || '-')}</span></div>
            <div class="info-row"><span class="info-label">NCM:</span><span class="info-value">${escapeHtml(item.ncm || '-')}</span></div>
        </div>
    ` : `
        <div class="form-grid">
            <div class="form-group full-width">
                <label>Descrição *</label>
                <input type="text" id="fDescricao" required maxlength="255">
            </div>
            <div class="form-group">
                <label>Grupo *</label>
                <div class="input-with-btn">
                    <select id="fGrupo" required>
                        <option value="">Selecione...</option>
                        ${grupos.map(g => `
                            <option value="${escapeHtml(g.abreviacao)}">
                                ${escapeHtml(g.nome)} (${escapeHtml(g.abreviacao)})
                            </option>`).join('')}
                    </select>
                    <button type="button" class="btn-plus" onclick="abrirModalNovoGrupo()" title="Novo grupo">+</button>
                </div>
            </div>
            <div class="form-group">
                <label>Valor Unitário (R$)</label>
                <input type="number" step="0.01" min="0" id="fValor" value="0.00">
            </div>
            <div class="form-group">
                <label>Quantidade Inicial</label>
                <input type="number" min="0" id="fQtd" value="0">
            </div>
            <div class="form-group">
                <label>Marca</label>
                <input type="text" id="fMarca" maxlength="100">
            </div>
            <div class="form-group">
                <label>Modelo</label>
                <input type="text" id="fModelo" maxlength="100">
            </div>
            <div class="form-group">
                <label>NCM</label>
                <input type="text" id="fNcm" maxlength="20">
            </div>
        </div>
    `;

    const html = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">${item ? 'Editar Item' : 'Novo Item'}</h2>
                <button type="button" class="close-modal" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <form id="formItem">
                ${campos}
                <div class="modal-actions">
                    ${item ? `<button type="button" class="cancel-close" style="background:#EF4444;" onclick="excluirItem('${escapeHtml(item.id)}')">Excluir</button>` : ''}
                    <button type="button" class="cancel-close" style="background:#6B7280;" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button type="submit" class="save">${item ? 'Salvar' : 'Criar Item'}</button>
                </div>
            </form>
        </div>
    `;

    const overlay = criarModal(html);
    overlay.querySelector('#formItem').addEventListener('submit', (e) => salvarItem(e, overlay));
}

async function salvarItem(e, overlay) {
    e.preventDefault();
    const descricao = document.getElementById('fDescricao').value.trim();
    const grupo = document.getElementById('fGrupo').value.trim();
    const valor = parseFloat(document.getElementById('fValor').value) || 0;

    if (!descricao) return notificar('Informe a descrição', 'error');
    if (!grupo) return notificar('Selecione o grupo', 'error');

    try {
        if (editingId) {
            await api(`${API_BASE}/${editingId}`, {
                method: 'PUT',
                body: JSON.stringify({ descricao, grupo, valor_unitario: valor })
            });
        } else {
            const qtd    = parseInt(document.getElementById('fQtd').value, 10) || 0;
            const marca  = document.getElementById('fMarca').value.trim();
            const modelo = document.getElementById('fModelo').value.trim();
            const ncm    = document.getElementById('fNcm').value.trim();

            await api(API_BASE, {
                method: 'POST',
                body: JSON.stringify({
                    descricao, grupo, valor_unitario: valor,
                    quantidade: qtd, marca, modelo, ncm
                })
            });
        }

        fecharModal(overlay);
        notificar(editingId ? 'Item atualizado!' : 'Item criado!', 'success');
        await carregarEstoque();
    } catch (err) {
        notificar(err.message, 'error');
    }
}

// ─── Exclusão ───────────────────────────────────────────────────────────────
function excluirItem(id) {
    const html = `
        <div class="modal-content ir-modal-confirm">
            <button type="button" class="ir-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            <h2 class="modal-title" style="margin-bottom:1rem;">Excluir Item</h2>
            <p class="ir-confirm-msg">Deseja realmente excluir este item? Esta ação não pode ser desfeita.</p>
            <div class="ir-confirm-actions">
                <button type="button" class="ir-btn-red" id="btnCancelarExc">Cancelar</button>
                <button type="button" class="ir-btn-green" id="btnConfirmarExc">Excluir</button>
            </div>
        </div>
    `;
    const overlay = criarModal(html);
    overlay.querySelector('#btnCancelarExc').onclick = () => fecharModal(overlay);
    overlay.querySelector('#btnConfirmarExc').onclick = async () => {
        try {
            await api(`${API_BASE}/${id}`, { method: 'DELETE' });
            fecharTodosModais();
            notificar('Item excluído', 'success');
            await carregarEstoque();
        } catch (err) {
            notificar(err.message, 'error');
        }
    };
}

// ─── Modal de Entrada / Saída ──────────────────────────────────────────────
function openMovModal(id, tipo) {
    const item = allItems.find(i => String(i.id) === String(id));
    if (!item) return notificar('Item não encontrado', 'error');

    const tipoLabel = tipo === 'entrada' ? 'Entrada' : 'Saída';

    const html = `
        <div class="modal-content ir-modal-confirm" style="text-align:left;">
            <button type="button" class="ir-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            <h2 class="modal-title" style="margin-bottom:0.75rem; text-align:center;">${tipoLabel} de Estoque</h2>
            <p style="text-align:center; color:var(--text-secondary); font-size:0.9rem; margin-bottom:1rem;">
                ${escapeHtml(item.codigo)} — ${escapeHtml(item.descricao)}
            </p>
            <div class="form-group">
                <label>Quantidade *</label>
                <input type="number" min="1" id="fMovQtd" value="1" style="text-align:center; font-size:1.2rem;">
                <p style="margin-top:0.5rem; color:var(--text-secondary); font-size:0.85rem; text-align:center;">
                    Estoque atual: <strong>${Number(item.quantidade) || 0}</strong>
                </p>
            </div>
            <div class="ir-confirm-actions">
                <button type="button" class="ir-btn-red" id="btnCancelarMov">Cancelar</button>
                <button type="button" class="ir-btn-green" id="btnConfirmarMov">Confirmar ${tipoLabel}</button>
            </div>
        </div>
    `;

    const overlay = criarModal(html);
    const input = overlay.querySelector('#fMovQtd');
    setTimeout(() => input.focus(), 100);

    overlay.querySelector('#btnCancelarMov').onclick = () => fecharModal(overlay);
    overlay.querySelector('#btnConfirmarMov').onclick = async () => {
        const qtd = parseInt(input.value, 10);
        if (!qtd || qtd <= 0) return notificar('Informe uma quantidade válida', 'error');

        try {
            await api(`${API_BASE}/${item.id}/movimentacao`, {
                method: 'POST',
                body: JSON.stringify({ tipo, quantidade: qtd })
            });

            fecharModal(overlay);
            notificar(`${tipoLabel} registrada!`, 'success');
            await carregarEstoque();
        } catch (err) {
            notificar(err.message, 'error');
        }
    };
}

// ─── Modal de novo grupo (chamado pelo botão +) ─────────────────────────────
function abrirModalNovoGrupo() {
    const html = `
        <div class="modal-content" style="max-width:460px;">
            <div class="modal-header">
                <h2 class="modal-title">Novo Grupo</h2>
                <button type="button" class="close-modal" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <form id="formGrupo">
                <div class="form-group">
                    <label>Nome do Grupo *</label>
                    <input type="text" id="gNome" required maxlength="100">
                </div>
                <div class="form-group">
                    <label>Abreviação (4 letras) *</label>
                    <input type="text" id="gAbrev" required maxlength="4"
                           style="text-transform:uppercase;"
                           oninput="this.value = this.value.toUpperCase().replace(/[^A-Z]/g, '')">
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-close" style="background:#6B7280;"
                            onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button type="submit" class="save">Criar Grupo</button>
                </div>
            </form>
        </div>
    `;

    const overlay = criarModal(html);
    overlay.querySelector('#formGrupo').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome      = document.getElementById('gNome').value.trim();
        const abreviacao = document.getElementById('gAbrev').value.trim().toUpperCase();

        if (abreviacao.length !== 4) {
            return notificar('A abreviação deve ter 4 letras', 'error');
        }

        try {
            const data = await api(`${API_BASE}/grupos`, {
                method: 'POST',
                body: JSON.stringify({ nome, abreviacao })
            });

            fecharModal(overlay);
            await carregarGrupos();

            // Atualiza o <select> do formulário principal (se aberto)
            const sel = document.getElementById('fGrupo');
            if (sel) {
                sel.innerHTML = '<option value="">Selecione...</option>' +
                    grupos.map(g => `
                        <option value="${escapeHtml(g.abreviacao)}"
                                ${g.abreviacao === data.abreviacao ? 'selected' : ''}>
                            ${escapeHtml(g.nome)} (${escapeHtml(g.abreviacao)})
                        </option>`).join('');
            }

            notificar('Grupo criado!', 'success');
        } catch (err) {
            notificar(err.message, 'error');
        }
    });
}

// ─── Sincronização ──────────────────────────────────────────────────────────
async function sincronizarDados(btn) {
    if (btn) {
        btn.classList.add('spinning');
        setTimeout(() => btn.classList.remove('spinning'), 600);
    }
    await Promise.all([carregarGrupos(), carregarEstoque()]);
    notificar('Dados sincronizados', 'success');
}

// ─── PDF ────────────────────────────────────────────────────────────────────
function gerarPDFEstoque() {
    try {
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) throw new Error('jsPDF não carregado');
        if (typeof jsPDF.API.autoTable !== 'function') {
            throw new Error('Plugin autoTable não carregado. Inclua o script do autoTable.');
        }

        const items = getFilteredItems();
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        doc.setFontSize(16);
        doc.setTextColor(255, 82, 29);
        doc.text('Relatório de Estoque', 14, 16);

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 22);
        doc.text(`Total de itens: ${items.length}`, 14, 27);

        const body = items.map(i => [
            i.codigo || '',
            i.descricao || '',
            i.grupo || '',
            i.marca || '',
            i.modelo || '',
            formatCurrency(i.valor_unitario),
            String(Number(i.quantidade) || 0),
            formatCurrency((Number(i.valor_unitario) || 0) * (Number(i.quantidade) || 0))
        ]);

        const totalQtd   = items.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
        const totalValor = items.reduce(
            (s, i) => s + ((Number(i.valor_unitario) || 0) * (Number(i.quantidade) || 0)), 0
        );

        doc.autoTable({
            startY: 32,
            head: [['Código', 'Descrição', 'Grupo', 'Marca', 'Modelo', 'Valor Unit.', 'Qtd', 'Total']],
            body,
            foot: [['', '', '', '', '', 'TOTAIS', String(totalQtd), formatCurrency(totalValor)]],
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [0, 0, 0], textColor: 255, fontStyle: 'bold' },
            footStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: {
                0: { cellWidth: 22 },
                1: { cellWidth: 70 },
                2: { cellWidth: 18 },
                3: { cellWidth: 28 },
                4: { cellWidth: 30 },
                5: { cellWidth: 26, halign: 'right' },
                6: { cellWidth: 16, halign: 'right' },
                7: { cellWidth: 28, halign: 'right' }
            }
        });

        const dataStr = new Date().toISOString().slice(0, 10);
        doc.save(`estoque-${dataStr}.pdf`);
        notificar('PDF gerado!', 'success');
    } catch (err) {
        console.error(err);
        notificar('Erro ao gerar PDF: ' + err.message, 'error');
    }
}

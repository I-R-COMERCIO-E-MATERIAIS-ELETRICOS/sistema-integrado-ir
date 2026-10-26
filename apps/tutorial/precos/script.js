function renderPrecosReplica() {
    return `
    <div class="replica-precos">
        <div class="app-content">
            <div class="container" id="tutMainContainer">
                <div class="header">
                    <div class="header-left"><h1>Tabela de Preços</h1></div>
                    <button type="button" class="btn-new-order-header" data-tut="btn-novo-preco">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Novo Preço
                    </button>
                </div>

                <div class="search-bar-wrapper">
                    <div class="search-bar">
                        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input type="text" placeholder="Buscar por código, marca ou descrição..." disabled data-tut="search-input">
                        <select class="search-select" data-tut="marca-select" disabled>
                            <option>TODAS</option>
                            <option>SIL</option>
                            <option>SCHNEIDER</option>
                        </select>
                        <button type="button" class="sync-btn" data-tut="sync-btn" disabled title="Sincronizar dados">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                        </button>
                    </div>
                </div>

                <div class="card table-card">
                    <div style="overflow-x:auto">
                        <table>
                            <thead data-tut="table-header">
                                <tr>
                                    <th>Marca</th>
                                    <th>Código</th>
                                    <th>Preço</th>
                                    <th>Descrição</th>
                                    <th>Atualizado Por</th>
                                    <th>Alteração</th>
                                    <th style="text-align:center;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>SIL</strong></td>
                                    <td>001</td>
                                    <td>R$ 1,50</td>
                                    <td>CABO FLEXÍVEL 2,5MM</td>
                                    <td>ROBERTO</td>
                                    <td style="color:#6B7280;font-size:0.85rem;">2h</td>
                                    <td class="actions-cell" style="text-align:center;">
                                        <button class="action-btn edit" data-tut="edit-btn">Editar</button>
                                        <button class="action-btn delete" data-tut="delete-btn">Excluir</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>SCHNEIDER</strong></td>
                                    <td>D40</td>
                                    <td>R$ 38,00</td>
                                    <td>DISJUNTOR BIPOLAR 40A</td>
                                    <td>MARIA</td>
                                    <td style="color:#6B7280;font-size:0.85rem;">1d</td>
                                    <td class="actions-cell" style="text-align:center;">
                                        <button class="action-btn edit">Editar</button>
                                        <button class="action-btn delete">Excluir</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>TRAMONTINA</strong></td>
                                    <td>TR-550</td>
                                    <td>R$ 12,90</td>
                                    <td>CHAVE DE FENDA 1/4</td>
                                    <td>JOÃO</td>
                                    <td style="color:#6B7280;font-size:0.85rem;">3d</td>
                                    <td class="actions-cell" style="text-align:center;">
                                        <button class="action-btn edit">Editar</button>
                                        <button class="action-btn delete">Excluir</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="paginacao-wrapper" data-tut="pagination">
                        <div class="paginacao-info">Exibindo 1&ndash;3 de 3 registros</div>
                        <div class="paginacao-btns">
                            <button class="pag-btn pag-nav" disabled>&lsaquo;</button>
                            <button class="pag-btn pag-btn-active">1</button>
                            <button class="pag-btn pag-nav" disabled>&rsaquo;</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAIS ═══════════ -->

        <div class="modal-overlay" id="tutFormOverlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Novo Preço</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-nav" data-tut="form-tabs">
                    <button type="button" class="tab-btn active" data-tut-tab="produto" data-tut="tab-produto">Produto</button>
                    <button type="button" class="tab-btn" data-tut-tab="valores" data-tut="tab-valores">Valores</button>
                </div>

                <div class="tab-content active" data-tut-pane="produto" data-tut="tab-content-produto">
                    <div class="form-grid">
                        <div class="form-group"><label>Marca *</label><input type="text" value="SIL" disabled></div>
                        <div class="form-group"><label>Código *</label><input type="text" value="001" disabled></div>
                        <div class="form-group"><label>Atualizado por</label><input type="text" value="ROBERTO" disabled style="background:var(--input-bg);"></div>
                        <div class="form-group"><label>Última Atualização</label><input type="text" value="24/01/2025 10:15" disabled style="background:var(--input-bg);"></div>
                        <div class="form-group" style="grid-column:1/-1;"><label>Descrição *</label><input type="text" value="CABO FLEXÍVEL 2,5MM" disabled></div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="valores" data-tut="tab-content-valores">
                    <div class="form-grid">
                        <div class="form-group"><label>Preço (R$) *</label><input type="number" value="1.50" step="0.01" disabled></div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="secondary" data-tut="btn-prev" style="display:none">Anterior</button>
                    <button type="button" class="secondary" data-tut="btn-next">Próximo</button>
                    <button type="button" class="save" data-tut="btn-save">Salvar</button>
                    <button type="button" class="cancel-close" data-tut="btn-cancel">Cancelar</button>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="tutDeleteOverlay">
            <div class="modal-content ir-modal-confirm">
                <button type="button" class="close-modal ir-close">✕</button>
                <div class="ir-confirm-msg">Tem certeza que deseja excluir este preço?</div>
                <div class="ir-confirm-actions">
                    <button type="button" class="ir-btn-green">Sim</button>
                    <button type="button" class="ir-btn-red">Não</button>
                </div>
            </div>
        </div>
    </div>`;
}

const STEPS = [
    // ═══════════════════ TELA PRINCIPAL ═══════════════════
    { id: '1',  target: '[data-tut="btn-novo-preco"]', text: 'Cadastre um novo preço no sistema.', view: 'main' },

    // ═══════════════════ MODAL DO FORMULÁRIO ═══════════════════
    { id: '2',  target: '[data-tut="form-tabs"]', text: 'O cadastro é organizado em abas.', view: 'form', activeTab: 'produto' },
    { id: '3',  target: ['[data-tut="btn-prev"]', '[data-tut="btn-next"]'], text: 'Navegue entre as abas do formulário utilizando os botões.', view: 'form', activeTab: 'produto' },
    { id: '4',  target: ['[data-tut="btn-save"]', '[data-tut="btn-cancel"]'], text: 'Salve ou descarte as informações preenchidas.', view: 'form', activeTab: 'produto' },
    { id: '5',  target: ['[data-tut="tab-produto"]', '[data-tut="tab-content-produto"]'], text: 'Preencha as informações do produto.', view: 'form', activeTab: 'produto' },
    { id: '6',  target: ['[data-tut="tab-valores"]', '[data-tut="tab-content-valores"]'], text: 'Defina o preço unitário do produto.', view: 'form', activeTab: 'valores' },

    // ═══════════════════ FILTROS ═══════════════════
    { id: '7',  target: '[data-tut="search-input"]', text: 'Filtro para buscas mais amplas.', view: 'main' },
    { id: '8',  target: '[data-tut="marca-select"]', text: 'Selecione a marca desejada para visualizar os preços.', view: 'main' },
    { id: '9',  target: '[data-tut="sync-btn"]', text: 'Atualize manualmente os dados.', view: 'main' },

    // ═══════════════════ TABELA E AÇÕES ═══════════════════
    { id: '10', target: '[data-tut="table-header"]', text: 'Tabela com as principais informações dos preços cadastrados.', view: 'main' },
    { id: '11', target: '[data-tut="edit-btn"]', text: 'Utilizado para abrir o formulário de alteração do preço.', view: 'main' },
    { id: '12', target: '[data-tut="delete-btn"]', text: 'Exclua definitivamente o preço do registro.', view: 'main' },
    { id: '13', target: '#tutDeleteOverlay .modal-content', text: 'Confirmação necessária para prevenir exclusões acidentais.', view: 'delete' },
    { id: '14', target: '[data-tut="pagination"]', text: 'Navegação entre as páginas de preços registrados.', view: 'main' }
];

let currentStepIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('stage').innerHTML = renderPrecosReplica();

    document.getElementById('btnPrev').addEventListener('click', stepPrev);
    document.getElementById('btnNext').addEventListener('click', stepNext);

    window.addEventListener('resize', repositionSpotlight);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') stepNext();
        else if (e.key === 'ArrowLeft') stepPrev();
    });

    setTimeout(() => renderStep(0), 60);
});

function renderStep(index) {
    if (index < 0) index = 0;
    if (index >= STEPS.length) index = STEPS.length - 1;
    currentStepIndex = index;

    const step = STEPS[index];

    document.getElementById('narrationStep').textContent = `Passo ${step.id}`;
    document.getElementById('narrationText').textContent = step.text;
    document.getElementById('btnPrev').disabled = (index === 0);

    const btnNext = document.getElementById('btnNext');
    if (index === STEPS.length - 1) {
        btnNext.innerHTML = 'Finalizar';
    } else {
        btnNext.innerHTML = 'Próximo <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
    }

    applyView(step.view, step.activeTab);
    setTimeout(repositionSpotlight, 50);
}

function applyView(view, activeTab) {
    const allModals = ['tutFormOverlay', 'tutDeleteOverlay'];

    allModals.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('show');
    });

    switch (view) {
        case 'form':
            openModal('tutFormOverlay');
            setFormTab(activeTab || 'produto');
            break;
        case 'delete':
            openModal('tutDeleteOverlay');
            break;
        case 'main':
        default:
            break;
    }
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('show');
}

function setFormTab(tabKey) {
    const overlay = document.getElementById('tutFormOverlay');
    if (!overlay) return;

    overlay.querySelectorAll('.tab-btn[data-tut-tab]').forEach(b => {
        b.classList.toggle('active', b.dataset.tutTab === tabKey);
    });
    overlay.querySelectorAll('.tab-content[data-tut-pane]').forEach(c => {
        c.classList.toggle('active', c.dataset.tutPane === tabKey);
    });

    // Botões Anterior/Próximo condicionais (espelha a lógica do app real)
    const prev = overlay.querySelector('[data-tut="btn-prev"]');
    const next = overlay.querySelector('[data-tut="btn-next"]');
    if (prev) prev.style.display = tabKey === 'produto' ? 'none' : 'inline-flex';
    if (next) next.style.display = tabKey === 'valores' ? 'none' : 'inline-flex';
}

function stepPrev() {
    if (currentStepIndex > 0) renderStep(currentStepIndex - 1);
}

function stepNext() {
    if (currentStepIndex < STEPS.length - 1) {
        renderStep(currentStepIndex + 1);
    } else {
        window.location.href = '../index.html';
    }
}

function repositionSpotlight() {
    const step = STEPS[currentStepIndex];
    if (!step) return;

    const spotlight = document.getElementById('spotlight');
    const targets = Array.isArray(step.target) ? step.target : [step.target];

    let minTop = Infinity, minLeft = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
    let hasTarget = false;

    targets.forEach(sel => {
        const el = document.querySelector(sel);
        if (el && el.offsetWidth > 0) {
            const r = el.getBoundingClientRect();
            hasTarget = true;
            minTop = Math.min(minTop, r.top);
            minLeft = Math.min(minLeft, r.left);
            maxRight = Math.max(maxRight, r.right);
            maxBottom = Math.max(maxBottom, r.bottom);
        }
    });

    if (!hasTarget) {
        spotlight.style.opacity = '0';
        return;
    }

    let top = minTop - 6;
    let left = minLeft - 6;
    let width = (maxRight - minLeft) + 12;
    let height = (maxBottom - minTop) + 12;

    const usableBottom = window.innerHeight - 20;
    const usableTop = 20;

    if (top < usableTop) { height += top; top = usableTop; }
    if (top + height > usableBottom) height = usableBottom - top;

    spotlight.style.opacity = '1';
    spotlight.style.top = top + 'px';
    spotlight.style.left = left + 'px';
    spotlight.style.width = width + 'px';
    spotlight.style.height = height + 'px';
}
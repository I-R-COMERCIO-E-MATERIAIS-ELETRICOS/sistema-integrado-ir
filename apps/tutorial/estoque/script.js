function renderEstoqueReplica() {
    return `
    <div class="replica-estoque">
        <div class="app-content">
            <div class="container">
                <div class="header">
                    <div class="header-left"><h1>Estoque</h1></div>
                    <button type="button" class="btn-new-order-header" data-tut="btn-novo-item" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Novo Item
                    </button>
                </div>

                <div class="search-bar-wrapper">
                    <div class="search-bar">
                        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input type="text" placeholder="Buscar por ID, descrição, marca ou modelo..." disabled data-tut="search-input">

                        <div class="search-bar-filters">
                            <div class="filter-dropdown-inline" data-tut="filter-marca">
                                <select disabled><option>Todas as Marcas</option></select>
                                <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                            <div class="filter-dropdown-inline" data-tut="filter-grupo">
                                <select disabled><option>Todos os Grupos</option></select>
                                <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                        </div>

                        <button type="button" class="sync-btn doc-btn" disabled data-tut="pdf-mov-btn" title="Relatório de Movimentações">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 8v4l3 3"></path>
                                <circle cx="12" cy="12" r="10"></circle>
                            </svg>
                        </button>
                        <button type="button" class="sync-btn doc-btn" disabled data-tut="pdf-estoque-btn" title="Gerar PDF do Estoque">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="9" y1="15" x2="15" y2="15"></line>
                            </svg>
                        </button>
                        <button type="button" class="sync-btn" disabled data-tut="sync-btn" title="Sincronizar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="card table-card">
                    <div style="overflow-x: auto;">
                        <table>
                            <thead data-tut="table-header">
                                <tr>
                                    <th>ID</th>
                                    <th>Descrição</th>
                                    <th>Grupo</th>
                                    <th>Valor Unitário</th>
                                    <th>Quantidade</th>
                                    <th style="text-align: center;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr data-tut="row-item">
                                    <td><strong>ELET0001</strong></td>
                                    <td>CABO FLEXÍVEL 2,5MM</td>
                                    <td>ELET</td>
                                    <td>R$ 1,50</td>
                                    <td>100</td>
                                    <td class="actions-cell" style="text-align:center;">
                                        <button class="action-btn edit" data-tut="edit-btn" disabled>Editar</button>
                                        <button class="action-btn entry" data-tut="entrada-btn" disabled>Entrada</button>
                                        <button class="action-btn exit" data-tut="saida-btn" disabled>Saída</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>ELET0002</strong></td>
                                    <td>DISJUNTOR BIPOLAR 40A</td>
                                    <td>ELET</td>
                                    <td>R$ 38,00</td>
                                    <td>20</td>
                                    <td class="actions-cell" style="text-align:center;">
                                        <button class="action-btn edit" disabled>Editar</button>
                                        <button class="action-btn entry" disabled>Entrada</button>
                                        <button class="action-btn exit" disabled>Saída</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="estoque-totals" data-tut="totals-bar">
                        <div class="totals-item">
                            <span>QUANTIDADE TOTAL</span>
                            <strong>120</strong>
                        </div>
                        <div class="totals-item">
                            <span>VALOR TOTAL</span>
                            <strong>R$ 910,00</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL: FORMULÁRIO ═══════════ -->
        <div class="modal-overlay" id="tutFormOverlay">
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2 class="modal-title">Novo Item</h2>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <form>
                    <div class="tabs-nav" data-tut="form-tabs">
                        <button type="button" class="tab-btn active" data-tut-tab="produto" data-tut="tab-produto">Produto</button>
                        <button type="button" class="tab-btn" data-tut-tab="fornecedor" data-tut="tab-fornecedor">Fornecedor</button>
                        <button type="button" class="tab-btn" data-tut-tab="valores" data-tut="tab-valores">Valores</button>
                    </div>

                    <div class="tab-content active" data-tut-pane="produto" data-tut="tab-content-produto">
                        <div class="form-grid">
                            <div class="form-group full-width">
                                <label>Descrição *</label>
                                <input type="text" placeholder="Descrição do produto" disabled>
                            </div>
                            <div class="form-group full-width">
                                <label>Grupo *</label>
                                <div class="input-with-btn">
                                    <select disabled><option>Selecione...</option></select>
                                    <button type="button" class="btn-plus" data-tut="btn-novo-grupo">+</button>
                                </div>
                            </div>
                            <div class="form-group full-width">
                                <label>NCM</label>
                                <input type="text" placeholder="Código NCM" disabled>
                            </div>
                        </div>
                    </div>

                    <div class="tab-content" data-tut-pane="fornecedor" data-tut="tab-content-fornecedor">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Marca</label>
                                <input type="text" placeholder="Marca do produto" disabled>
                            </div>
                            <div class="form-group">
                                <label>Modelo</label>
                                <input type="text" placeholder="Modelo do produto" disabled>
                            </div>
                        </div>
                    </div>

                    <div class="tab-content" data-tut-pane="valores" data-tut="tab-content-valores">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Valor Unitário (R$)</label>
                                <input type="number" value="0.00" disabled>
                            </div>
                            <div class="form-group">
                                <label>Quantidade</label>
                                <input type="number" value="0" disabled>
                            </div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <div>
                            <button type="button" class="secondary" data-tut="btn-prev">Anterior</button>
                            <button type="button" class="secondary" data-tut="btn-next">Próximo</button>
                        </div>
                        <div>
                            <button type="button" class="save" data-tut="btn-save">Salvar</button>
                            <button type="button" class="cancel-close" data-tut="btn-cancel">Cancelar</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- ═══════════ MODAL: NOVO GRUPO ═══════════ -->
        <div class="modal-overlay" id="tutGrupoOverlay">
            <div class="modal-content" style="max-width: 460px;">
                <div class="modal-header">
                    <h2 class="modal-title">Novo Grupo</h2>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <form>
                    <div class="form-group">
                        <label>Nome do Grupo *</label>
                        <input type="text" placeholder="Nome do grupo" disabled>
                    </div>
                    <div class="form-group">
                        <label>Abreviação (4 letras) *</label>
                        <input type="text" placeholder="ABCD" maxlength="4" disabled>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="cancel-close" style="background:#6B7280;">Cancelar</button>
                        <button type="button" class="save">Criar Grupo</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- ═══════════ MODAL: MOVIMENTAÇÃO ═══════════ -->
        <div class="modal-overlay" id="tutMovOverlay">
            <div class="modal-content ir-modal-confirm" style="text-align:left;">
                <button type="button" class="close-modal ir-close">✕</button>
                <h2 class="modal-title" style="margin-bottom:0.75rem; text-align:center;" id="movTitle">Entrada de Estoque</h2>
                <p style="text-align:center; color:#6B7280; font-size:0.9rem; margin-bottom:1rem;">
                    <span id="movCodigo">ELET0001</span> — <span id="movDescricao">CABO FLEXÍVEL 2,5MM</span>
                </p>
                <div class="form-group">
                    <label>Quantidade *</label>
                    <input type="number" min="1" value="1" disabled style="text-align:center; font-size:1.2rem;">
                    <p style="margin-top:0.5rem; color:#6B7280; font-size:0.85rem; text-align:center;">
                        Estoque atual: <strong id="movEstoqueAtual">100</strong>
                    </p>
                </div>
                <div class="ir-confirm-actions" data-tut="mov-actions">
                    <button type="button" class="ir-btn-red">Cancelar</button>
                    <button type="button" class="ir-btn-green" id="movConfirmBtn">Confirmar Entrada</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL: VISUALIZAÇÃO ═══════════ -->
        <div class="modal-overlay" id="tutViewOverlay">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2 class="modal-title">Visualizar Item</h2>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-nav">
                    <button type="button" class="tab-btn active">Produto</button>
                    <button type="button" class="tab-btn">Fornecedor</button>
                    <button type="button" class="tab-btn">Valores</button>
                </div>
                <div class="tab-content active">
                    <div class="info-section">
                        <h4>Dados do Produto</h4>
                        <div class="info-row"><span class="info-label">ID (Código):</span><span class="info-value">ELET0001</span></div>
                        <div class="info-row"><span class="info-label">Descrição:</span><span class="info-value">CABO FLEXÍVEL 2,5MM</span></div>
                        <div class="info-row"><span class="info-label">Grupo:</span><span class="info-value">ELET</span></div>
                        <div class="info-row"><span class="info-label">NCM:</span><span class="info-value">8544.42.00</span></div>
                    </div>
                </div>
                <div class="modal-actions" style="justify-content: flex-end;">
                    <button type="button" class="cancel-close" style="background:#6B7280; margin:0;">Fechar</button>
                </div>
            </div>
        </div>
    </div>`;
}

const STEPS = [
    // ═══════ 1: Novo Item ═══════
    { id: '1', target: '[data-tut="btn-novo-item"]', text: 'Cadastre um novo item no estoque.', view: 'main' },

    // ═══════ 2–9: Modal do formulário ═══════
    { id: '2', target: '[data-tut="form-tabs"]', text: 'O cadastro é organizado em abas', view: 'form', activeTab: 'produto' },
    { id: '3', target: ['[data-tut="btn-prev"]', '[data-tut="btn-next"]'], text: 'Navegue entre as abas do formulário utilizando os botões.', view: 'form', activeTab: 'produto' },
    { id: '4', target: ['[data-tut="btn-save"]', '[data-tut="btn-cancel"]'], text: 'Salve ou descarte as informações preenchidas.', view: 'form', activeTab: 'produto' },
    { id: '5', target: ['[data-tut="tab-produto"]', '[data-tut="tab-content-produto"]'], text: 'Preencha a descrição, o grupo e o NCM do produto.', view: 'form', activeTab: 'produto' },
    { id: '6', target: '[data-tut="btn-novo-grupo"]', text: 'Cadastre um novo grupo de produtos sem sair do formulário.', view: 'form', activeTab: 'produto' },
    { id: '7', target: '#tutGrupoOverlay .modal-content', text: 'Informe o nome e uma abreviação de 4 letras. Ela será usada como prefixo do código do item.', view: 'grupo' },
    { id: '8', target: ['[data-tut="tab-fornecedor"]', '[data-tut="tab-content-fornecedor"]'], text: 'Informe a marca e o modelo do produto.', view: 'form', activeTab: 'fornecedor' },
    { id: '9', target: ['[data-tut="tab-valores"]', '[data-tut="tab-content-valores"]'], text: 'Defina o valor unitário e a quantidade inicial em estoque.', view: 'form', activeTab: 'valores' },

    // ═══════ 10–12: Filtros ═══════
    { id: '10', target: '[data-tut="search-input"]', text: 'Busque por ID, descrição, marca ou modelo.', view: 'main' },
    { id: '11', target: '[data-tut="filter-marca"]', text: 'Filtre os itens por marca.', view: 'main' },
    { id: '12', target: '[data-tut="filter-grupo"]', text: 'Filtre os itens por grupo.', view: 'main' },

    // ═══════ 13–15: Relatórios e sincronização ═══════
    { id: '13', target: '[data-tut="pdf-estoque-btn"]', text: 'Emita o relatório em PDF do estoque atual (agrupado por grupo).', view: 'main' },
    { id: '14', target: '[data-tut="pdf-mov-btn"]', text: 'Emita o relatório de movimentações (entradas e saídas) por mês.', view: 'main' },
    { id: '15', target: '[data-tut="sync-btn"]', text: 'Atualize manualmente os dados do estoque.', view: 'main' },

    // ═══════ 16: Tabela ═══════
    { id: '16', target: '[data-tut="table-header"]', text: 'Tabela com ID, descrição, grupo, valor unitário e quantidade de cada item.', view: 'main' },

    // ═══════ 17–21: Ações da linha ═══════
    { id: '17', target: '[data-tut="edit-btn"]', text: 'Abra o formulário de edição do item. A quantidade só pode ser alterada via Entrada/Saída.', view: 'main' },
    { id: '18', target: '[data-tut="entrada-btn"]', text: 'Registre uma entrada de estoque para o item.', view: 'main' },
    { id: '19', target: '#tutMovOverlay .modal-content', text: 'Informe a quantidade a ser adicionada ao estoque e confirme.', view: 'mov-entrada' },
    { id: '20', target: '[data-tut="saida-btn"]', text: 'Registre uma saída de estoque para o item.', view: 'main' },
    { id: '21', target: '#tutMovOverlay .modal-content', text: 'Informe a quantidade a ser retirada do estoque e confirme.', view: 'mov-saida' },

    // ═══════ 22–23: Visualização ═══════
    { id: '22', target: '[data-tut="row-item"]', text: 'Clique em qualquer linha da tabela para abrir a visualização detalhada do item.', view: 'main' },
    { id: '23', target: '#tutViewOverlay .modal-content', text: 'O modal de visualização mostra os dados do produto, fornecedor e valores em abas.', view: 'view' },

    // ═══════ 24: Totais ═══════
    { id: '24', target: '[data-tut="totals-bar"]', text: 'Os totais exibem a soma de quantidade e valor dos itens filtrados.', view: 'main' }
];

let currentStepIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('stage').innerHTML = renderEstoqueReplica();

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
    const allModals = ['tutFormOverlay', 'tutGrupoOverlay', 'tutMovOverlay', 'tutViewOverlay'];

    allModals.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('show');
    });

    switch (view) {
        case 'form':
            openModal('tutFormOverlay');
            setFormTab(activeTab || 'produto');
            break;
        case 'grupo':
            openModal('tutGrupoOverlay');
            break;
        case 'mov-entrada':
            setMovModal('entrada');
            openModal('tutMovOverlay');
            break;
        case 'mov-saida':
            setMovModal('saida');
            openModal('tutMovOverlay');
            break;
        case 'view':
            openModal('tutViewOverlay');
            break;
        case 'main':
        default:
            break;
    }
}

function setMovModal(tipo) {
    const isEntrada = tipo === 'entrada';
    const title = isEntrada ? 'Entrada de Estoque' : 'Saída de Estoque';
    const confirmLabel = isEntrada ? 'Confirmar Entrada' : 'Confirmar Saída';

    const t = document.getElementById('movTitle');
    const c = document.getElementById('movConfirmBtn');
    if (t) t.textContent = title;
    if (c) c.textContent = confirmLabel;
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
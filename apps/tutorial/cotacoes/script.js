function renderCotacoesReplica() {
    return `
    <div class="replica-cotacoes">
        <div class="app-content">
            <div class="container" id="tutMainContainer">
                <div class="header">
                    <div class="header-left"><h1>Cotações de Frete</h1></div>
                    <button type="button" class="btn-new-order-header" data-tut="btn-nova-cotacao">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nova Cotação
                    </button>
                </div>

                <div class="search-bar-wrapper">
                    <div class="search-bar">
                        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input type="text" placeholder="Pesquisar" disabled data-tut="search-input">

                        <div class="search-bar-filters">
                            <div class="filter-dropdown-inline" data-tut="filter-transportadora">
                                <select disabled><option>Transportadora</option></select>
                                <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                            <div class="filter-dropdown-inline" data-tut="filter-responsavel">
                                <select disabled><option>Responsável</option></select>
                                <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                            <div class="filter-dropdown-inline" data-tut="filter-status">
                                <select disabled><option>Todos os Status</option></select>
                                <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                            <div class="month-navigation-inline" data-tut="month-nav">
                                <button type="button" class="month-nav-arrow" disabled>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>
                                <div class="month-display-inline"><span>Janeiro 2025</span></div>
                                <button type="button" class="month-nav-arrow" disabled>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            </div>
                        </div>

                        <button type="button" class="calendar-btn" data-tut="calendar-btn" disabled title="Selecionar mês">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </button>
                        <button type="button" class="sync-btn" data-tut="sync-btn" disabled title="Sincronizar dados">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="card table-card">
                    <div style="overflow-x: auto;">
                        <table>
                            <thead data-tut="table-header">
                                <tr>
                                    <th class="col-checkbox"> </th>
                                    <th class="col-codigo">Código</th>
                                    <th class="col-data">Data</th>
                                    <th class="col-transportadora">Transportadora</th>
                                    <th class="col-destino">Destino</th>
                                    <th class="col-documento">Documento</th>
                                    <th class="col-valor">Valor</th>
                                    <th class="col-alerta"></th>
                                    <th class="col-acoes">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="row-fechada">
                                    <td class="col-checkbox" style="text-align:center;">
                                        <div class="checkbox-wrapper" data-tut="checkbox-aprovacao">
                                            <input type="checkbox" class="styled-checkbox" checked>
                                            <label class="checkbox-label-styled"></label>
                                        </div>
                                    </td>
                                    <td class="col-codigo"><strong>001</strong></td>
                                    <td class="col-data">15/01/2025</td>
                                    <td class="col-transportadora"><strong>TRANSPORTES RÁPIDO SUL</strong></td>
                                    <td class="col-destino">SERRA / ES</td>
                                    <td class="col-documento">NF 12345</td>
                                    <td class="col-valor">R$ 320,00</td>
                                    <td class="col-alerta" style="text-align:center;">
                                        <button type="button" class="action-btn alert-icon" data-tut="alert-obs-btn" disabled title="Ver observações">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                        </button>
                                    </td>
                                    <td class="col-acoes">
                                        <div class="actions-cell">
                                            <button class="action-btn edit" data-tut="edit-btn">Editar</button>
                                            <button class="action-btn delete" data-tut="delete-btn">Excluir</button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="col-checkbox" style="text-align:center;">
                                        <div class="checkbox-wrapper">
                                            <input type="checkbox" class="styled-checkbox">
                                            <label class="checkbox-label-styled"></label>
                                        </div>
                                    </td>
                                    <td class="col-codigo"><strong>002</strong></td>
                                    <td class="col-data">18/01/2025</td>
                                    <td class="col-transportadora"><strong>LOG EXPRESS BRASIL</strong></td>
                                    <td class="col-destino">VITÓRIA / ES</td>
                                    <td class="col-documento">NF 98765</td>
                                    <td class="col-valor">R$ 180,00</td>
                                    <td class="col-alerta" style="text-align:center;"></td>
                                    <td class="col-acoes">
                                        <div class="actions-cell">
                                            <button class="action-btn edit">Editar</button>
                                            <button class="action-btn delete">Excluir</button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL FORMULÁRIO ═══════════ -->
        <div class="modal-overlay" id="tutFormOverlay">
            <div class="modal-content" style="max-width:1600px;">
                <div class="modal-header">
                    <h3 class="modal-title">Nova Cotação</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-container">
                    <div class="tabs-nav" data-tut="form-tabs">
                        <button type="button" class="tab-btn active" data-tut-tab="geral" data-tut="tab-geral">Geral</button>
                        <button type="button" class="tab-btn" data-tut-tab="transportadora" data-tut="tab-transportadora">Transportadora</button>
                        <button type="button" class="tab-btn" data-tut-tab="observacoes" data-tut="tab-observacoes">Observações</button>
                    </div>

                    <div class="tab-content active" data-tut-pane="geral" data-tut="tab-content-geral">
                        <div class="form-grid">
                            <div class="form-group"><label>Data da Cotação</label><input type="text" value="24/01/2025" disabled></div>
                            <div class="form-group"><label>Documento</label><input type="text" value="NF 12345" disabled></div>
                            <div class="form-group"><label>Nº da Cotação</label><input type="text" value="COT-2025-001" disabled></div>
                            <div class="form-group"><label>Destino</label><input type="text" value="SERRA / ES" disabled></div>
                            <div class="form-group"><label>Responsável</label><input type="text" value="ROBERTO" disabled style="background:var(--input-bg);cursor:not-allowed;"></div>
                            <div class="form-group"><label>Vendedor</label><select disabled><option>ROBERTO SILVA</option></select></div>
                        </div>
                    </div>

                    <div class="tab-content" data-tut-pane="transportadora" data-tut="tab-content-transportadora">
                        <div class="form-grid">
                            <div class="form-group"><label>Transportadora *</label><select disabled><option>TRANSPORTES RÁPIDO SUL</option></select></div>
                            <div class="form-group"><label>Atendente</label><input type="text" value="CARLOS PEREIRA" disabled></div>
                            <div class="form-group"><label>Canal de Comunicação</label><select disabled><option>WhatsApp</option></select></div>
                            <div class="form-group"><label>Código de Coleta</label><input type="text" value="COL-98765" disabled></div>
                            <div class="form-group"><label>Valor do Frete (R$)</label><input type="number" value="320.00" disabled></div>
                            <div class="form-group"><label>Previsão de Entrega</label><input type="text" value="30/01/2025" disabled></div>
                        </div>
                    </div>

                    <div class="tab-content" data-tut-pane="observacoes" data-tut="tab-content-observacoes">
                        <div class="observacoes-section">
                            <div class="observacoes-list">
                                <div class="observacao-item">
                                    <div class="observacao-header">
                                        <span class="observacao-data">24/01/2025 10:15</span>
                                        <button type="button" class="btn-remove-obs" disabled>✕</button>
                                    </div>
                                    <p class="observacao-texto">Frete CIF até o destino combinado. Embalagem reforçada.</p>
                                </div>
                            </div>
                            <div class="nova-observacao">
                                <textarea placeholder="Digite sua observação aqui..." disabled rows="3"></textarea>
                                <button type="button" class="btn-add-obs" disabled>Adicionar Observação</button>
                            </div>
                        </div>
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

        <!-- ═══════════ MODAL VISUALIZAÇÃO ═══════════ -->
        <div class="modal-overlay" id="tutViewOverlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Cotação - <span>NF 12345</span></h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-container">
                    <div class="tabs-nav" data-tut="view-tabs">
                        <button type="button" class="tab-btn active">Geral</button>
                        <button type="button" class="tab-btn">Transportadora</button>
                        <button type="button" class="tab-btn">Observações</button>
                    </div>
                    <div class="tab-content active">
                        <div class="info-section">
                            <h4>Informações Gerais</h4>
                            <div class="info-row"><span class="info-label">Código:</span><span class="info-value">001</span></div>
                            <div class="info-row"><span class="info-label">Data:</span><span class="info-value">15/01/2025</span></div>
                            <div class="info-row"><span class="info-label">Documento:</span><span class="info-value">NF 12345</span></div>
                            <div class="info-row"><span class="info-label">Nº Cotação:</span><span class="info-value">COT-2025-001</span></div>
                            <div class="info-row"><span class="info-label">Destino:</span><span class="info-value">SERRA / ES</span></div>
                            <div class="info-row"><span class="info-label">Responsável:</span><span class="info-value">ROBERTO</span></div>
                            <div class="info-row"><span class="info-label">Status:</span><span class="info-value">APROVADA</span></div>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="secondary">Anterior</button>
                    <button type="button" class="secondary">Próximo</button>
                    <button type="button" class="cancel-close">Fechar</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL EXCLUSÃO ═══════════ -->
        <div class="modal-overlay" id="tutDeleteOverlay">
            <div class="modal-content ir-modal-confirm">
                <button type="button" class="close-modal ir-close">✕</button>
                <div class="ir-confirm-msg">Tem certeza que deseja excluir a cotação NF 12345?</div>
                <div class="ir-confirm-actions">
                    <button type="button" class="ir-btn-green">Sim</button>
                    <button type="button" class="ir-btn-red">Não</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL CALENDÁRIO ═══════════ -->
        <div class="calendar-modal" id="tutCalendarOverlay">
            <div class="calendar-content">
                <div class="calendar-header" data-tut="calendar-year">
                    <button type="button" class="calendar-year-nav" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <h3>2025</h3>
                    <button type="button" class="calendar-year-nav" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
                <div class="calendar-months" data-tut="calendar-months">
                    <div class="calendar-month">Janeiro</div>
                    <div class="calendar-month">Fevereiro</div>
                    <div class="calendar-month">Março</div>
                    <div class="calendar-month">Abril</div>
                    <div class="calendar-month">Maio</div>
                    <div class="calendar-month">Junho</div>
                    <div class="calendar-month">Julho</div>
                    <div class="calendar-month">Agosto</div>
                    <div class="calendar-month">Setembro</div>
                    <div class="calendar-month">Outubro</div>
                    <div class="calendar-month">Novembro</div>
                    <div class="calendar-month">Dezembro</div>
                </div>
            </div>
        </div>
    </div>`;
}

const STEPS = [
    // ═══════ 1: Nova Cotação ═══════
    { id: '1', target: '[data-tut="btn-nova-cotacao"]', text: 'Cadastre uma nova cotação de frete no sistema.', view: 'main' },

    // ═══════ 2–7: Modal do formulário ═══════
    { id: '2', target: '[data-tut="form-tabs"]', text: 'O cadastro é organizado em abas.', view: 'form', activeTab: 'geral' },
    { id: '3', target: ['[data-tut="btn-prev"]', '[data-tut="btn-next"]'], text: 'Navegue entre as abas do formulário utilizando os botões.', view: 'form', activeTab: 'geral' },
    { id: '4', target: ['[data-tut="btn-save"]', '[data-tut="btn-cancel"]'], text: 'Salve ou descarte as informações preenchidas.', view: 'form', activeTab: 'geral' },
    { id: '5', target: ['[data-tut="tab-geral"]', '[data-tut="tab-content-geral"]'], text: 'Preencha as informações gerais da cotação.', view: 'form', activeTab: 'geral' },
    { id: '6', target: ['[data-tut="tab-transportadora"]', '[data-tut="tab-content-transportadora"]'], text: 'Preencha os dados da transportadora.', view: 'form', activeTab: 'transportadora' },
    { id: '7', target: ['[data-tut="tab-observacoes"]', '[data-tut="tab-content-observacoes"]'], text: 'Registre observações adicionais com data e hora.', view: 'form', activeTab: 'observacoes' },

    // ═══════ 8–11: Filtros ═══════
    { id: '8',  target: '[data-tut="search-input"]', text: 'Filtro para buscas mais amplas.', view: 'main' },
    { id: '9',  target: '[data-tut="filter-transportadora"]', text: 'Filtro por transportadora.', view: 'main' },
    { id: '10', target: '[data-tut="filter-responsavel"]', text: 'Filtro por responsável.', view: 'main' },
    { id: '11', target: '[data-tut="filter-status"]', text: 'Filtro por status da cotação.', view: 'main' },

    // ═══════ 12–14: Navegação por mês e calendário ═══════
    { id: '12', target: '[data-tut="month-nav"]', text: 'Navegue entre os meses para consultar registros do período.', view: 'main' },
    { id: '13', target: '[data-tut="calendar-btn"]', text: 'Abra o calendário para selecionar um mês específico.', view: 'main' },
    { id: '14', target: '#tutCalendarOverlay .calendar-content', text: 'Navegue por anos e clique no mês desejado.', view: 'calendar' },

    // ═══════ 15: Sincronizar ═══════
    { id: '15', target: '[data-tut="sync-btn"]', text: 'Atualize manualmente os dados.', view: 'main' },

    // ═══════ 16–22: Tabela e ações ═══════
    { id: '16', target: '[data-tut="table-header"]', text: 'Tabela com as principais informações das cotações.', view: 'main' },
    { id: '17', target: '[data-tut="checkbox-aprovacao"]', text: 'Marque o checkbox para aprovar a cotação. A linha fica destacada em verde.', view: 'main' },
    { id: '18', target: '[data-tut="alert-obs-btn"]', text: 'Ícone de alerta indica que a cotação possui observações registradas.', view: 'main' },
    { id: '19', target: '[data-tut="edit-btn"]', text: 'Utilizado para abrir o formulário de alteração da cotação.', view: 'main' },
    { id: '20', target: '[data-tut="delete-btn"]', text: 'Exclua definitivamente a cotação do registro.', view: 'main' },
    { id: '21', target: '#tutDeleteOverlay .modal-content', text: 'Confirmação necessária para prevenir exclusões acidentais.', view: 'delete' },
    { id: '22', target: '#tutViewOverlay .modal-content', text: 'Ao clicar em uma linha da tabela, o modal de visualização mostra os detalhes da cotação.', view: 'view' }
];

let currentStepIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('stage').innerHTML = renderCotacoesReplica();

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
    const allModals = ['tutFormOverlay', 'tutViewOverlay', 'tutDeleteOverlay', 'tutCalendarOverlay'];

    allModals.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('show');
    });

    switch (view) {
        case 'form':
            openModal('tutFormOverlay');
            setFormTab(activeTab || 'geral');
            break;
        case 'view':
            openModal('tutViewOverlay');
            break;
        case 'delete':
            openModal('tutDeleteOverlay');
            break;
        case 'calendar':
            openModal('tutCalendarOverlay');
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

    const tabs = ['geral', 'transportadora', 'observacoes'];
    const idx = tabs.indexOf(tabKey);

    overlay.querySelectorAll('.tab-btn[data-tut-tab]').forEach(b => {
        b.classList.toggle('active', b.dataset.tutTab === tabKey);
    });
    overlay.querySelectorAll('.tab-content[data-tut-pane]').forEach(c => {
        c.classList.toggle('active', c.dataset.tutPane === tabKey);
    });

    const prev = overlay.querySelector('[data-tut="btn-prev"]');
    const next = overlay.querySelector('[data-tut="btn-next"]');
    if (prev) prev.style.display = idx > 0 ? 'inline-flex' : 'none';
    if (next) next.style.display = idx < tabs.length - 1 ? 'inline-flex' : 'none';
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
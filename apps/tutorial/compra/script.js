function renderOrdensReplica() {
    return `
    <div class="replica-ordens">
        <div class="app-content">
            <div class="container" id="tutMainContainer">
                <div class="header">
                    <div class="header-left"><h1>Ordem de Compra</h1></div>
                    <button type="button" class="btn-new-order-header" data-tut="btn-nova-ordem">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nova Ordem
                    </button>
                </div>

                <div class="dashboard-grid">
                    <div class="stat-card" data-tut="card-total">
                        <div class="stat-icon stat-icon-default">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        </div>
                        <div class="stat-content"><div class="stat-value">42</div><div class="stat-label">Total de Ordens</div></div>
                    </div>
                    <div class="stat-card stat-card-success" data-tut="card-fechadas">
                        <div class="stat-icon stat-icon-success">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div class="stat-content"><div class="stat-value stat-value-success">18</div><div class="stat-label">Fechadas</div></div>
                    </div>
                    <div class="stat-card stat-card-warning" data-tut="card-abertas">
                        <div class="stat-icon stat-icon-warning">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div class="stat-content"><div class="stat-value stat-value-warning">24</div><div class="stat-label">Abertas</div></div>
                    </div>
                    <div class="stat-card stat-card-info" data-tut="card-valor">
                        <div class="stat-icon stat-icon-info">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </div>
                        <div class="stat-content"><div class="stat-value stat-value-info">R$ 42.500,00</div><div class="stat-label">Total do Mês</div></div>
                    </div>
                </div>

                <div class="search-bar-wrapper">
                    <div class="search-bar">
                        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                        <input type="text" placeholder="Pesquisar" disabled data-tut="search-input">

                        <div class="search-bar-filters">
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

                        <button type="button" class="sync-btn" data-tut="duplicar-btn" disabled title="Duplicar ordem">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="8" y="8" width="13" height="13" rx="2"/>
                                <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>
                            </svg>
                        </button>
                        <button type="button" class="sync-btn" data-tut="sync-btn" disabled title="Sincronizar">
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
                                    <th style="width: 40px; text-align: center;">✓</th>
                                    <th>Nº Ordem</th>
                                    <th>Responsável</th>
                                    <th>Fornecedor</th>
                                    <th>Data</th>
                                    <th>Valor Total</th>
                                    <th>Status</th>
                                    <th style="text-align: center;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="text-align:center;">
                                        <div class="checkbox-wrapper" data-tut="checkbox-status">
                                            <input type="checkbox" class="styled-checkbox" checked>
                                            <label class="checkbox-label-styled"></label>
                                        </div>
                                    </td>
                                    <td><strong>1250</strong></td>
                                    <td>ROBERTO</td>
                                    <td>SIL MATERIAIS ELÉTRICOS</td>
                                    <td>15/01/2025</td>
                                    <td><strong>R$ 1.850,00</strong></td>
                                    <td><span class="badge fechada">FECHADA</span></td>
                                    <td class="actions-cell">
                                        <div class="actions">
                                            <button class="action-btn edit" data-tut="edit-btn">Editar</button>
                                            <button class="action-btn success" data-tut="pdf-btn">PDF</button>
                                            <button class="action-btn delete" data-tut="delete-btn">Excluir</button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="text-align:center;">
                                        <div class="checkbox-wrapper">
                                            <input type="checkbox" class="styled-checkbox">
                                            <label class="checkbox-label-styled"></label>
                                        </div>
                                    </td>
                                    <td><strong>1251</strong></td>
                                    <td>ISAQUE</td>
                                    <td>SCHNEIDER ELECTRIC</td>
                                    <td>20/01/2025</td>
                                    <td><strong>R$ 3.420,00</strong></td>
                                    <td><span class="badge aberta">ABERTA</span></td>
                                    <td class="actions-cell">
                                        <div class="actions">
                                            <button class="action-btn edit">Editar</button>
                                            <button class="action-btn success">PDF</button>
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
            <div class="modal-content" style="max-width:1200px;">
                <div class="modal-header">
                    <h3 class="modal-title">Nova Ordem de Compra</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-nav" data-tut="form-tabs">
                    <button type="button" class="tab-btn active" data-tut-tab="geral" data-tut="tab-geral">Geral</button>
                    <button type="button" class="tab-btn" data-tut-tab="fornecedor" data-tut="tab-fornecedor">Fornecedor</button>
                    <button type="button" class="tab-btn" data-tut-tab="pedido" data-tut="tab-pedido">Pedido</button>
                    <button type="button" class="tab-btn" data-tut-tab="entrega" data-tut="tab-entrega">Entrega</button>
                    <button type="button" class="tab-btn" data-tut-tab="pagamento" data-tut="tab-pagamento">Pagamento</button>
                </div>

                <div class="tab-content active" data-tut-pane="geral" data-tut="tab-content-geral">
                    <div class="form-grid">
                        <div class="form-group"><label>Número da Ordem *</label><input type="text" value="1252" disabled></div>
                        <div class="form-group"><label>Responsável</label><input type="text" value="ROBERTO" disabled style="background:var(--input-bg);cursor:default;"></div>
                        <div class="form-group"><label>Data da Ordem *</label><input type="date" value="2025-01-24" disabled></div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="fornecedor" data-tut="tab-content-fornecedor">
                    <div class="form-grid">
                        <div class="form-group"><label>Razão Social *</label><input type="text" value="SIL MATERIAIS ELÉTRICOS" disabled></div>
                        <div class="form-group"><label>Nome Fantasia</label><input type="text" value="SIL" disabled></div>
                        <div class="form-group"><label>CNPJ *</label><input type="text" value="12.345.678/0001-90" disabled></div>
                        <div class="form-group"><label>Endereço</label><input type="text" value="RUA TADORNA, 472 - SERRA/ES" disabled></div>
                        <div class="form-group"><label>Site</label><input type="text" value="www.sil.com.br" disabled></div>
                        <div class="form-group"><label>Contato</label><input type="text" value="JOÃO DA SILVA" disabled></div>
                        <div class="form-group"><label>Telefone</label><input type="text" value="(27) 3209-4291" disabled></div>
                        <div class="form-group"><label>E-mail</label><input type="email" value="contato@sil.com.br" disabled></div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="pedido" data-tut="tab-content-pedido">
                    <button type="button" class="success small" style="margin-bottom:1rem;" data-tut="btn-add-item">+ Adicionar Item</button>
                    <div style="overflow-x:auto;">
                        <table class="items-table">
                            <thead>
                                <tr><th>Item</th><th>Especificação</th><th>QTD</th><th>Unid</th><th>Valor UN</th><th>IPI</th><th>ST</th><th>Total</th><th></th></tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="text-align:center;">1</td>
                                    <td>CABO FLEXÍVEL 2,5MM</td>
                                    <td>100</td>
                                    <td>M</td>
                                    <td>R$ 1,50</td>
                                    <td>-</td>
                                    <td>-</td>
                                    <td>R$ 150,00</td>
                                    <td style="text-align:center;"><button type="button" class="danger small">Excluir</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="double-field-row" style="margin-top:1rem;">
                        <div class="form-group"><label>Valor Total da Ordem</label><input type="text" value="R$ 150,00" readonly></div>
                        <div class="form-group"><label>Frete</label><input type="text" value="CIF" disabled></div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="entrega" data-tut="tab-content-entrega">
                    <div class="form-grid">
                        <div class="form-group"><label>Local de Entrega</label><input type="text" value="RUA TADORNA Nº 472, SALA 2, NOVO HORIZONTE - SERRA/ES | CEP: 29.163-318" disabled></div>
                        <div class="form-group"><label>Prazo de Entrega</label><input type="text" value="IMEDIATO" disabled></div>
                        <div class="form-group"><label>Transporte</label><input type="text" value="FORNECEDOR" disabled></div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="pagamento" data-tut="tab-content-pagamento">
                    <div class="form-grid">
                        <div class="form-group"><label>Forma de Pagamento *</label><input type="text" value="BOLETO" disabled></div>
                        <div class="form-group"><label>Dados Bancários</label><input type="text" value="BANCO DO BRASIL / AG 1234 / CC 56789-0" disabled></div>
                        <div class="form-group"><label>Prazo de Pagamento *</label><input type="text" value="30 DIAS" disabled></div>
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
                    <h3 class="modal-title">Ordem Nº <span>1250</span></h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-nav">
                    <button type="button" class="tab-btn active">Geral</button>
                    <button type="button" class="tab-btn">Fornecedor</button>
                    <button type="button" class="tab-btn">Pedido</button>
                    <button type="button" class="tab-btn">Entrega</button>
                    <button type="button" class="tab-btn">Pagamento</button>
                </div>
                <div class="tab-content active">
                    <div class="info-section">
                        <h4>Informações Gerais</h4>
                        <p><strong>Responsável:</strong> ROBERTO</p>
                        <p><strong>Data:</strong> 15/01/2025</p>
                        <p><strong>Status:</strong> <span class="badge fechada">FECHADA</span></p>
                        <p><strong>Atualizado Por:</strong> ROBERTO</p>
                        <p><strong>Última Atualização:</strong> 24/01/2025 10:15</p>
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
                <div class="ir-confirm-msg">Tem certeza que deseja excluir esta ordem?</div>
                <div class="ir-confirm-actions">
                    <button type="button" class="ir-btn-green">Sim</button>
                    <button type="button" class="ir-btn-red">Não</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL DUPLICAR ═══════════ -->
        <div class="modal-overlay" id="tutDuplicarOverlay">
            <div class="modal-content ir-modal-confirm">
                <button type="button" class="close-modal ir-close">✕</button>
                <p style="font-size:1.05rem;margin-bottom:1rem;font-weight:600;">Digite o número da ordem a ser duplicada</p>
                <input type="text" placeholder="Ex: 1250" disabled style="text-align:center;font-size:1.1rem;padding:10px;width:100%;max-width:220px;margin:0 auto;">
                <div class="ir-confirm-actions" style="margin-top:1.5rem;">
                    <button type="button" class="ir-btn-green">Confirmar</button>
                    <button type="button" class="ir-btn-red">Cancelar</button>
                </div>
            </div>
        </div>
    </div>`;
}

const STEPS = [
    // ═══════ 1: Botão Nova Ordem ═══════
    { id: '1', target: '[data-tut="btn-nova-ordem"]', text: 'Cadastre uma nova ordem de compra no sistema.', view: 'main' },

    // ═══════ 2–9: Modal do formulário ═══════
    { id: '2', target: '[data-tut="form-tabs"]', text: 'O cadastro é organizado em abas.', view: 'form', activeTab: 'geral' },
    { id: '3', target: ['[data-tut="btn-prev"]', '[data-tut="btn-next"]'], text: 'Navegue entre as abas do formulário utilizando os botões.', view: 'form', activeTab: 'geral' },
    { id: '4', target: ['[data-tut="btn-save"]', '[data-tut="btn-cancel"]'], text: 'Salve ou descarte as informações preenchidas.', view: 'form', activeTab: 'geral' },
    { id: '5', target: ['[data-tut="tab-geral"]', '[data-tut="tab-content-geral"]'], text: 'Preencha as informações gerais da ordem.', view: 'form', activeTab: 'geral' },
    { id: '6', target: ['[data-tut="tab-fornecedor"]', '[data-tut="tab-content-fornecedor"]'], text: 'Preencha os dados do fornecedor e contato. Informações de fornecedores já cadastrados são preenchidas automaticamente.', view: 'form', activeTab: 'fornecedor' },
    { id: '7', target: ['[data-tut="tab-pedido"]', '[data-tut="tab-content-pedido"]'], text: 'Defina os itens da ordem de compra e o tipo de frete.', view: 'form', activeTab: 'pedido' },
    { id: '8', target: ['[data-tut="tab-entrega"]', '[data-tut="tab-content-entrega"]'], text: 'Preencha as informações de entrega.', view: 'form', activeTab: 'entrega' },
    { id: '9', target: ['[data-tut="tab-pagamento"]', '[data-tut="tab-content-pagamento"]'], text: 'Defina a forma de pagamento, dados bancários e prazo de pagamento.', view: 'form', activeTab: 'pagamento' },

    // ═══════ 10–13: Dashboard ═══════
    { id: '10', target: '[data-tut="card-total"]', text: 'Total de ordens registradas no sistema.', view: 'main' },
    { id: '11', target: '[data-tut="card-fechadas"]', text: 'Quantidade de ordens fechadas no mês.', view: 'main' },
    { id: '12', target: '[data-tut="card-abertas"]', text: 'Quantidade de ordens abertas no mês.', view: 'main' },
    { id: '13', target: '[data-tut="card-valor"]', text: 'Somatório do valor total das ordens do mês.', view: 'main' },

    // ═══════ 14–17: Filtros e navegação ═══════
    { id: '14', target: '[data-tut="search-input"]', text: 'Filtro para buscas mais amplas.', view: 'main' },
    { id: '15', target: '[data-tut="filter-responsavel"]', text: 'Filtro por responsável.', view: 'main' },
    { id: '16', target: '[data-tut="filter-status"]', text: 'Filtro por status da ordem.', view: 'main' },
    { id: '17', target: '[data-tut="month-nav"]', text: 'Navegue entre os meses para visualizar ordens do período.', view: 'main' },

    // ═══════ 18–20: Duplicar e sincronizar ═══════
    { id: '18', target: '[data-tut="duplicar-btn"]', text: 'Duplique uma ordem existente a partir do número.', view: 'main' },
    { id: '19', target: '#tutDuplicarOverlay .modal-content', text: 'Informe o número da ordem que deseja duplicar.', view: 'duplicar' },
    { id: '20', target: '[data-tut="sync-btn"]', text: 'Atualize manualmente os dados.', view: 'main' },

    // ═══════ 21–26: Tabela e ações ═══════
    { id: '21', target: '[data-tut="table-header"]', text: 'Tabela com as principais informações das ordens de compra.', view: 'main' },
    { id: '22', target: '[data-tut="checkbox-status"]', text: 'Marque para indicar que a ordem foi fechada.', view: 'main' },
    { id: '23', target: '[data-tut="edit-btn"]', text: 'Utilizado para abrir o formulário de alteração da ordem.', view: 'main' },
    { id: '24', target: '[data-tut="pdf-btn"]', text: 'Emita o documento da ordem de compra.', view: 'main' },
    { id: '25', target: '[data-tut="delete-btn"]', text: 'Exclua definitivamente uma ordem.', view: 'main' },
    { id: '26', target: '#tutDeleteOverlay .modal-content', text: 'Confirmação necessária para prevenir exclusões acidentais.', view: 'delete' },

    // ═══════ 27: Modal de visualização ═══════
    { id: '27', target: '#tutViewOverlay .modal-content', text: 'Ao clicar em uma linha da tabela, o modal de visualização mostra os detalhes da ordem registrada.', view: 'view' }
];

let currentStepIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('stage').innerHTML = renderOrdensReplica();

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
    const allModals = ['tutFormOverlay', 'tutViewOverlay', 'tutDeleteOverlay', 'tutDuplicarOverlay'];

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
        case 'duplicar':
            openModal('tutDuplicarOverlay');
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

    const tabs = ['geral', 'fornecedor', 'pedido', 'entrega', 'pagamento'];
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
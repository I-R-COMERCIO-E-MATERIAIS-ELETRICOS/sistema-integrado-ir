function renderPedidosReplica() {
    return `
    <div class="replica-pedidos">
        <div class="app-content">
            <div class="container" id="tutMainContainer">
                <div class="header">
                    <div class="header-left"><h1>Pedido de Faturamento</h1></div>
                    <button type="button" class="btn-new-order-header" data-tut="btn-novo-pedido">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Novo Pedido
                    </button>
                </div>

                <div class="dashboard-grid">
                    <div class="stat-card" data-tut="card-pedidos">
                        <div class="stat-icon stat-icon-default">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        </div>
                        <div class="stat-content"><div class="stat-value">42</div><div class="stat-label">Pedidos</div></div>
                    </div>
                    <div class="stat-card stat-card-success" data-tut="card-emitidos">
                        <div class="stat-icon stat-icon-success">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div class="stat-content"><div class="stat-value stat-value-success">28</div><div class="stat-label">Emitidos</div></div>
                    </div>
                    <div class="stat-card stat-card-warning" data-tut="card-pendentes">
                        <div class="stat-icon stat-icon-warning">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div class="stat-content"><div class="stat-value stat-value-warning">14</div><div class="stat-label">Pendentes</div></div>
                    </div>
                    <div class="stat-card stat-card-info" data-tut="card-faturado">
                        <div class="stat-icon stat-icon-info">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </div>
                        <div class="stat-content"><div class="stat-value stat-value-info">R$ 82.450,00</div><div class="stat-label">Faturado</div></div>
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

                        <button type="button" class="calendar-btn" data-tut="calendar-btn" disabled title="Selecionar mês">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </button>
                        <button type="button" class="calendar-btn" data-tut="sync-btn" disabled title="Sincronizar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                        </button>
                    </div>
                </div>

                <div class="card table-card">
                    <div style="overflow-x: auto;">
                        <table>
                            <thead data-tut="table-header">
                                <tr>
                                    <th style="width: 40px; text-align: center;">✓</th>
                                    <th>Nº Pedido</th>
                                    <th>Razão Social</th>
                                    <th>Nº NF</th>
                                    <th>Data Emissão</th>
                                    <th>Valor Total</th>
                                    <th>Status</th>
                                    <th style="text-align: center;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="row-fechada">
                                    <td style="text-align: center;">
                                        <div class="checkbox-wrapper" data-tut="checkbox-emissao">
                                            <input type="checkbox" class="styled-checkbox" checked>
                                            <label class="checkbox-label-styled"></label>
                                        </div>
                                    </td>
                                    <td><strong>001</strong></td>
                                    <td>PREFEITURA MUNICIPAL DE SERRA</td>
                                    <td data-tut="nf-cell" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;">12345</td>
                                    <td>15/01/2025</td>
                                    <td><strong>R$ 4.850,00</strong></td>
                                    <td><span class="badge fechada">EMITIDO</span></td>
                                    <td>
                                        <div class="actions">
                                            <button class="action-btn" style="background:#6B7280;" data-tut="edit-btn">Editar</button>
                                            <button class="action-btn" style="background:#1E3A8A;" data-tut="etiqueta-btn">Etiqueta</button>
                                            <button class="action-btn" style="background:#DC2626;" data-tut="delete-btn">Excluir</button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="text-align: center;">
                                        <div class="checkbox-wrapper">
                                            <input type="checkbox" class="styled-checkbox">
                                            <label class="checkbox-label-styled"></label>
                                        </div>
                                    </td>
                                    <td><strong>002</strong></td>
                                    <td>SECRETARIA DE EDUCAÇÃO</td>
                                    <td style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;">-</td>
                                    <td>-</td>
                                    <td><strong>R$ 2.320,00</strong></td>
                                    <td><span class="badge aberta">PENDENTE</span></td>
                                    <td>
                                        <div class="actions">
                                            <button class="action-btn" style="background:#6B7280;">Editar</button>
                                            <button class="action-btn" style="background:#1E3A8A;">Etiqueta</button>
                                            <button class="action-btn" style="background:#DC2626;">Excluir</button>
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
                    <h3 class="modal-title">Novo Pedido de Faturamento</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-container">
                    <div class="tabs-nav" data-tut="form-tabs">
                        <button type="button" class="tab-btn active" data-tut-tab="geral" data-tut="tab-geral">Geral</button>
                        <button type="button" class="tab-btn" data-tut-tab="faturamento" data-tut="tab-faturamento">Faturamento</button>
                        <button type="button" class="tab-btn" data-tut-tab="itens" data-tut="tab-itens">Itens</button>
                        <button type="button" class="tab-btn" data-tut-tab="entrega" data-tut="tab-entrega">Entrega</button>
                        <button type="button" class="tab-btn" data-tut-tab="transporte" data-tut="tab-transporte">Transporte</button>
                    </div>

                    <div class="tab-content active" data-tut-pane="geral" data-tut="tab-content-geral">
                        <div class="form-grid">
                            <div class="form-group"><label>Código</label><input type="text" value="003" readonly></div>
                            <div class="form-group"><label>Documento</label><input type="text" value="PED-2025-003" disabled></div>
                            <div class="form-group"><label>Responsável *</label><input type="text" value="ROBERTO" readonly></div>
                            <div class="form-group"><label>Data de Registro</label><input type="text" value="24/01/2025" readonly></div>
                            <div class="form-group"><label>Vendedor</label><select disabled><option>ROBERTO SILVA</option></select></div>
                        </div>
                    </div>

                    <div class="tab-content" data-tut-pane="faturamento" data-tut="tab-content-faturamento">
                        <div class="form-grid">
                            <div class="form-group"><label>CNPJ</label><input type="text" value="12.345.678/0001-90" disabled></div>
                            <div class="form-group"><label>Razão Social</label><input type="text" value="PREFEITURA MUNICIPAL DE SERRA" disabled></div>
                            <div class="form-group"><label>Inscrição Estadual</label><input type="text" value="083.780.74-2" disabled></div>
                            <div class="form-group"><label>Telefone</label><input type="text" value="(27) 3209-4291" disabled></div>
                            <div class="form-group"><label>Contato</label><input type="text" value="JOÃO DA SILVA" disabled></div>
                            <div class="form-group"><label>E-mail</label><input type="email" value="compras@serra.es.gov.br" disabled></div>
                            <div class="form-group" style="grid-column:1/-1;"><label>Endereço</label><input type="text" value="RUA TADORNA Nº 472, SALA 2, SERRA/ES" disabled></div>
                        </div>
                    </div>

                    <div class="tab-content" data-tut-pane="itens" data-tut="tab-content-itens">
                        <button type="button" class="success small" style="margin-bottom:1rem;" data-tut="btn-add-item">+ Adicionar Item</button>
                        <div class="items-table-container">
                            <table class="items-table">
                                <thead>
                                    <tr><th>Item</th><th>Cód. Estoque</th><th>Especificação</th><th>UN</th><th>Qtd</th><th>Valor Un.</th><th>Valor Total</th><th>NCM</th><th></th></tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="text-align:center;">1</td>
                                        <td>001</td>
                                        <td>CABO FLEXÍVEL 2,5MM</td>
                                        <td>M</td>
                                        <td>100</td>
                                        <td>R$ 1,50</td>
                                        <td>R$ 150,00</td>
                                        <td>8544.42.00</td>
                                        <td><button type="button" class="danger small">✕</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="form-grid" style="margin-top:1.5rem;">
                            <div class="form-group"><label>Valor Total do Pedido</label><input type="text" value="R$ 150,00" readonly></div>
                            <div class="form-group"><label>Peso Total (kg)</label><input type="text" value="12,5" disabled></div>
                            <div class="form-group"><label>Quantidade Total</label><input type="number" value="100" readonly></div>
                            <div class="form-group"><label>Volumes</label><input type="text" value="2" disabled></div>
                        </div>
                    </div>

                    <div class="tab-content" data-tut-pane="entrega" data-tut="tab-content-entrega">
                        <div class="form-grid">
                            <div class="form-group" style="grid-column:1/-1;"><label>Local de Entrega</label><input type="text" value="ALMOXARIFADO CENTRAL - SERRA/ES" disabled></div>
                            <div class="form-group"><label>Setor</label><input type="text" value="ALMOXARIFADO" disabled></div>
                        </div>
                    </div>

                    <div class="tab-content" data-tut-pane="transporte" data-tut="tab-content-transporte">
                        <div class="form-grid">
                            <div class="form-group"><label>Transportadora</label><select disabled><option>TRANSPORTES RÁPIDO SUL</option></select></div>
                            <div class="form-group"><label>Valor do Frete (R$)</label><input type="text" value="320,00" disabled></div>
                            <div class="form-group"><label>Previsão de Entrega</label><input type="date" value="2025-01-30" disabled></div>
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
            <div class="modal-content" style="max-width:1600px;">
                <div class="modal-header">
                    <h3 class="modal-title">Pedido Nº <span>001</span></h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-container">
                    <div class="tabs-nav">
                        <button type="button" class="tab-btn active">Geral</button>
                        <button type="button" class="tab-btn">Faturamento</button>
                        <button type="button" class="tab-btn">Itens</button>
                        <button type="button" class="tab-btn">Entrega</button>
                        <button type="button" class="tab-btn">Transporte</button>
                    </div>
                    <div class="tab-content active">
                        <div class="info-section">
                            <h4>Informações Gerais</h4>
                            <div class="info-row"><span class="info-label">Responsável:</span><span class="info-value">ROBERTO</span></div>
                            <div class="info-row"><span class="info-label">Data:</span><span class="info-value">15/01/2025</span></div>
                            <div class="info-row"><span class="info-label">Vendedor:</span><span class="info-value">ROBERTO SILVA</span></div>
                            <div class="info-row"><span class="info-label">Status:</span><span class="badge fechada">EMITIDO</span></div>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-close">Fechar</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL EMISSÃO NF (checkbox) ═══════════ -->
        <div class="modal-overlay" id="tutEmissaoNFOverlay">
            <div class="modal-content ir-modal-confirm" style="max-width:460px;">
                <button type="button" class="close-modal ir-close">✕</button>
                <p style="font-size:1.05rem;margin-bottom:1rem;font-weight:600;">Informe o número da NF para confirmar a emissão do pedido 001</p>
                <input type="text" placeholder="Ex: 3000" disabled style="text-align:center;font-size:1.1rem;font-weight:600;letter-spacing:1px;margin:0 auto;max-width:220px;">
                <div class="ir-confirm-actions" style="margin-top:1.5rem;">
                    <button type="button" class="ir-btn-green">Confirmar</button>
                    <button type="button" class="ir-btn-red">Cancelar</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL DEFINIR NF (coluna) ═══════════ -->
        <div class="modal-overlay" id="tutDefinirNFOverlay">
            <div class="modal-content ir-modal-confirm" style="max-width:460px;">
                <button type="button" class="close-modal ir-close">✕</button>
                <p style="font-size:1.05rem;margin-bottom:1rem;font-weight:600;">Qual é o número da NF para este pedido?</p>
                <input type="text" placeholder="Número da NF" disabled style="text-align:center;font-size:1.1rem;font-weight:600;letter-spacing:1px;margin:0 auto;max-width:220px;">
                <div class="ir-confirm-actions" style="margin-top:1.5rem;">
                    <button type="button" class="ir-btn-green">Salvar</button>
                    <button type="button" class="ir-btn-red">Cancelar</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL ETIQUETA ═══════════ -->
        <div class="modal-overlay" id="tutEtiquetaOverlay">
            <div class="modal-content ir-modal-confirm" style="max-width:460px;">
                <button type="button" class="close-modal ir-close">✕</button>
                <input type="text" placeholder="Número da NF" disabled style="text-align:center;font-size:1.1rem;font-weight:600;letter-spacing:1px;margin:0 auto;max-width:220px;">
                <div class="ir-confirm-actions" style="margin-top:1.5rem;">
                    <button type="button" class="ir-btn-green">Gerar Etiqueta</button>
                    <button type="button" class="ir-btn-red">Cancelar</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL EXCLUSÃO ═══════════ -->
        <div class="modal-overlay" id="tutDeleteOverlay">
            <div class="modal-content ir-modal-confirm">
                <button type="button" class="close-modal ir-close">✕</button>
                <p style="font-size:1.05rem;margin-bottom:0.5rem;">Deseja excluir o <strong>Pedido Nº 001</strong>?</p>
                <p style="color:#6B7280;font-size:0.9rem;margin-bottom:1.5rem;">Esta ação não pode ser desfeita.</p>
                <div class="ir-confirm-actions">
                    <button type="button" class="ir-btn-green">Confirmar Exclusão</button>
                    <button type="button" class="ir-btn-red">Cancelar</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL CALENDÁRIO ═══════════ -->
        <div class="calendar-modal" id="tutCalendarOverlay">
            <div class="calendar-content">
                <div class="calendar-header">
                    <button type="button" class="calendar-year-nav" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <h3>2025</h3>
                    <button type="button" class="calendar-year-nav" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
                <div class="calendar-months">
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
    // ═══════ 1: Novo Pedido ═══════
    { id: '1', target: '[data-tut="btn-novo-pedido"]', text: 'Cadastre um novo pedido de faturamento.', view: 'main' },

    // ═══════ 2–9: Modal do formulário ═══════
    { id: '2', target: '[data-tut="form-tabs"]', text: 'O cadastro é organizado em abas.', view: 'form', activeTab: 'geral' },
    { id: '3', target: ['[data-tut="btn-prev"]', '[data-tut="btn-next"]'], text: 'Navegue entre as abas do formulário utilizando os botões.', view: 'form', activeTab: 'geral' },
    { id: '4', target: ['[data-tut="btn-save"]', '[data-tut="btn-cancel"]'], text: 'Salve ou descarte as informações preenchidas.', view: 'form', activeTab: 'geral' },
    { id: '5', target: ['[data-tut="tab-geral"]', '[data-tut="tab-content-geral"]'], text: 'Preencha as informações gerais do pedido', view: 'form', activeTab: 'geral' },
    { id: '6', target: ['[data-tut="tab-faturamento"]', '[data-tut="tab-content-faturamento"]'], text: 'Preencha os dados de faturamento do cliente.', view: 'form', activeTab: 'faturamento' },
    { id: '7', target: ['[data-tut="tab-itens"]', '[data-tut="tab-content-itens"]'], text: 'Insira os itens do pedido.', view: 'form', activeTab: 'itens' },
    { id: '8', target: ['[data-tut="tab-entrega"]', '[data-tut="tab-content-entrega"]'], text: 'Defina o local de entrega e o setor de destino.', view: 'form', activeTab: 'entrega' },
    { id: '9', target: ['[data-tut="tab-transporte"]', '[data-tut="tab-content-transporte"]'], text: 'Selecione a transportadora, informe o valor do frete e a previsão de entrega.', view: 'form', activeTab: 'transporte' },

    // ═══════ 10–13: Dashboard ═══════
    { id: '10', target: '[data-tut="card-pedidos"]', text: 'Total de pedidos registrados no mês.', view: 'main' },
    { id: '11', target: '[data-tut="card-emitidos"]', text: 'Quantidade de pedidos com NF emitida.', view: 'main' },
    { id: '12', target: '[data-tut="card-pendentes"]', text: 'Quantidade de pedidos aguardando emissão.', view: 'main' },
    { id: '13', target: '[data-tut="card-faturado"]', text: 'Somatório do valor faturado no mês.', view: 'main' },

    // ═══════ 14–17: Filtros ═══════
    { id: '14', target: '[data-tut="search-input"]', text: 'Filtro para buscas mais amplas.', view: 'main' },
    { id: '15', target: '[data-tut="filter-responsavel"]', text: 'Filtro por responsável.', view: 'main' },
    { id: '16', target: '[data-tut="filter-status"]', text: 'Filtro por status', view: 'main' },
    { id: '17', target: '[data-tut="month-nav"]', text: 'Navegue entre os meses para visualizar pedidos do período.', view: 'main' },

    // ═══════ 18–20: Calendário e sincronização ═══════
    { id: '18', target: '[data-tut="calendar-btn"]', text: 'Abra o calendário para selecionar um mês específico.', view: 'main' },
    { id: '19', target: '#tutCalendarOverlay .calendar-content', text: 'Navegue por anos e clique no mês desejado.', view: 'calendar' },
    { id: '20', target: '[data-tut="sync-btn"]', text: 'Atualize manualmente os dados.', view: 'main' },

    // ═══════ 21–22: Tabela e checkbox de emissão ═══════
    { id: '21', target: '[data-tut="table-header"]', text: 'Tabela com as principais informações dos pedidos.', view: 'main' },
    { id: '22', target: '[data-tut="checkbox-emissao"]', text: 'Marque o checkbox para confirmar a emissão do pedido de faturamento.', view: 'main' },
    { id: '23', target: '#tutEmissaoNFOverlay .modal-content', text: 'Informe o número da NF para confirmar a emissão.', view: 'emissaoNF' },
    { id: '24', target: '[data-tut="nf-cell"]', text: 'Clique no número da NF para definir ou editar diretamente.', view: 'main' },
    { id: '25', target: '#tutDefinirNFOverlay .modal-content', text: 'Modal para definir ou alterar o número da NF do pedido.', view: 'definirNF' },
    { id: '26', target: '[data-tut="edit-btn"]', text: 'Utilizado para abrir o formulário de alteração do pedido.', view: 'main' },
    { id: '27', target: '[data-tut="etiqueta-btn"]', text: 'Gera as etiquetas de envio do pedido.', view: 'main' },
    { id: '28', target: '#tutEtiquetaOverlay .modal-content', text: 'Informe o número da NF para gerar a etiqueta.', view: 'etiqueta' },
    { id: '29', target: '[data-tut="delete-btn"]', text: 'Exclua definitivamente o pedido do registro.', view: 'main' },
    { id: '30', target: '#tutDeleteOverlay .modal-content', text: 'Confirmação necessária para prevenir exclusões acidentais.', view: 'delete' },
    { id: '31', target: '#tutViewOverlay .modal-content', text: 'Ao clicar em uma linha da tabela, o modal de visualização mostra os detalhes do pedido.', view: 'view' }
];

let currentStepIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('stage').innerHTML = renderPedidosReplica();

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
    const allModals = ['tutFormOverlay', 'tutViewOverlay', 'tutEmissaoNFOverlay', 'tutDefinirNFOverlay', 'tutEtiquetaOverlay', 'tutDeleteOverlay', 'tutCalendarOverlay'];

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
        case 'emissaoNF':
            openModal('tutEmissaoNFOverlay');
            break;
        case 'definirNF':
            openModal('tutDefinirNFOverlay');
            break;
        case 'etiqueta':
            openModal('tutEtiquetaOverlay');
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

    const tabs = ['geral', 'faturamento', 'itens', 'entrega', 'transporte'];
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
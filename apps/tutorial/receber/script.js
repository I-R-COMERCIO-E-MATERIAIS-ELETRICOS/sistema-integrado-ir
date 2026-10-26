function renderReceberReplica() {
    return `
    <div class="replica-receber">
        <div class="app-content">
            <div class="container">
                <div class="header">
                    <div class="header-left"><h1>Contas a Receber</h1></div>
                    <button type="button" class="btn-new-order-header" data-tut="btn-nova-conta" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nova Conta
                    </button>
                </div>

                <div class="dashboard-grid">
                    <div class="stat-card stat-card-success" data-tut="card-pago">
                        <div class="stat-icon stat-icon-success">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value stat-value-success">R$ 82.450,00</div>
                            <div class="stat-label">Pago</div>
                        </div>
                    </div>

                    <div class="stat-card stat-card-danger" data-tut="card-alerta" style="cursor:pointer;">
                        <div class="stat-icon stat-icon-danger">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value stat-value-danger">3</div>
                            <div class="stat-label">Alerta</div>
                        </div>
                    </div>

                    <div class="stat-card stat-card-warning" data-tut="card-receber">
                        <div class="stat-icon stat-icon-warning">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value stat-value-warning">R$ 24.180,00</div>
                            <div class="stat-label">A Receber</div>
                        </div>
                    </div>

                    <div class="stat-card" data-tut="card-faturado">
                        <div class="stat-icon stat-icon-default">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">R$ 106.630,00</div>
                            <div class="stat-label">Faturado</div>
                        </div>
                    </div>
                </div>

                <div class="search-bar-wrapper">
                    <div class="search-bar">
                        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input type="text" placeholder="Pesquisar" disabled data-tut="search-input">

                        <div class="search-bar-filters">
                            <div class="filter-dropdown-inline" data-tut="filter-vendedor">
                                <select disabled><option>Todos Vendedores</option></select>
                                <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                            <div class="filter-dropdown-inline" data-tut="filter-banco">
                                <select disabled><option>Todos Bancos</option></select>
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
                                <div class="month-display-inline"><span>Janeiro 2026</span></div>
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
                        <button type="button" class="calendar-btn" data-tut="pdf-btn" disabled title="Gerar PDF de Comissão">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                        </button>
                        <button type="button" class="calendar-btn" data-tut="sync-btn" disabled title="Sincronizar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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
                                    <th style="width:50px;text-align:center;">✓</th>
                                    <th>NF</th>
                                    <th>Órgão</th>
                                    <th>Vendedor</th>
                                    <th>Banco</th>
                                    <th>Valor</th>
                                    <th>Valor Pago</th>
                                    <th>Dt. Pagamento</th>
                                    <th>Status</th>
                                    <th style="width:60px;"></th>
                                    <th style="text-align:center;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr data-tut="row-item">
                                    <td style="text-align:center;">
                                        <div class="checkbox-wrapper" data-tut="checkbox-pagamento">
                                            <input type="checkbox" class="styled-checkbox">
                                            <label class="checkbox-label-styled"></label>
                                        </div>
                                    </td>
                                    <td><strong>12345</strong></td>
                                    <td>PREFEITURA MUNICIPAL DE SERRA</td>
                                    <td>ROBERTO</td>
                                    <td>BANCO DO BRASIL</td>
                                    <td><strong>R$ 4.850,00</strong></td>
                                    <td>R$ 1.500,00</td>
                                    <td>15/01/2026</td>
                                    <td><span class="badge status-a-receber">A RECEBER</span></td>
                                    <td style="text-align:center;">
                                        <button type="button" class="action-btn alert-icon" data-tut="alert-icon" disabled title="Ver observações">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                                <line x1="12" y1="9" x2="12" y2="13"/>
                                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                                            </svg>
                                        </button>
                                    </td>
                                    <td class="actions-cell" style="text-align:center;">
                                        <button type="button" class="action-btn edit" data-tut="edit-btn" disabled>Editar</button>
                                        <button type="button" class="action-btn delete" data-tut="delete-btn" disabled>Excluir</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="text-align:center;">
                                        <div class="checkbox-wrapper">
                                            <input type="checkbox" class="styled-checkbox" checked>
                                            <label class="checkbox-label-styled"></label>
                                        </div>
                                    </td>
                                    <td><strong>12346</strong></td>
                                    <td>SECRETARIA DE EDUCAÇÃO</td>
                                    <td>MARIA</td>
                                    <td>ITAÚ</td>
                                    <td><strong>R$ 2.320,00</strong></td>
                                    <td>R$ 2.320,00</td>
                                    <td>22/01/2026</td>
                                    <td><span class="badge status-pago">PAGO</span></td>
                                    <td style="text-align:center;"></td>
                                    <td class="actions-cell" style="text-align:center;">
                                        <button type="button" class="action-btn edit" disabled>Editar</button>
                                        <button type="button" class="action-btn delete" disabled>Excluir</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL: FORMULÁRIO ═══════════ -->
        <div class="modal-overlay" id="tutFormOverlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Nova Conta a Receber</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-nav" data-tut="form-tabs">
                    <button type="button" class="tab-btn active" data-tut-tab="geral" data-tut="tab-geral">Geral</button>
                    <button type="button" class="tab-btn" data-tut-tab="valores" data-tut="tab-valores">Valores e Datas</button>
                    <button type="button" class="tab-btn" data-tut-tab="parcelas" data-tut="tab-parcelas">Pagamento Parcelado</button>
                    <button type="button" class="tab-btn" data-tut-tab="obs" data-tut="tab-obs">Observações</button>
                </div>

                <div class="tab-content active" data-tut-pane="geral" data-tut="tab-content-geral">
                    <div class="form-grid">
                        <div class="form-group"><label>Número NF *</label><input type="text" value="12345" disabled></div>
                        <div class="form-group"><label>Órgão *</label><input type="text" value="PREFEITURA MUNICIPAL DE SERRA" disabled></div>
                        <div class="form-group"><label>Vendedor *</label><select disabled><option>ROBERTO</option></select></div>
                        <div class="form-group"><label>Banco</label><input type="text" value="BANCO DO BRASIL" disabled></div>
                        <div class="form-group"><label>Tipo NF</label><select disabled><option>Envio</option></select></div>
                        <div class="form-group"><label>Status</label><select disabled><option>A Receber</option></select></div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="valores" data-tut="tab-content-valores">
                    <div class="form-grid">
                        <div class="form-group"><label>Valor NF (R$)</label><input type="number" value="4850.00" disabled></div>
                        <div class="form-group"><label>Valor Pago Total (R$)</label><input type="number" value="0.00" disabled></div>
                        <div class="form-group"><label>Data Emissão *</label><input type="date" value="2026-01-15" disabled></div>
                        <div class="form-group"><label>Vencimento</label><input type="date" value="2026-02-15" disabled></div>
                        <div class="form-group"><label>Data Pagamento</label><input type="date" disabled></div>
                        <div class="form-group"><label>&nbsp;</label>
                            <button type="button" class="btn-desconto" data-tut="btn-desconto">CONFIRMAR DESCONTO</button>
                        </div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="parcelas" data-tut="tab-content-parcelas">
                    <div style="margin-bottom:1rem;">
                        <button type="button" class="btn-add-obs" data-tut="btn-add-parcela">+ Adicionar Parcela</button>
                    </div>
                    <div class="observacoes-list">
                        <div class="observacao-item">
                            <div class="observacao-header">
                                <span class="observacao-data" style="font-weight:600;color:var(--text-primary);">1ª Parcela</span>
                                <button type="button" class="btn-remove-obs" disabled>✕</button>
                            </div>
                            <div class="form-grid" style="margin-top:0.5rem;">
                                <div class="form-group"><label>Valor (R$)</label><input type="number" value="1500.00" disabled></div>
                                <div class="form-group"><label>Data de Pagamento</label><input type="date" value="2026-01-15" disabled></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="obs" data-tut="tab-content-obs">
                    <div class="observacoes-list"></div>
                    <div class="nova-observacao">
                        <h4>Nova Observação</h4>
                        <textarea placeholder="Digite uma observação..." rows="3" disabled></textarea>
                        <button type="button" class="btn-add-obs" data-tut="btn-add-obs">+ Adicionar Observação</button>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="secondary tab-prev" data-tut="btn-prev" style="display:none">Anterior</button>
                    <button type="button" class="secondary tab-next" data-tut="btn-next">Próximo</button>
                    <button type="button" class="save" data-tut="btn-save">Salvar</button>
                    <button type="button" class="cancel-close" data-tut="btn-cancel">Cancelar</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL: VISUALIZAÇÃO ═══════════ -->
        <div class="modal-overlay" id="tutViewOverlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">NF 12345</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-nav">
                    <button type="button" class="tab-btn active">Geral</button>
                    <button type="button" class="tab-btn">Valores e Datas</button>
                    <button type="button" class="tab-btn">Pagamento Parcelado</button>
                    <button type="button" class="tab-btn">Observações</button>
                </div>
                <div class="tab-content active">
                    <div class="info-section">
                        <h4>Dados da Conta</h4>
                        <div class="info-row"><span class="info-label">Número NF:</span><span class="info-value">12345</span></div>
                        <div class="info-row"><span class="info-label">Órgão:</span><span class="info-value">PREFEITURA MUNICIPAL DE SERRA</span></div>
                        <div class="info-row"><span class="info-label">Vendedor:</span><span class="info-value">ROBERTO</span></div>
                        <div class="info-row"><span class="info-label">Banco:</span><span class="info-value">BANCO DO BRASIL</span></div>
                        <div class="info-row"><span class="info-label">Status:</span><span class="info-value"><span class="badge status-a-receber">A RECEBER</span></span></div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-close">Fechar</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL: EXCLUSÃO ═══════════ -->
        <div class="modal-overlay" id="tutDeleteOverlay">
            <div class="modal-content ir-modal-confirm">
                <button type="button" class="close-modal ir-close">✕</button>
                <div class="ir-confirm-msg">Excluir NF 12345?</div>
                <div class="ir-confirm-actions">
                    <button type="button" class="ir-btn-green">Sim</button>
                    <button type="button" class="ir-btn-red">Cancelar</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL: CONFIRMAÇÃO DE PAGAMENTO ═══════════ -->
        <div class="modal-overlay" id="tutConfirmPagOverlay">
            <div class="modal-content ir-modal-confirm">
                <button type="button" class="close-modal ir-close">✕</button>
                <div class="ir-confirm-msg">O pagamento da NF 12345 será parcelado?</div>
                <div class="ir-confirm-actions">
                    <button type="button" class="ir-btn-green">Sim</button>
                    <button type="button" class="ir-btn-red">Não</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL: VENCIDOS ═══════════ -->
        <div class="modal-overlay" id="tutVencidosOverlay">
            <div class="modal-content alert-modal">
                <div class="modal-header">
                    <h3 class="modal-title" style="color:#EF4444;">Vencidos</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="card table-card" style="overflow-x:auto;">
                    <table>
                        <thead>
                            <tr><th>NF</th><th>Órgão</th><th>Vendedor</th><th>Vencimento</th><th>Valor</th></tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>12201</strong></td>
                                <td>SECRETARIA DE SAÚDE</td>
                                <td>MARIA</td>
                                <td style="color:#EF4444;font-weight:600;">05/01/2026</td>
                                <td>R$ 1.250,00</td>
                            </tr>
                            <tr>
                                <td><strong>12202</strong></td>
                                <td>PREFEITURA DE VITÓRIA</td>
                                <td>ROBERTO</td>
                                <td style="color:#EF4444;font-weight:600;">08/01/2026</td>
                                <td>R$ 3.420,00</td>
                            </tr>
                            <tr>
                                <td><strong>12203</strong></td>
                                <td>SECRETARIA DE EDUCAÇÃO</td>
                                <td>JOÃO</td>
                                <td style="color:#EF4444;font-weight:600;">10/01/2026</td>
                                <td>R$ 890,00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="alert-pagination">
                    <button class="alert-page-btn" disabled>‹</button>
                    <span class="alert-page-info">1 / 1</span>
                    <button class="alert-page-btn" disabled>›</button>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-close">Fechar</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL: CALENDÁRIO ═══════════ -->
        <div class="modal-overlay" id="tutCalendarOverlay">
            <div class="calendar-content">
                <div class="calendar-header">
                    <button type="button" class="calendar-year-nav" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <h3>2026</h3>
                    <button type="button" class="calendar-year-nav" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
                <div class="calendar-months">
                    <div class="calendar-month current">Janeiro</div>
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
    // ═══════ 1: Botão Nova Conta ═══════
    { id: '1', target: '[data-tut="btn-nova-conta"]', text: 'Registre uma nova conta a receber no sistema.', view: 'main' },

    // ═══════ 2–11: Modal do formulário ═══════
    { id: '2', target: '[data-tut="form-tabs"]', text: 'O cadastro é organizado em 4 abas: Geral, Valores e Datas, Pagamento Parcelado e Observações.', view: 'form', activeTab: 'geral' },
    { id: '3', target: ['[data-tut="btn-prev"]', '[data-tut="btn-next"]'], text: 'Navegue entre as abas do formulário utilizando os botões.', view: 'form', activeTab: 'geral' },
    { id: '4', target: ['[data-tut="btn-save"]', '[data-tut="btn-cancel"]'], text: 'Salve ou descarte as informações preenchidas.', view: 'form', activeTab: 'geral' },
    { id: '5', target: ['[data-tut="tab-geral"]', '[data-tut="tab-content-geral"]'], text: 'Informe NF, órgão, vendedor, banco, tipo de NF e status.', view: 'form', activeTab: 'geral' },
    { id: '6', target: ['[data-tut="tab-valores"]', '[data-tut="tab-content-valores"]'], text: 'Defina os valores, datas de emissão, vencimento e pagamento.', view: 'form', activeTab: 'valores' },
    { id: '7', target: '[data-tut="btn-desconto"]', text: 'Ative este botão quando o pagamento for aceito com valor inferior ao total (desconto).', view: 'form', activeTab: 'valores' },
    { id: '8', target: ['[data-tut="tab-parcelas"]', '[data-tut="tab-content-parcelas"]'], text: 'Registre o pagamento em parcelas, cada uma com valor e data própria.', view: 'form', activeTab: 'parcelas' },
    { id: '9', target: '[data-tut="btn-add-parcela"]', text: 'Adicione uma nova parcela ao pagamento.', view: 'form', activeTab: 'parcelas' },
    { id: '10', target: ['[data-tut="tab-obs"]', '[data-tut="tab-content-obs"]'], text: 'Registre observações adicionais com data e hora.', view: 'form', activeTab: 'obs' },
    { id: '11', target: '[data-tut="btn-add-obs"]', text: 'Clique para adicionar uma nova observação.', view: 'form', activeTab: 'obs' },

    // ═══════ 12–17: Dashboard ═══════
    { id: '12', target: '[data-tut="card-pago"]', text: 'Valor total já pago no mês selecionado.', view: 'main' },
    { id: '13', target: '[data-tut="card-alerta"]', text: 'Clique neste card para abrir a lista de contas vencidas do mês.', view: 'main' },
    { id: '14', target: '#tutVencidosOverlay .modal-content', text: 'Lista completa das contas vencidas, com paginação e ordenação por vencimento.', view: 'vencidos' },
    { id: '15', target: '[data-tut="card-receber"]', text: 'Valor total ainda em aberto no mês selecionado.', view: 'main' },
    { id: '16', target: '[data-tut="card-faturado"]', text: 'Soma do pago + a receber: valor faturado no mês.', view: 'main' },

    // ═══════ 17–20: Filtros ═══════
    { id: '17', target: '[data-tut="search-input"]', text: 'Pesquise por NF, órgão, vendedor, banco ou status.', view: 'main' },
    { id: '18', target: '[data-tut="filter-vendedor"]', text: 'Filtre as contas por vendedor.', view: 'main' },
    { id: '19', target: '[data-tut="filter-banco"]', text: 'Filtre as contas por banco.', view: 'main' },
    { id: '20', target: '[data-tut="filter-status"]', text: 'Filtre por status: A Receber ou Pago.', view: 'main' },

    // ═══════ 21–24: Navegação por mês, calendário ═══════
    { id: '21', target: '[data-tut="month-nav"]', text: 'Navegue entre os meses com as setas laterais.', view: 'main' },
    { id: '22', target: '[data-tut="calendar-btn"]', text: 'Abra o calendário para selecionar um mês e ano específico.', view: 'main' },
    { id: '23', target: '#tutCalendarOverlay .calendar-content', text: 'Navegue por anos e clique no mês desejado.', view: 'calendar' },

    // ═══════ 24–25: PDF e Sincronizar ═══════
    { id: '24', target: '[data-tut="pdf-btn"]', text: 'Gere o PDF de comissão do vendedor selecionado (selecione um vendedor antes).', view: 'main' },
    { id: '25', target: '[data-tut="sync-btn"]', text: 'Atualize manualmente os dados.', view: 'main' },

    // ═══════ 26–30: Tabela e ações ═══════
    { id: '26', target: '[data-tut="table-header"]', text: 'Tabela com as principais informações das contas cadastradas.', view: 'main' },
    { id: '27', target: '[data-tut="checkbox-pagamento"]', text: 'Marque o checkbox para registrar o pagamento. Uma confirmação será exibida.', view: 'main' },
    { id: '28', target: '#tutConfirmPagOverlay .modal-content', text: 'Escolha se o pagamento é parcelado (Sim) ou total (Não).', view: 'confirmPag' },
    { id: '29', target: '[data-tut="alert-icon"]', text: 'Ícone de alerta indica que a conta possui observações registradas.', view: 'main' },
    { id: '30', target: '[data-tut="edit-btn"]', text: 'Abra o formulário de edição da conta.', view: 'main' },
    { id: '31', target: '[data-tut="delete-btn"]', text: 'Exclua definitivamente a conta do registro.', view: 'main' },
    { id: '32', target: '#tutDeleteOverlay .modal-content', text: 'Confirmação necessária para prevenir exclusões acidentais.', view: 'delete' },
    { id: '33', target: '[data-tut="row-item"]', text: 'Clique em qualquer linha para abrir os detalhes da conta.', view: 'main' },
    { id: '34', target: '#tutViewOverlay .modal-content', text: 'O modal de visualização mostra Geral, Valores, Parcelas e Observações em abas.', view: 'view' }
];

let currentStepIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('stage').innerHTML = renderReceberReplica();

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
    const allModals = ['tutFormOverlay', 'tutViewOverlay', 'tutDeleteOverlay', 'tutConfirmPagOverlay', 'tutVencidosOverlay', 'tutCalendarOverlay'];

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
        case 'confirmPag':
            openModal('tutConfirmPagOverlay');
            break;
        case 'vencidos':
            openModal('tutVencidosOverlay');
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

    const tabs = ['geral', 'valores', 'parcelas', 'obs'];
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
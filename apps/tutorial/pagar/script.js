function renderPagarReplica() {
    return `
    <div class="replica-pagar">
        <div class="app-content">
            <div class="container">
                <div class="header">
                    <div class="header-left"><h1>Contas a Pagar</h1></div>
                    <button type="button" class="btn-new-order-header" data-tut="btn-nova-conta" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nova Conta
                    </button>
                </div>

                <div class="dashboard-grid">
                    <div class="stat-card stat-card-success" data-tut="card-pagos">
                        <div class="stat-icon stat-icon-success">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value stat-value-success">R$ 42.180,00</div>
                            <div class="stat-label">Pagos</div>
                        </div>
                    </div>

                    <div class="stat-card stat-card-danger" data-tut="card-vencido" style="cursor:pointer;">
                        <div class="stat-icon stat-icon-danger">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value stat-value-danger">3</div>
                            <div class="stat-label">Vencido</div>
                        </div>
                    </div>

                    <div class="stat-card stat-card-warning" data-tut="card-pendente">
                        <div class="stat-icon stat-icon-warning">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value stat-value-warning">R$ 18.460,00</div>
                            <div class="stat-label">Pendente</div>
                        </div>
                    </div>

                    <div class="stat-card" data-tut="card-total">
                        <div class="stat-icon stat-icon-default">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">R$ 60.640,00</div>
                            <div class="stat-label">Valor Total</div>
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
                            <div class="filter-dropdown-inline" data-tut="filter-banco">
                                <select disabled><option>Todos os Bancos</option></select>
                                <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                            <div class="filter-dropdown-inline" data-tut="filter-pagamento">
                                <select disabled><option>Todas Formas</option></select>
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

                        <button type="button" class="calendar-btn" data-tut="pdf-btn" disabled title="Gerar PDF">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                        </button>
                        <button type="button" class="calendar-btn" data-tut="calendar-btn" disabled title="Selecionar mês">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
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
                    <div style="overflow-x:auto;">
                        <table>
                            <thead data-tut="table-header">
                                <tr>
                                    <th style="text-align:center;width:60px;">✓</th>
                                    <th>Descrição</th>
                                    <th>Valor</th>
                                    <th>Vencimento</th>
                                    <th style="text-align:center;">Nº Parcelas</th>
                                    <th>Banco</th>
                                    <th>Data Pagamento</th>
                                    <th>Status</th>
                                    <th style="text-align:center;width:60px;"></th>
                                    <th style="text-align:center;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr data-tut="row-item">
                                    <td style="text-align:center;">
                                        <button class="check-btn" data-tut="check-btn" disabled aria-label="Marcar pago"></button>
                                    </td>
                                    <td>ALUGUEL GALPÃO</td>
                                    <td><strong>R$ 4.500,00</strong></td>
                                    <td>10/01/2026</td>
                                    <td style="text-align:center;">1/3</td>
                                    <td>BANCO DO BRASIL</td>
                                    <td>-</td>
                                    <td><span class="badge vencido">VENCIDO</span></td>
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
                                        <button class="check-btn checked" disabled aria-label="Pago"></button>
                                    </td>
                                    <td>ENERGIA ELÉTRICA</td>
                                    <td><strong>R$ 2.320,00</strong></td>
                                    <td>22/01/2026</td>
                                    <td style="text-align:center;">-</td>
                                    <td>BRADESCO</td>
                                    <td>22/01/2026</td>
                                    <td><span class="badge pago">PAGO</span></td>
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

        <!-- ═══════════ MODAL: SELEÇÃO DE TIPO ═══════════ -->
        <div class="modal-overlay" id="tutTipoOverlay">
            <div class="modal-content ir-modal-confirm">
                <button type="button" class="close-modal ir-close">✕</button>
                <h3 style="font-size:1.1rem;text-align:center;font-weight:600;margin:0.5rem 0 1.5rem;color:var(--text-primary);">Qual é o tipo de cadastro para esta conta?</h3>
                <div class="ir-confirm-actions">
                    <button type="button" class="ir-btn-blue" data-tut="btn-tipo-simples">Simples</button>
                    <button type="button" class="ir-btn-green" data-tut="btn-tipo-parcelado">Parcelado</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL: FORMULÁRIO SIMPLES ═══════════ -->
        <div class="modal-overlay" id="tutFormOverlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Nova Conta</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-nav" data-tut="form-tabs">
                    <button type="button" class="tab-btn active" data-tut-tab="dados" data-tut="tab-dados">Dados</button>
                    <button type="button" class="tab-btn" data-tut-tab="pagamento" data-tut="tab-pagamento">Pagamento</button>
                    <button type="button" class="tab-btn" data-tut-tab="obs" data-tut="tab-obs">Observações</button>
                </div>

                <div class="tab-content active" data-tut-pane="dados" data-tut="tab-content-dados">
                    <div class="form-row">
                        <div class="form-group"><label>Documento</label><input type="text" value="CTE 123456" disabled></div>
                        <div class="form-group"><label>Descrição *</label><input type="text" value="ALUGUEL GALPÃO" disabled></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Valor (R$) *</label><input type="number" value="4500.00" disabled></div>
                        <div class="form-group"><label>Data de Vencimento *</label><input type="date" value="2026-01-10" disabled></div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="pagamento" data-tut="tab-content-pagamento">
                    <div class="form-row">
                        <div class="form-group"><label>Forma de Pagamento *</label><select disabled><option>Pix</option></select></div>
                        <div class="form-group"><label>Banco *</label><select disabled><option>BANCO DO BRASIL</option></select></div>
                        <div class="form-group"><label>Data do Pagamento</label><input type="date" disabled></div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="obs" data-tut="tab-content-obs">
                    <div class="observacoes-list"></div>
                    <div class="nova-observacao">
                        <label>Nova Observação</label>
                        <textarea placeholder="Digite sua observação aqui..." rows="3" disabled></textarea>
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

        <!-- ═══════════ MODAL: FORMULÁRIO PARCELADO ═══════════ -->
        <div class="modal-overlay" id="tutFormParceladoOverlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Nova Conta Parcelada</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-nav">
                    <button type="button" class="tab-btn active" data-tut="tab-parcelado-dados">Dados</button>
                    <button type="button" class="tab-btn">Pagamento</button>
                    <button type="button" class="tab-btn">Observações</button>
                </div>

                <div class="tab-content active">
                    <div class="form-row">
                        <div class="form-group"><label>Documento</label><input type="text" value="CTE 123456" disabled></div>
                        <div class="form-group"><label>Descrição *</label><input type="text" value="ALUGUEL GALPÃO" disabled></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Nº Parcelas *</label><input type="number" value="3" disabled data-tut="parcelado-num"></div>
                        <div class="form-group"><label>Valor Total (R$) *</label><input type="number" value="13500.00" disabled data-tut="parcelado-valor"></div>
                        <div class="form-group"><label>Data Início *</label><input type="date" value="2026-01-10" disabled data-tut="parcelado-data"></div>
                    </div>
                    <div class="parcelas-preview" data-tut="parcelado-preview">
                        <h4>Prévia das parcelas</h4>
                        <div class="parcela-item">
                            <span class="parcela-numero">1ª Parcela</span>
                            <span class="parcela-data">10/01/2026</span>
                            <span class="parcela-valor">R$ 4.500,00</span>
                        </div>
                        <div class="parcela-item">
                            <span class="parcela-numero">2ª Parcela</span>
                            <span class="parcela-data">10/02/2026</span>
                            <span class="parcela-valor">R$ 4.500,00</span>
                        </div>
                        <div class="parcela-item">
                            <span class="parcela-numero">3ª Parcela</span>
                            <span class="parcela-data">10/03/2026</span>
                            <span class="parcela-valor">R$ 4.500,00</span>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="save" data-tut="btn-save-parcelado">Salvar</button>
                    <button type="button" class="cancel-close">Cancelar</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL: VISUALIZAÇÃO ═══════════ -->
        <div class="modal-overlay" id="tutViewOverlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Detalhes da Conta</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-nav">
                    <button type="button" class="tab-btn active">Dados Gerais</button>
                    <button type="button" class="tab-btn">Observações</button>
                </div>
                <div class="tab-content active">
                    <div class="info-section">
                        <div class="info-row"><span class="info-label">Documento:</span><span class="info-value">CTE 123456</span></div>
                        <div class="info-row"><span class="info-label">Descrição:</span><span class="info-value">ALUGUEL GALPÃO</span></div>
                        <div class="info-row"><span class="info-label">Parcela:</span><span class="info-value">1ª de 3</span></div>
                        <div class="info-row"><span class="info-label">Valor:</span><span class="info-value" style="color:var(--primary);font-weight:700;">R$ 4.500,00</span></div>
                        <div class="info-row"><span class="info-label">Vencimento:</span><span class="info-value">10/01/2026</span></div>
                        <div class="info-row"><span class="info-label">Forma de Pagamento:</span><span class="info-value">PIX</span></div>
                        <div class="info-row"><span class="info-label">Banco:</span><span class="info-value">BANCO DO BRASIL</span></div>
                        <div class="info-row"><span class="info-label">Status:</span><span class="info-value"><span class="badge vencido">VENCIDO</span></span></div>
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
                <div class="ir-confirm-msg">Tem certeza que deseja excluir esta conta?</div>
                <div class="ir-confirm-actions">
                    <button type="button" class="ir-btn-green">Sim</button>
                    <button type="button" class="ir-btn-red">Cancelar</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL: VENCIDOS ═══════════ -->
        <div class="modal-overlay" id="tutVencidoOverlay">
            <div class="modal-content alert-modal">
                <div class="modal-header">
                    <h3 class="modal-title" style="color:#EF4444;">Vencidos</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="card table-card" style="overflow-x:auto;">
                    <table>
                        <thead>
                            <tr><th>Descrição</th><th>Vencimento</th><th style="text-align:right;">Valor</th><th style="text-align:center;">Dias Atraso</th></tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>ALUGUEL GALPÃO</td>
                                <td style="white-space:nowrap;">05/01/2026</td>
                                <td style="text-align:right;font-weight:700;color:#EF4444;">R$ 4.500,00</td>
                                <td style="text-align:center;"><span class="badge vencido">12 dias</span></td>
                            </tr>
                            <tr>
                                <td>ENERGIA ELÉTRICA</td>
                                <td style="white-space:nowrap;">08/01/2026</td>
                                <td style="text-align:right;font-weight:700;color:#EF4444;">R$ 2.320,00</td>
                                <td style="text-align:center;"><span class="badge vencido">9 dias</span></td>
                            </tr>
                            <tr>
                                <td>INTERNET FIBRA</td>
                                <td style="white-space:nowrap;">10/01/2026</td>
                                <td style="text-align:right;font-weight:700;color:#EF4444;">R$ 890,00</td>
                                <td style="text-align:center;"><span class="badge vencido">7 dias</span></td>
                            </tr>
                        </tbody>
                    </table>
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
    // ═══════ 1: Nova Conta ═══════
    { id: '1', target: '[data-tut="btn-nova-conta"]', text: 'Registre uma nova conta a pagar no sistema.', view: 'main' },

    // ═══════ 2: Seleção de tipo ═══════
    { id: '2', target: '#tutTipoOverlay .modal-content', text: 'Escolha o tipo de cadastro: Simples (parcela única) ou Parcelado (dividido em várias parcelas).', view: 'tipo' },

    // ═══════ 3–5: Formulário simples — estrutura ═══════
    { id: '3', target: '[data-tut="form-tabs"]', text: 'O cadastro é organizado em 3 abas: Dados, Pagamento e Observações.', view: 'form', activeTab: 'dados' },
    { id: '4', target: ['[data-tut="btn-prev"]', '[data-tut="btn-next"]'], text: 'Navegue entre as abas do formulário utilizando os botões.', view: 'form', activeTab: 'dados' },
    { id: '5', target: ['[data-tut="btn-save"]', '[data-tut="btn-cancel"]'], text: 'Salve ou descarte as informações preenchidas.', view: 'form', activeTab: 'dados' },

    // ═══════ 6–7: Aba Dados (simples) ═══════
    { id: '6', target: ['[data-tut="tab-dados"]', '[data-tut="tab-content-dados"]'], text: 'Preencha documento, descrição, valor e data de vencimento.', view: 'form', activeTab: 'dados' },

    // ═══════ 7: Form parcelado ═══════
    { id: '7', target: '#tutFormParceladoOverlay .modal-content', text: 'No modo Parcelado, informe número de parcelas, valor total e data de início. As parcelas são geradas automaticamente.', view: 'form-parcelado' },
    { id: '8', target: '[data-tut="parcelado-preview"]', text: 'A prévia das parcelas é exibida logo abaixo, com valor e vencimento de cada parcela.', view: 'form-parcelado' },

    // ═══════ 9–10: Aba Pagamento ═══════
    { id: '9', target: ['[data-tut="tab-pagamento"]', '[data-tut="tab-content-pagamento"]'], text: 'Defina a forma de pagamento (Pix, Boleto, Cartão, Dinheiro, Transferência), o banco e, se já pago, a data do pagamento.', view: 'form', activeTab: 'pagamento' },

    // ═══════ 10–11: Aba Observações ═══════
    { id: '10', target: ['[data-tut="tab-obs"]', '[data-tut="tab-content-obs"]'], text: 'Registre observações adicionais com data e hora.', view: 'form', activeTab: 'obs' },
    { id: '11', target: '[data-tut="btn-add-obs"]', text: 'Clique para adicionar uma nova observação.', view: 'form', activeTab: 'obs' },

    // ═══════ 12–16: Dashboard ═══════
    { id: '12', target: '[data-tut="card-pagos"]', text: 'Valor total já pago no mês selecionado.', view: 'main' },
    { id: '13', target: '[data-tut="card-vencido"]', text: 'Clique neste card para abrir a lista de contas vencidas do mês.', view: 'main' },
    { id: '14', target: '#tutVencidoOverlay .modal-content', text: 'Lista das contas vencidas com data de vencimento, valor e dias em atraso.', view: 'vencido' },
    { id: '15', target: '[data-tut="card-pendente"]', text: 'Valor total pendente (ainda em aberto) no mês selecionado.', view: 'main' },
    { id: '16', target: '[data-tut="card-total"]', text: 'Soma do pago + pendente: valor total do mês.', view: 'main' },

    // ═══════ 17–20: Filtros ═══════
    { id: '17', target: '[data-tut="search-input"]', text: 'Pesquise por descrição, documento, banco ou forma de pagamento.', view: 'main' },
    { id: '18', target: '[data-tut="filter-banco"]', text: 'Filtre as contas por banco.', view: 'main' },
    { id: '19', target: '[data-tut="filter-pagamento"]', text: 'Filtre por forma de pagamento (Pix, Boleto, Cartão, Dinheiro, Transferência).', view: 'main' },
    { id: '20', target: '[data-tut="filter-status"]', text: 'Filtre por status: Pago, Vencido ou Pendente.', view: 'main' },

    // ═══════ 21–24: Mês, calendário, PDF e sincronização ═══════
    { id: '21', target: '[data-tut="month-nav"]', text: 'Navegue entre os meses com as setas laterais.', view: 'main' },
    { id: '22', target: '[data-tut="calendar-btn"]', text: 'Abra o calendário para selecionar um mês e ano específico.', view: 'main' },
    { id: '23', target: '#tutCalendarOverlay .calendar-content', text: 'Navegue por anos e clique no mês desejado.', view: 'calendar' },
    { id: '24', target: '[data-tut="pdf-btn"]', text: 'Gere um PDF com as contas do período e os totais: pago, pendente e geral.', view: 'main' },
    { id: '25', target: '[data-tut="sync-btn"]', text: 'Atualize manualmente os dados.', view: 'main' },

    // ═══════ 26–34: Tabela e ações ═══════
    { id: '26', target: '[data-tut="table-header"]', text: 'Tabela com descrição, valor, vencimento, nº de parcelas, banco, data de pagamento e status de cada conta.', view: 'main' },
    { id: '27', target: '[data-tut="check-btn"]', text: 'Marque o checkbox para registrar o pagamento. A conta é movida para o status PAGO.', view: 'main' },
    { id: '28', target: '[data-tut="alert-icon"]', text: 'Ícone de alerta indica que a conta possui observações registradas. Clique para abri-las.', view: 'main' },
    { id: '29', target: '[data-tut="edit-btn"]', text: 'Abra o formulário de edição. Para contas parceladas, cada parcela é editada em sua própria aba.', view: 'main' },
    { id: '30', target: '[data-tut="delete-btn"]', text: 'Exclua definitivamente a conta do registro.', view: 'main' },
    { id: '31', target: '#tutDeleteOverlay .modal-content', text: 'Confirmação necessária para prevenir exclusões acidentais.', view: 'delete' },
    { id: '32', target: '[data-tut="row-item"]', text: 'Clique em qualquer linha da tabela para abrir os detalhes da conta.', view: 'main' },
    { id: '33', target: '#tutViewOverlay .modal-content', text: 'O modal de visualização mostra Dados Gerais e Observações em abas.', view: 'view' }
];

let currentStepIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('stage').innerHTML = renderPagarReplica();

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
    const allModals = ['tutTipoOverlay', 'tutFormOverlay', 'tutFormParceladoOverlay', 'tutViewOverlay', 'tutDeleteOverlay', 'tutVencidoOverlay', 'tutCalendarOverlay'];

    allModals.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('show');
    });

    switch (view) {
        case 'tipo':
            openModal('tutTipoOverlay');
            break;
        case 'form':
            openModal('tutFormOverlay');
            setFormTab(activeTab || 'dados');
            break;
        case 'form-parcelado':
            openModal('tutFormParceladoOverlay');
            break;
        case 'view':
            openModal('tutViewOverlay');
            break;
        case 'delete':
            openModal('tutDeleteOverlay');
            break;
        case 'vencido':
            openModal('tutVencidoOverlay');
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

    const tabs = ['dados', 'pagamento', 'obs'];
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
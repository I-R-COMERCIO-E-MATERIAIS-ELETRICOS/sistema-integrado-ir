function renderFreteReplica() {
    return `
    <div class="replica-frete">
        <div class="app-content">
            <div class="container">
                <div class="header">
                    <div class="header-left"><h1>Controle de Frete</h1></div>
                    <button type="button" class="btn-new-order-header" data-tut="btn-novo-frete" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Registrar Frete
                    </button>
                </div>

                <div class="dashboard-grid">
                    <div class="stat-card stat-card-success" data-tut="card-entregues">
                        <div class="stat-icon stat-icon-success">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value stat-value-success">12</div>
                            <div class="stat-label">Entregas Realizadas</div>
                        </div>
                    </div>

                    <div class="stat-card stat-card-danger" data-tut="card-fora-prazo" style="cursor:pointer;">
                        <div class="stat-icon stat-icon-danger">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value stat-value-danger">3</div>
                            <div class="stat-label">Fora do Prazo</div>
                        </div>
                    </div>

                    <div class="stat-card" data-tut="card-transito">
                        <div class="stat-icon stat-icon-default">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">8</div>
                            <div class="stat-label">Em Trânsito</div>
                        </div>
                    </div>

                    <div class="stat-card stat-card-success" data-tut="card-faturado">
                        <div class="stat-icon stat-icon-success">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value stat-value-success">R$ 82.450,00</div>
                            <div class="stat-label">Faturado</div>
                        </div>
                    </div>

                    <div class="stat-card stat-card-info" data-tut="card-frete">
                        <div class="stat-icon stat-icon-info">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="1" y="3" width="15" height="13"></rect>
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                <circle cx="18.5" cy="18.5" r="2.5"></circle>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value stat-value-info">R$ 6.320,00</div>
                            <div class="stat-label">Frete</div>
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
                            <div class="filter-dropdown-inline" data-tut="filter-transportadora">
                                <select disabled><option>Todas Transportadoras</option></select>
                                <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                            <div class="filter-dropdown-inline" data-tut="filter-vendedor">
                                <select disabled><option>Todos Vendedores</option></select>
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
                        <button type="button" class="calendar-btn" data-tut="cmp-btn" disabled title="Análise Comparativa">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="3" y1="3" x2="3" y2="21"></line>
                                <line x1="3" y1="21" x2="21" y2="21"></line>
                                <rect x="6" y="12" width="3" height="6" rx="0.5"></rect>
                                <rect x="11" y="8" width="3" height="10" rx="0.5"></rect>
                                <rect x="16" y="4" width="3" height="14" rx="0.5"></rect>
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
                                    <th style="width: 40px; text-align: center;">✓</th>
                                    <th>NF</th>
                                    <th>Órgão</th>
                                    <th>Vendedor</th>
                                    <th>Transportadora</th>
                                    <th>Data Entrega</th>
                                    <th>Valor NF</th>
                                    <th>Status</th>
                                    <th style="width: 60px;"></th>
                                    <th style="text-align: center;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr data-tut="row-item">
                                    <td style="text-align:center;">
                                        <div class="checkbox-wrapper" data-tut="checkbox-entrega">
                                            <input type="checkbox" class="styled-checkbox">
                                            <label class="checkbox-label-styled"></label>
                                        </div>
                                    </td>
                                    <td><strong>12345</strong></td>
                                    <td>PREFEITURA MUNICIPAL DE SERRA</td>
                                    <td>ROBERTO</td>
                                    <td>TRANSPORTES RÁPIDO SUL</td>
                                    <td>30/01/2026</td>
                                    <td><strong>R$ 4.850,00</strong></td>
                                    <td><span class="badge transito">Em Trânsito</span></td>
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
                                    <td>LOG BRASIL</td>
                                    <td>22/01/2026</td>
                                    <td><strong>R$ 2.320,00</strong></td>
                                    <td><span class="badge entregue">Entregue</span></td>
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
                    <h3 class="modal-title">Novo Frete</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-nav" data-tut="form-tabs">
                    <button type="button" class="tab-btn active" data-tut-tab="nota" data-tut="tab-nota">Dados da Nota</button>
                    <button type="button" class="tab-btn" data-tut-tab="orgao" data-tut="tab-orgao">Órgão</button>
                    <button type="button" class="tab-btn" data-tut-tab="transporte" data-tut="tab-transporte">Transporte</button>
                    <button type="button" class="tab-btn" data-tut-tab="obs" data-tut="tab-obs">Observações</button>
                </div>

                <div class="tab-content active" data-tut-pane="nota" data-tut="tab-content-nota">
                    <div class="form-grid">
                        <div class="form-group"><label>Número da NF *</label><input type="text" value="12345" disabled></div>
                        <div class="form-group"><label>Data de Emissão</label><input type="date" value="2026-01-15" disabled></div>
                        <div class="form-group"><label>Documento</label><input type="text" value="2025NE0000" disabled></div>
                        <div class="form-group"><label>Valor da Nota (R$)</label><input type="number" value="4850.00" disabled></div>
                        <div class="form-group"><label>Tipo de NF</label><select disabled><option>Envio</option></select></div>
                        <div class="form-group"><label>Vendedor Responsável</label><select disabled><option>ROBERTO</option></select></div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="orgao" data-tut="tab-content-orgao">
                    <div class="form-grid">
                        <div class="form-group"><label>Nome do Órgão *</label><input type="text" value="PREFEITURA MUNICIPAL DE SERRA" disabled></div>
                        <div class="form-group"><label>Contato do Órgão</label><input type="text" value="JOÃO DA SILVA" disabled></div>
                        <div class="form-group"><label>Cidade-UF (Destino)</label><input type="text" value="SERRA-ES" disabled></div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="transporte" data-tut="tab-content-transporte">
                    <div class="form-grid">
                        <div class="form-group"><label>Transportadora</label><select disabled><option>TRANSPORTES RÁPIDO SUL</option></select></div>
                        <div class="form-group"><label>Valor do Frete (R$)</label><input type="number" value="320.00" disabled></div>
                        <div class="form-group"><label>Data da Coleta *</label><input type="date" value="2026-01-16" disabled></div>
                        <div class="form-group"><label>Previsão de Entrega</label><input type="date" value="2026-01-30" disabled></div>
                        <div class="form-group"><label>Data de Entrega</label><input type="date" disabled></div>
                        <div class="form-group"><label>Cotação</label><input type="text" value="COT-2026-001" disabled></div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="obs" data-tut="tab-content-obs">
                    <div class="observacoes-section">
                        <div class="observacoes-list">
                            <div class="observacao-item">
                                <div class="observacao-header">
                                    <span class="observacao-data">15/01/2026 10:15</span>
                                    <button type="button" class="btn-remove-obs" disabled>✕</button>
                                </div>
                                <p class="observacao-texto">Frete CIF. Embalagem reforçada.</p>
                            </div>
                        </div>
                        <div class="nova-observacao">
                            <textarea placeholder="Digite sua observação aqui..." rows="3" disabled></textarea>
                            <button type="button" class="btn-add-obs" data-tut="btn-add-obs" disabled>Adicionar Observação</button>
                        </div>
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
                    <h3 class="modal-title">Detalhes do Frete</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-nav">
                    <button type="button" class="tab-btn active">Dados da Nota</button>
                    <button type="button" class="tab-btn">Órgão</button>
                    <button type="button" class="tab-btn">Transporte</button>
                    <button type="button" class="tab-btn">Observações</button>
                </div>
                <div class="tab-content active">
                    <div class="info-section">
                        <h4>Dados da Nota Fiscal</h4>
                        <p><strong>Número NF:</strong> 12345</p>
                        <p><strong>Data Emissão:</strong> 15/01/2026</p>
                        <p><strong>Documento:</strong> 2025NE0000</p>
                        <p><strong>Valor NF:</strong> R$ 4.850,00</p>
                        <p><strong>Tipo NF:</strong> Envio</p>
                        <p><strong>Vendedor:</strong> ROBERTO</p>
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
                <div class="ir-confirm-msg">Tem certeza que deseja excluir a NF 12345?</div>
                <div class="ir-confirm-actions">
                    <button type="button" class="ir-btn-green">Sim</button>
                    <button type="button" class="ir-btn-red">Não</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL: ALERTA FORA DO PRAZO ═══════════ -->
        <div class="modal-overlay" id="tutAlertOverlay">
            <div class="modal-content alert-modal">
                <div class="modal-header">
                    <h3 class="modal-title">Fora do Prazo</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="card table-card">
                    <table>
                        <thead>
                            <tr><th>Nº NF</th><th>Emissão</th><th>Órgão</th><th>Vendedor</th><th>Previsão</th></tr>
                        </thead>
                        <tbody>
                            <tr><td><strong>12201</strong></td><td>05/01/2026</td><td>SECRETARIA DE SAÚDE</td><td>MARIA</td><td style="color:#DC2626;font-weight:600;">10/01/2026</td></tr>
                            <tr><td><strong>12202</strong></td><td>08/01/2026</td><td>PREFEITURA DE VITÓRIA</td><td>ROBERTO</td><td style="color:#DC2626;font-weight:600;">12/01/2026</td></tr>
                            <tr><td><strong>12203</strong></td><td>10/01/2026</td><td>SECRETARIA DE EDUCAÇÃO</td><td>JOÃO</td><td style="color:#DC2626;font-weight:600;">15/01/2026</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="alert-pagination">
                    <button class="alert-page-btn" disabled>‹</button>
                    <span class="alert-page-info">1 / 1</span>
                    <button class="alert-page-btn" disabled>›</button>
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

        <!-- ═══════════ MODAL: ANÁLISE COMPARATIVA ═══════════ -->
        <div class="modal-overlay" id="tutCmpOverlay">
            <div class="modal-content dashboard-comparativo">
                <div class="modal-header">
                    <h3 class="modal-title">Análise Comparativa</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="cmp-pag">
                    <button type="button" class="cmp-pag-btn" disabled>‹</button>
                    <span class="cmp-pag-info">Mês</span>
                    <button type="button" class="cmp-pag-btn">›</button>
                </div>
                <div class="cmp-grid">
                    <div class="cmp-card">
                        <div class="cmp-card-titulo">Mês selecionado</div>
                        <div class="cmp-card-sub">Janeiro/2026</div>
                        <div class="cmp-linha"><span>Faturado</span><strong>R$ 82.450,00</strong></div>
                        <div class="cmp-linha"><span>Frete</span><strong>R$ 6.320,00</strong></div>
                        <div class="cmp-linha"><span>Frete / Faturado</span><strong>7,7%</strong></div>
                        <div class="cmp-linha"><span>Notas emitidas</span><strong>18</strong></div>
                    </div>
                    <div class="cmp-card">
                        <div class="cmp-card-titulo">Mês anterior</div>
                        <div class="cmp-card-sub">Dezembro/2025</div>
                        <div class="cmp-linha"><span>Faturado</span><strong>R$ 71.200,00</strong></div>
                        <div class="cmp-linha"><span>Frete</span><strong>R$ 5.800,00</strong></div>
                        <div class="cmp-linha"><span>Frete / Faturado</span><strong>8,1%</strong></div>
                        <div class="cmp-linha"><span>Notas emitidas</span><strong>15</strong></div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-close">Fechar</button>
                </div>
            </div>
        </div>

        <!-- ═══════════ MODAL: DATE PICKER ═══════════ -->
        <div class="modal-overlay" id="tutDateOverlay">
            <div class="modal-content ir-modal-confirm">
                <button type="button" class="close-modal ir-close">✕</button>
                <div class="ir-confirm-msg">Informe a data de entrega para a NF 12345</div>
                <input type="date" value="2026-01-24" disabled style="text-align:center;font-size:1.1rem;font-weight:700;padding:10px;max-width:220px;margin:0 auto 1rem;">
                <div class="ir-confirm-actions">
                    <button type="button" class="ir-btn-green">Confirmar</button>
                    <button type="button" class="ir-btn-red">Cancelar</button>
                </div>
            </div>
        </div>
    </div>`;
}

const STEPS = [
    // ═══════ 1: Botão Registrar Frete ═══════
    { id: '1', target: '[data-tut="btn-novo-frete"]', text: 'Registre um novo frete no sistema.', view: 'main' },

    // ═══════ 2–9: Modal do formulário ═══════
    { id: '2', target: '[data-tut="form-tabs"]', text: 'O cadastro é organizado em 4 abas: Dados da Nota, Órgão, Transporte e Observações.', view: 'form', activeTab: 'nota' },
    { id: '3', target: ['[data-tut="btn-prev"]', '[data-tut="btn-next"]'], text: 'Navegue entre as abas do formulário utilizando os botões.', view: 'form', activeTab: 'nota' },
    { id: '4', target: ['[data-tut="btn-save"]', '[data-tut="btn-cancel"]'], text: 'Salve ou descarte as informações preenchidas.', view: 'form', activeTab: 'nota' },
    { id: '5', target: ['[data-tut="tab-nota"]', '[data-tut="tab-content-nota"]'], text: 'Preencha os dados da Nota Fiscal: número, data, documento, valor, tipo e vendedor.', view: 'form', activeTab: 'nota' },
    { id: '6', target: ['[data-tut="tab-orgao"]', '[data-tut="tab-content-orgao"]'], text: 'Informe o órgão destinatário, contato e cidade-UF de destino.', view: 'form', activeTab: 'orgao' },
    { id: '7', target: ['[data-tut="tab-transporte"]', '[data-tut="tab-content-transporte"]'], text: 'Defina transportadora, valor do frete, datas de coleta/entrega e a cotação.', view: 'form', activeTab: 'transporte' },
    { id: '8', target: ['[data-tut="tab-obs"]', '[data-tut="tab-content-obs"]'], text: 'Registre observações adicionais com data e hora.', view: 'form', activeTab: 'obs' },
    { id: '9', target: '[data-tut="btn-add-obs"]', text: 'Clique para adicionar uma nova observação ao frete.', view: 'form', activeTab: 'obs' },

    // ═══════ 10–15: Dashboard ═══════
    { id: '10', target: '[data-tut="card-entregues"]', text: 'Quantidade de entregas realizadas no mês selecionado.', view: 'main' },
    { id: '11', target: '[data-tut="card-fora-prazo"]', text: 'Clique neste card para abrir a lista de fretes fora do prazo.', view: 'main' },
    { id: '12', target: '#tutAlertOverlay .modal-content', text: 'Lista completa dos fretes com previsão de entrega vencida, com paginação.', view: 'alert' },
    { id: '13', target: '[data-tut="card-transito"]', text: 'Quantidade de fretes em trânsito (todos os meses).', view: 'main' },
    { id: '14', target: '[data-tut="card-faturado"]', text: 'Valor total faturado no mês selecionado.', view: 'main' },
    { id: '15', target: '[data-tut="card-frete"]', text: 'Valor total gasto com frete no mês selecionado.', view: 'main' },

    // ═══════ 16–19: Filtros ═══════
    { id: '16', target: '[data-tut="search-input"]', text: 'Pesquise por NF, órgão, transportadora, vendedor ou documento.', view: 'main' },
    { id: '17', target: '[data-tut="filter-transportadora"]', text: 'Filtre os fretes por transportadora.', view: 'main' },
    { id: '18', target: '[data-tut="filter-vendedor"]', text: 'Filtre os fretes por vendedor responsável.', view: 'main' },
    { id: '19', target: '[data-tut="filter-status"]', text: 'Filtre por status, incluindo a opção "Fora do Prazo".', view: 'main' },

    // ═══════ 20–24: Navegação por mês, calendário e análise comparativa ═══════
    { id: '20', target: '[data-tut="month-nav"]', text: 'Navegue entre os meses com as setas laterais.', view: 'main' },
    { id: '21', target: '[data-tut="calendar-btn"]', text: 'Abra o calendário para selecionar um mês e ano específico.', view: 'main' },
    { id: '22', target: '#tutCalendarOverlay .calendar-content', text: 'Navegue por anos e clique no mês desejado.', view: 'calendar' },
    { id: '23', target: '[data-tut="cmp-btn"]', text: 'Abra a Análise Comparativa com dados de faturamento, frete e notas.', view: 'main' },
    { id: '24', target: '#tutCmpOverlay .modal-content', text: 'Compare mês atual × mês anterior, ano atual × ano anterior e o detalhamento mês a mês.', view: 'cmp' },

    // ═══════ 25: Sincronizar ═══════
    { id: '25', target: '[data-tut="sync-btn"]', text: 'Atualize manualmente os dados.', view: 'main' },

    // ═══════ 26–34: Tabela e ações ═══════
    { id: '26', target: '[data-tut="table-header"]', text: 'Tabela com as principais informações dos fretes cadastrados.', view: 'main' },
    { id: '27', target: '[data-tut="checkbox-entrega"]', text: 'Marque o checkbox para confirmar a entrega. Uma data será solicitada.', view: 'main' },
    { id: '28', target: '#tutDateOverlay .modal-content', text: 'Informe a data de entrega e confirme. O frete passa a ser marcado como ENTREGUE.', view: 'date' },
    { id: '29', target: '[data-tut="alert-icon"]', text: 'Ícone de alerta indica que o frete possui observações registradas. Clique para abri-las.', view: 'main' },
    { id: '30', target: '[data-tut="edit-btn"]', text: 'Abra o formulário de edição do frete.', view: 'main' },
    { id: '31', target: '[data-tut="delete-btn"]', text: 'Exclua definitivamente o frete do registro.', view: 'main' },
    { id: '32', target: '#tutDeleteOverlay .modal-content', text: 'Confirmação necessária para prevenir exclusões acidentais.', view: 'delete' },
    { id: '33', target: '[data-tut="row-item"]', text: 'Clique em qualquer linha da tabela para abrir os detalhes do frete.', view: 'main' },
    { id: '34', target: '#tutViewOverlay .modal-content', text: 'O modal de visualização mostra Nota, Órgão, Transporte e Observações em abas.', view: 'view' }
];

let currentStepIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('stage').innerHTML = renderFreteReplica();

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
    const allModals = ['tutFormOverlay', 'tutViewOverlay', 'tutDeleteOverlay', 'tutAlertOverlay', 'tutCalendarOverlay', 'tutCmpOverlay', 'tutDateOverlay'];

    allModals.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('show');
    });

    switch (view) {
        case 'form':
            openModal('tutFormOverlay');
            setFormTab(activeTab || 'nota');
            break;
        case 'view':
            openModal('tutViewOverlay');
            break;
        case 'delete':
            openModal('tutDeleteOverlay');
            break;
        case 'alert':
            openModal('tutAlertOverlay');
            break;
        case 'calendar':
            openModal('tutCalendarOverlay');
            break;
        case 'cmp':
            openModal('tutCmpOverlay');
            break;
        case 'date':
            openModal('tutDateOverlay');
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

    const tabs = ['nota', 'orgao', 'transporte', 'obs'];
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
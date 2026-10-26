function renderLicitacoesReplica() {
    return `
    <div class="replica-licitacoes">
        <main class="app-content">
            <div class="container" id="tutMainContainer">
                <div class="header">
                    <div class="header-left"><h1>Licitações</h1></div>
                    <button type="button" class="btn-new-order-header" data-tut="btn-nova-licitacao">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Nova Licitação
                    </button>
                </div>

                <div class="dashboard-grid" data-tut="dashboard-cards">
                    <div class="stat-card stat-card-warning" id="tutCardDisputa" data-tut="card-disputa">
                        <div class="stat-icon stat-icon-warning"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
                        <div class="stat-content"><div class="stat-value stat-value-warning">2</div><div class="stat-label">Alerta de Disputa</div></div>
                    </div>
                    <div class="stat-card stat-card-success">
                        <div class="stat-icon stat-icon-success"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                        <div class="stat-content"><div class="stat-value stat-value-success">12</div><div class="stat-label">Ganhos</div></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon stat-icon-default"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
                        <div class="stat-content"><div class="stat-value">28</div><div class="stat-label">Realizados</div></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon stat-icon-default"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></div>
                        <div class="stat-content"><div class="stat-value">42</div><div class="stat-label">Total de Licitações</div></div>
                    </div>
                </div>

                <div class="search-bar-wrapper">
                    <div class="search-bar">
                        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                        <input placeholder="Pesquisar pregão, UASG, vendedor ou órgão…" disabled data-tut="search-input">
                        <div class="search-bar-filters">
                            <div class="filter-dropdown-inline" data-tut="filter-vendedor">
                                <select disabled><option>Todos os Vendedores</option></select>
                                <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            <div class="filter-dropdown-inline" data-tut="filter-status">
                                <select disabled><option>Todos os Status</option></select>
                                <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            <div class="month-navigation-inline" data-tut="month-nav">
                                <button type="button" class="month-nav-arrow" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                                <div class="month-display-inline"><span>Janeiro 2025</span></div>
                                <button type="button" class="month-nav-arrow" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
                            </div>
                        </div>
                        <button type="button" class="sync-btn" data-tut="sync-btn" disabled><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>
                    </div>
                </div>

                <div class="card table-card">
                    <div style="overflow-x:auto">
                        <table>
                            <thead data-tut="table-header">
                                <tr>
                                    <th style="width:56px;text-align:center;">✓</th>
                                    <th>Pregão</th><th>UASG</th><th>Vendedor</th><th>Órgão</th>
                                    <th>Data</th><th>Hora</th>
                                    <th style="text-align:center;">Status</th>
                                    <th style="text-align:center;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="text-align:center;">
                                        <div class="checkbox-wrapper" data-tut="checkbox-ganho">
                                            <input type="checkbox" class="styled-checkbox" checked>
                                            <label class="checkbox-label-styled"></label>
                                        </div>
                                    </td>
                                    <td><strong>PE 001/2025</strong></td>
                                    <td>123456</td>
                                    <td>ROBERTO SILVA</td>
                                    <td>PREFEITURA MUNICIPAL DE SERRA</td>
                                    <td>15/01/2025</td>
                                    <td>10:00</td>
                                    <td style="text-align:center;"><span class="badge-status ganho">GANHO</span></td>
                                    <td class="actions-cell">
                                        <div class="actions">
                                            <button class="action-btn edit" data-tut="edit-btn">Editar</button>
                                            <button class="action-btn itens" data-tut="items-btn">Itens</button>
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
                                    <td><strong>PE 002/2025</strong></td>
                                    <td>654321</td>
                                    <td>MARIA SOUZA</td>
                                    <td>SECRETARIA DE EDUCAÇÃO</td>
                                    <td>22/01/2025</td>
                                    <td>14:30</td>
                                    <td style="text-align:center;"><span class="badge-status aguardando">AGUARDANDO DISPUTA</span></td>
                                    <td class="actions-cell">
                                        <div class="actions">
                                            <button class="action-btn edit">Editar</button>
                                            <button class="action-btn itens">Itens</button>
                                            <button class="action-btn delete">Excluir</button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination" data-tut="pagination">
                        <button class="page-btn" disabled>‹</button>
                        <button class="page-btn active">1</button>
                        <button class="page-btn">2</button>
                        <button class="page-btn">3</button>
                        <button class="page-btn">›</button>
                    </div>
                </div>
            </div>
        </main>

        <section class="items-page" id="tutItemsPage" hidden>
            <div class="items-header">
                <div>
                    <h2>Pregão PE 001/2025</h2>
                    <p class="subtitle">PREFEITURA MUNICIPAL DE SERRA</p>
                </div>
                <button type="button" class="icon-btn" data-tut="back-items" title="Voltar">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                </button>
            </div>

            <div class="search-bar-wrapper">
                <div class="search-bar">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                    <input placeholder="Pesquisar item…" disabled data-tut="item-search">
                    <div class="search-bar-filters">
                        <div class="filter-dropdown-inline" data-tut="filter-marca">
                            <select disabled><option>Todas as Marcas</option></select>
                            <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                        <div class="filter-dropdown-inline" data-tut="filter-itens">
                            <select disabled><option>Todos os Itens</option></select>
                            <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                    </div>
                    <button type="button" class="sync-btn" data-tut="pdf-btn" disabled><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg></button>
                    <button type="button" class="sync-btn" data-tut="sync-items-btn" disabled><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>
                </div>
            </div>

            <div id="tutTablesContainer">
                <div class="items-toolbar-center" data-tut="insert-bar">
                    <button type="button" class="btn-toggle-table">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Tabela de Itens
                    </button>
                    <button type="button" class="btn-toggle-table">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        Grupo/Lote
                    </button>
                </div>

                <div class="grupo-tabela">
                    <div class="grupo-header">
                        <span style="flex:1;"></span>
                        <div class="grupo-actions">
                            <button type="button" class="grupo-icon-btn" data-tut="add-item-btn" title="Adicionar Item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                            <button type="button" class="grupo-icon-btn" data-tut="add-range-btn" title="Adicionar Intervalo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></button>
                            <button type="button" class="grupo-icon-btn" data-tut="quote-btn" title="Cotação"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg></button>
                            <button type="button" class="grupo-icon-btn" data-tut="del-table-btn" title="Excluir tabela"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                        </div>
                    </div>
                    <div class="card table-card items-card">
                        <div class="items-wrap">
                            <table class="items-table">
                                <thead data-tut="items-header">
                                    <tr>
                                        <th class="col-check">✓</th><th class="col-item">ITEM</th><th class="col-desc">DESCRIÇÃO</th>
                                        <th class="col-qtd">QTD</th><th class="col-und">UND</th><th class="col-marca">MARCA</th>
                                        <th class="col-modelo">MODELO</th><th class="col-num">ESTIM. UNT</th>
                                        <th class="col-num">CUSTO UNT</th><th class="col-pct">%</th>
                                        <th class="col-num">VENDA UNT</th><th class="col-actions"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr class="row-ganho-item">
                                        <td style="text-align:center;" data-tut="item-checkbox">
                                            <div class="checkbox-wrapper">
                                                <input type="checkbox" class="styled-checkbox" checked>
                                                <label class="checkbox-label-styled"></label>
                                            </div>
                                        </td>
                                        <td><input value="1" disabled></td>
                                        <td><input value="CABO FLEXÍVEL 2,5MM" disabled></td>
                                        <td><input value="100" disabled></td>
                                        <td><input value="M" disabled></td>
                                        <td><input value="SIL" disabled></td>
                                        <td><input value="FLEX" disabled></td>
                                        <td><input value="1,50" disabled></td>
                                        <td><input value="1,20" disabled></td>
                                        <td><input value="149" disabled></td>
                                        <td><input value="1,79" disabled></td>
                                        <td data-tut="item-actions">
                                            <div class="row-actions">
                                                <button type="button" class="row-btn brush" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/></svg></button>
                                                <button type="button" class="row-btn del" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align:center;">
                                            <div class="checkbox-wrapper"><input type="checkbox" class="styled-checkbox"><label class="checkbox-label-styled"></label></div>
                                        </td>
                                        <td><input value="2" disabled></td>
                                        <td><input value="DISJUNTOR BIPOLAR 40A" disabled></td>
                                        <td><input value="20" disabled></td>
                                        <td><input value="UN" disabled></td>
                                        <td><input value="SCHNEIDER" disabled></td>
                                        <td><input value="D40" disabled></td>
                                        <td><input value="45,00" disabled></td>
                                        <td><input value="38,00" disabled></td>
                                        <td><input value="149" disabled></td>
                                        <td><input value="56,62" disabled></td>
                                        <td>
                                            <div class="row-actions">
                                                <button type="button" class="row-btn brush" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/></svg></button>
                                                <button type="button" class="row-btn del" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="totals-bar" data-tut="totals-bar">
                        <div class="totals-item"><span>ESTIMADO</span><strong>R$ 1.050,00</strong></div>
                        <div class="totals-item"><span>CUSTO</span><strong>R$ 880,00</strong></div>
                        <div class="totals-item"><span>VENDA</span><strong>R$ 1.311,20</strong></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═══════════ MODAIS ═══════════ -->

        <div class="modal-overlay" id="tutFormOverlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Nova Licitação</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-nav" data-tut="form-tabs">
                    <button type="button" class="tab-btn active" data-tut-tab="info" data-tut="tab-info">Informações</button>
                    <button type="button" class="tab-btn" data-tut-tab="orgao" data-tut="tab-orgao">Órgão</button>
                    <button type="button" class="tab-btn" data-tut-tab="req" data-tut="tab-req">Requisitos</button>
                    <button type="button" class="tab-btn" data-tut-tab="prazos" data-tut="tab-prazos">Prazos</button>
                </div>

                <div class="tab-content active" data-tut-pane="info" data-tut="tab-content-info">
                    <div class="form-grid">
                        <div class="form-group"><label>Data Registro *</label><input type="date" disabled value="2025-01-15"></div>
                        <div class="form-group"><label>Vendedor</label><select disabled><option>ROBERTO SILVA</option></select></div>
                        <div class="form-group"><label>Data do Pregão</label><input type="date" disabled value="2025-01-20"></div>
                        <div class="form-group"><label>Horário do Pregão</label><input type="time" disabled value="10:00"></div>
                        <div class="form-group"><label>Modalidade</label><select disabled><option>ABERTO</option></select></div>
                        <div class="form-group"><label>Número do Pregão</label><input disabled value="PE 001/2025"></div>
                        <div class="form-group"><label>Status</label><select disabled><option>-</option></select></div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="orgao" data-tut="tab-content-orgao">
                    <div class="form-grid">
                        <div class="form-group"><label>Nome do Órgão</label><input disabled value="PREFEITURA MUNICIPAL DE SERRA"></div>
                        <div class="form-group"><label>UASG</label><input disabled value="123456"></div>
                        <div class="form-group"><label>Cidade</label><input disabled value="SERRA"></div>
                        <div class="form-group"><label>UF</label><select disabled><option>ES</option></select></div>
                        <div class="form-group"><label>Telefone</label><input disabled value="(27) 3209-4291"></div>
                        <div class="form-group"><label>Email</label><input disabled value="compras@serra.es.gov.br"></div>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="req" data-tut="tab-content-req">
                    <p class="helper">Clique nos requisitos aplicáveis.</p>
                    <div class="requirement-grid">
                        <div class="requirement selected">CERTIFICADO IBAMA</div>
                        <div class="requirement">REGISTRO DE PREÇO</div>
                        <div class="requirement selected">INSTALAÇÃO/INSPEÇÃO</div>
                        <div class="requirement">VISITA TÉCNICA/ENSAIO</div>
                        <div class="requirement">ENVIO DE AMOSTRA</div>
                        <div class="requirement">ATESTADO DE CAPACIDADE</div>
                    </div>
                    <div class="form-group" style="margin-top:1.5rem;max-width:340px;">
                        <label>Banco para Pagamento</label>
                        <select disabled><option>BANCO DO BRASIL</option></select>
                    </div>
                </div>

                <div class="tab-content" data-tut-pane="prazos" data-tut="tab-content-prazos">
                    <div class="form-grid">
                        <div class="form-group"><label>Validade da Proposta</label><input disabled value="60 DIAS CORRIDOS"></div>
                        <div class="form-group"><label>Prazo de Entrega</label><input disabled value="30 DIAS CORRIDOS"></div>
                        <div class="form-group"><label>Prazo de Pagamento</label><input disabled value="30 DIAS CORRIDOS"></div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn-secondary" data-tut="btn-prev">Anterior</button>
                    <button type="button" class="btn-secondary" data-tut="btn-next">Próximo</button>
                    <button type="button" class="save" data-tut="btn-save">Salvar</button>
                    <button type="button" class="cancel-close" data-tut="btn-cancel">Cancelar</button>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="tutDeleteOverlay">
            <div class="modal-content ir-modal-confirm">
                <button type="button" class="close-modal ir-close">✕</button>
                <div class="ir-confirm-msg">Deseja excluir o pregão PE 001/2025?</div>
                <div class="ir-confirm-actions">
                    <button type="button" class="ir-btn-green">Sim</button>
                    <button type="button" class="ir-btn-red">Não</button>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="tutViewOverlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Pregão <span>PE 001/2025</span></h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-nav">
                    <button type="button" class="tab-btn active">Informações</button>
                    <button type="button" class="tab-btn">Órgão</button>
                    <button type="button" class="tab-btn">Requisitos</button>
                    <button type="button" class="tab-btn">Prazos</button>
                </div>
                <div class="tab-content active">
                    <p><b>Vendedor:</b> ROBERTO SILVA</p>
                    <p><b>Data de Registro:</b> 15/01/2025</p>
                    <p><b>Data do Pregão:</b> 20/01/2025</p>
                    <p><b>Horário:</b> 10:00</p>
                    <p><b>Modalidade:</b> ABERTO</p>
                    <p><b>Status:</b> <span class="badge-status ganho">GANHO</span></p>
                </div>
                <div class="modal-actions"><button type="button" class="cancel-close">Fechar</button></div>
            </div>
        </div>

        <div class="modal-overlay" id="tutDisputaOverlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Alerta de Disputa</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="card table-card">
                    <table>
                        <thead><tr><th>Data</th><th>Hora</th><th>Pregão</th><th>Vendedor</th><th>Órgão</th></tr></thead>
                        <tbody>
                            <tr><td>24/01/2025</td><td>10:00</td><td><strong>PE 003/2025</strong></td><td>ROBERTO SILVA</td><td>SECRETARIA DE SAÚDE</td></tr>
                            <tr><td>24/01/2025</td><td>14:00</td><td><strong>PE 004/2025</strong></td><td>MARIA SOUZA</td><td>PREFEITURA DE VITÓRIA</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="modal-actions"><button type="button" class="cancel-close">Fechar</button></div>
            </div>
        </div>

        <div class="modal-overlay" id="tutRangeOverlay">
            <div class="modal-content modal-small">
                <div class="modal-header">
                    <h3 class="modal-title">Adicionar Intervalo</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <p class="helper">Informe os itens ou intervalos em ordem crescente. Ex.: <b>1-5, 12, 100-180</b></p>
                <div class="form-group"><input placeholder="Ex: 1-5, 12, 100-180" disabled></div>
                <div class="modal-actions">
                    <button type="button" class="save">Confirmar</button>
                    <button type="button" class="cancel-close">Cancelar</button>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="tutDocOverlay">
            <div class="modal-content modal-small">
                <div class="modal-header">
                    <h3 class="modal-title">Gerar documento</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <p class="helper">Escolha o documento:</p>
                <div class="doc-choices">
                    <button type="button" class="doc-choice">PROPOSTA PDF</button>
                    <button type="button" class="doc-choice">PROPOSTA DOCS</button>
                </div>
                <div class="modal-actions" style="justify-content:center;">
                    <button type="button" class="save">Confirmar</button>
                    <button type="button" class="cancel-close">Cancelar</button>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="tutQuoteOverlay">
            <div class="modal-content modal-small">
                <div class="modal-header">
                    <h3 class="modal-title">Cotação de Preço</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <p class="helper">Modelo de cotação (da tabela principal):</p>
                <div class="quote-options">
                    <button type="button" class="quote-option">DESCRIÇÃO</button>
                    <button type="button" class="quote-option">MODELO</button>
                </div>
                <div class="form-group" style="margin-top:.75rem;">
                    <label>Intervalo de itens</label>
                    <input placeholder="Ex: 1-5, 10, 15-20" disabled>
                </div>
                <div class="modal-actions" style="justify-content:center;">
                    <button type="button" class="save">Confirmar</button>
                    <button type="button" class="cancel-close">Cancelar</button>
                </div>
            </div>
        </div>
    </div>`;
}

const STEPS = [
    // ═══════ 1 ═══════
    { id: '1', target: '[data-tut="btn-nova-licitacao"]', text: 'Cadastre um novo pregão no sistema.', view: 'main' },

    // ═══════ 2–8: Modal do formulário ═══════
    { id: '2', target: '[data-tut="form-tabs"]', text: 'O cadastro é organizado em abas.', view: 'form', activeTab: 'info' },
    { id: '3', target: ['[data-tut="btn-prev"]', '[data-tut="btn-next"]'], text: 'Navegue entre as abas do formulário utilizando os botões.', view: 'form', activeTab: 'info' },
    { id: '4', target: ['[data-tut="btn-save"]', '[data-tut="btn-cancel"]'], text: 'Salve ou descarte as informações preenchidas.', view: 'form', activeTab: 'info' },
    { id: '5', target: ['[data-tut="tab-info"]', '[data-tut="tab-content-info"]'], text: 'Dados principais do pregão.', view: 'form', activeTab: 'info' },
    { id: '6', target: ['[data-tut="tab-orgao"]', '[data-tut="tab-content-orgao"]'], text: 'Informações do órgão comprador.', view: 'form', activeTab: 'orgao' },
    { id: '7', target: ['[data-tut="tab-req"]', '[data-tut="tab-content-req"]'], text: 'Marque os requisitos aplicáveis e defina o banco de pagamento.', view: 'form', activeTab: 'req' },
    { id: '8', target: ['[data-tut="tab-prazos"]', '[data-tut="tab-content-prazos"]'], text: 'Defina validade e prazos da proposta.', view: 'form', activeTab: 'prazos' },

    // ═══════ 9–11: Dashboard e Alerta de Disputa ═══════
    { id: '9',  target: '[data-tut="dashboard-cards"]', text: 'Painel com indicadores referente ao mês.', view: 'main' },
    { id: '10', target: '[data-tut="card-disputa"]', text: 'Apresenta a quantidade de disputas programadas para hoje.', view: 'main' },
    { id: '11', target: '#tutDisputaOverlay .modal-content', text: 'A seleção do card apresenta uma tabela com a relação dos pregões programados.', view: 'disputa' },

    // ═══════ 12–15: Filtros e sincronização ═══════
    { id: '12', target: '[data-tut="search-input"]', text: 'Filtro para buscas mais amplas.', view: 'main' },
    { id: '13', target: ['[data-tut="filter-vendedor"]', '[data-tut="filter-status"]'], text: 'Filtros para buscar informações mais específicas.', view: 'main' },
    { id: '14', target: '[data-tut="month-nav"]', text: 'Navega entre os meses para visualizar registros do período.', view: 'main' },
    { id: '15', target: '[data-tut="sync-btn"]', text: 'Atualize manualmente os dados.', view: 'main' },

    // ═══════ 16–22: Tabela principal e ações ═══════
    { id: '16', target: '[data-tut="table-header"]', text: 'Tabela de registros com as principais informações dos pregões.', view: 'main' },
    { id: '17', target: '[data-tut="checkbox-ganho"]', text: 'Marque o checkbox para indicar que o pregão foi ganho. A linha fica destacada em verde.', view: 'main' },
    { id: '18', target: '[data-tut="edit-btn"]', text: 'Utilizado para abrir o formulário de alteração das informações do pregão registrado.', view: 'main' },
    { id: '19', target: '[data-tut="items-btn"]', text: 'Utilizado para abrir a página de itens do pregão.', view: 'main' },
    { id: '20', target: '[data-tut="delete-btn"]', text: 'Exclua definitivamente o pregão e todos os seus itens.', view: 'main' },
    { id: '21', target: '#tutDeleteOverlay .modal-content', text: 'Confirmação necessária para prevenir exclusões acidentais.', view: 'delete' },
    { id: '22', target: '[data-tut="pagination"]', text: 'Navegação entre as páginas dos pregões registrados.', view: 'main' },

    // ═══════ 23–24: Modal de visualização e entrada nos itens ═══════
    { id: '23', target: '#tutViewOverlay .modal-content', text: 'Ao clicar em uma linha da tabela de registros, o modal de visualização mostra os detalhes do pregão registrado.', view: 'view' },
    { id: '24', target: '[data-tut="items-btn"]', text: 'Selecione para abrir a página de itens deste pregão.', view: 'main' },

    // ═══════ 25–30: Página de itens — filtros e toolbar ═══════
    { id: '25', target: '[data-tut="item-search"]', text: 'Filtro para pesquisar itens mais amplamente.', view: 'items' },
    { id: '26', target: ['[data-tut="filter-marca"]', '[data-tut="filter-itens"]'], text: 'Filtros de busca para itens mais específicos.', view: 'items' },
    { id: '27', target: '[data-tut="pdf-btn"]', text: 'Utilizado para emitir propostas.', view: 'items' },
    { id: '28', target: '#tutDocOverlay .modal-content', text: 'Quando selecionado o ícone apresenta dois formatos de documento para a emissão da proposta.', view: 'doc' },
    { id: '29', target: '[data-tut="sync-items-btn"]', text: 'Sincroniza manualmente os dados da página de itens.', view: 'items' },
    { id: '30', target: '[data-tut="insert-bar"]', text: 'Insere uma Tabela de Itens principal ou um Grupo/Lote.', view: 'items' },

    // ═══════ 31: Adicionar Item ═══════
    { id: '31', target: '[data-tut="add-item-btn"]', text: 'Adicione um item de cada vez na tabela.', view: 'items' },

    // ═══════ 32–36: Outros ícones do grupo + modais ═══════
    { id: '32', target: '[data-tut="add-range-btn"]', text: 'Permite inserir vários itens em sequência numérica de uma só vez.', view: 'items' },
    { id: '33', target: '#tutRangeOverlay .modal-content', text: 'Informe os itens ou intervalos em ordem crescente (ex.: 1-5, 12, 100-180) para adicioná-los à tabela.', view: 'range' },
    { id: '34', target: '[data-tut="quote-btn"]', text: 'Gera automaticamente um texto de solicitação de orçamento dos itens selecionados.', view: 'items' },
    { id: '35', target: '#tutQuoteOverlay .modal-content', text: 'Escolha o formato e o intervalo de itens para gerar a mensagem de cotação.', view: 'quote' },
    { id: '36', target: '[data-tut="del-table-btn"]', text: 'Remove a tabela inteira, com todos os itens nela contidos.', view: 'items' },

    // ═══════ 37–40: Tabela de itens ═══════
    { id: '37', target: '[data-tut="items-header"]', text: 'A tabela de itens contém informações necessárias para o documento da proposta.', view: 'items' },
    { id: '38', target: '[data-tut="item-checkbox"]', text: 'Marque o checkbox para indicar que o item foi ganho. Apenas itens marcados estarão na proposta.', view: 'items' },
    { id: '39', target: '[data-tut="item-actions"]', text: 'Personalize a cor ou exclua a linha da tabela.', view: 'items' },
    { id: '40', target: '[data-tut="totals-bar"]', text: 'Valores totais específicos da tabela de itens.', view: 'items' },

    // ═══════ 41: Voltar ═══════
    { id: '41', target: '[data-tut="back-items"]', text: 'Volte à tela principal.', view: 'items' }
];

let currentStepIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('stage').innerHTML = renderLicitacoesReplica();

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
    const mainContainer = document.getElementById('tutMainContainer');
    const itemsPage = document.getElementById('tutItemsPage');
    const allModals = ['tutFormOverlay','tutViewOverlay','tutDeleteOverlay','tutDisputaOverlay','tutRangeOverlay','tutDocOverlay','tutQuoteOverlay'];

    allModals.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('open');
    });
    if (itemsPage) itemsPage.hidden = true;
    if (mainContainer) mainContainer.style.display = '';

    switch (view) {
        case 'items':
            if (itemsPage) itemsPage.hidden = false;
            if (mainContainer) mainContainer.style.display = 'none';
            break;
        case 'form':
            openModal('tutFormOverlay');
            setFormTab(activeTab || 'info');
            break;
        case 'view':
            openModal('tutViewOverlay');
            break;
        case 'delete':
            openModal('tutDeleteOverlay');
            break;
        case 'disputa':
            openModal('tutDisputaOverlay');
            break;
        case 'range':
        case 'doc':
        case 'quote':
            if (itemsPage) itemsPage.hidden = false;
            if (mainContainer) mainContainer.style.display = 'none';
            openModal('tut' + view.charAt(0).toUpperCase() + view.slice(1) + 'Overlay');
            break;
        case 'main':
        default:
            break;
    }
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
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
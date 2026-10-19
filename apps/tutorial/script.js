/* ================================================================
 * Tutorial · I.R. Comércio
 * ================================================================ */

const MODULE_ICONS = {
    usuarios:         '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    licitacoes:       '<svg viewBox="0 0 24 24"><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>',
    precos:           '<svg viewBox="0 0 24 24"><path d="M11 13H7"/><path d="M19 9h-4"/><path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="15" y="5" width="4" height="12" rx="1"/><rect x="7" y="8" width="4" height="9" rx="1"/></svg>',
    compra:           '<svg viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
    transportadoras:  '<svg viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
    cotacoes:         '<svg viewBox="0 0 24 24"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27 9 5.15"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/><circle cx="18.5" cy="15.5" r="2.5"/><path d="M20.27 17.27 22 19"/></svg>',
    faturamento:      '<svg viewBox="0 0 24 24"><path d="M4 11V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M2 15h10"/><path d="m9 18 3-3-3-3"/></svg>',
    frete:            '<svg viewBox="0 0 24 24"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
    estoque:          '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    receber:          '<svg viewBox="0 0 24 24"><path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/><path d="m16 19 3 3 3-3"/><path d="M18 12h.01"/><path d="M19 16v6"/><path d="M6 12h.01"/><circle cx="12" cy="12" r="2"/></svg>',
    pagar:            '<svg viewBox="0 0 24 24"><path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/><path d="M18 12h.01"/><path d="M19 22v-6"/><path d="m22 19-3-3-3 3"/><path d="M6 12h.01"/><circle cx="12" cy="12" r="2"/></svg>',
    lucro:            '<svg viewBox="0 0 24 24"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
};

const MODULE_INFO = {
    usuarios:        { name: 'Usuários',                desc: 'Cadastro e gestão de usuários do sistema' },
    licitacoes:      { name: 'Licitações',              desc: 'Gestão de licitações e pregões' },
    precos:          { name: 'Tabela de Preços',        desc: 'Cadastro e consulta de preços' },
    compra:          { name: 'Ordens de Compra',        desc: 'Emissão e controle de ordens de compra' },
    transportadoras: { name: 'Transportadoras',         desc: 'Cadastro de transportadoras' },
    cotacoes:        { name: 'Cotações de Frete',       desc: 'Gestão de cotações de frete' },
    faturamento:     { name: 'Pedidos de Faturamento',  desc: 'Emissão de pedidos e faturamento' },
    estoque:         { name: 'Estoque',                 desc: 'Controle de estoque e movimentações' },
    frete:           { name: 'Controle de Frete',       desc: 'Acompanhamento de fretes' },
    receber:         { name: 'Contas a Receber',        desc: 'Gestão de contas a receber' },
    pagar:           { name: 'Contas a Pagar',          desc: 'Gestão de contas a pagar' },
    lucro:           { name: 'Lucro Real',              desc: 'Cálculo de lucro real' },
};

/* Variáveis de Permissão */
let isAdmin = false;
let userApps = [];

/* ═══════════════════════════════════════════════════════════════
   REPLICA HTML — Usuários
   ═══════════════════════════════════════════════════════════════ */
function renderUsuariosReplica() {
    return `
    <div class="replica">
        <div class="container">
            <div class="header">
                <div class="header-left">
                    <h1>Usuários</h1>
                </div>
                <button class="btn-new-order-header" data-tut="btn-novo-usuario">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Novo Usuário
                </button>
            </div>

            <div class="search-bar-wrapper">
                <div class="search-bar" data-tut="search-bar">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input type="text" placeholder="Buscar por nome ou usuário..." disabled>
                    <select class="search-select" data-tut="sector-filter" disabled>
                        <option>Todos os setores</option>
                    </select>
                    <select class="search-select" data-tut="employee-filter" disabled>
                        <option>Todos os Funcionários</option>
                    </select>
                    <button type="button" class="icon-btn" data-tut="sync-btn" disabled>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M23 4v6h-6"/>
                            <path d="M1 20v-6h6"/>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
                            <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="card table-card">
                <div style="overflow-x: auto;">
                    <table>
                        <thead data-tut="table-header">
                            <tr>
                                <th style="width: 60px;">Cód.</th>
                                <th>Nome</th>
                                <th>Usuário</th>
                                <th>Setor</th>
                                <th>Status</th>
                                <th>Criado em</th>
                                <th style="text-align: center;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>01</strong></td>
                                <td><strong>ROBERTO SILVA</strong></td>
                                <td>roberto.silva</td>
                                <td>ADMINISTRADOR</td>
                                <td><span class="badge ativo">Ativo</span></td>
                                <td>01/01/2025</td>
                                <td style="text-align:center;">
                                    <button class="action-btn edit" data-tut="edit-btn">Editar</button>
                                    <button class="action-btn delete" data-tut="delete-btn">Excluir</button>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>02</strong></td>
                                <td><strong>MARIA SANTOS</strong></td>
                                <td>maria.santos</td>
                                <td>VENDAS</td>
                                <td><span class="badge ativo">Ativo</span></td>
                                <td>15/02/2025</td>
                                <td style="text-align:center;">
                                    <button class="action-btn edit">Editar</button>
                                    <button class="action-btn delete">Excluir</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Modal replica -->
        <div class="replica-modal" id="tutModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Novo Usuário</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>

                <div class="tabs-nav" data-tut="modal-tabs">
                    <button type="button" class="tab-btn active" data-tut-tab="info" data-tut="tab-btn-info">Informações</button>
                    <button type="button" class="tab-btn" data-tut-tab="modules" data-tut="tab-btn-modules">Módulos</button>
                    <button type="button" class="tab-btn" data-tut-tab="credentials" data-tut="tab-btn-credentials">Credenciais</button>
                </div>

                <div class="tab-content active" data-tut="tab-content-info" data-tut-pane="info">
                    <div class="form-grid">
                        <div class="form-group full">
                            <label>Nome do funcionário *</label>
                            <input type="text" placeholder="Nome completo" disabled>
                        </div>
                        <div class="form-group">
                            <label>Setor *</label>
                            <select disabled><option>Almoxarifado</option></select>
                        </div>
                        <div class="form-group">
                            <label>E-mail</label>
                            <input type="email" placeholder="email@exemplo.com" disabled>
                        </div>
                        <div class="form-group full">
                            <label>Telefone</label>
                            <input type="tel" placeholder="(00) 00000-0000" disabled>
                        </div>
                    </div>
                </div>

                <div class="tab-content" data-tut="tab-content-modules" data-tut-pane="modules">
                    <p style="margin-bottom:1rem;color:#5B6470;font-size:0.9rem;">Selecione os módulos que este usuário poderá acessar:</p>
                    <div class="modules-preview">
                        <div class="module-card selected">Licitações</div>
                        <div class="module-card">Tabela de Preços</div>
                        <div class="module-card selected">Pedidos de Faturamento</div>
                        <div class="module-card">Estoque</div>
                    </div>
                </div>

                <div class="tab-content" data-tut="tab-content-credentials" data-tut-pane="credentials">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Nome de usuário *</label>
                            <input type="text" placeholder="usuario" disabled>
                        </div>
                        <div class="form-group">
                            <label>Senha</label>
                            <input type="password" placeholder="••••••••" disabled>
                        </div>
                    </div>
                    <div class="form-group full" style="margin-top:1rem;">
                        <label>Status do usuário</label>
                        <div class="status-preview" data-tut="credentials-status">Selecione para desativar</div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="secondary tab-prev" data-tut="btn-prev">Anterior</button>
                    <button type="button" class="secondary tab-next" data-tut="btn-next">Próximo</button>
                    <button type="button" class="save" data-tut="btn-save">Salvar</button>
                    <button type="button" class="cancel-close" data-tut="btn-cancel">Cancelar</button>
                </div>
            </div>
        </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   TUTORIAIS CONFIGURADOS
   ═══════════════════════════════════════════════════════════════ */
const TUTORIALS = {
    usuarios: {
        title: 'Tutorial · Usuários',
        render: renderUsuariosReplica,
        steps: [
            {
                id: '1',
                target: '[data-tut="btn-novo-usuario"]',
                text: 'Este botão permite cadastrar novos usuários no sistema, definindo suas credenciais de acesso, permissões e informações funcionais.',
                modalOpen: false
            },
            {
                id: '2',
                target: '[data-tut="modal-tabs"]',
                text: 'Estas abas permitem navegar entre as diferentes seções do formulário, organizadas para o preenchimento dos dados cadastrais, das credenciais de acesso, das permissões e das demais informações do usuário.',
                modalOpen: true,
                activeTab: 'info'
            },
            {
                id: '3',
                target: ['[data-tut="btn-prev"]', '[data-tut="btn-next"]'],
                text: 'Utilize os botões PRÓXIMO e ANTERIOR para navegar entre as abas do formulário, avançando para a próxima seção ou retornando à anterior.',
                modalOpen: true,
                activeTab: 'info'
            },
            {
                id: '4',
                target: ['[data-tut="btn-save"]', '[data-tut="btn-cancel"]'],
                text: 'Para concluir o cadastro e registrar as informações preenchidas, clique em SALVAR. Caso deseje interromper o processo sem concluir o registro, selecione CANCELAR.',
                modalOpen: true,
                activeTab: 'info'
            },
            {
                id: '5',
                target: ['[data-tut="tab-btn-info"]', '[data-tut="tab-content-info"]'],
                text: 'Nesta aba, você encontrará as informações cadastrais do funcionário, incluindo seus dados de contato e o setor ao qual será vinculado.',
                modalOpen: true,
                activeTab: 'info'
            },
            {
                id: '6',
                target: ['[data-tut="tab-btn-modules"]', '[data-tut="tab-content-modules"]'],
                text: 'Nesta aba, selecione os módulos aos quais o usuário terá acesso após a conclusão do cadastro. Apenas os módulos selecionados estarão disponíveis para o usuário.',
                modalOpen: true,
                activeTab: 'modules'
            },
            {
                id: '7',
                target: ['[data-tut="tab-btn-credentials"]', '[data-tut="tab-content-credentials"]'],
                text: 'Esta aba reúne as informações referentes às credenciais de acesso do usuário. Por motivos de segurança, a senha não é exibida após o cadastro. Caso deseje alterá-la, basta preencher novamente o campo correspondente ao acessar o modo de edição por meio do botão EDITAR.',
                modalOpen: true,
                activeTab: 'credentials'
            },
            {
                id: '8',
                target: ['[data-tut="tab-btn-credentials"]', '[data-tut="credentials-status"]'],
                text: 'Para ativar ou desativar o usuário, utilize a caixa de seleção localizada abaixo dos campos. Por padrão, todo usuário recém-cadastrado é registrado como ativo, não sendo necessário realizar nenhuma ação adicional para habilitar seu acesso.',
                modalOpen: true,
                activeTab: 'credentials'
            },
            {
                id: '9',
                target: '[data-tut="search-bar"]',
                text: 'Para realizar uma pesquisa rápida, selecione o filtro de busca desejado e digite o termo que pretende localizar neste módulo.',
                modalOpen: false
            },
            {
                id: '10',
                target: '[data-tut="sector-filter"]',
                text: 'Selecione o setor desejado para filtrar os registros. A tabela exibirá apenas os usuários vinculados ao setor selecionado.',
                modalOpen: false
            },
            {
                id: '11',
                target: '[data-tut="employee-filter"]',
                text: 'Selecione o funcionário desejado para filtrar os registros. A tabela exibirá apenas o usuário correspondente ao funcionário selecionado.',
                modalOpen: false
            },
            {
                id: '12',
                target: '[data-tut="sync-btn"]',
                text: 'Este ícone permite realizar uma sincronização manual dos dados, auxiliando na atualização das informações caso elas não sejam atualizadas automaticamente pelo sistema.',
                modalOpen: false
            },
            {
                id: '13',
                target: '[data-tut="table-header"]',
                text: 'Este é o cabeçalho da tabela de registros, responsável por organizar em colunas as principais informações cadastradas de cada usuário, facilitando a visualização e a identificação dos registros.',
                modalOpen: false
            },
            {
                id: '14',
                target: '[data-tut="edit-btn"]',
                text: 'Este botão permite editar as informações cadastradas do usuário, possibilitando atualizar dados como nome de usuário, senha, informações pessoais e demais configurações disponíveis no cadastro.',
                modalOpen: false
            },
            {
                id: '15',
                target: '[data-tut="delete-btn"]',
                text: 'Este botão permite excluir definitivamente o usuário do sistema. No entanto, os registros de acesso e as atividades realizadas por ele serão preservados para consultas futuras, garantindo a rastreabilidade das ações executadas, caso seja necessário.',
                modalOpen: false
            }
        ]
    }
};

/* ═══════════════════════════════════════════════════════════════
   ESTADO E ELEMENTOS
   ═══════════════════════════════════════════════════════════════ */
let currentModuleId = null;
let currentStepIndex = 0;
let currentSteps = [];

const $ = id => document.getElementById(id);

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar permissões antes de renderizar
    try {
        const token = window.IR ? IR.getToken() : new URLSearchParams(window.location.search).get('sessionToken');
        const res = await fetch('/api/me', { headers: { 'X-Session-Token': token }});
        if (res.ok) {
            const user = await res.json();
            isAdmin = user.is_admin;
            userApps = user.apps || [];
        }
    } catch(e) { console.error('Erro ao carregar permissões:', e); }

    // 2. Renderizar Dashboard
    renderDashboard();

    // 3. Event Listeners
    $('btnVoltarDashboard').addEventListener('click', voltarDashboard);
    $('btnPrev').addEventListener('click', stepPrev);
    $('btnNext').addEventListener('click', stepNext);

    window.addEventListener('resize', () => {
        if (currentModuleId) {
            requestAnimationFrame(repositionSpotlight);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!currentModuleId) return;
        if (e.key === 'Escape') voltarDashboard();
        else if (e.key === 'ArrowRight') stepNext();
        else if (e.key === 'ArrowLeft') stepPrev();
    });
});

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
function renderDashboard() {
    const grid = $('dashGrid');
    grid.innerHTML = '';
    let hasAnyTutorial = false;

    Object.keys(MODULE_INFO).forEach(modId => {
        // Filtro de permissão
        let allowed = isAdmin;
        if (!allowed && modId === 'usuarios') allowed = false;
        else if (!allowed) allowed = userApps.includes(modId);

        if (!allowed) return;

        const info = MODULE_INFO[modId];
        const isImplemented = !!TUTORIALS[modId];
        
        if (isImplemented) hasAnyTutorial = true;

        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'dash-card';
        
        // Cards não implementados ainda levam a um toast
        if (!isImplemented) {
            card.style.opacity = '0.6';
            card.style.cursor = 'not-allowed';
        }

        card.innerHTML = `
            <div class="dash-card-icon">${MODULE_ICONS[modId] || ''}</div>
            <div class="dash-card-title">${info.name}</div>
            <div class="dash-card-desc">${info.desc}</div>
        `;

        if (isImplemented) {
            card.addEventListener('click', () => openTutorial(modId));
        } else {
            card.addEventListener('click', () => {
                if (window.IR && IR.toast) {
                    IR.toast('Este tutorial será adicionado em breve', 'info');
                }
            });
        }

        grid.appendChild(card);
    });

    if (!hasAnyTutorial && grid.innerHTML === '') {
        grid.innerHTML = '<p style="color: var(--text-secondary); padding: 2rem;">Nenhum tutorial disponível para o seu nível de acesso.</p>';
    }
}

/* ═══════════════════════════════════════════════════════════════
   ABRIR TUTORIAL
   ═══════════════════════════════════════════════════════════════ */
function openTutorial(moduleId) {
    const tut = TUTORIALS[moduleId];
    if (!tut) return;

    currentModuleId = moduleId;
    currentSteps = tut.steps;
    currentStepIndex = 0;

    $('tutorialDashboard').classList.add('hidden');
    $('tutorialStageView').classList.remove('hidden');
    $('tutorialTitle').textContent = tut.title;

    $('stage').innerHTML = tut.render();
    
    // Garante que o scroll do palco volte pro topo
    $('stage').scrollTop = 0;

    setTimeout(() => renderStep(0), 60);
}

function voltarDashboard() {
    currentModuleId = null;
    currentSteps = [];
    currentStepIndex = 0;
    
    // Esconde spotlight e limpa a tela
    const spotlight = $('spotlight');
    spotlight.style.opacity = '0';
    spotlight.style.cssText = '';
    
    $('stage').innerHTML = '';
    
    // Troca as views
    $('tutorialStageView').classList.add('hidden');
    $('tutorialDashboard').classList.remove('hidden');
}

/* ═══════════════════════════════════════════════════════════════
   RENDERIZAR STEP
   ═══════════════════════════════════════════════════════════════ */
function renderStep(index) {
    if (!currentSteps.length) return;
    if (index < 0) index = 0;
    if (index >= currentSteps.length) index = currentSteps.length - 1;
    currentStepIndex = index;

    const step = currentSteps[index];
    const total = currentSteps.length;

    $('tutorialProgress').textContent = `${index + 1} / ${total}`;
    $('narrationStep').textContent = `Passo ${step.id}`;
    $('narrationText').textContent = step.text;

    $('btnPrev').disabled = (index === 0);
    $('btnNext').disabled = false; // Permite clicar em finalizar
    
    if (index === total - 1) {
        $('btnNext').innerHTML = 'Finalizar';
    } else {
        $('btnNext').innerHTML = 'Próximo <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
    }

    const modal = document.querySelector('.replica-modal');
    if (modal) {
        if (step.modalOpen) {
            modal.classList.add('show');
            const tab = step.activeTab || 'info';
            modal.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.tutTab === tab);
            });
            modal.querySelectorAll('.tab-content').forEach(c => {
                c.classList.toggle('active', c.dataset.tutPane === tab);
            });
        } else {
            modal.classList.remove('show');
        }
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(repositionSpotlight);
    });
}

function stepPrev() {
    if (currentStepIndex > 0) renderStep(currentStepIndex - 1);
}

function stepNext() {
    if (currentStepIndex < currentSteps.length - 1) {
        renderStep(currentStepIndex + 1);
    } else {
        voltarDashboard();
    }
}

/* ═══════════════════════════════════════════════════════════════
   SPOTLIGHT (Aceita múltiplos alvos)
   ═══════════════════════════════════════════════════════════════ */
function repositionSpotlight() {
    if (!currentModuleId) return;
    const step = currentSteps[currentStepIndex];
    if (!step) return;

    const spotlight = $('spotlight');
    const targets = Array.isArray(step.target) ? step.target : [step.target];
    
    let minTop = Infinity, minLeft = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
    let hasTarget = false;

    targets.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) {
            const r = el.getBoundingClientRect();
            if (r.width > 0 || r.height > 0) {
                hasTarget = true;
                minTop = Math.min(minTop, r.top);
                minLeft = Math.min(minLeft, r.left);
                maxRight = Math.max(maxRight, r.right);
                maxBottom = Math.max(maxBottom, r.bottom);
            }
        }
    });

    if (!hasTarget) {
        spotlight.style.opacity = '0';
        return;
    }

    // Margem para o spotlight não colar no botão
    let top = minTop - 6;
    let left = minLeft - 6;
    let width = (maxRight - minLeft) + 12;
    let height = (maxBottom - minTop) + 12;

    const narrationHeight = $('narration')?.offsetHeight || 180;
    const usableBottom = window.innerHeight - narrationHeight;
    const usableTop = 56;

    if (top < usableTop) {
        height -= (usableTop - top);
        top = usableTop;
    }
    if (top + height > usableBottom) {
        height = usableBottom - top;
    }

    spotlight.style.opacity = '1';
    spotlight.style.top = top + 'px';
    spotlight.style.left = left + 'px';
    spotlight.style.width = width + 'px';
    spotlight.style.height = height + 'px';
}

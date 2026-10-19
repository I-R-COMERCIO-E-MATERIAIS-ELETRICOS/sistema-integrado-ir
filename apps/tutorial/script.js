/* ================================================================
 * Tutorial · I.R. Comércio
 * Módulo de aprendizado visual e sequencial
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
                            <tr>
                                <td><strong>03</strong></td>
                                <td><strong>LUCAS OLIVEIRA</strong></td>
                                <td>lucas.oliveira</td>
                                <td>ALMOXARIFADO</td>
                                <td><span class="badge ativo">Ativo</span></td>
                                <td>03/03/2025</td>
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
                    <button type="button" class="tab-btn active" data-tut-tab="info">Informações</button>
                    <button type="button" class="tab-btn" data-tut-tab="modules">Módulos</button>
                    <button type="button" class="tab-btn" data-tut-tab="credentials">Credenciais</button>
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
                        <div class="module-card">Contas a Receber</div>
                        <div class="module-card">Contas a Pagar</div>
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
                        <div class="status-preview">Selecione para desativar</div>
                    </div>
                </div>

                <div class="modal-actions" data-tut="modal-actions">
                    <button type="button" class="secondary tab-prev">Anterior</button>
                    <button type="button" class="secondary tab-next">Próximo</button>
                    <button type="button" class="save">Salvar</button>
                    <button type="button" class="cancel-close">Cancelar</button>
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
                text: 'Este botão permite que novos usuários sejam registrados.',
                modalOpen: false
            },
            {
                id: '2',
                target: '[data-tut="modal-tabs"]',
                text: 'Estas são as abas de navegação para os campos necessários ao registro e informações do usuário.',
                modalOpen: true,
                activeTab: 'info'
            },
            {
                id: '2.1',
                target: '[data-tut="modal-actions"]',
                text: "Para navegar entre as abas você pode selecionar os botões 'Próximo' ou 'Anterior'. Para registrar as informações, basta clicar em 'Salvar'. Para cancelar um registro basta selecionar o botão 'Cancelar'.",
                modalOpen: true,
                activeTab: 'info'
            },
            {
                id: '2.2',
                target: '[data-tut="tab-content-info"]',
                text: 'Esta aba contém informações a respeito do funcionário, contato e setor para o qual ele será designado.',
                modalOpen: true,
                activeTab: 'info'
            },
            {
                id: '2.3',
                target: '[data-tut="tab-content-modules"]',
                text: 'Nesta aba você vai selecionar apenas os módulos que o usuário terá acesso após ser registrado.',
                modalOpen: true,
                activeTab: 'modules'
            },
            {
                id: '2.4',
                target: '[data-tut="tab-content-credentials"]',
                text: 'Esta aba contém informações referentes às credenciais do usuário. Por motivos de segurança, após o registro a senha não fica visível, porém, você pode substituir por uma nova a qualquer momento preenchendo novamente o campo de senha através do Botão Editar. Para desativar e ativar um usuário, basta clicar na caixa de seleção abaixo dos campos. O usuário já é registrado ativo, por isso não há necessidade de selecionar o botão de ativação.',
                modalOpen: true,
                activeTab: 'credentials'
            },
            {
                id: '3',
                target: '[data-tut="search-bar"]',
                text: 'Para uma pesquisa rápida, selecione o filtro de busca e escreva o que deseja buscar neste módulo.',
                modalOpen: false
            },
            {
                id: '4',
                target: '[data-tut="sector-filter"]',
                text: 'Selecione o setor desejado e apenas usuários designados a ele serão apresentados na tabela de registros.',
                modalOpen: false
            },
            {
                id: '5',
                target: '[data-tut="employee-filter"]',
                text: 'Selecione o funcionário desejado e apenas ele será apresentado na tabela de registros.',
                modalOpen: false
            },
            {
                id: '6',
                target: '[data-tut="sync-btn"]',
                text: 'Ao selecionar este ícone você pode ter uma sincronização auxiliar, caso os dados não sejam atualizados de forma adequada pelo sistema.',
                modalOpen: false
            },
            {
                id: '7',
                target: '[data-tut="table-header"]',
                text: 'Este é o cabeçalho da tabela de registros, onde ficam dispostas em colunas algumas das informações registradas para o usuário.',
                modalOpen: false
            },
            {
                id: '8',
                target: '[data-tut="edit-btn"]',
                text: 'Este botão servirá para que você consiga modificar informações a respeito do usuário, inclusive alterar senhas, nomes de usuários entre outros.',
                modalOpen: false
            },
            {
                id: '9',
                target: '[data-tut="delete-btn"]',
                text: 'Este botão servirá para que você exclua o usuário de forma definitiva, mas os acessos e atividades realizadas por ele ficarão guardados para consultas posteriores em caso de necessidade.',
                modalOpen: false
            }
        ]
    }
    // Licitações, Preços, Compra, etc. serão adicionados depois
};

/* ═══════════════════════════════════════════════════════════════
   ESTADO E ELEMENTOS
   ═══════════════════════════════════════════════════════════════ */
let currentModuleId = null;
let currentStepIndex = 0;
let currentSteps = [];
let stageScale = 1;

const $ = id => document.getElementById(id);

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();

    $('btnVoltarDashboard').addEventListener('click', voltarDashboard);
    $('btnPrev').addEventListener('click', () => stepPrev());
    $('btnNext').addEventListener('click', () => stepNext());

    window.addEventListener('resize', () => {
        if (currentModuleId) {
            computeStageScale();
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

    Object.keys(MODULE_INFO).forEach(modId => {
        const info = MODULE_INFO[modId];
        const isAvailable = !!TUTORIALS[modId];

        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'dash-card' + (isAvailable ? '' : ' disabled');
        card.innerHTML = `
            <div class="dash-card-icon">${MODULE_ICONS[modId] || ''}</div>
            <div class="dash-card-title">${info.name}</div>
            <div class="dash-card-desc">${info.desc}</div>
            <span class="dash-card-badge ${isAvailable ? 'available' : 'soon'}">
                ${isAvailable ? 'Disponível' : 'Em breve'}
            </span>
        `;

        if (isAvailable) {
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

    // Mostra a view do tutorial
    $('tutorialDashboard').classList.add('hidden');
    $('tutorialStageView').classList.remove('hidden');

    // Título
    $('tutorialTitle').textContent = tut.title;

    // Renderiza replica
    $('stage').innerHTML = tut.render();
    computeStageScale();

    // Renderiza primeiro step após pequeno delay para o DOM estabilizar
    setTimeout(() => renderStep(0), 60);
}

function voltarDashboard() {
    currentModuleId = null;
    currentSteps = [];
    currentStepIndex = 0;
    $('tutorialStageView').classList.add('hidden');
    $('tutorialDashboard').classList.remove('hidden');
    $('stage').innerHTML = '';
    $('spotlight').style.cssText = '';
}

/* ═══════════════════════════════════════════════════════════════
   ESCALA DO STAGE
   Ajusta o stage (1600x1100) para caber no wrapper visível.
   ═══════════════════════════════════════════════════════════════ */
function computeStageScale() {
    const wrapper = $('stageWrapper');
    const stage = $('stage');
    if (!wrapper || !stage) return;

    const STAGE_W = 1600;
    const STAGE_H = 1100;
    const availW = wrapper.clientWidth - 32;   // margem
    const availH = wrapper.clientHeight - 32;

    const scaleW = availW / STAGE_W;
    const scaleH = availH / STAGE_H;
    stageScale = Math.min(1, scaleW, scaleH);

    stage.style.transform = `scale(${stageScale})`;
    stage.style.marginTop = '16px';
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

    // Progresso
    $('tutorialProgress').textContent = `${index + 1} / ${total}`;
    $('narrationStep').textContent = `Passo ${step.id}`;
    $('narrationText').textContent = step.text;

    // Botões prev/next
    $('btnPrev').disabled = (index === 0);
    $('btnNext').disabled = (index === total - 1);
    $('btnNext').innerHTML = (index === total - 1)
        ? 'Finalizar'
        : 'Próximo <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';

    // Modal: mostrar/ocultar e trocar de tab
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

    // Aguarda o DOM se ajustar antes de calcular o spotlight
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
   SPOTLIGHT
   ═══════════════════════════════════════════════════════════════ */
function repositionSpotlight() {
    if (!currentModuleId) return;
    const step = currentSteps[currentStepIndex];
    if (!step) return;

    const spotlight = $('spotlight');
    const target = document.querySelector(step.target);
    if (!target) {
        // Elemento não encontrado — esconde o spotlight (não destaca nada)
        spotlight.style.opacity = '0';
        return;
    }

    const rect = target.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
        spotlight.style.opacity = '0';
        return;
    }

    // Área de toque do narração top (bottom bar) — evita que o spotlight
    // fique por baixo do rodapé
    const narrationHeight = $('narration')?.offsetHeight || 200;
    const usableBottom = window.innerHeight - narrationHeight;
    const usableTop = 56; // topbar

    // Clamp dentro da área visível (não deixa o spotlight invadir o rodapé)
    let top = rect.top - 4;
    let left = rect.left - 4;
    let width = rect.width + 8;
    let height = rect.height + 8;

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

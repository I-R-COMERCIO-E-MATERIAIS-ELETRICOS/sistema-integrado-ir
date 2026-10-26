function renderUsuariosReplica() {
    return `
    <div class="replica">
        <div class="container">
            <div class="header">
                <div class="header-left"><h1>Usuários</h1></div>
                <button class="btn-new-order-header" data-tut="btn-novo-usuario">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Novo Usuário
                </button>
            </div>

            <div class="search-bar-wrapper">
                <div class="search-bar">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                    <input type="text" placeholder="Buscar por nome ou usuário..." disabled data-tut="search-input">
                    <select class="search-select" data-tut="sector-filter" disabled><option>Todos os setores</option></select>
                    <select class="search-select" data-tut="employee-filter" disabled><option>Todos os Funcionários</option></select>
                    <button type="button" class="icon-btn" data-tut="sync-btn" disabled>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/></svg>
                    </button>
                </div>
            </div>

            <div class="card table-card">
                <div style="overflow-x: auto;">
                    <table>
                        <thead data-tut="table-header">
                            <tr><th style="width: 60px;">Cód.</th><th>Nome</th><th>Usuário</th><th>Setor</th><th>Status</th><th>Criado em</th><th style="text-align: center;">Ações</th></tr>
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
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="replica-modal" id="tutModal">
            <div class="modal-content">
                <div class="modal-header"><h3 class="modal-title">Novo Usuário</h3><button type="button" class="close-modal">✕</button></div>

                <div class="tabs-nav" data-tut="modal-tabs">
                    <button type="button" class="tab-btn active" data-tut-tab="info" data-tut="tab-btn-info">Informações</button>
                    <button type="button" class="tab-btn" data-tut-tab="modules" data-tut="tab-btn-modules">Módulos</button>
                    <button type="button" class="tab-btn" data-tut-tab="credentials" data-tut="tab-btn-credentials">Credenciais</button>
                </div>

                <div class="tab-content active" data-tut="tab-content-info" data-tut-pane="info">
                    <div class="form-grid">
                        <div class="form-group full"><label>Nome do funcionário *</label><input type="text" placeholder="Nome completo" disabled></div>
                        <div class="form-group"><label>Setor *</label><select disabled><option>Almoxarifado</option></select></div>
                        <div class="form-group"><label>E-mail</label><input type="email" placeholder="email@exemplo.com" disabled></div>
                        <div class="form-group full"><label>Telefone</label><input type="tel" placeholder="(00) 00000-0000" disabled></div>
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
                        <div class="form-group"><label>Nome de usuário *</label><input type="text" placeholder="usuario" disabled></div>
                        <div class="form-group"><label>Senha</label><input type="password" placeholder="••••••••" disabled></div>
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

        <div class="replica-modal" id="deleteModal">
            <div class="modal-content modal-confirm">
                <button type="button" class="close-modal">✕</button>
                <p class="confirm-msg">Tem certeza que deseja excluir este usuário?</p>
                <div class="confirm-actions">
                    <button type="button" class="save">Sim</button>
                    <button type="button" class="cancel-close">Não</button>
                </div>
            </div>
        </div>
    </div>`;
}

const STEPS = [
    { id: '1', target: '[data-tut="btn-novo-usuario"]', text: 'Cadastra um novo usuário no sistema.', modalOpen: false },

    // Modal Formulário
    { id: '2', target: '[data-tut="modal-tabs"]', text: 'O cadastro é dividido em 3 abas: Informações, Módulos e Credenciais.', modalOpen: true, activeTab: 'info' },
    { id: '3', target: ['[data-tut="btn-prev"]', '[data-tut="btn-next"]'], text: 'Navegue entre as abas com Anterior e Próximo.', modalOpen: true, activeTab: 'info' },
    { id: '4', target: ['[data-tut="btn-save"]', '[data-tut="btn-cancel"]'], text: 'Botões para salvar ou descartar o cadastro.', modalOpen: true, activeTab: 'info' },
    { id: '5', target: ['[data-tut="tab-btn-info"]', '[data-tut="tab-content-info"]'], text: 'Informações - Contém os dados cadastrais do usuário e define seu nível de acesso ao sistema conforme o perfil atribuído.', modalOpen: true, activeTab: 'info' },
    { id: '6', target: ['[data-tut="tab-btn-modules"]', '[data-tut="tab-content-modules"]'], text: 'Módulos - Permite definir os módulos disponíveis para cada usuário, exceto Administradores, que possuem acesso total ao sistema.', modalOpen: true, activeTab: 'modules' },
    { id: '7', target: ['[data-tut="tab-btn-credentials"]', '[data-tut="tab-content-credentials"]'], text: 'Credenciais - Permite configurar os dados de acesso do usuário. Na edição, deixe a senha em branco para manter a atual.', modalOpen: true, activeTab: 'credentials' },
    { id: '8', target: '[data-tut="credentials-status"]', text: 'Este botão permite ativar ou desativar o acesso do usuário ao sistema.', modalOpen: true, activeTab: 'credentials' },

    // Tela Principal
    { id: '9',  target: '[data-tut="search-input"]',    text: 'Filtro para refinar os resultados e localizar usuários rapidamente.', modalOpen: false },
    { id: '10', target: '[data-tut="sector-filter"]',   text: 'Filtro para exibir usuários conforme o setor ao qual estão vinculados.', modalOpen: false },
    { id: '11', target: '[data-tut="employee-filter"]', text: 'Filtro para exibir usuários conforme o nome cadastrado.', modalOpen: false },
    { id: '12', target: '[data-tut="sync-btn"]',        text: 'Atualiza manualmente os dados de registros.', modalOpen: false },
    { id: '13', target: '[data-tut="table-header"]',    text: 'A tabela de registros permite visualizar as principais informações dos cadastros.', modalOpen: false },
    { id: '14', target: '[data-tut="edit-btn"]',        text: 'Permite editar as informações cadastradas. O nome de usuário não pode ser alterado.', modalOpen: false },
    { id: '15', target: '[data-tut="delete-btn"]',      text: 'Exclui definitivamente todas as informações de registro do usuário. Todas as atividades do usuário no sistema permanecem.', modalOpen: false },
    { id: '16', target: '.replica-modal#deleteModal .modal-content', text: 'Confirma ou cancela exclusão para determinado registro.', modalOpen: true, activeModal: 'deleteModal' }
];

let currentStepIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('stage').innerHTML = renderUsuariosReplica();

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

    const formModal = document.getElementById('tutModal');
    const deleteModal = document.getElementById('deleteModal');

    if (formModal) formModal.classList.remove('show');
    if (deleteModal) deleteModal.classList.remove('show');

    if (step.modalOpen) {
        if (step.activeModal === 'deleteModal') {
            if (deleteModal) deleteModal.classList.add('show');
        } else if (formModal) {
            formModal.classList.add('show');
            const tab = step.activeTab || 'info';
            formModal.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tutTab === tab));
            formModal.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.dataset.tutPane === tab));
        }
    }

    setTimeout(repositionSpotlight, 50);
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
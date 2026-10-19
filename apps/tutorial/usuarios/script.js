/* Renderiza o "clone" da interface de Usuários */
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
                <div class="search-bar" data-tut="search-bar">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                    <input type="text" placeholder="Buscar por nome ou usuário..." disabled>
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
                                <td><strong>01</strong></td><td><strong>ROBERTO SILVA</strong></td><td>roberto.silva</td><td>ADMINISTRADOR</td>
                                <td><span class="badge ativo">Ativo</span></td><td>01/01/2025</td>
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
    </div>`;
}

const STEPS = [
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
        text: 'Esta aba reúne as informações referentes às credenciais de acesso do usuário. Por motivos de segurança, a senha não é exibida após o cadastro. Caso deseje alterá-la, basta preencher novamente o campo correspondente ao acessar o modo de edição por meio do botão EDITAR. Para ativar ou desativar o usuário, utilize a caixa de seleção localizada abaixo dos campos. Por padrão, todo usuário recém-cadastrado é registrado como ativo, não sendo necessário realizar nenhuma ação adicional para habilitar seu acesso.', 
        modalOpen: true, 
        activeTab: 'credentials' 
    },
    { 
        id: '8', 
        target: '[data-tut="search-bar"]', 
        text: 'Para realizar uma pesquisa rápida, selecione o filtro de busca desejado e digite o termo que pretende localizar neste módulo.', 
        modalOpen: false 
    },
    { 
        id: '9', 
        target: '[data-tut="sector-filter"]', 
        text: 'Selecione o setor desejado para filtrar os registros. A tabela exibirá apenas os usuários vinculados ao setor selecionado.', 
        modalOpen: false 
    },
    { 
        id: '10', 
        target: '[data-tut="employee-filter"]', 
        text: 'Selecione o funcionário desejado para filtrar os registros. A tabela exibirá apenas o usuário correspondente ao funcionário selecionado.', 
        modalOpen: false 
    },
    { 
        id: '11', 
        target: '[data-tut="sync-btn"]', 
        text: 'Este ícone permite realizar uma sincronização manual dos dados, auxiliando na atualização das informações caso elas não sejam atualizadas automaticamente pelo sistema.', 
        modalOpen: false 
    },
    { 
        id: '12', 
        target: '[data-tut="table-header"]', 
        text: 'Este é o cabeçalho da tabela de registros, responsável por organizar em colunas as principais informações cadastradas de cada usuário, facilitando a visualização e a identificação dos registros.', 
        modalOpen: false 
    },
    { 
        id: '13', 
        target: '[data-tut="edit-btn"]', 
        text: 'Este botão permite editar as informações cadastradas do usuário, possibilitando atualizar dados como nome de usuário, senha, informações pessoais e demais configurações disponíveis no cadastro.', 
        modalOpen: false 
    },
    { 
        id: '14', 
        target: '[data-tut="delete-btn"]', 
        text: 'Este botão permite excluir definitivamente o usuário do sistema. No entanto, os registros de acesso e as atividades realizadas por ele serão preservados para consultas futuras, garantindo a rastreabilidade das ações executadas, caso seja necessário.', 
        modalOpen: false 
    }
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

    // Inicia no passo 0
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

    const modal = document.querySelector('.replica-modal');
    if (modal) {
        if (step.modalOpen) {
            modal.classList.add('show');
            const tab = step.activeTab || 'info';
            modal.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tutTab === tab));
            modal.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.dataset.tutPane === tab));
        } else {
            modal.classList.remove('show');
        }
    }

    requestAnimationFrame(() => requestAnimationFrame(repositionSpotlight));
}

function stepPrev() {
    if (currentStepIndex > 0) renderStep(currentStepIndex - 1);
}

function stepNext() {
    if (currentStepIndex < STEPS.length - 1) {
        renderStep(currentStepIndex + 1);
    } else {
        window.location.href = '/tutorial/';
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

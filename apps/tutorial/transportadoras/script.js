function renderTransportadorasReplica() {
    return `
    <div class="replica">
        <div class="container">
            <div class="header">
                <div class="header-left"><h1>Transportadoras</h1></div>
                <button type="button" class="btn-new-order-header" data-tut="btn-new">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Nova Transportadora
                </button>
            </div>

            <div class="search-bar-wrapper">
                <div class="search-bar" data-tut="search-bar">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                    <input type="text" placeholder="Buscar por nome, representante, e-mail, região ou estado..." disabled>
                </div>
            </div>

            <div class="card table-card">
                <div style="overflow-x: auto;">
                    <table>
                        <thead data-tut="table-header">
                            <tr>
                                <th>Nome</th><th>Representante</th><th>Telefone</th><th>Celular</th><th>E-mail</th><th style="text-align: center;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>TRANSPORTES RÁPIDO LTDA</strong></td>
                                <td>CARLOS SILVA</td>
                                <td>(27) 3333-1111</td>
                                <td>(27) 99999-2222</td>
                                <td>CONTATO@RAPIDO.COM</td>
                                <td class="actions-cell" data-tut="table-actions">
                                    <div class="actions">
                                        <button type="button" class="action-btn edit" data-tut="btn-edit">Editar</button>
                                        <button type="button" class="action-btn delete" data-tut="btn-delete">Excluir</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>LOG BRASIL</strong></td>
                                <td>MARIA SOUZA</td>
                                <td>(11) 4444-5555</td>
                                <td>(11) 98888-7777</td>
                                <td>VENDAS@LOGBRASIL.COM</td>
                                <td class="actions-cell">
                                    <div class="actions">
                                        <button type="button" class="action-btn edit">Editar</button>
                                        <button type="button" class="action-btn delete">Excluir</button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="formOverlay">
            <div class="modal-content" data-tut="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Nova Transportadora</h3>
                    <button type="button" class="close-modal">✕</button>
                </div>
                <div class="tabs-nav" data-tut="modal-tabs">
                    <button type="button" class="tab-btn active" data-tut-tab="geral" data-tut="tab-btn-geral">Geral</button>
                    <button type="button" class="tab-btn" data-tut-tab="atendimento" data-tut="tab-btn-atendimento">Atendimento</button>
                </div>
                
                <div class="tab-content active" data-tut="tab-content-geral" data-tut-pane="geral">
                    <div class="form-grid">
                        <div class="form-group"><label>Nome *</label><input type="text" placeholder="NOME DA TRANSPORTADORA" disabled></div>
                        <div class="form-group"><label>Representante</label><input type="text" placeholder="Nome do representante" disabled></div>
                        <div class="form-group"><label>E-mail *</label><input type="email" placeholder="email@transportadora.com" disabled></div>
                        <div class="form-group"><label>Telefones</label><input type="text" placeholder="(00) 0000-0000" disabled></div>
                        <div class="form-group"><label>Celulares</label><input type="text" placeholder="(00) 00000-0000" disabled></div>
                    </div>
                </div>

                <div class="tab-content" data-tut="tab-content-atendimento" data-tut-pane="atendimento">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Regiões (selecione as que atende)</label>
                            <div class="chips-container" data-tut="chips-regioes">
                                <button type="button" class="chip-selector selected">SUDESTE</button>
                                <button type="button" class="chip-selector">SUL</button>
                                <button type="button" class="chip-selector">NORDESTE</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Estados (selecione os que atende)</label>
                            <div class="chips-container" data-tut="chips-estados">
                                <button type="button" class="chip-selector selected">ES</button>
                                <button type="button" class="chip-selector selected">RJ</button>
                                <button type="button" class="chip-selector">SP</button>
                                <button type="button" class="chip-selector">MG</button>
                            </div>
                        </div>
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

        <div class="modal-overlay" id="deleteOverlay">
            <div class="modal-content ir-modal-confirm" data-tut="delete-modal-content">
                <button type="button" class="close-modal ir-close">✕</button>
                <div class="ir-confirm-msg">Tem certeza que deseja excluir esta transportadora?</div>
                <div class="ir-confirm-actions">
                    <button type="button" class="ir-btn-green">Sim</button>
                    <button type="button" class="ir-btn-red">Não</button>
                </div>
            </div>
        </div>
    </div>`;
}

const STEPS = [
    { id: '1', target: '[data-tut="btn-new"]', text: 'Adicione uma nova transportadora', modalOpen: false },
    
    // Modal Formulário
    { id: '2', target: '[data-tut="modal-tabs"]', text: 'O formulário de cadastro é dividido em abas para facilitar o preenchimento.', modalOpen: true, activeTab: 'geral' },
    { id: '3', target: ['[data-tut="btn-prev"]', '[data-tut="btn-next"]'], text: 'Navegue entre as abas utilizando os botões.', modalOpen: true, activeTab: 'geral' },
    { id: '4', target: ['[data-tut="btn-save"]', '[data-tut="btn-cancel"]'], text: 'Salve ou descarte as informações preenchidas.', modalOpen: true, activeTab: 'geral' },
    { id: '5', target: ['[data-tut="tab-btn-geral"]', '[data-tut="tab-content-geral"]'], text: 'Insira as informações de contato da transportadora.', modalOpen: true, activeTab: 'geral' },
    { id: '6', target: ['[data-tut="tab-btn-atendimento"]', '[data-tut="tab-content-atendimento"]'], text: 'Selecione as Regiões e os Estados onde esta transportadora opera.', modalOpen: true, activeTab: 'atendimento' },
    
    // Volta para tela principal
    { id: '7', target: '[data-tut="search-bar"]', text: 'Filtro para buscas mais amplas.', modalOpen: false },
    { id: '8', target: '[data-tut="table-header"]', text: 'Tabela com as principais informações das transportadoras cadastradas.', modalOpen: false },
    { id: '9', target: '[data-tut="btn-edit"]', text: 'Utilizado para abrir o formulário de alteração.', modalOpen: false },
    
    // Modal Exclusão
    { id: '10', target: '[data-tut="btn-delete"]', text: 'Exclua definitivamente o preço do registro.', modalOpen: false },
    { id: '11', target: '[data-tut="delete-modal-content"]', text: 'Confirmação necessária para prevenir exclusões acidentais.', modalOpen: true, activeModal: 'deleteOverlay' }
];

let currentStepIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('stage').innerHTML = renderTransportadorasReplica();
    
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

    const formModal = document.getElementById('formOverlay');
    const deleteModal = document.getElementById('deleteOverlay');
    
    // Fecha todos os modais primeiro
    if (formModal) formModal.classList.remove('open');
    if (deleteModal) deleteModal.classList.remove('open');

    // Abre o modal correto, se houver
    if (step.modalOpen) {
        if (step.activeModal === 'deleteOverlay') {
            if (deleteModal) deleteModal.classList.add('open');
        } else if (formModal) {
            formModal.classList.add('open');
            const tab = step.activeTab || 'geral';
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

    if (!step.target) {
        spotlight.style.opacity = '0';
        return;
    }

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
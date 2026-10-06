// ============================================================
// Tutorial Interativo · I.R. Comércio (desktop)
// ============================================================

const API_URL = window.location.origin + '/api/tutorial';

let accessToken = null;
let userInfo = null;
let availableModules = [];

let currentModuleId = null;
let currentStep = 0;
let steps = [];

function resolveToken() {
    const p = new URLSearchParams(window.location.search);
    const fromUrl = p.get('access_token');
    if (fromUrl) {
        sessionStorage.setItem('irToken', fromUrl);
        window.history.replaceState({}, '', window.location.pathname);
        return fromUrl;
    }
    return sessionStorage.getItem('irToken');
}

function getHeaders() {
    return {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    };
}

function showDenied(msg) {
    document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem;">
            <h1 style="font-size:1.75rem;margin-bottom:1rem;">${msg || 'ACESSO NEGADO'}</h1>
            <p style="color:#5B6470;margin-bottom:2rem;">Não foi possível carregar o tutorial.</p>
            <a href="/portal" style="background:#FF521D;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;">Voltar ao Portal</a>
        </div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { showDenied('SESSÃO EXPIRADA'); return; }

    try {
        const res = await fetch(`${API_URL}/modules`, { headers: getHeaders() });
        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (!res.ok) throw new Error('Erro ' + res.status);

        const data = await res.json();
        availableModules = (data.modules || []).filter(m => TUTORIAIS[m.id]);
        renderHome();
    } catch (err) {
        console.error(err);
        showDenied('ERRO');
    }
});

function renderHome() {
    const grid = document.getElementById('modulesGrid');
    grid.innerHTML = '';

    if (!availableModules.length) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#9CA3AF;">Nenhum tutorial disponível para o seu perfil.</p>';
        return;
    }

    availableModules.forEach(m => {
        const card = document.createElement('button');
        card.className = 'tut-module-card';

        // Ícone
        const iconWrap = document.createElement('div');
        iconWrap.className = 'tut-card-icon';
        iconWrap.innerHTML = ICONS[m.id] || ICONS.default;

        // Nome
        const strong = document.createElement('strong');
        strong.textContent = m.name;

        // Descrição
        const span = document.createElement('span');
        span.textContent = 'Aprenda a usar este módulo com dados fictícios.';

        card.appendChild(iconWrap);
        card.appendChild(strong);
        card.appendChild(span);

        card.addEventListener('click', () => iniciarModulo(m.id, m.name));
        grid.appendChild(card);
    });
}

function iniciarModulo(id, name) {
    currentModuleId = id;
    currentStep = 0;
    steps = TUTORIAIS[id] || [];

    document.getElementById('tutHome').style.display = 'none';
    document.getElementById('tutStage').style.display = 'flex';
    document.getElementById('tutCurrentModule').textContent = name;

    renderFakeModule(id);
    renderChat();
    aplicarHighlight();
}

window.voltarHome = function () {
    document.getElementById('tutStage').style.display = 'none';
    document.getElementById('tutHome').style.display = 'block';
    document.getElementById('tutModuleArea').innerHTML = '';
    currentModuleId = null;
    currentStep = 0;
    steps = [];
};

function renderChat() {
    const body = document.getElementById('tutChatBody');
    body.innerHTML = '';
    document.getElementById('tutStepCounter').textContent = `Passo ${currentStep + 1} de ${steps.length}`;
    document.getElementById('tutPrevBtn').disabled = currentStep === 0;
    document.getElementById('tutNextBtn').textContent = (currentStep === steps.length - 1) ? 'Concluir' : 'Próximo';
}

function adicionarMensagem(texto, tipo = 'tut') {
    const body = document.getElementById('tutChatBody');
    const el = document.createElement('div');
    el.className = `tut-msg ${tipo}`;
    el.textContent = texto;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
}

window.proximoPasso = function () {
    if (currentStep >= steps.length - 1) {
        finalizarTutorial();
        return;
    }
    currentStep++;
    renderChat();
    aplicarHighlight();
};

window.passoAnterior = function () {
    if (currentStep === 0) return;
    currentStep--;
    renderChat();
    aplicarHighlight();
};

function finalizarTutorial() {
    const body = document.getElementById('tutChatBody');
    const el = document.createElement('div');
    el.className = 'tut-msg success';
    el.textContent = '✅ Tutorial concluído! Você pode explorar o módulo livremente ou voltar ao início para escolher outro.';
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;

    document.getElementById('tutNextBtn').disabled = true;
    removerHighlight();
}

window.fecharChat = function () {
    if (confirm('Deseja sair do tutorial?')) voltarHome();
};

function aplicarHighlight() {
    removerHighlight();

    const passo = steps[currentStep];
    if (!passo) return;

    const body = document.getElementById('tutChatBody');
    body.innerHTML = '';
    adicionarMensagem(passo.mensagem);

    if (passo.selector) {
        const el = document.querySelector(passo.selector);
        if (el) {
            el.classList.add('tut-highlight');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (passo.onEnter) passo.onEnter();
        }
    }
}

function removerHighlight() {
    document.querySelectorAll('.tut-highlight').forEach(el => el.classList.remove('tut-highlight'));
}

function renderFakeModule(id) {
    const area = document.getElementById('tutModuleArea');
    if (RENDERIZADORES[id]) {
        area.innerHTML = RENDERIZADORES[id]();
    } else {
        area.innerHTML = '<div class="tut-fake-container"><p style="text-align:center;color:#9CA3AF;">Tutorial deste módulo ainda não disponível.</p></div>';
    }
}

// ─── ÍCONES ───────────────────────────────────────────────
const ICONS = {
    default: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    usuarios: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    licitacoes: '<svg viewBox="0 0 24 24"><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>',
    precos: '<svg viewBox="0 0 24 24"><path d="M11 13H7"/><path d="M19 9h-4"/><path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="15" y="5" width="4" height="12" rx="1"/><rect x="7" y="8" width="4" height="9" rx="1"/></svg>',
    compra: '<svg viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
    transportadoras: '<svg viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
    cotacoes: '<svg viewBox="0 0 24 24"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27 9 5.15"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/><circle cx="18.5" cy="15.5" r="2.5"/><path d="M20.27 17.27 22 19"/></svg>',
    faturamento: '<svg viewBox="0 0 24 24"><path d="M4 11V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M2 15h10"/><path d="m9 18 3-3-3-3"/></svg>',
    frete: '<svg viewBox="0 0 24 24"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
    receber: '<svg viewBox="0 0 24 24"><path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/><path d="m16 19 3 3 3-3"/><path d="M18 12h.01"/><path d="M19 16v6"/><path d="M6 12h.01"/><circle cx="12" cy="12" r="2"/></svg>',
    pagar: '<svg viewBox="0 0 24 24"><path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/><path d="M18 12h.01"/><path d="M19 22v-6"/><path d="m22 19-3-3-3 3"/><path d="M6 12h.01"/><circle cx="12" cy="12" r="2"/></svg>',
    lucro: '<svg viewBox="0 0 24 24"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>'
};

const RENDERIZADORES = {
    usuarios: () => `
        <div class="tut-fake-container">
            <div class="tut-fake-header">
                <h2>Usuários</h2>
                <button class="tut-fake-btn" id="fakeNovoUsuario">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Novo Usuário
                </button>
            </div>
            <div class="tut-fake-table-card">
                <table class="tut-fake-table">
                    <thead>
                        <tr>
                            <th style="width:60px;">Cód.</th>
                            <th>Nome</th>
                            <th>Usuário</th>
                            <th>Setor</th>
                            <th>Status</th>
                            <th style="text-align:center;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>1</strong></td>
                            <td><strong>João Silva</strong></td>
                            <td>joao.silva</td>
                            <td>Vendas</td>
                            <td><span class="tut-fake-badge ativo">Ativo</span></td>
                            <td style="text-align:center;">
                                <button class="tut-fake-action edit">Editar</button>
                                <button class="tut-fake-action delete">Excluir</button>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>2</strong></td>
                            <td><strong>Maria Souza</strong></td>
                            <td>maria.souza</td>
                            <td>Financeiro</td>
                            <td><span class="tut-fake-badge ativo">Ativo</span></td>
                            <td style="text-align:center;">
                                <button class="tut-fake-action edit">Editar</button>
                                <button class="tut-fake-action delete">Excluir</button>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>3</strong></td>
                            <td><strong>Pedro Alves</strong></td>
                            <td>pedro.alves</td>
                            <td>Almoxarifado</td>
                            <td><span class="tut-fake-badge inativo">Inativo</span></td>
                            <td style="text-align:center;">
                                <button class="tut-fake-action edit">Editar</button>
                                <button class="tut-fake-action delete">Excluir</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `,
    licitacoes: () => `
        <div class="tut-fake-container">
            <div class="tut-fake-header">
                <h2>Licitações</h2>
                <button class="tut-fake-btn" id="fakeNovaLicitacao">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Nova Licitação
                </button>
            </div>
            <div class="tut-fake-table-card">
                <table class="tut-fake-table">
                    <thead>
                        <tr>
                            <th style="width:60px;">Cód.</th>
                            <th>Título</th>
                            <th>Status</th>
                            <th>Criado em</th>
                            <th style="text-align:center;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>1</strong></td>
                            <td>Pregão 001/2026 - Materiais elétricos</td>
                            <td>Em análise</td>
                            <td>28/09/2026</td>
                            <td style="text-align:center;">
                                <button class="tut-fake-action edit">Editar</button>
                                <button class="tut-fake-action delete">Excluir</button>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>2</strong></td>
                            <td>Tomada de preços 002/2026 - Cabeamento</td>
                            <td>Aberta</td>
                            <td>27/09/2026</td>
                            <td style="text-align:center;">
                                <button class="tut-fake-action edit">Editar</button>
                                <button class="tut-fake-action delete">Excluir</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `
};

const TUTORIAIS = {
    usuarios: [
        { selector: '.tut-fake-header h2', mensagem: 'Bem-vindo ao módulo de Usuários. Aqui você gerencia quem pode acessar o sistema.' },
        { selector: '#fakeNovoUsuario', mensagem: 'Este é o botão "Novo Usuário". Clique nele quando quiser cadastrar um novo funcionário.' },
        { selector: '.tut-fake-table', mensagem: 'Esta é a lista de usuários. Cada linha mostra: código, nome, usuário de login, setor e status.' },
        { selector: '.tut-fake-action.edit', mensagem: 'O botão "Editar" abre o cadastro para alterar dados, trocar senha, mudar setor ou desativar o usuário.' },
        { selector: '.tut-fake-action.delete', mensagem: 'O botão "Excluir" remove o usuário. Cuidado: é uma ação permanente.' },
        { selector: 'tbody tr:first-child .tut-fake-badge', mensagem: 'O status indica se o usuário pode fazer login. Verde = ativo. Vermelho = inativo.' },
        { selector: null, mensagem: 'Você aprendeu o básico do módulo de Usuários. Explore os botões livremente para praticar!' }
    ],
    licitacoes: [
        { selector: '.tut-fake-header h2', mensagem: 'Bem-vindo ao módulo de Licitações. Aqui você acompanha os processos licitatórios da empresa.' },
        { selector: '#fakeNovaLicitacao', mensagem: 'Este é o botão "Nova Licitação". Clique nele para cadastrar um novo processo.' },
        { selector: '.tut-fake-table', mensagem: 'Esta é a lista de licitações. Cada linha mostra o código, título, status e data de criação.' },
        { selector: '.tut-fake-action.edit', mensagem: 'O botão "Editar" abre o processo para atualizar título, descrição ou status.' },
        { selector: '.tut-fake-action.delete', mensagem: 'O botão "Excluir" remove o processo do sistema.' },
        { selector: null, mensagem: 'Você aprendeu o básico do módulo de Licitações. Explore livremente para praticar!' }
    ]
};// ============================================================
// Tutorial Interativo · I.R. Comércio (desktop)
// ============================================================

const API_URL = window.location.origin + '/api/tutorial';

let accessToken = null;
let userInfo = null;
let availableModules = [];

let currentModuleId = null;
let currentStep = 0;
let steps = [];

function resolveToken() {
    const p = new URLSearchParams(window.location.search);
    const fromUrl = p.get('access_token');
    if (fromUrl) {
        sessionStorage.setItem('irToken', fromUrl);
        window.history.replaceState({}, '', window.location.pathname);
        return fromUrl;
    }
    return sessionStorage.getItem('irToken');
}

function getHeaders() {
    return {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    };
}

function showDenied(msg) {
    document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem;">
            <h1 style="font-size:1.75rem;margin-bottom:1rem;">${msg || 'ACESSO NEGADO'}</h1>
            <p style="color:#5B6470;margin-bottom:2rem;">Não foi possível carregar o tutorial.</p>
            <a href="/portal" style="background:#FF521D;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;">Voltar ao Portal</a>
        </div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { showDenied('SESSÃO EXPIRADA'); return; }

    try {
        const res = await fetch(`${API_URL}/modules`, { headers: getHeaders() });
        if (res.status === 401 || res.status === 403) { showDenied('SEM ACESSO'); return; }
        if (!res.ok) throw new Error('Erro ' + res.status);

        const data = await res.json();
        availableModules = (data.modules || []).filter(m => TUTORIAIS[m.id]);
        renderHome();
    } catch (err) {
        console.error(err);
        showDenied('ERRO');
    }
});

function renderHome() {
    const grid = document.getElementById('modulesGrid');
    grid.innerHTML = '';

    if (!availableModules.length) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#9CA3AF;">Nenhum tutorial disponível para o seu perfil.</p>';
        return;
    }

    availableModules.forEach(m => {
        const card = document.createElement('button');
        card.className = 'tut-module-card';

        // Ícone
        const iconWrap = document.createElement('div');
        iconWrap.className = 'tut-card-icon';
        iconWrap.innerHTML = ICONS[m.id] || ICONS.default;

        // Nome
        const strong = document.createElement('strong');
        strong.textContent = m.name;

        // Descrição
        const span = document.createElement('span');
        span.textContent = 'Aprenda a usar este módulo com dados fictícios.';

        card.appendChild(iconWrap);
        card.appendChild(strong);
        card.appendChild(span);

        card.addEventListener('click', () => iniciarModulo(m.id, m.name));
        grid.appendChild(card);
    });
}

function iniciarModulo(id, name) {
    currentModuleId = id;
    currentStep = 0;
    steps = TUTORIAIS[id] || [];

    document.getElementById('tutHome').style.display = 'none';
    document.getElementById('tutStage').style.display = 'flex';
    document.getElementById('tutCurrentModule').textContent = name;

    renderFakeModule(id);
    renderChat();
    aplicarHighlight();
}

window.voltarHome = function () {
    document.getElementById('tutStage').style.display = 'none';
    document.getElementById('tutHome').style.display = 'block';
    document.getElementById('tutModuleArea').innerHTML = '';
    currentModuleId = null;
    currentStep = 0;
    steps = [];
};

function renderChat() {
    const body = document.getElementById('tutChatBody');
    body.innerHTML = '';
    document.getElementById('tutStepCounter').textContent = `Passo ${currentStep + 1} de ${steps.length}`;
    document.getElementById('tutPrevBtn').disabled = currentStep === 0;
    document.getElementById('tutNextBtn').textContent = (currentStep === steps.length - 1) ? 'Concluir' : 'Próximo';
}

function adicionarMensagem(texto, tipo = 'tut') {
    const body = document.getElementById('tutChatBody');
    const el = document.createElement('div');
    el.className = `tut-msg ${tipo}`;
    el.textContent = texto;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
}

window.proximoPasso = function () {
    if (currentStep >= steps.length - 1) {
        finalizarTutorial();
        return;
    }
    currentStep++;
    renderChat();
    aplicarHighlight();
};

window.passoAnterior = function () {
    if (currentStep === 0) return;
    currentStep--;
    renderChat();
    aplicarHighlight();
};

function finalizarTutorial() {
    const body = document.getElementById('tutChatBody');
    const el = document.createElement('div');
    el.className = 'tut-msg success';
    el.textContent = '✅ Tutorial concluído! Você pode explorar o módulo livremente ou voltar ao início para escolher outro.';
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;

    document.getElementById('tutNextBtn').disabled = true;
    removerHighlight();
}

window.fecharChat = function () {
    if (confirm('Deseja sair do tutorial?')) voltarHome();
};

function aplicarHighlight() {
    removerHighlight();

    const passo = steps[currentStep];
    if (!passo) return;

    const body = document.getElementById('tutChatBody');
    body.innerHTML = '';
    adicionarMensagem(passo.mensagem);

    if (passo.selector) {
        const el = document.querySelector(passo.selector);
        if (el) {
            el.classList.add('tut-highlight');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (passo.onEnter) passo.onEnter();
        }
    }
}

function removerHighlight() {
    document.querySelectorAll('.tut-highlight').forEach(el => el.classList.remove('tut-highlight'));
}

function renderFakeModule(id) {
    const area = document.getElementById('tutModuleArea');
    if (RENDERIZADORES[id]) {
        area.innerHTML = RENDERIZADORES[id]();
    } else {
        area.innerHTML = '<div class="tut-fake-container"><p style="text-align:center;color:#9CA3AF;">Tutorial deste módulo ainda não disponível.</p></div>';
    }
}

// ─── ÍCONES ───────────────────────────────────────────────
const ICONS = {
    default: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    usuarios: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    licitacoes: '<svg viewBox="0 0 24 24"><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>',
    precos: '<svg viewBox="0 0 24 24"><path d="M11 13H7"/><path d="M19 9h-4"/><path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="15" y="5" width="4" height="12" rx="1"/><rect x="7" y="8" width="4" height="9" rx="1"/></svg>',
    compra: '<svg viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
    transportadoras: '<svg viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
    cotacoes: '<svg viewBox="0 0 24 24"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27 9 5.15"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/><circle cx="18.5" cy="15.5" r="2.5"/><path d="M20.27 17.27 22 19"/></svg>',
    faturamento: '<svg viewBox="0 0 24 24"><path d="M4 11V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M2 15h10"/><path d="m9 18 3-3-3-3"/></svg>',
    frete: '<svg viewBox="0 0 24 24"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
    receber: '<svg viewBox="0 0 24 24"><path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/><path d="m16 19 3 3 3-3"/><path d="M18 12h.01"/><path d="M19 16v6"/><path d="M6 12h.01"/><circle cx="12" cy="12" r="2"/></svg>',
    pagar: '<svg viewBox="0 0 24 24"><path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/><path d="M18 12h.01"/><path d="M19 22v-6"/><path d="m22 19-3-3-3 3"/><path d="M6 12h.01"/><circle cx="12" cy="12" r="2"/></svg>',
    lucro: '<svg viewBox="0 0 24 24"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>'
};

const RENDERIZADORES = {
    usuarios: () => `
        <div class="tut-fake-container">
            <div class="tut-fake-header">
                <h2>Usuários</h2>
                <button class="tut-fake-btn" id="fakeNovoUsuario">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Novo Usuário
                </button>
            </div>
            <div class="tut-fake-table-card">
                <table class="tut-fake-table">
                    <thead>
                        <tr>
                            <th style="width:60px;">Cód.</th>
                            <th>Nome</th>
                            <th>Usuário</th>
                            <th>Setor</th>
                            <th>Status</th>
                            <th style="text-align:center;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>1</strong></td>
                            <td><strong>João Silva</strong></td>
                            <td>joao.silva</td>
                            <td>Vendas</td>
                            <td><span class="tut-fake-badge ativo">Ativo</span></td>
                            <td style="text-align:center;">
                                <button class="tut-fake-action edit">Editar</button>
                                <button class="tut-fake-action delete">Excluir</button>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>2</strong></td>
                            <td><strong>Maria Souza</strong></td>
                            <td>maria.souza</td>
                            <td>Financeiro</td>
                            <td><span class="tut-fake-badge ativo">Ativo</span></td>
                            <td style="text-align:center;">
                                <button class="tut-fake-action edit">Editar</button>
                                <button class="tut-fake-action delete">Excluir</button>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>3</strong></td>
                            <td><strong>Pedro Alves</strong></td>
                            <td>pedro.alves</td>
                            <td>Almoxarifado</td>
                            <td><span class="tut-fake-badge inativo">Inativo</span></td>
                            <td style="text-align:center;">
                                <button class="tut-fake-action edit">Editar</button>
                                <button class="tut-fake-action delete">Excluir</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `,
    licitacoes: () => `
        <div class="tut-fake-container">
            <div class="tut-fake-header">
                <h2>Licitações</h2>
                <button class="tut-fake-btn" id="fakeNovaLicitacao">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Nova Licitação
                </button>
            </div>
            <div class="tut-fake-table-card">
                <table class="tut-fake-table">
                    <thead>
                        <tr>
                            <th style="width:60px;">Cód.</th>
                            <th>Título</th>
                            <th>Status</th>
                            <th>Criado em</th>
                            <th style="text-align:center;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>1</strong></td>
                            <td>Pregão 001/2026 - Materiais elétricos</td>
                            <td>Em análise</td>
                            <td>28/09/2026</td>
                            <td style="text-align:center;">
                                <button class="tut-fake-action edit">Editar</button>
                                <button class="tut-fake-action delete">Excluir</button>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>2</strong></td>
                            <td>Tomada de preços 002/2026 - Cabeamento</td>
                            <td>Aberta</td>
                            <td>27/09/2026</td>
                            <td style="text-align:center;">
                                <button class="tut-fake-action edit">Editar</button>
                                <button class="tut-fake-action delete">Excluir</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `
};

const TUTORIAIS = {
    usuarios: [
        { selector: '.tut-fake-header h2', mensagem: 'Bem-vindo ao módulo de Usuários. Aqui você gerencia quem pode acessar o sistema.' },
        { selector: '#fakeNovoUsuario', mensagem: 'Este é o botão "Novo Usuário". Clique nele quando quiser cadastrar um novo funcionário.' },
        { selector: '.tut-fake-table', mensagem: 'Esta é a lista de usuários. Cada linha mostra: código, nome, usuário de login, setor e status.' },
        { selector: '.tut-fake-action.edit', mensagem: 'O botão "Editar" abre o cadastro para alterar dados, trocar senha, mudar setor ou desativar o usuário.' },
        { selector: '.tut-fake-action.delete', mensagem: 'O botão "Excluir" remove o usuário. Cuidado: é uma ação permanente.' },
        { selector: 'tbody tr:first-child .tut-fake-badge', mensagem: 'O status indica se o usuário pode fazer login. Verde = ativo. Vermelho = inativo.' },
        { selector: null, mensagem: 'Você aprendeu o básico do módulo de Usuários. Explore os botões livremente para praticar!' }
    ],
    licitacoes: [
        { selector: '.tut-fake-header h2', mensagem: 'Bem-vindo ao módulo de Licitações. Aqui você acompanha os processos licitatórios da empresa.' },
        { selector: '#fakeNovaLicitacao', mensagem: 'Este é o botão "Nova Licitação". Clique nele para cadastrar um novo processo.' },
        { selector: '.tut-fake-table', mensagem: 'Esta é a lista de licitações. Cada linha mostra o código, título, status e data de criação.' },
        { selector: '.tut-fake-action.edit', mensagem: 'O botão "Editar" abre o processo para atualizar título, descrição ou status.' },
        { selector: '.tut-fake-action.delete', mensagem: 'O botão "Excluir" remove o processo do sistema.' },
        { selector: null, mensagem: 'Você aprendeu o básico do módulo de Licitações. Explore livremente para praticar!' }
    ]
};

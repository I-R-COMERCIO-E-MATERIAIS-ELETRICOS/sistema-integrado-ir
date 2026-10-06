// ============================================================
// Tutorial Mobile · I.R. Comércio
// ============================================================

const API_URL = window.location.origin + '/api/tutorial';

let accessToken = null;
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
            <h1 style="font-size:1.4rem;margin-bottom:1rem;">${msg || 'ACESSO NEGADO'}</h1>
            <p style="color:#5B6470;margin-bottom:2rem;">Não foi possível carregar o tutorial.</p>
            <a href="/portal/m/" style="background:#FF521D;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">Voltar ao Portal</a>
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
    const grid = document.getElementById('mModulesGrid');
    grid.innerHTML = '';

    if (!availableModules.length) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#9CA3AF;">Nenhum tutorial disponível.</p>';
        return;
    }

    availableModules.forEach(m => {
        const card = document.createElement('button');
        card.className = 'm-module-card';
        card.innerHTML = `
            <div class="m-card-icon">${ICONS[m.id] || ICONS.default}</div>
            <strong>${m.name}</strong>
        `;
        card.addEventListener('click', () => iniciarModulo(m.id, m.name));
        grid.appendChild(card);
    });
}

function iniciarModulo(id, name) {
    currentModuleId = id;
    currentStep = 0;
    steps = TUTORIAIS[id] || [];

    document.getElementById('mHome').style.display = 'none';
    document.getElementById('mStage').style.display = 'flex';
    document.getElementById('mCurrentModule').textContent = name;

    renderFakeModule(id);
    renderChat();
    aplicarHighlight();
    abrirChat();
}

window.voltarHome = function () {
    document.getElementById('mStage').style.display = 'none';
    document.getElementById('mHome').style.display = 'block';
    document.getElementById('mChatOverlay').style.display = 'none';
    document.getElementById('mModuleArea').innerHTML = '';
    currentModuleId = null;
    currentStep = 0;
    steps = [];
};

window.toggleChat = function () {
    const overlay = document.getElementById('mChatOverlay');
    overlay.style.display = (overlay.style.display === 'flex') ? 'none' : 'flex';
};
function abrirChat() { document.getElementById('mChatOverlay').style.display = 'flex'; }
function fecharChat() { document.getElementById('mChatOverlay').style.display = 'none'; }

function renderChat() {
    document.getElementById('mStepCounter').textContent = `Passo ${currentStep + 1} de ${steps.length}`;
    document.getElementById('mPrevBtn').disabled = currentStep === 0;
    document.getElementById('mNextBtn').textContent = (currentStep === steps.length - 1) ? 'Concluir' : 'Próximo';
}

function adicionarMensagem(texto, tipo = 'tut') {
    const body = document.getElementById('mChatBody');
    const el = document.createElement('div');
    el.className = `m-msg ${tipo}`;
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
    const body = document.getElementById('mChatBody');
    const el = document.createElement('div');
    el.className = 'm-msg success';
    el.textContent = '✅ Tutorial concluído! Explore o módulo livremente ou volte para escolher outro.';
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    document.getElementById('mNextBtn').disabled = true;
    removerHighlight();
}

function aplicarHighlight() {
    removerHighlight();
    const passo = steps[currentStep];
    if (!passo) return;

    const body = document.getElementById('mChatBody');
    body.innerHTML = '';
    adicionarMensagem(passo.mensagem);

    if (passo.selector) {
        const el = document.querySelector(passo.selector);
        if (el) {
            el.classList.add('tut-highlight');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function removerHighlight() {
    document.querySelectorAll('.tut-highlight').forEach(el => el.classList.remove('tut-highlight'));
}

function renderFakeModule(id) {
    const area = document.getElementById('mModuleArea');
    if (RENDERIZADORES[id]) {
        area.innerHTML = RENDERIZADORES[id]();
    } else {
        area.innerHTML = '<p style="text-align:center;color:#9CA3AF;">Tutorial ainda não disponível.</p>';
    }
}

// ─── ÍCONES ───────────────────────────────────────────────
const ICONS = {
    default: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    usuarios: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    licitacoes: '<svg viewBox="0 0 24 24"><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>'
    // demais ícones podem ser adicionados conforme módulos tiverem tutorial
};

const RENDERIZADORES = {
    usuarios: () => `
        <div class="tut-fake-container">
            <div class="tut-fake-header">
                <h2>Usuários</h2>
                <button class="tut-fake-btn" id="fakeNovoUsuario">+ Novo</button>
            </div>
            <div class="tut-fake-table-card">
                <table class="tut-fake-table">
                    <thead>
                        <tr>
                            <th style="width:50px;">Cód.</th>
                            <th>Nome</th>
                            <th>Usuário</th>
                            <th>Setor</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>1</strong></td>
                            <td><strong>João Silva</strong></td>
                            <td>joao.silva</td>
                            <td>Vendas</td>
                            <td><span class="tut-fake-badge ativo">Ativo</span></td>
                        </tr>
                        <tr>
                            <td><strong>2</strong></td>
                            <td><strong>Maria Souza</strong></td>
                            <td>maria.souza</td>
                            <td>Financeiro</td>
                            <td><span class="tut-fake-badge ativo">Ativo</span></td>
                        </tr>
                        <tr>
                            <td><strong>3</strong></td>
                            <td><strong>Pedro Alves</strong></td>
                            <td>pedro.alves</td>
                            <td>Almoxarifado</td>
                            <td><span class="tut-fake-badge inativo">Inativo</span></td>
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
                <button class="tut-fake-btn" id="fakeNovaLicitacao">+ Nova</button>
            </div>
            <div class="tut-fake-table-card">
                <table class="tut-fake-table">
                    <thead>
                        <tr>
                            <th style="width:50px;">Cód.</th>
                            <th>Título</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>1</strong></td>
                            <td>Pregão 001/2026</td>
                            <td>Em análise</td>
                        </tr>
                        <tr>
                            <td><strong>2</strong></td>
                            <td>Tomada 002/2026</td>
                            <td>Aberta</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `
};

const TUTORIAIS = {
    usuarios: [
        { selector: '.tut-fake-header h2', mensagem: 'Bem-vindo ao módulo de Usuários. Aqui você gerencia quem acessa o sistema.' },
        { selector: '#fakeNovoUsuario', mensagem: 'Este é o botão para cadastrar um novo usuário.' },
        { selector: '.tut-fake-table', mensagem: 'Esta é a lista de usuários. Cada linha mostra código, nome, login, setor e status.' },
        { selector: 'tbody tr:first-child .tut-fake-badge', mensagem: 'O status indica se o usuário pode fazer login: verde ativo, vermelho inativo.' },
        { selector: null, mensagem: 'Você aprendeu o básico do módulo de Usuários. Explore livremente!' }
    ],
    licitacoes: [
        { selector: '.tut-fake-header h2', mensagem: 'Bem-vindo ao módulo de Licitações. Aqui você acompanha os processos.' },
        { selector: '#fakeNovaLicitacao', mensagem: 'Este é o botão para cadastrar uma nova licitação.' },
        { selector: '.tut-fake-table', mensagem: 'Esta é a lista de licitações. Cada linha mostra código, título e status.' },
        { selector: null, mensagem: 'Você aprendeu o básico do módulo de Licitações. Explore livremente!' }
    ]
};

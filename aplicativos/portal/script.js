const MODULE_ICONS = {
    vendas:           '<svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    usuarios:         '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    precos:           '<svg viewBox="0 0 24 24"><path d="M11 13H7"/><path d="M19 9h-4"/><path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="15" y="5" width="4" height="12" rx="1"/><rect x="7" y="8" width="4" height="9" rx="1"/></svg>',
    compra:           '<svg viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
    transportadoras:  '<svg viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
    cotacoes:         '<svg viewBox="0 0 24 24"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27 9 5.15"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/><circle cx="18.5" cy="15.5" r="2.5"/><path d="M20.27 17.27 22 19"/></svg>',
    faturamento:      '<svg viewBox="0 0 24 24"><path d="M4 11V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M2 15h10"/><path d="m9 18 3-3-3-3"/></svg>',
    estoque:          '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    frete:            '<svg viewBox="0 0 24 24"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
    receber:          '<svg viewBox="0 0 24 24"><path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/><path d="m16 19 3 3 3-3"/><path d="M18 12h.01"/><path d="M19 16v6"/><path d="M6 12h.01"/><circle cx="12" cy="12" r="2"/></svg>',
    pagar:            '<svg viewBox="0 0 24 24"><path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/><path d="M18 12h.01"/><path d="M19 22v-6"/><path d="m22 19-3-3-3 3"/><path d="M6 12h.01"/><circle cx="12" cy="12" r="2"/></svg>',
    lucro:            '<svg viewBox="0 0 24 24"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
    licitacoes:       '<svg viewBox="0 0 24 24"><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>'
};

let accessToken = null;
let userInfo = null;
let modules = [];

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

function getGreeting() {
    const now = new Date();
    const br = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const h = br.getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
}

document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { window.location.href = '/'; return; }

    try {
        const res = await fetch('/api/portal/modules', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (res.status === 401 || res.status === 403) {
            sessionStorage.removeItem('irToken');
            window.location.href = '/';
            return;
        }
        if (!res.ok) throw new Error('Erro ' + res.status);

        const data = await res.json();
        userInfo = data.user;
        modules = data.modules || [];
        bootUI();
    } catch (err) {
        console.error(err);
        window.location.href = '/';
    }
});

function bootUI() {
    const name = userInfo.name || userInfo.username || 'Usuário';
    const firstName = name.split(' ')[0];

    document.getElementById('userInitial').textContent = name.charAt(0).toUpperCase();
    document.getElementById('userName').textContent = name;
    document.getElementById('userSector').textContent = userInfo.sector || 'Usuário';

    const greetingEl = document.getElementById('splashGreeting');
    if (greetingEl) {
        greetingEl.textContent = `${getGreeting()}, ${firstName}!`;
    }

    renderSidebar();

    setTimeout(() => {
        const s = document.getElementById('splash');
        if (s) {
            s.classList.add('fade-out');
            setTimeout(() => { s.style.display = 'none'; }, 400);
        }
        document.getElementById('dashboard').style.display = 'flex';
        if (modules.length > 0) openModule(modules[0]);
    }, 2200);
}

function renderSidebar() {
    const nav = document.getElementById('sidebarModules');
    nav.innerHTML = '';

    if (!modules.length) {
        nav.innerHTML = '<div style="padding:1.5rem;color:rgba(255,255,255,0.4);font-size:0.85rem;">Nenhum módulo liberado.<br>Contate o administrador.</div>';
        return;
    }

    modules.forEach(m => {
        const el = document.createElement('div');
        el.className = 'module-item';
        el.dataset.moduleId = m.id;
        el.innerHTML = `
            <span class="module-icon">${MODULE_ICONS[m.id] || ''}</span>
            <span class="module-label">${m.name}</span>
        `;
        el.addEventListener('click', () => openModule(m));
        nav.appendChild(el);
    });
}

function openModule(mod) {
    document.querySelectorAll('.module-item').forEach(i => i.classList.remove('active'));
    const sidebarItem = document.querySelector(`.module-item[data-module-id="${mod.id}"]`);
    if (sidebarItem) sidebarItem.classList.add('active');

    let container = document.getElementById(`iframe-${mod.id}`);
    if (!container) {
        container = document.createElement('div');
        container.className = 'iframe-container';
        container.id = `iframe-${mod.id}`;

        const iframe = document.createElement('iframe');
        iframe.src = `${mod.url}?access_token=${encodeURIComponent(accessToken)}`;
        iframe.title = mod.name;
        container.appendChild(iframe);
        document.getElementById('iframesContainer').appendChild(container);
    }

    document.querySelectorAll('.iframe-container').forEach(c => c.classList.remove('active'));
    requestAnimationFrame(() => container.classList.add('active'));
}

window.showLogout = () => document.getElementById('logoutModal').classList.add('show');
window.closeLogout = () => document.getElementById('logoutModal').classList.remove('show');
window.confirmLogout = () => {
    sessionStorage.removeItem('irToken');
    sessionStorage.removeItem('irUser');
    window.location.href = '/';
};

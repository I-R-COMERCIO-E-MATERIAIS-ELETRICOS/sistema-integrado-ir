// ============================================================
// Portal Mobile · I.R. Comércio
// Carrossel inferior + drawer lateral esquerdo (sem X, sem
// info do usuário). Fecha ao clicar em qualquer lugar (backdrop)
// ou ao selecionar um módulo.
// ============================================================

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

const SHORT_NAMES = {
    usuarios: 'Usuários', licitacoes: 'Licitações', precos: 'Preços',
    compra: 'Compras', transportadoras: 'Transp.', cotacoes: 'Cotações',
    faturamento: 'Faturam.', frete: 'Frete', estoque: 'Estoque',
    receber: 'Receber', pagar: 'Pagar', lucro: 'Lucro',
};

let accessToken = null;
let userInfo = null;
let modules = [];
let activeModuleId = null;
const loaderTimeouts = {};

document.addEventListener('DOMContentLoaded', async () => {
    accessToken = resolveToken();
    if (!accessToken) { location.replace('/'); return; }
    try { IR.setToken(accessToken); } catch (_) {}

    wireDrawer();

    try {
        const res = await fetch('/api/portal/modules', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.status === 401 || res.status === 403) { limparSessao(); location.replace('/'); return; }
        if (!res.ok) throw new Error('HTTP ' + res.status);

        const data = await res.json();
        userInfo = data.user;
        modules = data.modules || [];

        renderCarousel();
        renderDrawer();
        showGreeting();

        const primeiro = modules.find(m => m.allowed);
        if (primeiro) openModule(primeiro);

        if (!userInfo.is_admin) agendarAvisoExpediente();
    } catch (err) {
        console.error('[PORTAL-M]', err);
        location.replace('/');
    }
});

function resolveToken() {
    const p = new URLSearchParams(location.search);
    const fromUrl = p.get('access_token') || p.get('sessionToken');
    if (fromUrl) {
        try { sessionStorage.setItem('irToken', fromUrl); } catch (_) {}
        history.replaceState({}, '', location.pathname);
        return fromUrl;
    }
    return sessionStorage.getItem('irToken');
}
function limparSessao() {
    try { sessionStorage.removeItem('irToken'); sessionStorage.removeItem('irUser'); } catch (_) {}
}

/* ─── CARROSSEL ─────────────────────────────────────────────── */
function renderCarousel() {
    const carousel = document.getElementById('carousel');
    carousel.innerHTML = '';
    const visiveis = modules.filter(m => m.allowed || !m.adminOnly);
    if (!visiveis.length) {
        carousel.innerHTML = '<div class="empty-carousel">Nenhum módulo disponível</div>';
        return;
    }
    visiveis.forEach(m => {
        if (m.adminOnly && !userInfo.is_admin) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'carousel-item' + (m.allowed ? '' : ' disabled');
        btn.dataset.moduleId = m.id;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-label', m.name);
        const shortLabel = SHORT_NAMES[m.id] || m.name;
        btn.innerHTML = `
            <span class="carousel-icon">${MODULE_ICONS[m.id] || ''}</span>
            <span class="carousel-label">${shortLabel}</span>`;
        if (m.allowed) btn.addEventListener('click', () => openModule(m));
        else btn.disabled = true;
        carousel.appendChild(btn);
    });
}

/* ─── DRAWER (esquerda, sem X, fecha em backdrop) ───────────── */
function renderDrawer() {
    const nav = document.getElementById('drawerNav');
    nav.innerHTML = '';
    modules.forEach(m => {
        if (m.adminOnly && !userInfo.is_admin) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'drawer-item' + (m.allowed ? '' : ' disabled');
        btn.dataset.moduleId = m.id;
        btn.innerHTML = `
            <span class="drawer-item-icon">${MODULE_ICONS[m.id] || ''}</span>
            <span class="drawer-item-label">${m.name}</span>`;
        if (m.allowed) btn.addEventListener('click', () => { openModule(m); closeDrawer(); });
        else btn.disabled = true;
        nav.appendChild(btn);
    });
}

function wireDrawer() {
    document.getElementById('menuBtn').addEventListener('click', openDrawer);
    document.getElementById('drawerBackdrop').addEventListener('click', closeDrawer);
    document.getElementById('drawerLogout').addEventListener('click', confirmarLogout);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
}

function openDrawer() {
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawer').setAttribute('aria-hidden', 'false');
    document.getElementById('drawerBackdrop').classList.add('show');
    document.getElementById('menuBtn').setAttribute('aria-expanded', 'true');
}

function closeDrawer() {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawer').setAttribute('aria-hidden', 'true');
    document.getElementById('drawerBackdrop').classList.remove('show');
    document.getElementById('menuBtn').setAttribute('aria-expanded', 'false');
}

/* ─── MÓDULO (iframe) ──────────────────────────────────────── */
function openModule(mod) {
    activeModuleId = mod.id;
    document.querySelectorAll('.carousel-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.drawer-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`.carousel-item[data-module-id="${mod.id}"]`)?.classList.add('active');
    document.querySelector(`.drawer-item[data-module-id="${mod.id}"]`)?.classList.add('active');

    let container = document.getElementById(`iframe-${mod.id}`);
    if (!container) {
        container = document.createElement('div');
        container.className = 'iframe-container';
        container.id = `iframe-${mod.id}`;

        const loader = document.createElement('div');
        loader.className = 'module-loader';
        loader.id = `loader-${mod.id}`;
        loader.innerHTML = '<div class="module-spinner"></div>';
        container.appendChild(loader);

        const iframe = document.createElement('iframe');
        iframe.src = `${mod.url}?sessionToken=${encodeURIComponent(accessToken)}`;
        iframe.title = mod.name;
        iframe.addEventListener('load', () => {
            clearTimeout(loaderTimeouts[mod.id]);
            loaderTimeouts[mod.id] = setTimeout(() => esconderLoader(mod.id), 1200);
        });
        container.appendChild(iframe);
        document.getElementById('iframesContainer').appendChild(container);
    }

    document.querySelectorAll('.iframe-container').forEach(c => c.classList.remove('active'));
    requestAnimationFrame(() => container.classList.add('active'));

    setTimeout(() => {
        const c = document.querySelector(`.carousel-item[data-module-id="${mod.id}"]`);
        if (c) c.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 60);
}

function esconderLoader(id) {
    const l = document.getElementById(`loader-${id}`);
    if (l && !l.classList.contains('done')) {
        l.classList.add('done');
        setTimeout(() => l.remove(), 300);
    }
}

window.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'ir-session-expired' ||
        data.type === 'ir-access-denied' ||
        data.type === 'ir-module-denied') {
        limparSessao(); location.replace('/'); return;
    }
    if (data.type === 'ir-module-ready') {
        const id = data.module || activeModuleId;
        if (id) { clearTimeout(loaderTimeouts[id]); esconderLoader(id); }
    }
});

/* ─── LOGOUT ───────────────────────────────────────────────── */
async function confirmarLogout() {
    let ok;
    if (window.IR && typeof IR.confirm === 'function') {
        ok = await IR.confirm('Deseja realmente sair?', { confirmText: 'Sim', cancelText: 'Não' });
    } else {
        ok = window.confirm('Deseja realmente sair?');
    }
    if (!ok) return;
    limparSessao(); location.replace('/');
}

/* ─── SAUDAÇÃO ─────────────────────────────────────────────── */
function showGreeting() {
    const text = document.getElementById('greetingText');
    const overlay = document.getElementById('greeting');
    if (!text || !overlay) return;
    const name = userInfo.name || userInfo.username || 'Usuário';
    const firstName = name.split(' ')[0];
    const agora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const h = agora.getHours();
    const greeting = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    text.textContent = `${greeting}, ${firstName}!`;
    setTimeout(() => overlay.classList.add('hide'), 1600);
    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 2600);
}

/* ─── EXPEDIENTE ───────────────────────────────────────────── */
function agendarAvisoExpediente() {
    const tick = () => {
        const br = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const dow = br.getDay();
        if (dow === 0 || dow === 6) { limparSessao(); location.replace('/'); return; }
        const mins = br.getHours() * 60 + br.getMinutes();
        const limite = (dow === 5) ? 16 * 60 + 45 : 17 * 60 + 15;
        const fim    = (dow === 5) ? 17 * 60      : 17 * 60 + 30;
        if (mins >= limite && mins < fim && !document.getElementById('avisoExpediente')) {
            const el = document.createElement('div');
            el.id = 'avisoExpediente';
            el.style.cssText = [
                'position: fixed', 'left: 12px', 'right: 12px',
                'bottom: calc(env(safe-area-inset-bottom) + 76px)',
                'z-index: 500', 'padding: 12px 14px',
                'border: 1px solid #eab308', 'border-radius: 10px',
                'background: #fef08a', 'color: #713f12',
                'font: 600 13px/1.4 Inter, system-ui, sans-serif',
                'box-shadow: 0 8px 24px rgba(0,0,0,.18)'
            ].join(';');
            el.textContent = 'Faltam 15 minutos para o fim do expediente, salve suas atividades';
            document.body.appendChild(el);
        }
        if (mins >= fim) { limparSessao(); location.replace('/'); }
    };
    tick();
    setInterval(tick, 30000);
}

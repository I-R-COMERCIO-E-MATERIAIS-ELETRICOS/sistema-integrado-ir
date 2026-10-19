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

document.addEventListener('DOMContentLoaded', async () => {
    let isAdmin = false;
    let userApps = [];

    try {
        const token = window.IR ? IR.getToken() : new URLSearchParams(window.location.search).get('sessionToken');
        const res = await fetch('/api/me', { headers: { 'X-Session-Token': token }});
        if (res.ok) {
            const user = await res.json();
            isAdmin = user.is_admin;
            userApps = user.apps || [];
        }
    } catch(e) { console.error(e); }

    const grid = document.getElementById('dashGrid');
    
    Object.keys(MODULE_INFO).forEach(modId => {
        let allowed = isAdmin;
        if (!allowed && modId === 'usuarios') allowed = false;
        else if (!allowed) allowed = userApps.includes(modId);

        if (!allowed) return;

        const info = MODULE_INFO[modId];
        
        // Aqui definimos quais tutoriais estão prontos. 
        // Se não estiver na lista, o card pode ficar esmaecido ou escondido. 
        // Deixei visível mas com aviso para os que faltam.
        const isImplemented = ['usuarios'].includes(modId);

        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'dash-card';
        
        if (!isImplemented) card.style.opacity = '0.6';

        card.innerHTML = `
            <div class="dash-card-icon">${MODULE_ICONS[modId] || ''}</div>
            <div class="dash-card-title">${info.name}</div>
            <div class="dash-card-desc">${info.desc}</div>
        `;

        card.addEventListener('click', () => {
            if (isImplemented) {
                window.location.href = `/tutorial/${modId}/`;
            } else {
                if (window.IR && IR.toast) IR.toast('Este tutorial será adicionado em breve', 'info');
            }
        });

        grid.appendChild(card);
    });
});

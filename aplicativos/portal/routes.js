// aplicativos/portal/routes.js
const express = require('express');

module.exports = function (supabase, supabaseAdmin) {
    const router = express.Router();

    // Lista canônica de módulos do sistema.
    // O `id` aqui é o mesmo que você salva em profile.apps.
    // `available: false` = módulo ainda não implementado (fica oculto).
    const ALL_MODULES = [
        { id: 'vendas',          name: 'Painel',                 url: '/vendas',          available: true  },
        { id: 'usuarios',        name: 'Usuários',               url: '/usuarios',        available: true, adminOnly: true },
        { id: 'precos',          name: 'Tabela de Preços',       url: '/precos',          available: true  },
        { id: 'compra',          name: 'Ordens de Compra',       url: '/compra',          available: true  },
        { id: 'transportadoras', name: 'Transportadoras',        url: '/transportadoras', available: true  },
        { id: 'cotacoes',        name: 'Cotações de Frete',      url: '/cotacoes',        available: true  },
        { id: 'faturamento',     name: 'Pedidos de Faturamento', url: '/faturamento',     available: true  },
        { id: 'frete',           name: 'Controle de Frete',      url: '/frete',           available: true  },
        { id: 'estoque',         name: 'Estoque',                url: '/estoque',         available: false },
        { id: 'receber',         name: 'Contas a Receber',       url: '/receber',         available: true  },
        { id: 'pagar',           name: 'Contas a Pagar',         url: '/pagar',           available: true  },
        { id: 'lucro',           name: 'Lucro Real',             url: '/lucro',           available: true  },
        { id: 'licitacoes',      name: 'Licitações',             url: '/licitacoes',      available: false }
    ];

    // ─── MIDDLEWARE ───────────────────────────────────────────
    async function requireAuth(req, res, next) {
        const auth = req.headers['authorization'];
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
        if (!token) return res.status(401).json({ error: 'Não autenticado' });

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return res.status(401).json({ error: 'Sessão inválida' });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, username, name, sector, is_admin, is_active, apps')
            .eq('id', user.id)
            .single();

        if (!profile || !profile.is_active) {
            return res.status(403).json({ error: 'Usuário inativo' });
        }

        req.user = profile;
        next();
    }

    // ─── MÓDULOS AUTORIZADOS ──────────────────────────────────
    // Admin vê todos os módulos disponíveis.
    // Usuário comum vê apenas o que está em profile.apps.
    router.get('/modules', requireAuth, (req, res) => {
        const { is_admin, apps } = req.user;
        const allowedIds = is_admin
            ? ALL_MODULES.filter(m => m.available).map(m => m.id)
            : (Array.isArray(apps) ? apps : []);

        const modules = ALL_MODULES
            .filter(m => m.available)
            .filter(m => allowedIds.includes(m.id))
            .map(m => ({
                id: m.id,
                name: m.name,
                url: m.url
            }));

        res.json({
            user: {
                id: req.user.id,
                username: req.user.username,
                name: req.user.name,
                sector: req.user.sector,
                is_admin: req.user.is_admin
            },
            modules
        });
    });

    return router;
};

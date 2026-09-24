// aplicativos/portal/routes.js
const express = require('express');

module.exports = function (supabase, supabaseAdmin) {
    const router = express.Router();

    // Todos os módulos do sistema + ícone + URL.
    // `available: false` = ainda não implementado.
    const ALL_MODULES = [
        { id: 'vendas',          name: 'Painel',                 url: '/vendas',           available: true  },
        { id: 'usuarios',        name: 'Usuários',               url: '/usuarios',         available: true,  adminOnly: true },
        { id: 'precos',          name: 'Tabela de Preços',       url: '/precos',           available: true  },
        { id: 'compra',          name: 'Ordens de Compra',       url: '/compra',           available: true  },
        { id: 'transportadoras', name: 'Transportadoras',        url: '/transportadoras',  available: true  },
        { id: 'cotacoes',        name: 'Cotações de Frete',      url: '/cotacoes',         available: true  },
        { id: 'faturamento',     name: 'Pedidos de Faturamento', url: '/faturamento',      available: true  },
        { id: 'frete',           name: 'Controle de Frete',      url: '/frete',            available: true  },
        { id: 'estoque',         name: 'Estoque',                url: '/estoque',          available: false },
        { id: 'receber',         name: 'Contas a Receber',       url: '/receber',          available: true  },
        { id: 'pagar',           name: 'Contas a Pagar',         url: '/pagar',            available: true  },
        { id: 'lucro',           name: 'Lucro Real',             url: '/lucro',            available: true  },
        { id: 'licitacoes',      name: 'Licitações',             url: '/licitacoes',       available: false }
    ];

    // Regras por setor — quem vê o quê
    const SECTOR_ACCESS = {
        'Administrador': ['*'],
        'Vendas':        ['vendas', 'precos', 'compra', 'transportadoras', 'cotacoes',
                          'faturamento', 'estoque', 'frete', 'receber', 'licitacoes'],
        'Financeiro':    ['vendas', 'transportadoras', 'faturamento', 'frete',
                          'receber', 'pagar', 'licitacoes'],
        'Almoxarifado':  ['vendas', 'transportadoras', 'cotacoes', 'faturamento',
                          'estoque', 'frete']
    };

    // ─── MIDDLEWARE: exige token válido ───────────────────────
    async function requireAuth(req, res, next) {
        const auth = req.headers['authorization'];
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
        if (!token) return res.status(401).json({ error: 'Não autenticado' });

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return res.status(401).json({ error: 'Sessão inválida' });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, username, name, sector, is_admin, is_active')
            .eq('id', user.id)
            .single();

        if (!profile || !profile.is_active) {
            return res.status(403).json({ error: 'Usuário inativo' });
        }

        req.user = profile;
        next();
    }

    // ─── MÓDULOS AUTORIZADOS ──────────────────────────────────
    router.get('/modules', requireAuth, (req, res) => {
        const { sector, is_admin } = req.user;

        let allowed;
        if (is_admin) {
            allowed = ['*'];
        } else {
            allowed = SECTOR_ACCESS[sector] || ['vendas'];
        }

        const modules = ALL_MODULES
            .filter(m => {
                if (!m.available) return true;              // mostra desabilitado
                if (m.adminOnly && !is_admin) return false; // módulos exclusivos de admin
                if (allowed.includes('*')) return true;
                return allowed.includes(m.id);
            })
            .map(m => ({
                id: m.id,
                name: m.name,
                url: m.url,
                available: !!m.available,
                allowed: m.adminOnly ? is_admin : (allowed.includes('*') || allowed.includes(m.id))
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

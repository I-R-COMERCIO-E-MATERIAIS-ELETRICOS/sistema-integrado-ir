const express = require('express');
const crypto = require('crypto');

function verifyToken(token, secret) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    try {
        const expected = crypto.createHmac('sha256', secret).update(body).digest('base64')
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const a = Buffer.from(sig), b = Buffer.from(expected);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
        const payload = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/')
            .padEnd(Math.ceil(body.length / 4) * 4, '='), 'base64').toString('utf8'));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch { return null; }
}

module.exports = function (supabase, supabaseAdmin) {
    const router = express.Router();
    const admin = supabaseAdmin || supabase;
    const secret = process.env.SESSION_SECRET;

    const MODULES = [
        { id: 'vendas', name: 'Vendas', url: '/vendas', available: true },
        { id: 'precos', name: 'Tabela de Preços', url: '/precos', available: true },
        { id: 'compra', name: 'Ordens de Compra', url: '/compra', available: true },
        { id: 'transportadoras', name: 'Transportadoras', url: '/transportadoras', available: true },
        { id: 'cotacoes', name: 'Cotações de Frete', url: '/cotacoes', available: true },
        { id: 'faturamento', name: 'Pedidos de Faturamento', url: '/faturamento', available: true },
        { id: 'frete', name: 'Controle de Frete', url: '/frete', available: true },
        { id: 'receber', name: 'Contas a Receber', url: '/receber', available: true },
        { id: 'pagar', name: 'Contas a Pagar', url: '/pagar', available: true },
        { id: 'lucro', name: 'Lucro Real', url: '/lucro', available: true },
        { id: 'licitacoes', name: 'Licitações', url: '/licitacoes', available: false },
        { id: 'estoque', name: 'Estoque', url: '/estoque', available: false }
    ];

    async function requireAuth(req, res, next) {
        try {
            const auth = req.headers.authorization || '';
            const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
            const payload = verifyToken(token, secret);
            if (!payload?.uid) return res.status(401).json({ error: 'Sessão inválida' });
            const { data: profile, error } = await admin.from('profiles')
                .select('id, code, username, name, sector, is_admin, is_active, apps')
                .eq('id', payload.uid).maybeSingle();
            if (error || !profile || !profile.is_active)
                return res.status(401).json({ error: 'Sessão inválida' });
            req.user = profile;
            next();
        } catch (e) {
            console.error('[portal requireAuth]', e.message);
            return res.status(500).json({ error: 'Erro interno de autenticação' });
        }
    }

    router.get('/modules', requireAuth, (req, res) => {
        const { is_admin, apps } = req.user;
        const allowedIds = is_admin
            ? MODULES.filter(m => m.available).map(m => m.id)
            : (Array.isArray(apps) ? apps : []);
        res.json({
            user: {
                id: req.user.id, code: req.user.code, username: req.user.username,
                name: req.user.name, sector: req.user.sector, is_admin: req.user.is_admin
            },
            modules: MODULES.filter(m => m.available).map(m => ({
                id: m.id, name: m.name, url: m.url, allowed: allowedIds.includes(m.id)
            }))
        });
    });

    router.post('/verify-session', async (req, res) => {
        const token = req.body?.sessionToken || req.headers['x-session-token'];
        const payload = verifyToken(token, secret);
        if (!payload?.uid) return res.status(401).json({ valid: false, error: 'Sessão inválida' });
        const { data: profile, error } = await admin.from('profiles')
            .select('id, code, username, name, sector, is_admin, is_active, apps')
            .eq('id', payload.uid).maybeSingle();
        if (error || !profile || !profile.is_active) return res.status(401).json({ valid: false });
        res.json({ valid: true, session: profile });
    });

    return router;
};

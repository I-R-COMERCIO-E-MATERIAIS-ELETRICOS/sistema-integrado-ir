const express = require('express');
const crypto = require('crypto');
const { normalizarApps } = require('../../lib/helpers');

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

    function dentroDoExpediente() {
        const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
        const get = t => parts.find(p => p.type === t)?.value;
        const day = get('weekday');
        const minutes = Number(get('hour')) * 60 + Number(get('minute'));
        if (['Mon', 'Tue', 'Wed', 'Thu'].includes(day)) return minutes >= 510 && minutes < 1050;
        if (day === 'Fri') return minutes >= 510 && minutes < 1020;
        return false;
    }

    const MODULES = [
        { id: 'usuarios',       name: 'Usuários',                 url: '/usuarios',       available: true, adminOnly: true },
        { id: 'licitacoes',     name: 'Licitações',               url: '/licitacoes',     available: true },
        { id: 'precos',         name: 'Tabela de Preços',         url: '/precos',         available: true },
        { id: 'compra',         name: 'Ordens de Compra',         url: '/compra',         available: true },
        { id: 'transportadoras',name: 'Transportadoras',          url: '/transportadoras',available: true },
        { id: 'cotacoes',       name: 'Cotações de Frete',        url: '/cotacoes',       available: true },
        { id: 'faturamento',    name: 'Pedidos de Faturamento',   url: '/faturamento',    available: true },
        { id: 'estoque',        name: 'Estoque',                  url: '/estoque',        available: true },
        { id: 'frete',          name: 'Controle de Frete',        url: '/frete',          available: true },
        { id: 'receber',        name: 'Contas a Receber',         url: '/receber',        available: true },
        { id: 'pagar',          name: 'Contas a Pagar',           url: '/pagar',          available: true },
        { id: 'lucro',          name: 'Lucro Real',               url: '/lucro',          available: true },
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
            if (!profile.is_admin && !dentroDoExpediente())
                return res.status(401).json({ error: 'Sessão encerrada', silentLogout: true });
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
            : normalizarApps(apps);

        res.json({
            user: {
                id: req.user.id, code: req.user.code, username: req.user.username,
                name: req.user.name, sector: req.user.sector, is_admin: req.user.is_admin
            },
            modules: MODULES.filter(m => m.available).map(m => ({
                id: m.id, name: m.name, url: m.url,
                allowed: m.adminOnly ? !!is_admin : allowedIds.includes(m.id)
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

const express = require('express');
const crypto = require('crypto');

function verifyToken(token, secret) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch { return null; }
}

module.exports = function (supabase, supabaseAdmin) {
    const router = express.Router();
    const SESSION_SECRET = process.env.SESSION_SECRET;

    // ─── Validar sessão ─────────────────────────────────────
    router.get('/me', async (req, res) => {
        const auth = req.headers['authorization'];
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
        const payload = verifyToken(token, SESSION_SECRET);
        if (!payload) return res.status(401).json({ error: 'Não autenticado' });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, code, username, name, sector, is_admin, is_active')
            .eq('id', payload.uid)
            .single();

        if (!profile || !profile.is_active) return res.status(401).json({ error: 'Sessão inválida' });

        res.json({ user: profile });
    });

    // ─── Módulos disponíveis para o tutorial ────────────────
    // Só devolve os módulos que o usuário tem acesso (menos o próprio tutorial).
    // O front usa isso para montar o grid inicial.
    router.get('/modules', async (req, res) => {
        const auth = req.headers['authorization'];
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
        const payload = verifyToken(token, SESSION_SECRET);
        if (!payload) return res.status(401).json({ error: 'Não autenticado' });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('is_admin, is_active, apps')
            .eq('id', payload.uid)
            .single();

        if (!profile || !profile.is_active) return res.status(401).json({ error: 'Sessão inválida' });

        const ALL = [
            { id: 'usuarios',        name: 'Usuários',                adminOnly: true },
            { id: 'licitacoes',      name: 'Licitações' },
            { id: 'precos',          name: 'Tabela de Preços' },
            { id: 'compra',          name: 'Ordens de Compra' },
            { id: 'transportadoras', name: 'Transportadoras' },
            { id: 'cotacoes',        name: 'Cotações de Frete' },
            { id: 'faturamento',     name: 'Pedidos de Faturamento' },
            { id: 'frete',           name: 'Controle de Frete' },
            { id: 'receber',         name: 'Contas a Receber' },
            { id: 'pagar',           name: 'Contas a Pagar' },
            { id: 'lucro',           name: 'Lucro Real' }
        ];

        const apps = Array.isArray(profile.apps) ? profile.apps : [];
        const modules = ALL
            .filter(m => profile.is_admin || !m.adminOnly)
            .filter(m => profile.is_admin || apps.includes(m.id))
            .map(m => ({ id: m.id, name: m.name }));

        res.json({ modules });
    });

    return router;
};

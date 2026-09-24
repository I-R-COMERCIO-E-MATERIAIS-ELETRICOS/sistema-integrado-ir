const express = require('express');

module.exports = function (supabase, supabaseAdmin) {
    const router = express.Router();

    // ─── CONFIG PÚBLICA ───────────────────────────────────────
    router.get('/config', (req, res) => {
        res.json({
            url: process.env.SUPABASE_URL,
            anonKey: process.env.SUPABASE_ANON_KEY
        });
    });

    // ─── PERFIL DO USUÁRIO LOGADO ─────────────────────────────
    router.get('/profile', async (req, res) => {
        const auth = req.headers['authorization'];
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
        if (!token) return res.status(401).json({ error: 'Token não fornecido' });

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return res.status(401).json({ error: 'Token inválido' });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, username, name, contact_email, sector, is_admin, is_active, apps')
            .eq('id', user.id)
            .single();

        res.json(profile || {});
    });

    return router;
};

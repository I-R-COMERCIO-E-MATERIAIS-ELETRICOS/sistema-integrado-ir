// apps/login-e-autenticacao/routes.js
const express = require('express');

module.exports = function(supabase, supabaseAdmin) {
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
            .select('*')
            .eq('id', user.id)
            .single();

        res.json({
            id: user.id,
            email: user.email,
            name: profile?.name || user.user_metadata?.name || user.email,
            sector: profile?.sector || null,
            is_admin: profile?.is_admin || false,
            apps: profile?.apps || null
        });
    });

    // ─── CRIAR USUÁRIO (admin) ────────────────────────────────
    router.post('/users', async (req, res) => {
        const auth = req.headers['authorization'];
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
        if (!token) return res.status(401).json({ error: 'Token não fornecido' });

        const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !caller) return res.status(401).json({ error: 'Token inválido' });

        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('is_admin')
            .eq('id', caller.id)
            .single();

        if (!callerProfile?.is_admin) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { email, password, name, sector, apps, is_admin } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        try {
            const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name, sector: sector || null }
            });

            if (createError) {
                if (createError.message.includes('already registered')) {
                    return res.status(409).json({ error: 'E-mail já cadastrado' });
                }
                throw createError;
            }

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: created.user.id,
                    email,
                    name,
                    sector: sector || null,
                    is_admin: !!is_admin,
                    apps: apps || null
                });

            if (profileError) {
                await supabaseAdmin.auth.admin.deleteUser(created.user.id);
                throw profileError;
            }

            res.status(201).json({ success: true, userId: created.user.id });
        } catch (err) {
            res.status(500).json({ error: 'Erro ao criar usuário: ' + err.message });
        }
    });

    // ─── SETUP INICIAL — cria o primeiro admin ────────────────
    router.post('/setup-admin', async (req, res) => {
        try {
            const { data: existing } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('is_admin', true)
                .limit(1);

            if (existing && existing.length > 0) {
                return res.status(403).json({ error: 'Admin já cadastrado' });
            }

            const { email, password, name } = req.body;
            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Dados incompletos' });
            }

            const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name, sector: 'Administrador' }
            });

            if (createError) throw createError;

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: created.user.id,
                    email,
                    name,
                    sector: 'Administrador',
                    is_admin: true,
                    apps: 'precos,compra,vendas'
                });

            if (profileError) {
                await supabaseAdmin.auth.admin.deleteUser(created.user.id);
                throw profileError;
            }

            res.status(201).json({ success: true, userId: created.user.id });
        } catch (err) {
            res.status(500).json({ error: 'Erro: ' + err.message });
        }
    });

    return router;
};

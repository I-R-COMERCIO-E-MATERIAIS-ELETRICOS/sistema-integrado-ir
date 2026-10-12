const express = require('express');
const crypto = require('crypto');
const logActivity = require('../shared/logActivity');

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

    async function requireAuth(req, res, next) {
        const auth = req.headers['authorization'];
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
        const payload = verifyToken(token, SESSION_SECRET);
        if (!payload) return res.status(401).json({ error: 'Não autenticado' });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, code, username, name, sector, is_admin, is_active, apps')
            .eq('id', payload.uid)
            .single();

        if (!profile || !profile.is_active) return res.status(401).json({ error: 'Sessão inválida' });

        if (!profile.is_admin) {
            const apps = Array.isArray(profile.apps) ? profile.apps : [];
            if (!apps.includes('licitacoes')) {
                return res.status(403).json({ error: 'Sem acesso ao módulo' });
            }
        }
        req.user = profile;
        next();
    }

    router.get('/', requireAuth, async (req, res) => {
        try {
            const { data, error } = await supabaseAdmin
                .from('licitacoes')
                .select('*')
                .order('code', { ascending: true });
            if (error) throw error;
            res.json(data || []);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao listar: ' + err.message });
        }
    });

    router.get('/:id', requireAuth, async (req, res) => {
        try {
            const { data, error } = await supabaseAdmin
                .from('licitacoes')
                .select('*')
                .eq('id', req.params.id)
                .single();
            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Não encontrado' });
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Erro: ' + err.message });
        }
    });

    router.post('/', requireAuth, async (req, res) => {
        try {
            const { data, error } = await supabaseAdmin
                .from('licitacoes')
                .insert([{
                    title: req.body.title,
                    description: req.body.description || null,
                    status: req.body.status || 'aberta',
                    created_by: req.user.id
                }])
                .select('*')
                .single();
            if (error) throw error;

            logActivity(supabaseAdmin, req, {
                action: 'create',
                module: 'licitacoes',
                target_id: data.id,
                target_code: data.code,
                details: { title: data.title }
            });

            res.status(201).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao criar: ' + err.message });
        }
    });

    router.put('/:id', requireAuth, async (req, res) => {
        try {
            const updates = {
                title: req.body.title,
                description: req.body.description || null,
                status: req.body.status || 'aberta',
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabaseAdmin
                .from('licitacoes')
                .update(updates)
                .eq('id', req.params.id)
                .select('*')
                .single();
            if (error) throw error;

            logActivity(supabaseAdmin, req, {
                action: 'update',
                module: 'licitacoes',
                target_id: data.id,
                target_code: data.code,
                details: { title: data.title }
            });

            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao atualizar: ' + err.message });
        }
    });

    router.delete('/:id', requireAuth, async (req, res) => {
        try {
            const { data: alvo } = await supabaseAdmin
                .from('licitacoes').select('code, title').eq('id', req.params.id).single();

            await supabaseAdmin.from('licitacoes').delete().eq('id', req.params.id);

            logActivity(supabaseAdmin, req, {
                action: 'delete',
                module: 'licitacoes',
                target_id: req.params.id,
                target_code: alvo?.code || null,
                details: { title: alvo?.title }
            });

            res.status(204).end();
        } catch (err) {
            res.status(500).json({ error: 'Erro ao excluir: ' + err.message });
        }
    });

    return router;
};

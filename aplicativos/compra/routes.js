// ============================================================
// apps/compra/routes.js
// Rotas da API de Ordens de Compra
// ============================================================

const express = require('express');
const crypto  = require('crypto');

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

function toSnakeCase(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        out[k.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)] = v;
    }
    return out;
}

module.exports = function (supabase, supabaseAdmin, logActivity) {
    const router = express.Router();
    const admin  = supabaseAdmin || supabase;
    const SESSION_SECRET = process.env.SESSION_SECRET;

    console.log('[compra][init] módulo de compra carregado');

    // ─── AUTH ───────────────────────────────────────────────
    async function requireAuth(req, res, next) {
        const auth  = req.headers['authorization'];
        const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
        const sessionToken = bearer || req.headers['x-session-token'];

        console.log('[compra][auth]', req.method, req.originalUrl,
            '| token recebido:', sessionToken ? 'SIM' : 'NÃO',
            '| origem:', bearer ? 'Bearer' : (req.headers['x-session-token'] ? 'X-Session-Token' : 'nenhuma'));

        if (!sessionToken) return res.status(401).json({ error: 'Não autenticado' });

        let profile = null;
        const payload = verifyToken(sessionToken, SESSION_SECRET);
        if (payload && payload.uid) {
            console.log('[compra][auth] token JWT válido, buscando profile', payload.uid);
            const { data, error } = await admin
                .from('profiles')
                .select('id, username, name, sector, is_admin, is_active, apps')
                .eq('id', payload.uid)
                .single();
            if (error) console.log('[compra][auth] erro profiles:', error.message);
            profile = data;
        } else {
            console.log('[compra][auth] token não é JWT, tentando active_sessions');
        }

        if (!profile) {
            const { data: sess, error } = await admin
                .from('active_sessions')
                .select('*, users(id, username, name, is_admin, is_active, sector, apps)')
                .eq('session_token', sessionToken)
                .eq('is_active', true)
                .gt('expires_at', new Date().toISOString())
                .single();
            if (error) console.log('[compra][auth] erro active_sessions:', error.message);
            if (sess && sess.users) profile = sess.users;
        }

        if (!profile || !profile.is_active) {
            console.log('[compra][auth] ✗ sem profile ativo');
            return res.status(401).json({ error: 'Sessão inválida' });
        }

        console.log('[compra][auth] ✓ usuário:', profile.username, '| is_admin:', profile.is_admin, '| apps:', JSON.stringify(profile.apps));

        if (!profile.is_admin) {
            const apps = Array.isArray(profile.apps) ? profile.apps : [];
            if (!apps.includes('compra') && !apps.includes('compras')) {
                console.log('[compra][auth] ✗ usuário sem app "compra"');
                return res.status(403).json({ error: 'Sem acesso ao módulo' });
            }
        }

        req.user = profile;
        next();
    }

    function nomeResponsavel(user) {
        if (!user) return null;
        const nome = (user.name || '').trim();
        if (nome) return nome;
        return (user.username || '').trim() || null;
    }

    async function notificar(msg) {
        try { await admin.from('compranotifications').insert({ message: msg }); }
        catch (e) { console.error('[compra] notificação:', e.message); }
    }

    function audit(req, action, targetId, details) {
        if (typeof logActivity !== 'function') {
            console.log('[compra][audit] logActivity não é função, pulando');
            return;
        }
        try {
            logActivity(admin, req, {
                action,
                module: 'compra',
                target_id: targetId,
                target_code: details?.numero || null,
                details: typeof details === 'object' ? JSON.stringify(details) : (details || null)
            });
        } catch (e) {
            console.error('[compra] logActivity:', e.message);
        }
    }

    // ─── ÚLTIMO NÚMERO ──────────────────────────────────────
    router.get('/ordens/ultimo-numero', requireAuth, async (req, res) => {
        try {
            console.log('[compra][GET /ordens/ultimo-numero]');
            const { data, error } = await admin
                .from('ordens_compra')
                .select('numero_ordem')
                .order('numero_ordem', { ascending: false })
                .limit(1);
            if (error) {
                console.log('[compra][GET /ordens/ultimo-numero] erro:', error.message);
                throw error;
            }
            const ultimo = data && data[0] ? parseInt(data[0].numero_ordem) || 0 : 0;
            res.json({ ultimoNumero: ultimo });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // ─── BUSCAR POR NÚMERO ──────────────────────────────────
    router.get('/ordens/numero/:numero', requireAuth, async (req, res) => {
        try {
            console.log('[compra][GET /ordens/numero]', req.params.numero);
            const { data, error } = await admin
                .from('ordens_compra')
                .select('*')
                .eq('numero_ordem', req.params.numero)
                .maybeSingle();
            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Ordem não encontrada' });
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // ─── LISTAR ─────────────────────────────────────────────
    router.get('/ordens', requireAuth, async (req, res) => {
        try {
            const { mes, ano } = req.query;
            console.log('[compra][GET /ordens] mes:', mes, 'ano:', ano);

            let q = admin.from('ordens_compra').select('*');

            if (mes !== undefined && ano !== undefined) {
                const start = new Date(Number(ano), Number(mes), 1);
                const end   = new Date(Number(ano), Number(mes) + 1, 1);
                q = q
                    .gte('data_ordem', start.toISOString().split('T')[0])
                    .lt('data_ordem', end.toISOString().split('T')[0]);
            }

            const { data, error } = await q.order('numero_ordem', { ascending: true });
            if (error) {
                console.log('[compra][GET /ordens] erro:', error.message);
                throw error;
            }
            console.log('[compra][GET /ordens] ✓ retornando', (data || []).length, 'linhas');
            res.json(data || []);
        } catch (e) {
            console.error('[compra][GET /ordens] catch:', e);
            res.status(500).json({ error: e.message });
        }
    });

    // ─── CRIAR ──────────────────────────────────────────────
    router.post('/ordens', requireAuth, async (req, res) => {
        try {
            const body = toSnakeCase(req.body);
            if (!Array.isArray(body.items)) body.items = [];
            if (!body.status) body.status = 'aberta';

            const responsavel = nomeResponsavel(req.user);
            if (!body.responsavel && responsavel) body.responsavel = responsavel;

            console.log('[compra][POST /ordens] numero:', body.numero_ordem, '| responsavel:', body.responsavel);

            const { data, error } = await admin
                .from('ordens_compra')
                .insert(body)
                .select()
                .single();
            if (error) {
                console.log('[compra][POST /ordens] erro:', error.message);
                throw error;
            }

            await notificar(`Ordem de Nº ${data.numero_ordem} aberta`);
            audit(req, 'create', data.id, { numero: data.numero_ordem });

            res.status(201).json(data);
        } catch (e) {
            console.error('POST /ordens:', e);
            res.status(500).json({ error: e.message });
        }
    });

    // ─── ATUALIZAR ──────────────────────────────────────────
    router.put('/ordens/:id', requireAuth, async (req, res) => {
        try {
            const body = toSnakeCase(req.body);
            if (!Array.isArray(body.items)) body.items = [];

            const { data: old, error: fe } = await admin
                .from('ordens_compra')
                .select('numero_ordem')
                .eq('id', req.params.id)
                .single();
            if (fe) throw fe;

            const { data, error } = await admin
                .from('ordens_compra')
                .update(body)
                .eq('id', req.params.id)
                .select()
                .single();
            if (error) throw error;

            await notificar(`Ordem de Nº ${old.numero_ordem} atualizada`);
            audit(req, 'update', data.id, { numero: data.numero_ordem });

            res.json(data);
        } catch (e) {
            console.error('PUT /ordens/:id:', e);
            res.status(500).json({ error: e.message });
        }
    });

    // ─── EXCLUIR ────────────────────────────────────────────
    router.delete('/ordens/:id', requireAuth, async (req, res) => {
        try {
            const { data: ordem, error: fe } = await admin
                .from('ordens_compra')
                .select('numero_ordem')
                .eq('id', req.params.id)
                .single();
            if (fe) throw fe;

            const { error } = await admin
                .from('ordens_compra')
                .delete()
                .eq('id', req.params.id);
            if (error) throw error;

            await notificar(`Ordem de Nº ${ordem.numero_ordem} excluída`);
            audit(req, 'delete', req.params.id, { numero: ordem.numero_ordem });

            res.status(204).end();
        } catch (e) {
            console.error('DELETE /ordens/:id:', e);
            res.status(500).json({ error: e.message });
        }
    });

    // ─── ALTERAR STATUS ─────────────────────────────────────
    router.patch('/ordens/:id/status', requireAuth, async (req, res) => {
        try {
            const { status } = req.body || {};
            if (!['aberta', 'fechada'].includes(status)) {
                return res.status(400).json({ error: 'Status inválido' });
            }

            const { data, error } = await admin
                .from('ordens_compra')
                .update({ status })
                .eq('id', req.params.id)
                .select()
                .single();
            if (error) throw error;

            audit(req, 'status', data.id, { numero: data.numero_ordem, status });
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // ─── FORNECEDORES ÚNICOS ────────────────────────────────
    router.get('/fornecedores', requireAuth, async (req, res) => {
        try {
            console.log('[compra][GET /fornecedores]');
            const { data, error } = await admin
                .from('ordens_compra')
                .select('razao_social, nome_fantasia, cnpj, endereco_fornecedor, site, contato, telefone, email')
                .order('razao_social');
            if (error) throw error;

            const unique = new Map();
            for (const f of data || []) {
                const key = (f.razao_social || '').trim().toUpperCase();
                if (key && !unique.has(key)) unique.set(key, f);
            }
            console.log('[compra][GET /fornecedores] ✓', unique.size, 'fornecedores únicos');
            res.json(Array.from(unique.values()));
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    return router;
};

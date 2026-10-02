// ============================================================
// apps/transportadoras/routes.js
// Rotas da API de Transportadoras
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

function toUpperCase(v) { return v ? String(v).toUpperCase() : ''; }
function toLowerCase(v) { return v ? String(v).toLowerCase() : ''; }

function nomeResponsavel(user) {
    if (!user) return null;
    const nome = (user.name || '').trim();
    if (nome) return nome;
    return (user.username || '').trim() || null;
}

module.exports = function (supabase, supabaseAdmin, logActivity) {
    const router = express.Router();
    const admin  = supabaseAdmin || supabase;
    const SESSION_SECRET = process.env.SESSION_SECRET;

    async function requireAuth(req, res, next) {
        const auth = req.headers['authorization'];
        const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
        const sessionToken = bearer || req.headers['x-session-token'];
        if (!sessionToken) return res.status(401).json({ error: 'Não autenticado' });

        let profile = null;
        const payload = verifyToken(sessionToken, SESSION_SECRET);
        if (payload && payload.uid) {
            const { data } = await admin
                .from('profiles')
                .select('id, username, name, sector, is_admin, is_active, apps')
                .eq('id', payload.uid)
                .single();
            profile = data;
        }

        if (!profile) {
            const { data: sess } = await admin
                .from('active_sessions')
                .select('*, users(id, username, name, is_admin, is_active, sector, apps)')
                .eq('session_token', sessionToken)
                .eq('is_active', true)
                .gt('expires_at', new Date().toISOString())
                .single();
            if (sess && sess.users) profile = sess.users;
        }

        if (!profile || !profile.is_active) {
            return res.status(401).json({ error: 'Sessão inválida' });
        }

        if (!profile.is_admin) {
            const apps = Array.isArray(profile.apps) ? profile.apps : [];
            if (!apps.includes('transportadoras')) {
                return res.status(403).json({ error: 'Sem acesso ao módulo' });
            }
        }

        req.user = profile;
        next();
    }

    async function requireAdmin(req, res, next) {
        if (!req.user || !req.user.is_admin) {
            return res.status(403).json({ error: 'Apenas administradores' });
        }
        next();
    }

    async function audit(req, action, targetId, details) {
        if (typeof logActivity !== 'function') return;
        try {
            await logActivity(admin, req, {
                action,
                module: 'transportadoras',
                target_id: targetId,
                target_code: details?.nome || null,
                details: typeof details === 'object' ? JSON.stringify(details) : (details || null)
            });
        } catch (e) {
            console.error('[transportadoras] logActivity:', e.message);
        }
    }

    // ─── AUDITORIA (por responsável + mês/ano) ──────────────
    router.get('/auditoria', requireAuth, requireAdmin, async (req, res) => {
        try {
            const responsavel = (req.query.responsavel || '').trim().toUpperCase();
            if (!responsavel) {
                return res.status(400).json({ error: 'Selecione um responsável' });
            }

            const mes = parseInt(req.query.mes, 10);
            const ano = parseInt(req.query.ano, 10);
            if (isNaN(mes) || isNaN(ano)) {
                return res.status(400).json({ error: 'Mês/ano inválidos' });
            }

            const start = new Date(Date.UTC(ano, mes, 1, 0, 0, 0));
            const end   = new Date(Date.UTC(ano, mes + 1, 1, 0, 0, 0));

            const { data, error } = await admin
                .from('activity_logs')
                .select('*')
                .eq('module', 'transportadoras')
                .eq('username', responsavel)
                .gte('created_at', start.toISOString())
                .lt('created_at', end.toISOString())
                .order('created_at', { ascending: false })
                .limit(500);
            if (error) throw error;
            res.json(data || []);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // ─── LISTAR ─────────────────────────────────────────────
    router.get('/', requireAuth, async (req, res) => {
        try {
            const page  = Math.max(1, parseInt(req.query.page)  || 1);
            const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 200), 500);
            const from  = (page - 1) * limit;
            const to    = from + limit - 1;
            const search = (req.query.search || '').trim();
            const mes = req.query.mes !== undefined ? parseInt(req.query.mes, 10) : null;
            const ano = req.query.ano !== undefined ? parseInt(req.query.ano, 10) : null;

            let query = admin
                .from('transportadoras')
                .select('*', { count: 'exact' })
                .order('nome', { ascending: true })
                .range(from, to);

            if (search) {
                const s = search.replace(/[%_\\]/g, '\\$&');
                query = query.or(
                    `nome.ilike.%${s}%,representante.ilike.%${s}%,email.ilike.%${s}%`
                );
            }

            if (mes !== null && ano !== null && !isNaN(mes) && !isNaN(ano)) {
                const start = new Date(Date.UTC(ano, mes, 1, 0, 0, 0));
                const end   = new Date(Date.UTC(ano, mes + 1, 1, 0, 0, 0));
                query = query
                    .gte('timestamp', start.toISOString())
                    .lt('timestamp', end.toISOString());
            }

            const { data, error, count } = await query;
            if (error) throw error;

            if (req.query.page) {
                return res.json({ data: data || [], total: count || 0, page, limit });
            }
            res.json(data || []);
        } catch (err) {
            console.error('GET /transportadoras:', err.message);
            res.status(500).json({ error: 'Erro ao listar transportadoras' });
        }
    });

    // ─── BUSCAR POR ID ──────────────────────────────────────
    router.get('/:id', requireAuth, async (req, res) => {
        try {
            const id = req.params.id;
            if (!id || id === 'undefined' || id === 'null') {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const { data, error } = await admin
                .from('transportadoras')
                .select('*')
                .eq('id', id)
                .maybeSingle();
            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Transportadora não encontrada' });
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao buscar transportadora' });
        }
    });

    // ─── CRIAR ──────────────────────────────────────────────
    router.post('/', requireAuth, async (req, res) => {
        try {
            const { nome, representante, email, telefones, celulares, regioes, estados } = req.body || {};

            if (!nome) {
                return res.status(400).json({ error: 'Nome é obrigatório' });
            }

            const responsavel = nomeResponsavel(req.user);

            const { data, error } = await admin
                .from('transportadoras')
                .insert([{
                    nome:          toUpperCase(nome).trim(),
                    representante: toUpperCase(representante || '').trim(),
                    email:         toLowerCase(email || '').trim(),
                    telefones:     Array.isArray(telefones) ? telefones : [],
                    celulares:     Array.isArray(celulares) ? celulares : [],
                    regioes:       Array.isArray(regioes)   ? regioes.map(toUpperCase) : [],
                    estados:       Array.isArray(estados)   ? estados.map(toUpperCase) : [],
                    responsavel:   responsavel,
                    timestamp:     new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            await audit(req, 'create', data.id, { nome: data.nome });

            res.status(201).json(data);
        } catch (err) {
            console.error('POST /transportadoras:', err.message);
            res.status(500).json({ error: 'Erro ao criar transportadora' });
        }
    });

    // ─── ATUALIZAR ──────────────────────────────────────────
    router.put('/:id', requireAuth, async (req, res) => {
        try {
            const id = req.params.id;
            if (!id || id === 'undefined' || id === 'null') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            const { nome, representante, email, telefones, celulares, regioes, estados } = req.body || {};

            if (!nome) {
                return res.status(400).json({ error: 'Nome é obrigatório' });
            }

            const responsavel = nomeResponsavel(req.user);

            const { data, error } = await admin
                .from('transportadoras')
                .update({
                    nome:          toUpperCase(nome).trim(),
                    representante: toUpperCase(representante || '').trim(),
                    email:         toLowerCase(email || '').trim(),
                    telefones:     Array.isArray(telefones) ? telefones : [],
                    celulares:     Array.isArray(celulares) ? celulares : [],
                    regioes:       Array.isArray(regioes)   ? regioes.map(toUpperCase) : [],
                    estados:       Array.isArray(estados)   ? estados.map(toUpperCase) : [],
                    responsavel:   responsavel
                })
                .eq('id', id)
                .select()
                .maybeSingle();

            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Transportadora não encontrada' });

            await audit(req, 'update', data.id, { nome: data.nome });

            res.json(data);
        } catch (err) {
            console.error('PUT /transportadoras/:id:', err.message);
            res.status(500).json({ error: 'Erro ao atualizar transportadora' });
        }
    });

    // ─── EXCLUIR ────────────────────────────────────────────
    router.delete('/:id', requireAuth, async (req, res) => {
        try {
            const id = req.params.id;
            if (!id || id === 'undefined' || id === 'null') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            const { data: existing } = await admin
                .from('transportadoras')
                .select('nome')
                .eq('id', id)
                .maybeSingle();
            if (!existing) return res.status(404).json({ error: 'Transportadora não encontrada' });

            const { error } = await admin
                .from('transportadoras')
                .delete()
                .eq('id', id);
            if (error) throw error;

            await audit(req, 'delete', id, { nome: existing.nome });

            res.json({ success: true });
        } catch (err) {
            console.error('DELETE /transportadoras/:id:', err.message);
            res.status(500).json({ error: 'Erro ao excluir transportadora' });
        }
    });

    return router;
};

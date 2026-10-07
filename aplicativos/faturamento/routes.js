// ============================================
// PEDIDOS DE FATURAMENTO - routes.js
// ============================================
const express = require('express');
const crypto = require('crypto');

function verifyToken(token, secret) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    try {
        const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
        const a = Buffer.from(sig), b = Buffer.from(expected);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch { return null; }
}

module.exports = function (supabase, supabaseAdmin) {
    const router = express.Router();
    const db = supabaseAdmin || supabase;
    const SESSION_SECRET = process.env.SESSION_SECRET;

    async function requireAuth(req, res, next) {
        try {
            const auth = req.headers['authorization'];
            const headerToken = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
            const token = req.headers['x-session-token'] || headerToken;
            const payload = verifyToken(token, SESSION_SECRET);
            if (!payload?.uid) return res.status(401).json({ error: 'Sessão inválida' });

            const { data: profile, error } = await db
                .from('profiles')
                .select('id, code, username, name, sector, is_admin, is_active, apps')
                .eq('id', payload.uid)
                .maybeSingle();

            if (error || !profile || !profile.is_active) {
                return res.status(401).json({ error: 'Sessão inválida' });
            }

            const allowed = profile.is_admin || (Array.isArray(profile.apps) && profile.apps.includes('faturamento'));
            if (!allowed) return res.status(403).json({ error: 'Acesso negado a este módulo' });

            req.user = profile;
            next();
        } catch (err) {
            console.error('[faturamento auth]', err.message);
            res.status(500).json({ error: 'Erro interno de autenticação' });
        }
    }

    router.use(requireAuth);

    // ── Helper: range de mês ─────────────────────────────────────────────────
    function buildDateRange(mes, ano) {
        const m = parseInt(mes);
        const y = parseInt(ano);
        if (isNaN(m) || isNaN(y)) return null;
        // data_registro é do tipo date (YYYY-MM-DD)
        const mm   = String(m + 1).padStart(2, '0');
        const last = new Date(y, m + 1, 0).getDate();
        return {
            start: `${y}-${mm}-01`,
            end:   `${y}-${mm}-${String(last).padStart(2, '0')}`
        };
    }

    // GET /api/pedidos/me — retorna dados do usuário autenticado
    router.get('/me', (req, res) => {
        if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
        res.json(req.user);
    });

    // GET /api/pedidos — lista pedidos (filtro por mês/ano via data_registro)
    router.get('/', async (req, res) => {
        try {
            const { mes, ano, responsavel, status } = req.query;

            let query = db
                .from('pedidos_faturamento')
                .select('*')
                .order('codigo', { ascending: true });

            if (mes !== undefined && ano !== undefined) {
                const range = buildDateRange(mes, ano);
                if (range) {
                    query = query
                        .gte('data_registro', range.start)
                        .lte('data_registro', range.end);
                }
            }

            if (responsavel) query = query.eq('responsavel', responsavel);
            if (status)      query = query.eq('status', status);

            const { data, error } = await query;
            if (error) throw error;
            res.json(data);
        } catch (err) {
            console.error('Erro ao listar pedidos:', err.message);
            res.status(500).json({ error: 'Erro ao listar pedidos' });
        }
    });

    // GET /api/pedidos/ultimo-numero — próximo código sequencial
    router.get('/ultimo-numero', async (req, res) => {
        try {
            const { data, error } = await db
                .from('pedidos_faturamento')
                .select('codigo')
                .order('codigo', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            const proximo = data ? data.codigo + 1 : 1;
            res.json({ proximo });
        } catch (err) {
            console.error('Erro ao obter último número:', err.message);
            res.status(500).json({ error: 'Erro ao obter último número' });
        }
    });

    // GET /api/pedidos/:id
    router.get('/:id', async (req, res) => {
        try {
            const { data, error } = await db
                .from('pedidos_faturamento')
                .select('*')
                .eq('id', req.params.id)
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Pedido não encontrado' });
            res.json(data);
        } catch (err) {
            console.error('Erro ao buscar pedido:', err.message);
            res.status(500).json({ error: 'Erro ao buscar pedido' });
        }
    });

    // POST /api/pedidos — cria novo pedido (código gerado pelo banco via sequence)
    router.post('/', async (req, res) => {
        try {
            const payload = { ...req.body };
            delete payload.id;     // o banco gera o UUID
            delete payload.codigo; // o banco gera via serial / unique constraint

            // Obtém o próximo código manualmente (sem race condition em mono-tenant)
            const { data: last } = await db
                .from('pedidos_faturamento')
                .select('codigo')
                .order('codigo', { ascending: false })
                .limit(1)
                .maybeSingle();

            payload.codigo      = last ? last.codigo + 1 : 1;
            payload.created_at  = new Date().toISOString();
            payload.updated_at  = new Date().toISOString();
            payload.timestamp   = new Date().toISOString();

            const { data, error } = await db
                .from('pedidos_faturamento')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;
            res.status(201).json(data);
        } catch (err) {
            console.error('Erro ao criar pedido:', err.message);
            res.status(500).json({ error: 'Erro ao criar pedido' });
        }
    });

    // PUT /api/pedidos/:id — atualização completa
    router.put('/:id', async (req, res) => {
        try {
            const payload = { ...req.body };
            delete payload.id;
            payload.updated_at = new Date().toISOString();

            const { data, error } = await db
                .from('pedidos_faturamento')
                .update(payload)
                .eq('id', req.params.id)
                .select()
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Pedido não encontrado' });
            res.json(data);
        } catch (err) {
            console.error('Erro ao atualizar pedido:', err.message);
            res.status(500).json({ error: 'Erro ao atualizar pedido' });
        }
    });

    // PATCH /api/pedidos/:id — atualização parcial (status, data_emissao, etc.)
    router.patch('/:id', async (req, res) => {
        try {
            const payload = { ...req.body };
            delete payload.id;
            payload.updated_at = new Date().toISOString();

            const { data, error } = await db
                .from('pedidos_faturamento')
                .update(payload)
                .eq('id', req.params.id)
                .select()
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Pedido não encontrado' });
            res.json(data);
        } catch (err) {
            console.error('Erro ao atualizar pedido (patch):', err.message);
            res.status(500).json({ error: 'Erro ao atualizar pedido' });
        }
    });

    // DELETE /api/pedidos/:id
    router.delete('/:id', async (req, res) => {
        try {
            const { error } = await db
                .from('pedidos_faturamento')
                .delete()
                .eq('id', req.params.id);

            if (error) throw error;
            res.json({ success: true });
        } catch (err) {
            console.error('Erro ao excluir pedido:', err.message);
            res.status(500).json({ error: 'Erro ao excluir pedido' });
        }
    });

    // ── Estoque usado pelo fluxo de emissão ──────────────────────────────────
    // O módulo de estoque ainda não possui uma tela própria neste projeto,
    // mas o faturamento precisa consultar e atualizar quantidades.
    router.get('/estoque', async (req, res) => {
        try {
            const { data, error } = await db
                .from('estoque')
                .select('*')
                .order('codigo', { ascending: true });

            if (error) throw error;
            res.json(data || []);
        } catch (err) {
            console.error('Erro ao listar estoque:', err.message);
            res.status(500).json({ error: 'Erro ao listar estoque' });
        }
    });

    router.patch('/estoque/:codigo', async (req, res) => {
        try {
            if (req.body?.quantidade === undefined) {
                return res.status(400).json({ error: 'Quantidade não informada' });
            }

            const quantidade = Number(req.body.quantidade);
            if (!Number.isFinite(quantidade) || quantidade < 0) {
                return res.status(400).json({ error: 'Quantidade inválida' });
            }

            const { data, error } = await db
                .from('estoque')
                .update({ quantidade, updated_at: new Date().toISOString() })
                .eq('codigo', req.params.codigo)
                .select()
                .maybeSingle();

            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Item de estoque não encontrado' });
            res.json(data);
        } catch (err) {
            console.error('Erro ao atualizar estoque:', err.message);
            res.status(500).json({ error: 'Erro ao atualizar estoque' });
        }
    });

    return router;
};

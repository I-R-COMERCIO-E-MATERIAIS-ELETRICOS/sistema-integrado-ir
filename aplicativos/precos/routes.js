const express = require('express');
const crypto = require('crypto');
const { randomUUID } = require('crypto');

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

        if (!profile || !profile.is_active) {
            return res.status(401).json({ error: 'Sessão inválida' });
        }

        if (!profile.is_admin) {
            const apps = Array.isArray(profile.apps) ? profile.apps : [];
            if (!apps.includes('precos')) {
                return res.status(403).json({ error: 'Sem acesso ao módulo' });
            }
        }

        req.user = profile;
        next();
    }

    router.head('/', (req, res) => res.status(200).end());

    // ─── MARCAS ─────────────────────────────────────────────
    router.get('/marcas', requireAuth, async (req, res) => {
        try {
            const { data, error } = await supabaseAdmin
                .from('precos')
                .select('marca')
                .not('marca', 'is', null);

            if (error) return res.status(500).json({ error: 'Erro ao buscar marcas: ' + error.message });

            const marcas = [
                ...new Set(
                    (data || [])
                        .map(p => (p.marca || '').trim().toUpperCase())
                        .filter(m => m.length > 0)
                )
            ].sort();

            res.json(marcas);
        } catch (e) {
            res.status(500).json({ error: 'Erro interno ao buscar marcas' });
        }
    });

    // ─── LISTAR ─────────────────────────────────────────────
    router.get('/', requireAuth, async (req, res) => {
        try {
            const page  = Math.max(1, parseInt(req.query.page)  || 1);
            const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 50), 50);
            const marca  = (req.query.marca  || '').trim();
            const search = (req.query.search || '').trim() || null;
            const from   = (page - 1) * limit;
            const to     = from + limit - 1;

            let query = supabaseAdmin
                .from('precos')
                .select('*', { count: 'exact' })
                .order('marca',  { ascending: true })
                .order('codigo', { ascending: true });

            if (marca && marca.toUpperCase() !== 'TODAS') {
                query = query.ilike('marca', marca);
            }

            if (search) {
                const s = search.replace(/[%_\\]/g, '\\$&');
                query = query.or(`codigo.ilike.%${s}%,marca.ilike.%${s}%,descricao.ilike.%${s}%,vendedor.ilike.%${s}%`);
            }

            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) return res.status(500).json({ error: 'Erro ao buscar preços: ' + error.message });

            const normalized = (data || []).map(p => ({
                id:         p.id,
                marca:      (p.marca     || '').trim().toUpperCase(),
                codigo:     (p.codigo    || '').trim(),
                preco:      parseFloat(p.preco) || 0,
                descricao:  (p.descricao || '').trim().toUpperCase(),
                vendedor:   (p.vendedor  || '').trim() || null,
                timestamp:  p.timestamp  || null,
                marca_nome: (p.marca     || '').trim().toUpperCase()
            }));

            const total      = typeof count === 'number' ? count : normalized.length;
            const totalPages = Math.max(1, Math.ceil(total / limit));

            res.json({ data: normalized, total, page, limit, totalPages });
        } catch (e) {
            console.error('Erro GET /precos:', e);
            res.status(500).json({ error: 'Erro interno ao buscar preços' });
        }
    });

    // ─── BUSCAR POR ID ──────────────────────────────────────
    router.get('/:id', requireAuth, async (req, res) => {
        try {
            const id = req.params.id;
            if (!id || id === 'undefined' || id === 'null') {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const { data, error } = await supabaseAdmin
                .from('precos')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) return res.status(500).json({ error: 'Erro ao buscar preço: ' + error.message });
            if (!data) return res.status(404).json({ error: 'Preço não encontrado' });

            res.json({
                ...data,
                marca:      (data.marca     || '').trim().toUpperCase(),
                descricao:  (data.descricao || '').trim().toUpperCase(),
                vendedor:   (data.vendedor  || '').trim() || null,
                marca_nome: (data.marca     || '').trim().toUpperCase()
            });
        } catch (e) {
            res.status(500).json({ error: 'Erro interno ao buscar preço' });
        }
    });

    // ─── CRIAR ──────────────────────────────────────────────
    router.post('/', requireAuth, async (req, res) => {
        try {
            const { marca, codigo, preco, descricao } = req.body || {};

            if (!marca || !codigo || preco === undefined || preco === null || !descricao) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
            }

            const precoNum = parseFloat(preco);
            if (isNaN(precoNum) || precoNum <= 0) {
                return res.status(400).json({ error: 'Preço deve ser um número maior que zero' });
            }

            const codigoNorm    = String(codigo).trim();
            const marcaNorm     = String(marca).trim().toUpperCase();
            const descricaoNorm = String(descricao).trim().toUpperCase();

            if (!codigoNorm || !marcaNorm || !descricaoNorm) {
                return res.status(400).json({ error: 'Campos não podem ser vazios após formatação' });
            }

            // Bloqueio de código duplicado (case-insensitive, trim)
            const { data: existing } = await supabaseAdmin
                .from('precos')
                .select('id')
                .ilike('codigo', codigoNorm)
                .maybeSingle();

            if (existing) {
                return res.status(409).json({ error: 'Já existe um preço cadastrado com este código' });
            }

            // Vendedor = nome do usuário logado (não vem do front)
            const vendedor = req.user.name || req.user.username || null;

            const { data, error } = await supabaseAdmin
                .from('precos')
                .insert([{
                    id:        randomUUID(),
                    marca:     marcaNorm,
                    codigo:    codigoNorm,
                    preco:     precoNum,
                    descricao: descricaoNorm,
                    vendedor:  vendedor,
                    timestamp: new Date().toISOString()
                }])
                .select('*')
                .single();

            if (error) return res.status(500).json({ error: 'Erro ao criar preço: ' + error.message });

            res.status(201).json({
                ...data,
                marca_nome: (data.marca || '').trim().toUpperCase()
            });
        } catch (e) {
            console.error('Erro POST /precos:', e);
            res.status(500).json({ error: 'Erro interno ao criar preço' });
        }
    });

    // ─── ATUALIZAR (vendedor NÃO muda) ──────────────────────
    router.put('/:id', requireAuth, async (req, res) => {
        try {
            const id = req.params.id;
            if (!id || id === 'undefined' || id === 'null') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            const { marca, codigo, preco, descricao } = req.body || {};

            if (!marca || !codigo || preco === undefined || preco === null || !descricao) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
            }

            const precoNum = parseFloat(preco);
            if (isNaN(precoNum) || precoNum <= 0) {
                return res.status(400).json({ error: 'Preço deve ser um número maior que zero' });
            }

            const codigoNorm    = String(codigo).trim();
            const marcaNorm     = String(marca).trim().toUpperCase();
            const descricaoNorm = String(descricao).trim().toUpperCase();

            // Bloqueio de código duplicado (excluindo o próprio)
            const { data: existing } = await supabaseAdmin
                .from('precos')
                .select('id')
                .ilike('codigo', codigoNorm)
                .neq('id', id)
                .maybeSingle();

            if (existing) {
                return res.status(409).json({ error: 'Já existe outro preço cadastrado com este código' });
            }

            const { data, error } = await supabaseAdmin
                .from('precos')
                .update({
                    marca:     marcaNorm,
                    codigo:    codigoNorm,
                    preco:     precoNum,
                    descricao: descricaoNorm,
                    timestamp: new Date().toISOString()
                })
                .eq('id', id)
                .select('*')
                .maybeSingle();

            if (error) return res.status(500).json({ error: 'Erro ao atualizar preço: ' + error.message });
            if (!data) return res.status(404).json({ error: 'Preço não encontrado' });

            res.json({
                ...data,
                marca_nome: (data.marca || '').trim().toUpperCase()
            });
        } catch (e) {
            console.error('Erro PUT /precos:', e);
            res.status(500).json({ error: 'Erro interno ao atualizar preço' });
        }
    });

    // ─── EXCLUIR ────────────────────────────────────────────
    router.delete('/:id', requireAuth, async (req, res) => {
        try {
            const id = req.params.id;
            if (!id || id === 'undefined' || id === 'null') {
                return res.status(400).json({ error: 'ID inválido' });
            }

            const { data: existing } = await supabaseAdmin
                .from('precos')
                .select('id')
                .eq('id', id)
                .maybeSingle();

            if (!existing) return res.status(404).json({ error: 'Preço não encontrado' });

            const { error } = await supabaseAdmin
                .from('precos')
                .delete()
                .eq('id', id);

            if (error) return res.status(500).json({ error: 'Erro ao excluir preço: ' + error.message });
            res.status(204).end();
        } catch (e) {
            res.status(500).json({ error: 'Erro interno ao excluir preço' });
        }
    });

    return router;
};

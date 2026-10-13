const { primeiroNome, podeConfirmar } = require('../../lib/helpers');

module.exports = function (supabase) {
    const router = require('express').Router();

    function buildDateRange(mes, ano) {
        const m = parseInt(mes);
        const y = parseInt(ano);
        if (isNaN(m) || isNaN(y)) return null;
        const mm = String(m + 1).padStart(2, '0');
        const last = new Date(y, m + 1, 0).getDate();
        return { start: `${y}-${mm}-01`, end: `${y}-${mm}-${String(last).padStart(2, '0')}` };
    }

    router.get('/me', (req, res) => {
        if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
        res.json(req.user);
    });

    router.get('/', async (req, res) => {
        try {
            const { mes, ano, responsavel, status } = req.query;
            let query = supabase.from('pedidos_faturamento').select('*').order('codigo', { ascending: true });
            if (mes !== undefined && ano !== undefined) {
                const range = buildDateRange(mes, ano);
                if (range) query = query.gte('data_registro', range.start).lte('data_registro', range.end);
            }
            if (responsavel) query = query.eq('responsavel', responsavel);
            if (status) query = query.eq('status', status);
            const { data, error } = await query;
            if (error) throw error;
            res.json(data);
        } catch (err) {
            console.error('Erro ao listar pedidos:', err.message);
            res.status(500).json({ error: 'Erro ao listar pedidos' });
        }
    });

    router.get('/ultimo-numero', async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('pedidos_faturamento').select('codigo')
                .order('codigo', { ascending: false }).limit(1).maybeSingle();
            if (error) throw error;
            res.json({ proximo: data ? data.codigo + 1 : 1 });
        } catch (err) {
            console.error('Erro ao obter último número:', err.message);
            res.status(500).json({ error: 'Erro ao obter último número' });
        }
    });

    router.get('/:id', async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('pedidos_faturamento').select('*').eq('id', req.params.id).single();
            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Pedido não encontrado' });
            res.json(data);
        } catch (err) {
            console.error('Erro ao buscar pedido:', err.message);
            res.status(500).json({ error: 'Erro ao buscar pedido' });
        }
    });

    router.post('/', async (req, res) => {
        try {
            const payload = { ...req.body };
            delete payload.id;
            delete payload.codigo;
            const { data: last } = await supabase
                .from('pedidos_faturamento').select('codigo')
                .order('codigo', { ascending: false }).limit(1).maybeSingle();
            payload.codigo = last ? last.codigo + 1 : 1;
            payload.created_at = new Date().toISOString();
            payload.updated_at = new Date().toISOString();
            payload.timestamp = new Date().toISOString();
            payload.atualizado_por = primeiroNome(req.user) || null;
            payload.ultima_atualizacao = new Date().toISOString();
            const { data, error } = await supabase
                .from('pedidos_faturamento').insert([payload]).select().single();
            if (error) throw error;
            res.status(201).json(data);
        } catch (err) {
            console.error('Erro ao criar pedido:', err.message);
            res.status(500).json({ error: 'Erro ao criar pedido' });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const payload = { ...req.body };
            delete payload.id;
            payload.updated_at = new Date().toISOString();
            payload.atualizado_por = primeiroNome(req.user) || null;
            payload.ultima_atualizacao = new Date().toISOString();
            const { data, error } = await supabase
                .from('pedidos_faturamento').update(payload).eq('id', req.params.id).select().single();
            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Pedido não encontrado' });
            res.json(data);
        } catch (err) {
            console.error('Erro ao atualizar pedido:', err.message);
            res.status(500).json({ error: 'Erro ao atualizar pedido' });
        }
    });

    router.patch('/:id', async (req, res) => {
        try {
            const payload = { ...req.body };
            delete payload.id;
            if (('status' in payload || 'data_emissao' in payload || 'numero_nf' in payload) && !podeConfirmar(req.user, 'FINANCEIRO')) {
                return res.status(403).json({ error: 'Somente o setor Financeiro e administradores podem realizar esta ação' });
            }
            payload.updated_at = new Date().toISOString();
            payload.atualizado_por = primeiroNome(req.user) || null;
            payload.ultima_atualizacao = new Date().toISOString();
            const { data, error } = await supabase
                .from('pedidos_faturamento').update(payload).eq('id', req.params.id).select().single();
            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Pedido não encontrado' });
            res.json(data);
        } catch (err) {
            console.error('Erro ao atualizar pedido (patch):', err.message);
            res.status(500).json({ error: 'Erro ao atualizar pedido' });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            const { error } = await supabase.from('pedidos_faturamento').delete().eq('id', req.params.id);
            if (error) throw error;
            res.json({ success: true });
        } catch (err) {
            console.error('Erro ao excluir pedido:', err.message);
            res.status(500).json({ error: 'Erro ao excluir pedido' });
        }
    });

    router.get('/estoque-items/all', async (req, res) => {
        try {
            const { data, error } = await supabase.from('estoque').select('*').order('codigo', { ascending: true });
            if (error) throw error;
            res.json(data);
        } catch (err) {
            console.error('Erro ao listar estoque:', err.message);
            res.status(500).json({ error: 'Erro ao listar estoque' });
        }
    });

    return router;
};

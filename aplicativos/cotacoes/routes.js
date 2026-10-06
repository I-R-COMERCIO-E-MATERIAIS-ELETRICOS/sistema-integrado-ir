const express = require('express');
module.exports = function (supabase) {
    const router = express.Router();

    function buildDateRange(mes, ano) {
        const m = parseInt(mes, 10), y = parseInt(ano, 10);
        if (isNaN(m) || isNaN(y)) return null;
        const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
        const nextMonth = new Date(Date.UTC(y, m + 1, 1));
        const end = `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, '0')}-01`;
        return { start, end };
    }

    // Health check público (não exige sessão)
    router.get('/health', (req, res) => {
        res.json({ status: 'ok', module: 'cotacoes', ts: new Date().toISOString() });
    });

    // Próximo código sequencial (usado ao abrir o form)
    router.get('/ultimo-codigo', async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('cotacoes')
                .select('codigo')
                .order('codigo', { ascending: false })
                .limit(1);
            if (error) throw error;
            const ultimo = data && data[0] ? parseInt(data[0].codigo) || 0 : 0;
            res.json({ ultimoCodigo: ultimo });
        } catch (err) {
            res.status(500).json({ error: 'Erro ao buscar último código' });
        }
    });

    router.get('/', async (req, res) => {
        try {
            const { mes, ano, transportadora, responsavel, status } = req.query;
            let query = supabase
                .from('cotacoes')
                .select('*')
                .order('dataCotacao', { ascending: false, nullsFirst: false })
                .order('createdat', { ascending: false, nullsFirst: false });

            if (mes !== undefined && ano !== undefined) {
                const range = buildDateRange(mes, ano);
                if (range) query = query.gte('dataCotacao', range.start).lt('dataCotacao', range.end);
            }
            if (transportadora) query = query.eq('transportadora', transportadora);
            if (responsavel)    query = query.eq('responsavel', responsavel);
            if (status === 'aprovada')  query = query.eq('negocioFechado', true);
            if (status === 'reprovada') query = query.eq('negocioFechado', false);

            const { data, error } = await query;
            if (error) throw error;
            res.json(data || []);
        } catch (err) {
            console.error('GET /cotacoes:', err.message);
            res.status(500).json({ error: 'Erro ao listar cotações' });
        }
    });

    router.get('/:id', async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('cotacoes')
                .select('*')
                .eq('id', req.params.id)
                .maybeSingle();
            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Cotação não encontrada' });
            res.json(data);
        } catch (err) { res.status(500).json({ error: 'Erro ao buscar cotação' }); }
    });

    router.post('/', async (req, res) => {
        try {
            const payload = { ...req.body };
            // Remove id/codigo se vierem, pra deixar o banco gerar
            delete payload.id;
            delete payload.codigo;

            payload.createdat = payload.createdat || new Date().toISOString();
            payload.timestamp = payload.timestamp || new Date().toISOString();
            payload.updatedat = new Date().toISOString();

            // Gera o próximo codigo
            const { data: last } = await supabase
                .from('cotacoes')
                .select('codigo')
                .order('codigo', { ascending: false })
                .limit(1);
            const proxCodigo = (last && last[0] ? parseInt(last[0].codigo) || 0 : 0) + 1;
            payload.codigo = proxCodigo;

            const { data, error } = await supabase.from('cotacoes').insert([payload]).select().single();
            if (error) throw error;
            res.status(201).json(data);
        } catch (err) {
            console.error('POST /cotacoes:', err.message);
            res.status(500).json({ error: 'Erro ao criar cotação' });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const payload = { ...req.body };
            payload.updatedat = new Date().toISOString();
            delete payload.id;
            delete payload.createdat;
            delete payload.codigo;

            const { data, error } = await supabase
                .from('cotacoes')
                .update(payload)
                .eq('id', req.params.id)
                .select()
                .single();
            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Cotação não encontrada' });
            res.json(data);
        } catch (err) { res.status(500).json({ error: 'Erro ao atualizar cotação' }); }
    });

    router.patch('/:id', async (req, res) => {
        try {
            const payload = { ...req.body };
            payload.updatedat = new Date().toISOString();
            delete payload.id;
            delete payload.codigo;

            const { data, error } = await supabase
                .from('cotacoes')
                .update(payload)
                .eq('id', req.params.id)
                .select()
                .single();
            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Cotação não encontrada' });
            res.json(data);
        } catch (err) { res.status(500).json({ error: 'Erro ao atualizar cotação' }); }
    });

    router.delete('/:id', async (req, res) => {
        try {
            const { error } = await supabase.from('cotacoes').delete().eq('id', req.params.id);
            if (error) throw error;
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: 'Erro ao excluir cotação' }); }
    });

    router.post('/import', async (req, res) => {
        try {
            const cotacoes = req.body;
            if (!Array.isArray(cotacoes) || cotacoes.length === 0) {
                return res.status(400).json({ error: 'Envie um array de cotações.' });
            }
            const inseridas = [];
            for (const cotacao of cotacoes) {
                const payload = {
                    dataCotacao: cotacao.dataCotacao || cotacao.data_cotacao || '',
                    transportadora: cotacao.transportadora || '',
                    destino: cotacao.destino || '',
                    documento: cotacao.documento || '',
                    numeroCotacao: cotacao.numeroCotacao || cotacao.numero_cotacao || '',
                    valorFrete: cotacao.valorFrete || cotacao.valor_frete || null,
                    previsaoEntrega: cotacao.previsaoEntrega || cotacao.previsao_entrega || null,
                    responsavel: cotacao.responsavel || '',
                    vendedor: cotacao.vendedor || '',
                    responsavelTransportadora: cotacao.responsavelTransportadora || cotacao.responsavel_transportadora || '',
                    canalComunicacao: cotacao.canalComunicacao || cotacao.canal_comunicacao || '',
                    codigoColeta: cotacao.codigoColeta || cotacao.codigo_coleta || '',
                    observacoes: cotacao.observacoes || '',
                    negocioFechado: cotacao.negocioFechado ?? null,
                    createdat: cotacao.createdat || new Date().toISOString(),
                    timestamp: cotacao.timestamp || new Date().toISOString(),
                    updatedat: new Date().toISOString()
                };
                const { data, error } = await supabase.from('cotacoes').insert([payload]).select().single();
                if (error) throw error;
                inseridas.push(data);
            }
            res.status(201).json({ message: `${inseridas.length} cotações importadas`, data: inseridas });
        } catch (err) { res.status(500).json({ error: 'Erro na importação', details: err.message }); }
    });

    return router;
};

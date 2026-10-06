const express = require('express');
module.exports = function (supabase, supabaseAdmin) {
    const router = express.Router();
    const db = supabaseAdmin || supabase;


    // Health check público (não exige sessão)
    router.get('/health', (req, res) => {
        res.json({ status: 'ok', module: 'cotacoes', ts: new Date().toISOString() });
    });

    // Próximo código sequencial (usado ao abrir o form)
    router.get('/ultimo-codigo', async (req, res) => {
        try {
            const { data, error } = await db
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
            const allRows = [];
            const pageSize = 1000;
            for (let offset = 0; ; offset += pageSize) {
                const { data: page, error } = await db
                    .from('cotacoes')
                    .select('*')
                    .order('createdat', { ascending: false, nullsFirst: false })
                    .range(offset, offset + pageSize - 1);
                if (error) throw error;
                allRows.push(...(page || []));
                if (!page || page.length < pageSize) break;
            }

            const normalizarData = value => {
                const raw = String(value || '').trim();
                if (!raw) return null;
                let m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
                if (m) return { mes: Number(m[2]) - 1, ano: Number(m[3]) };
                m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (m) return { mes: Number(m[2]) - 1, ano: Number(m[1]) };
                const d = new Date(raw);
                if (!isNaN(d.getTime())) return { mes: d.getMonth(), ano: d.getFullYear() };
                return null;
            };

            let result = Array.isArray(allRows) ? allRows : [];
            if (mes !== undefined && ano !== undefined) {
                const m = parseInt(mes, 10), y = parseInt(ano, 10);
                if (!Number.isNaN(m) && !Number.isNaN(y)) {
                    result = result.filter(row => {
                        const d = normalizarData(row.dataCotacao);
                        return d && d.mes === m && d.ano === y;
                    });
                }
            }
            if (transportadora) result = result.filter(r => r.transportadora === transportadora);
            if (responsavel) result = result.filter(r => r.responsavel === responsavel);
            if (status === 'aprovada') result = result.filter(r => r.negocioFechado === true);
            if (status === 'reprovada') result = result.filter(r => r.negocioFechado === false);

            result.sort((a, b) => {
                const na = parseInt(a.codigo ?? a.numeroCotacao, 10) || 0;
                const nb = parseInt(b.codigo ?? b.numeroCotacao, 10) || 0;
                return nb - na;
            });
            res.json(result);
        } catch (err) {
            console.error('GET /cotacoes:', err.message);
            res.status(500).json({ error: 'Erro ao listar cotações', details: err.message });
        }
    });
    router.get('/:id', async (req, res) => {
        try {
            const { data, error } = await db
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
            payload.atualizado_por = payload.atualizadoPor || payload.atualizado_por || payload.responsavel || '';
            delete payload.atualizadoPor;

            // A numeração é reservada no momento do INSERT através de uma sequence
            // do PostgreSQL, evitando colisão quando dois usuários salvam simultaneamente.
            const { data: seqValue, error: seqError } = await db.rpc('proximo_codigo_cotacao');
            if (seqError) throw seqError;
            const proxCodigo = Number(seqValue);
            if (!Number.isFinite(proxCodigo)) throw new Error('Número de cotação inválido');
            payload.codigo = proxCodigo;
            payload.numeroCotacao = String(proxCodigo);

            // Data e responsável de criação são definidos no servidor.
            payload.dataCotacao = payload.dataCotacao || new Date().toLocaleDateString('pt-BR');
            payload.responsavel = payload.responsavel || payload.atualizado_por || '';

            const { data, error } = await db.from('cotacoes').insert([payload]).select().single();
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
            payload.atualizado_por = payload.atualizadoPor || payload.atualizado_por || payload.responsavel || '';
            delete payload.atualizadoPor;
            delete payload.id;
            delete payload.createdat;
            delete payload.codigo;

            const { data, error } = await db
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
            payload.atualizado_por = payload.atualizadoPor || payload.atualizado_por || payload.responsavel || '';
            delete payload.atualizadoPor;
            delete payload.id;
            delete payload.codigo;

            const { data, error } = await db
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
            const { error } = await db.from('cotacoes').delete().eq('id', req.params.id);
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
                const { data: seqValue, error: seqError } = await db.rpc('proximo_codigo_cotacao');
                if (seqError) throw seqError;
                const proxCodigo = Number(seqValue);
                const payload = {
                    dataCotacao: cotacao.dataCotacao || cotacao.data_cotacao || new Date().toLocaleDateString('pt-BR'),
                    codigo: proxCodigo,
                    transportadora: cotacao.transportadora || '',
                    destino: cotacao.destino || '',
                    documento: cotacao.documento || '',
                    numeroCotacao: String(proxCodigo),
                    valorFrete: cotacao.valorFrete || cotacao.valor_frete || null,
                    previsaoEntrega: cotacao.previsaoEntrega || cotacao.previsao_entrega || null,
                    responsavel: cotacao.responsavel || '',
                    vendedor: cotacao.vendedor || '',
                    responsavelTransportadora: cotacao.responsavelTransportadora || cotacao.responsavel_transportadora || '',
                    canalComunicacao: cotacao.canalComunicacao || cotacao.canal_comunicacao || '',
                    codigoColeta: cotacao.codigoColeta || cotacao.codigo_coleta || '',
                    negocioFechado: cotacao.negocioFechado ?? null,
                    createdat: cotacao.createdat || new Date().toISOString(),
                    timestamp: cotacao.timestamp || new Date().toISOString(),
                    updatedat: new Date().toISOString()
                };
                const { data, error } = await db.from('cotacoes').insert([payload]).select().single();
                if (error) throw error;
                inseridas.push(data);
            }
            res.status(201).json({ message: `${inseridas.length} cotações importadas`, data: inseridas });
        } catch (err) { res.status(500).json({ error: 'Erro na importação', details: err.message }); }
    });

    return router;
};

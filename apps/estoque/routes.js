// apps/estoque/routes.js
const express = require('express');

module.exports = function (supabase) {
    const router = express.Router();

    const norm = s => String(s == null ? '' : s).trim();
    const up   = s => norm(s).toUpperCase();

    function obterUsuario(req) {
        const u = req.user || {};
        const nome = u.name || u.username || '';
        const primeiro = String(nome).trim().split(/\s+/)[0];
        return up(primeiro) || null;
    }

    // GRUPOS
    router.get('/estoque/grupos', async (req, res) => {
        try {
            const { data, error } = await supabase.from('estoque_grupos').select('*').order('nome', { ascending: true });
            if (error) throw error;
            res.json(data || []);
        } catch (e) { res.status(500).json({ error: 'Erro ao listar grupos' }); }
    });

    router.post('/estoque/grupos', async (req, res) => {
        try {
            const nome = up(req.body?.nome);
            const abreviacao = up(req.body?.abreviacao);
            if (!nome) return res.status(400).json({ error: 'Informe o nome do grupo' });
            if (!/^[A-Z]{4}$/.test(abreviacao)) return res.status(400).json({ error: 'A abreviação deve ter exatamente 4 letras' });

            const { data: existing } = await supabase.from('estoque_grupos').select('id').eq('abreviacao', abreviacao).maybeSingle();
            if (existing) return res.status(409).json({ error: `A abreviação ${abreviacao} já existe` });

            const { data, error } = await supabase.from('estoque_grupos').insert([{ nome, abreviacao, ultimo_sequencial: 0 }]).select('*').single();
            if (error) throw error;
            res.status(201).json(data);
        } catch (e) { res.status(500).json({ error: 'Erro ao criar grupo' }); }
    });

    // MOVIMENTAÇÕES
    router.get('/estoque/:id/movimentacoes', async (req, res) => {
        try {
            const { data, error } = await supabase.from('estoque_movimentacoes').select('*').eq('estoque_id', req.params.id).order('created_at', { ascending: false });
            if (error) throw error;
            res.json(data || []);
        } catch (e) { res.status(500).json({ error: 'Erro ao listar movimentações' }); }
    });

    router.post('/estoque/:id/movimentacao', async (req, res) => {
        try {
            const tipo = String(req.body?.tipo || '').toLowerCase();
            const quantidade = parseInt(req.body?.quantidade, 10);
            if (tipo !== 'entrada' && tipo !== 'saida') return res.status(400).json({ error: 'Tipo inválido' });
            if (!Number.isInteger(quantidade) || quantidade <= 0) return res.status(400).json({ error: 'Quantidade inválida' });

            const { data: item, error: e1 } = await supabase.from('estoque').select('*').eq('id', req.params.id).maybeSingle();
            if (e1) throw e1;
            if (!item) return res.status(404).json({ error: 'Item não encontrado' });

            const delta = tipo === 'entrada' ? quantidade : -quantidade;
            const novaQtd = Number(item.quantidade || 0) + delta;
            if (novaQtd < 0) return res.status(400).json({ error: 'Quantidade em estoque insuficiente' });

            const usuario = obterUsuario(req);
            const now = new Date().toISOString();

            await supabase.from('estoque').update({ quantidade: novaQtd, atualizado_por: usuario, ultima_atualizacao: now }).eq('id', item.id);

            const { data: mov, error: e3 } = await supabase.from('estoque_movimentacoes').insert([{
                estoque_id: item.id, codigo_estoque: item.codigo, numero_pedido: null, tipo, quantidade, atualizado_por: usuario, ultima_atualizacao: now
            }]).select('*').single();
            if (e3) throw e3;

            res.status(201).json({ item: { ...item, quantidade: novaQtd }, movimentacao: mov });
        } catch (e) { res.status(500).json({ error: 'Erro ao registrar movimentação' }); }
    });

    // PATCH por CÓDIGO
    router.patch('/estoque/:codigo', async (req, res) => {
        try {
            const codigo = String(req.params.codigo || '').trim();
            const body = req.body || {};
            const { data: item, error: e1 } = await supabase.from('estoque').select('*').eq('codigo', codigo).maybeSingle();
            if (e1) throw e1;
            if (!item) return res.status(404).json({ error: 'Item não encontrado' });

            const novaQtd = body.quantidade !== undefined ? parseInt(body.quantidade, 10) : Number(item.quantidade || 0);
            if (!Number.isInteger(novaQtd)) return res.status(400).json({ error: 'Quantidade inválida' });

            const usuario = body.atualizado_por ? up(String(body.atualizado_por).trim().split(/\s+/)[0]) : obterUsuario(req);
            const now = new Date().toISOString();

            const { data: updated, error: e2 } = await supabase.from('estoque').update({ quantidade: novaQtd, atualizado_por: usuario, ultima_atualizacao: now }).eq('id', item.id).select('*').single();
            if (e2) throw e2;

            const delta = novaQtd - Number(item.quantidade || 0);
            if (delta !== 0) {
                const tipo = delta > 0 ? 'entrada' : 'saida';
                const numeroPedido = body.numero_pedido != null ? parseInt(body.numero_pedido, 10) : null;
                await supabase.from('estoque_movimentacoes').insert([{
                    estoque_id: item.id, codigo_estoque: item.codigo, numero_pedido: Number.isInteger(numeroPedido) ? numeroPedido : null, tipo, quantidade: Math.abs(delta), atualizado_por: usuario, ultima_atualizacao: now
                }]);
            }
            res.json(updated);
        } catch (e) { res.status(500).json({ error: 'Erro ao atualizar estoque' }); }
    });

    // CRUD
    router.get('/estoque', async (req, res) => {
        try {
            const { data, error } = await supabase.from('estoque').select('*').order('codigo', { ascending: true });
            if (error) throw error;
            res.json(data || []);
        } catch (e) { res.status(500).json({ error: 'Erro ao listar estoque' }); }
    });

    router.post('/estoque', async (req, res) => {
        try {
            const b = req.body || {};
            const descricao = up(b.descricao);
            const grupo = up(b.grupo);
            const valorUnitario = parseFloat(b.valor_unitario) || 0;
            const quantidadeInicial = parseInt(b.quantidade, 10) || 0;
            const marca = up(b.marca);
            const modelo = up(b.modelo);
            const ncm = norm(b.ncm);

            if (!descricao) return res.status(400).json({ error: 'Descrição é obrigatória' });
            if (!/^[A-Z]{4}$/.test(grupo)) return res.status(400).json({ error: 'Grupo inválido' });
            if (valorUnitario < 0) return res.status(400).json({ error: 'Valor unitário inválido' });
            if (quantidadeInicial < 0) return res.status(400).json({ error: 'Quantidade inválida' });

            const { data: g } = await supabase.from('estoque_grupos').select('*').eq('abreviacao', grupo).maybeSingle();
            if (!g) return res.status(400).json({ error: 'Grupo não cadastrado' });

            if (modelo) {
                const { data: dup } = await supabase.from('estoque').select('id, modelo').ilike('modelo', modelo).maybeSingle();
                if (dup) return res.status(409).json({ error: `O modelo ${modelo} já possui cadastro` });
            }

            const seq = (g.ultimo_sequencial || 0) + 1;
            const codigo = grupo + String(seq).padStart(4, '0');
            await supabase.from('estoque_grupos').update({ ultimo_sequencial: seq }).eq('id', g.id);

            const usuario = obterUsuario(req);
            const now = new Date().toISOString();

            const { data, error } = await supabase.from('estoque').insert([{
                codigo, descricao, grupo, valor_unitario: valorUnitario, quantidade: quantidadeInicial, marca: marca || null, modelo: modelo || null, ncm: ncm || null, atualizado_por: usuario, ultima_atualizacao: now
            }]).select('*').single();
            if (error) throw error;
            res.status(201).json(data);
        } catch (e) { res.status(500).json({ error: 'Erro ao criar item' }); }
    });

    // ATUALIZAÇÃO (CORRIGIDA: agora aceita marca, modelo e ncm)
    router.put('/estoque/:id', async (req, res) => {
        try {
            const b = req.body || {};
            const descricao = up(b.descricao);
            const grupo = up(b.grupo);
            const valorUnitario = parseFloat(b.valor_unitario) || 0;
            const marca = up(b.marca);   
            const modelo = up(b.modelo); 
            const ncm = norm(b.ncm);     

            if (!descricao) return res.status(400).json({ error: 'Descrição é obrigatória' });
            if (!/^[A-Z]{4}$/.test(grupo)) return res.status(400).json({ error: 'Grupo inválido' });
            if (valorUnitario < 0) return res.status(400).json({ error: 'Valor unitário inválido' });

            const { data: g } = await supabase.from('estoque_grupos').select('id').eq('abreviacao', grupo).maybeSingle();
            if (!g) return res.status(400).json({ error: 'Grupo não cadastrado' });

            if (modelo) {
                const { data: dup } = await supabase.from('estoque').select('id, modelo').ilike('modelo', modelo).neq('id', req.params.id).maybeSingle();
                if (dup) return res.status(409).json({ error: `O modelo ${modelo} já possui cadastro` });
            }

            const usuario = obterUsuario(req);
            const now = new Date().toISOString();

            const { data, error } = await supabase.from('estoque').update({
                descricao, grupo, valor_unitario: valorUnitario, marca: marca || null, modelo: modelo || null, ncm: ncm || null, atualizado_por: usuario, ultima_atualizacao: now
            }).eq('id', req.params.id).select('*').maybeSingle();
            
            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Item não encontrado' });
            res.json(data);
        } catch (e) { res.status(500).json({ error: 'Erro ao atualizar item' }); }
    });

    router.delete('/estoque/:id', async (req, res) => {
        try {
            const { error } = await supabase.from('estoque').delete().eq('id', req.params.id);
            if (error) throw error;
            res.status(204).end();
        } catch (e) { res.status(500).json({ error: 'Erro ao excluir item' }); }
    });

    return router;
};

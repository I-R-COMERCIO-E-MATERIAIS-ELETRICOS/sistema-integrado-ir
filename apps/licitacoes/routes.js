const express = require('express');
module.exports = function (supabase) {
  const router = express.Router();
  const table = 'licitacoes';
  const bankTable = 'bancos';
  const clean = (v) => v === undefined ? null : v;

  router.get('/licitacoes/opcoes', async (req, res) => {
    try {
      const [{ data: profiles, error: pErr }, { data: banks, error: bErr }] = await Promise.all([
        supabase.from('profiles').select('id,name,username,is_admin,is_active,apps').eq('is_active', true).order('name'),
        supabase.from(bankTable).select('*').order('nome_banco')
      ]);
      if (pErr) throw pErr;
      if (bErr && !String(bErr.message || '').includes('does not exist')) throw bErr;
      const users = (profiles || []).filter(p => p.is_admin || (Array.isArray(p.apps) ? p.apps : []).includes('licitacoes')).map(p => ({ id:p.id, name:p.name || p.username }));
      res.json({ users, banks: banks || [] });
    } catch (e) { res.status(500).json({ error:e.message, hint:'Confira a execução do arquivo apps/licitacoes/schema.sql no Supabase.' }); }
  });

  router.get('/licitacoes', async (req,res) => {
    try { const {data,error}=await supabase.from(table).select('*').order('created_at',{ascending:false}); if(error) throw error; res.json(data||[]); }
    catch(e){res.status(500).json({error:e.message});}
  });
  router.get('/licitacoes/:id', async (req,res) => {
    try { const {data,error}=await supabase.from(table).select('*').eq('id',req.params.id).single(); if(error) throw error; res.json(data); }
    catch(e){res.status(404).json({error:e.message});}
  });
  router.post('/licitacoes', async (req,res) => {
    try {
      const b=req.body||{}; const row={ vendedor_id:clean(b.vendedorId), vendedor:clean(b.vendedor), numero_pregao:clean(b.numeroPregao), uasg:clean(b.uasg), nome_orgao:clean(b.nomeOrgao), cidade:clean(b.cidade), uf:clean(b.uf), telefone:clean(b.telefone), email:clean(b.email), requisitos:b.requisitos||{}, banco_pagamento:clean(b.bancoPagamento), validade_proposta:clean(b.validadeProposta), prazo_entrega:clean(b.prazoEntrega), prazo_pagamento:clean(b.prazoPagamento), items:Array.isArray(b.items)?b.items:[], atualizado_por:req.user?.name||req.user?.username||b.vendedor||null, ultima_atualizacao:new Date().toISOString() };
      const {data,error}=await supabase.from(table).insert(row).select('*').single(); if(error) throw error; res.status(201).json(data);
    } catch(e){res.status(500).json({error:e.message});}
  });
  router.put('/licitacoes/:id', async (req,res) => {
    try {
      const b=req.body||{}; const row={ vendedor_id:clean(b.vendedorId), vendedor:clean(b.vendedor), numero_pregao:clean(b.numeroPregao), uasg:clean(b.uasg), nome_orgao:clean(b.nomeOrgao), cidade:clean(b.cidade), uf:clean(b.uf), telefone:clean(b.telefone), email:clean(b.email), requisitos:b.requisitos||{}, banco_pagamento:clean(b.bancoPagamento), validade_proposta:clean(b.validadeProposta), prazo_entrega:clean(b.prazoEntrega), prazo_pagamento:clean(b.prazoPagamento), items:Array.isArray(b.items)?b.items:[], atualizado_por:req.user?.name||req.user?.username||b.vendedor||null, ultima_atualizacao:new Date().toISOString() };
      const {data,error}=await supabase.from(table).update(row).eq('id',req.params.id).select('*').single(); if(error) throw error; res.json(data);
    } catch(e){res.status(500).json({error:e.message});}
  });
  router.delete('/licitacoes/:id', async (req,res) => {
    try {const {error}=await supabase.from(table).delete().eq('id',req.params.id);if(error)throw error;res.status(204).end();}
    catch(e){res.status(500).json({error:e.message});}
  });
  router.get('/licitacoes-bancos', async (req,res) => {
    try {const {data,error}=await supabase.from(bankTable).select('*').order('nome_banco');if(error)throw error;res.json(data||[]);}
    catch(e){res.status(500).json({error:e.message});}
  });
  router.post('/licitacoes-bancos', async (req,res) => {
    try {const b=req.body||{};const {data,error}=await supabase.from(bankTable).upsert({nome_banco:b.nomeBanco,agencia:b.agencia,conta_corrente:b.contaCorrente},{onConflict:'nome_banco'}).select('*').single();if(error)throw error;res.json(data);}
    catch(e){res.status(500).json({error:e.message});}
  });
  return router;
};

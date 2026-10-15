const express = require('express');

module.exports = function (supabase) {
  const router = express.Router();
  const table = 'licitacoes';
  const bankTable = 'bancos';

  const clean = (v) => v === undefined ? null : v;
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  async function loadSessionUser(token) {
    if (!token) return null;
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('user_id, expires_at, is_active')
        .eq('token', token)
        .maybeSingle();
      if (error || !session) return null;
      if (session.is_active === false) return null;
      if (session.expires_at && new Date(session.expires_at) < new Date()) return null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, username, is_admin, is_active')
        .eq('id', session.user_id)
        .maybeSingle();
      if (!profile) return null;
      if (profile.is_active === false) return null;
      return profile;
    } catch (e) { return null; }
  }

  async function requireAuth(req, res, next) {
    if (req.user) return next();
    const token = req.headers['x-session-token'] ||
                  (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Sessão não fornecida' });
    const user = await loadSessionUser(token);
    if (!user) return res.status(401).json({ error: 'Sessão inválida ou expirada' });
    req.user = user;
    req.sessionToken = token;
    next();
  }

  router.use(requireAuth);

  router.get('/licitacoes/opcoes', async (req, res) => {
    try {
      const [{ data: profiles, error: pErr }, { data: banks, error: bErr }] = await Promise.all([
        supabase.from('profiles').select('id,name,username,is_admin,is_active,apps').eq('is_active', true).order('name'),
        supabase.from(bankTable).select('*').order('nome_banco')
      ]);
      if (pErr) throw pErr;
      if (bErr && !String(bErr.message || '').includes('does not exist')) throw bErr;
      const users = (profiles || [])
        .filter(p => p.is_admin || (Array.isArray(p.apps) ? p.apps : []).includes('licitacoes'))
        .map(p => ({ id: p.id, name: p.name || p.username }));
      res.json({ users, banks: banks || [] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/licitacoes/stats', async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).select('id,data_pregao,horario_pregao,ganho,status');
      if (error) throw error;
      const today = todayStr();
      const nowMs = Date.now();
      const all = data || [];
      let total = all.length, ganhos = 0, disputa = 0, realizados = 0, pulse = false;
      for (const r of all) {
        if (r.ganho) { ganhos++; continue; }
        const s = String(r.status || '').toLowerCase();
        const d = r.data_pregao || '';
        if (d === today) {
          disputa++;
          if (r.horario_pregao) {
            const [h, m] = r.horario_pregao.split(':').map(Number);
            const dt = new Date(); dt.setHours(h || 0, m || 0, 0, 0);
            if (dt.getTime() <= nowMs) pulse = true;
          } else pulse = true;
        } else if (d && d < today && !['suspenso','encerrado','cancelado'].includes(s)) {
          realizados++;
        }
      }
      res.json({ total, ganhos, disputa, realizados, pulse });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/licitacoes/disputa-hoje', async (req, res) => {
    try {
      const today = todayStr();
      const { data, error } = await supabase.from(table)
        .select('id,numero_pregao,vendedor,nome_orgao')
        .eq('data_pregao', today)
        .order('horario_pregao', { ascending: true, nullsFirst: false });
      if (error) throw error;
      res.json(data || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/licitacoes', async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const perPage = 20;
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      const search = String(req.query.search || '').trim();
      const vendedor = String(req.query.vendedor || '').trim().toUpperCase();
      const status = String(req.query.status || '').trim();
      const today = todayStr();

      let query = supabase.from(table).select('*', { count: 'exact' });

      if (search) {
        const s = search.replace(/[%,()*.:\\'"]/g, '').trim();
        if (s) {
          query = query.or(
            `numero_pregao.ilike.%${s}%,` +
            `uasg.ilike.%${s}%,` +
            `vendedor.ilike.%${s}%,` +
            `nome_orgao.ilike.%${s}%,` +
            `cidade.ilike.%${s}%`
          );
        }
      }
      if (vendedor) query = query.eq('vendedor', vendedor);

      if (status === 'ganhos') {
        query = query.eq('ganho', true);
      } else if (status === 'disputa') {
        query = query.eq('data_pregao', today).eq('ganho', false);
      } else if (status === 'realizados') {
        query = query
          .lt('data_pregao', today)
          .eq('ganho', false)
          .or('status.is.null,status.eq.,status.eq.agendado');
      }

      query = query
        .order('data_pregao', { ascending: true, nullsFirst: false })
        .order('horario_pregao', { ascending: true, nullsFirst: false })
        .range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      const total = count || 0;
      const pages = Math.max(1, Math.ceil(total / perPage));
      res.json({ data: data || [], total, page, perPage, pages });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/licitacoes/:id', async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).select('*').eq('id', req.params.id).maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Licitação não encontrada' });
      res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  function buildRow(b, req) {
    const stRaw = String(b.status || '').toLowerCase();
    const status = ['suspenso','encerrado','cancelado'].includes(stRaw) ? stRaw : '';
    return {
      vendedor_id: clean(b.vendedorId),
      vendedor: clean(b.vendedor),
      numero_pregao: clean(b.numeroPregao),
      uasg: clean(b.uasg),
      nome_orgao: clean(b.nomeOrgao),
      cidade: clean(b.cidade),
      uf: clean(b.uf),
      telefone: clean(b.telefone),
      email: clean(b.email),
      data_pregao: clean(b.dataPregao),
      horario_pregao: clean(b.horarioPregao),
      modalidade: clean(b.modalidade) || 'ABERTO',
      requisitos: b.requisitos || {},
      banco_pagamento: clean(b.bancoPagamento) || 'BANCO DO BRASIL',
      status,
      validade_proposta: clean(b.validadeProposta),
      prazo_entrega: clean(b.prazoEntrega),
      prazo_pagamento: clean(b.prazoPagamento),
      items: Array.isArray(b.items) ? b.items : [],
      atualizado_por: req.user?.name || req.user?.username || b.vendedor || null,
      ultima_atualizacao: new Date().toISOString()
    };
  }

  router.post('/licitacoes', async (req, res) => {
    try {
      const row = buildRow(req.body || {}, req);
      row.ganho = false;
      const { data, error } = await supabase.from(table).insert(row).select('*').single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.put('/licitacoes/:id', async (req, res) => {
    try {
      const row = buildRow(req.body || {}, req);
      delete row.ganho;
      const { data, error } = await supabase.from(table).update(row).eq('id', req.params.id).select('*').maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Licitação não encontrada' });
      res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.patch('/licitacoes/:id/ganho', async (req, res) => {
    try {
      const ganho = !!req.body?.ganho;
      const update = {
        ganho,
        atualizado_por: req.user?.name || req.user?.username || null,
        ultima_atualizacao: new Date().toISOString()
      };
      const { data, error } = await supabase.from(table).update(update).eq('id', req.params.id).select('*').maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Licitação não encontrada' });
      res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.delete('/licitacoes/:id', async (req, res) => {
    try {
      const { error } = await supabase.from(table).delete().eq('id', req.params.id);
      if (error) throw error;
      res.status(204).end();
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/licitacoes-bancos', async (req, res) => {
    try {
      const { data, error } = await supabase.from(bankTable).select('*').order('nome_banco');
      if (error) throw error;
      res.json(data || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};

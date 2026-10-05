require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log('✅ Supabase conectado');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const STATIC_EXTENSIONS = /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$/i;

async function verificarAutenticacao(req, res, next) {
    if (req.path === '/' || req.path === '/health' || req.path === '/api/health' ||
        req.path === '/api/supabase-config' || req.path === '/api/verify-session' ||
        req.path.startsWith('/api/portal/') ||
        req.path.startsWith('/api/cotacoes/health') ||
        STATIC_EXTENSIONS.test(req.path)) {
        return next();
    }
    const sessionToken = req.headers['x-session-token'] || req.query.sessionToken;
    if (!sessionToken) {
        if (req.headers.accept && req.headers.accept.includes('text/html'))
            return res.redirect('/portal?redirect=' + encodeURIComponent(req.path));
        return res.status(401).json({ error: 'Não autenticado' });
    }
    try {
        const { data: session, error } = await supabase
            .from('active_sessions')
            .select('*, users(id, username, name, is_admin, is_active, sector, apps)')
            .eq('session_token', sessionToken)
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString())
            .single();
        if (error || !session || !session.users || !session.users.is_active)
            return res.status(401).json({ error: 'Sessão inválida' });
        req.user = session.users;
        req.session = session;
        req.sessionToken = sessionToken;
        next();
    } catch (e) {
        return res.status(500).json({ error: 'Erro ao verificar sessão' });
    }
}

app.get('/health', (req, res) => res.json({ status: 'ok', supabase: true, ts: new Date().toISOString() }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', supabase: true, ts: new Date().toISOString() }));

app.get('/api/supabase-config', (req, res) => {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
    if (!url || !anonKey) return res.status(500).json({ error: 'Configuração incompleta' });
    res.json({ url, anonKey });
});

const APPS = ['portal','precos','compra','transportadoras','cotacoes','faturamento','frete','receber','vendas','pagar','lucro','licitacoes','estoque'];
const APPS_ROOT = path.join(__dirname, 'aplicativos');

console.log('📂 Módulos em:', APPS_ROOT);

APPS.forEach(appName => {
    const appPath = path.join(APPS_ROOT, appName);
    if (fs.existsSync(appPath)) {
        app.use(`/${appName}/assets`, express.static(appPath));
        app.get(`/${appName}`, (req, res) => res.sendFile(path.join(appPath, 'index.html')));
        app.get(`/${appName}/`, (req, res) => res.sendFile(path.join(appPath, 'index.html')));
        app.use(`/${appName}`, express.static(appPath, { index: false, dotfiles: 'deny' }));
        console.log(`✅ Servindo /${appName}`);
    } else {
        console.log(`⚠️  Pasta não encontrada: ${appPath}`);
    }
});

app.use((req, res, next) => {
    if (!STATIC_EXTENSIONS.test(req.path)) return next();
    const referer = req.get('Referer') || '';
    let matchedApp = null;
    for (const appName of APPS) if (referer.includes(`/${appName}`)) { matchedApp = appName; break; }
    if (!matchedApp) return next();
    const filePath = path.join(APPS_ROOT, matchedApp, req.path.replace(/^\//, ''));
    if (fs.existsSync(filePath)) return res.sendFile(filePath);
    next();
});

app.get('/', (req, res) => {
    const p = path.join(APPS_ROOT, 'portal', 'index.html');
    if (fs.existsSync(p)) return res.sendFile(p);
    res.json({ message: 'I.R. Comércio', apps: APPS.filter(a => fs.existsSync(path.join(APPS_ROOT, a))) });
});

app.post('/api/verify-session', async (req, res) => {
    try {
        const { sessionToken } = req.body || {};
        if (!sessionToken) return res.json({ valid: false });
        const { data: session, error } = await supabase
            .from('active_sessions')
            .select('*, users(id, username, name, is_admin, is_active, sector, apps)')
            .eq('session_token', sessionToken)
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString())
            .single();
        if (error || !session || !session.users || !session.users.is_active) return res.json({ valid: false });
        res.json({ valid: true, session: session.users });
    } catch { res.status(500).json({ valid: false }); }
});

function mount(relPath, mountPath, nome) {
    try {
        const mod = require(relPath);
        if (typeof mod === 'function') {
            app.use(mountPath, mod(supabase, supabase));
            console.log(`✅ Rota ${mountPath}`);
        } else {
            console.log(`⚠️  ${nome}: export não é função`);
        }
    } catch (e) {
        console.log(`⚠️  ${nome} não carregado: ${e.message}`);
    }
}

mount('./aplicativos/portal/routes',          '/api/portal',          'portal');
mount('./aplicativos/cotacoes/routes',        '/api/cotacoes',        'cotacoes');
mount('./aplicativos/precos/routes',          '/api/precos',          'precos');
mount('./aplicativos/transportadoras/routes', '/api/transportadoras', 'transportadoras');
mount('./aplicativos/faturamento/routes',     '/api/pedidos',         'faturamento');
mount('./aplicativos/frete/routes',           '/api/fretes',          'frete');
mount('./aplicativos/receber/routes',         '/api/receber',         'receber');
mount('./aplicativos/vendas/routes',          '/api/vendas',          'vendas');
mount('./aplicativos/compra/routes',          '/api',                 'compra');
mount('./aplicativos/lucro/routes',           '/api',                 'lucro');
mount('./aplicativos/pagar/routes',           '/api',                 'pagar');

app.use('/api', verificarAutenticacao);

app.post('/api/notifications', async (req, res) => {
    try {
        const { message } = req.body || {};
        if (!message) return res.status(400).json({ error: 'Mensagem inválida' });
        const { data, error } = await supabase.from('compranotifications').insert({ message }).select().single();
        if (error) throw error;
        res.status(201).json({ id: data.id });
    } catch { res.status(500).json({ error: 'Erro interno' }); }
});
app.get('/api/notifications', async (req, res) => {
    try {
        const { data, error } = await supabase.from('compranotifications').select('*').order('created_at', { ascending: false }).limit(50);
        if (error) throw error;
        res.json(data || []);
    } catch { res.status(500).json({ error: 'Erro' }); }
});

app.get('/api/estoque', async (req, res) => {
    try {
        const { data, error } = await supabase.from('estoque').select('*').order('codigo');
        if (error) throw error;
        res.json(data || []);
    } catch { res.status(500).json({ error: 'Erro' }); }
});

app.use((err, req, res, next) => {
    console.error('Erro:', err.message);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: 'Erro interno' });
});

app.use((req, res) => {
    res.status(404).json({ error: '404 - Rota não encontrada', path: req.path });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Servidor rodando na porta ${PORT}\n`);
});

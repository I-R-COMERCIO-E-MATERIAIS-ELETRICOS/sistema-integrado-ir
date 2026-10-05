require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','PATCH','HEAD','OPTIONS'], allowedHeaders: ['Content-Type','Authorization','X-Session-Token'] }));
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
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao verificar autenticação' });
    }
}

app.get('/health', async (req, res) => {
    try {
        const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        res.json({ status: error ? 'unhealthy' : 'healthy', database: error ? 'disconnected' : 'connected', timestamp: new Date().toISOString() });
    } catch { res.json({ status: 'unhealthy', timestamp: new Date().toISOString() }); }
});
app.get('/api/health', async (req, res) => {
    try {
        const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        res.json({ status: error ? 'unhealthy' : 'healthy', database: error ? 'disconnected' : 'connected', timestamp: new Date().toISOString() });
    } catch { res.json({ status: 'unhealthy', timestamp: new Date().toISOString() }); }
});

app.get('/api/supabase-config', (req, res) => {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
    if (!url || !anonKey) return res.status(500).json({ error: 'Configuração incompleta' });
    res.json({ url, anonKey });
});

const APPS = ['portal','precos','compra','transportadoras','cotacoes','faturamento','frete','receber','vendas','pagar','lucro','licitacoes','estoque'];

APPS.forEach(appName => {
    const appPath = path.join(__dirname, 'aplicativos', appName);
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
    const filePath = path.join(__dirname, 'aplicativos', matchedApp, req.path.replace(/^\//, ''));
    if (fs.existsSync(filePath)) return res.sendFile(filePath);
    next();
});

app.get('/', (req, res) => {
    const p = path.join(__dirname, 'aplicativos', 'portal', 'index.html');
    if (fs.existsSync(p)) res.sendFile(p);
    else res.json({ message: 'I.R. Comércio', apps: APPS.map(a => `/${a}`) });
});

// Carrega módulos em try/catch para não crashar se algum não existir
function carregarModulo(relPath, mountPath, nome) {
    try {
        const mod = require(relPath);
        app.use(mountPath, mod(supabase));
        console.log(`✅ Rota ${mountPath}`);
    } catch (e) {
        console.log(`⚠️  ${nome} não carregado: ${e.message}`);
    }
}

carregarModulo('./aplicativos/portal/routes',         '/api/portal',         'portal');
carregarModulo('./aplicativos/cotacoes/routes',       '/api/cotacoes',       'cotacoes');
carregarModulo('./aplicativos/precos/routes',         '/api/precos',         'precos');
carregarModulo('./aplicativos/transportadoras/routes','/api/transportadoras','transportadoras');
carregarModulo('./aplicativos/faturamento/routes',    '/api/pedidos',        'faturamento');
carregarModulo('./aplicativos/frete/routes',          '/api/fretes',         'frete');
carregarModulo('./aplicativos/receber/routes',        '/api/receber',        'receber');
carregarModulo('./aplicativos/vendas/routes',         '/api/vendas',         'vendas');

app.post('/api/verify-session', async (req, res) => {
    try {
        const { sessionToken } = req.body;
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

// Aplica auth nas rotas /api restantes (menos as já montadas acima)
app.use('/api', verificarAutenticacao);

try {
    const compraRoutes = require('./aplicativos/compra/routes');
    app.use('/api', compraRoutes(supabase));
    console.log('✅ Rota /api (compra)');
} catch (e) { console.log(`⚠️  compra não carregado: ${e.message}`); }

try {
    const lucroRoutes = require('./aplicativos/lucro/routes');
    app.use('/api', lucroRoutes(supabase));
    console.log('✅ Rota /api (lucro)');
} catch (e) { console.log(`⚠️  lucro não carregado: ${e.message}`); }

try {
    const pagarRoutes = require('./aplicativos/pagar/routes');
    app.use('/api', pagarRoutes(supabase));
    console.log('✅ Rota /api (pagar)');
} catch (e) { console.log(`⚠️  pagar não carregado: ${e.message}`); }

app.post('/api/notifications', async (req, res) => {
    try {
        const { message } = req.body;
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
    try { const { data, error } = await supabase.from('estoque').select('*').order('codigo'); if (error) throw error; res.json(data); }
    catch { res.status(500).json({ error: 'Erro' }); }
});

app.use((req, res) => { res.status(404).json({ error: '404 - Rota não encontrada', path: req.path }); });
app.use((error, req, res, next) => { console.error('Erro:', error.message); res.status(500).json({ error: 'Erro interno' }); });

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Servidor rodando na porta ${PORT}`);
    console.log(`✅ Supabase conectado\n`);
    APPS.forEach(a => console.log(`  ${fs.existsSync(path.join(__dirname,'aplicativos',a)) ? '✅' : '⚠️ '} /${a}`));
    console.log('');
});

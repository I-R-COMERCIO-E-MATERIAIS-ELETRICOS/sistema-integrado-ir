require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { normalizarApps } = require('./lib/helpers');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !process.env.SESSION_SECRET) {
    console.error('❌ Configure SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY e SESSION_SECRET');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});
const supabaseAdmin = supabase;

// ─── MIDDLEWARES ──────────────────────────────────────────────────────────────
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token']
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── LOG DE ACESSOS ───────────────────────────────────────────────────────────
const logFilePath = path.join(__dirname, 'acessos.log');
let accessCount = 0;
const uniqueIPs = new Set();

function registrarAcesso(req, res, next) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const clientIP = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.socket.remoteAddress;
    const cleanIP = (clientIP || '').replace('::ffff:', '');
    fs.appendFile(logFilePath, `[${new Date().toISOString()}] ${cleanIP} - ${req.method} ${req.path}\n`, () => {});
    accessCount++;
    uniqueIPs.add(cleanIP);
    next();
}
app.use(registrarAcesso);

setInterval(() => {
    if (accessCount > 0) {
        console.log(`📊 Última hora: ${accessCount} requisições de ${uniqueIPs.size} IPs únicos`);
        accessCount = 0;
        uniqueIPs.clear();
    }
}, 3600000);

// ─── HEALTH CHECKS ───────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
    try {
        const { error } = await supabaseAdmin.from('profiles').select('count', { count: 'exact', head: true });
        res.json({ status: error ? 'unhealthy' : 'healthy', database: error ? 'disconnected' : 'connected', timestamp: new Date().toISOString() });
    } catch {
        res.json({ status: 'unhealthy', timestamp: new Date().toISOString() });
    }
});
app.get('/api/health', (req, res) => res.redirect('/health'));

// ─── AUTENTICAÇÃO CENTRAL ────────────────────────────────────────────────────
const PUBLIC_PATHS = [
    '/', '/health', '/api/health', '/app', '/portal', '/portal/',
    '/login-autenticacao', '/login-autenticacao/',
    '/api/supabase-config', '/api/auth'
];
const STATIC_EXTENSIONS = /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|map)$/i;

function verifySessionToken(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    try {
        const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(body).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const a = Buffer.from(sig);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
        const payload = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(body.length / 4) * 4, '='), 'base64').toString('utf8'));
        if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch { return null; }
}

function horarioBrasilia() {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t)?.value;
    return { day: get('weekday'), minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

function dentroDoExpediente() {
    const { day, minutes } = horarioBrasilia();
    if (day === 'Fri') return minutes >= 8 * 60 + 30 && minutes < 17 * 60;
    if (['Mon', 'Tue', 'Wed', 'Thu'].includes(day)) return minutes >= 8 * 60 + 30 && minutes < 17 * 60 + 30;
    return false;
}

const ROUTE_TO_MODULE = {
    '/api/usuarios':         'usuarios',
    '/api/precos':           'precos',
    '/api/ordens':           'compra',
    '/api/fornecedores':     'compra',
    '/api/transportadoras':  ['transportadoras', 'cotacoes', 'faturamento', 'frete'],
    '/api/cotacoes':         'cotacoes',
    '/api/pedidos':          'faturamento',
    '/api/fretes':           'frete',
    '/api/receber':          'receber',
    '/api/contas':           'pagar',
    '/api/lucro-real':       'lucro',
    '/api/custo-fixo':       'lucro',
    '/api/monitorar-pedidos':'lucro',
    '/api/estoque/grupos':   'estoque',
    '/api/estoque':          ['faturamento', 'estoque'],
    '/api/licitacoes':       'licitacoes'
};

const SHARED_PATHS = ['/api/me', '/api/vendedores', '/api/notifications', '/api/verify-session'];

function moduloDaRota(pathname) {
    for (const prefix of Object.keys(ROUTE_TO_MODULE)) {
        if (pathname === prefix || pathname.startsWith(prefix + '/')) return ROUTE_TO_MODULE[prefix];
    }
    return null;
}

async function verificarAutenticacao(req, res, next) {
    const fullPath = (req.baseUrl || '') + req.path;
    const isPublicPath = PUBLIC_PATHS.some(p => fullPath === p);
    const isStaticAsset = STATIC_EXTENSIONS.test(fullPath);
    if (isPublicPath || isStaticAsset || fullPath.startsWith('/api/auth/') || fullPath === '/api/verify-session' || fullPath.startsWith('/api/portal/')) return next();

    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : (req.headers['x-session-token'] || req.query.sessionToken || req.query.access_token);

    if (!token) {
        if (req.headers.accept && req.headers.accept.includes('text/html')) return res.redirect('/?redirect=' + encodeURIComponent(fullPath));
        return res.status(401).json({ error: 'Não autenticado', redirectToLogin: true });
    }

    try {
        const payload = verifySessionToken(token);
        if (!payload?.uid) return res.status(401).json({ error: 'Sessão inválida', redirectToLogin: true });

        const { data: profile, error } = await supabaseAdmin.from('profiles').select('id, username, name, is_admin, is_active, sector, apps').eq('id', payload.uid).maybeSingle();
        if (error || !profile || !profile.is_active) return res.status(401).json({ error: 'Sessão inválida', redirectToLogin: true });

        if (!profile.is_admin && !dentroDoExpediente()) {
            if (req.headers.accept && req.headers.accept.includes('text/html')) return res.redirect('/');
            return res.status(401).json({ error: 'Sessão encerrada', redirectToLogin: true, silentLogout: true });
        }

        const isShared = SHARED_PATHS.some(p => fullPath === p || fullPath.startsWith(p + '/'));
        if (!profile.is_admin && !isShared) {
            const modulo = moduloDaRota(fullPath);
            const exigidos = Array.isArray(modulo) ? modulo : (modulo ? [modulo] : []);
            if (exigidos.length && !exigidos.includes('usuarios')) {
                const apps = normalizarApps(profile.apps);
                if (!exigidos.some(m => apps.includes(m))) {
                    return res.status(403).json({ error: 'Sem acesso a este módulo', moduleDenied: true, module: exigidos[0] });
                }
            }
        }

        req.user = profile;
        req.sessionToken = token;
        next();
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error.message);
        return res.status(500).json({ error: 'Erro ao verificar autenticação' });
    }
}

// ─── CONFIGURAÇÃO DO SUPABASE PARA FRONTEND ─────────────────────────────────
app.get('/api/supabase-config', (req, res) => {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
    if (!url || !anonKey) return res.status(500).json({ error: 'Configuração do Supabase incompleta no servidor' });
    res.json({ url, anonKey });
});

// ─── IMAGENS COMPARTILHADAS ──────────────────────────────────────────────────
app.use('/shared', express.static(path.join(__dirname, 'shared'), { dotfiles: 'deny' }));
app.use('/apps/imagens', express.static(path.join(__dirname, 'apps', 'imagens'), { dotfiles: 'deny', maxAge: '7d' }));
app.use('/imagens', express.static(path.join(__dirname, 'apps', 'imagens'), { dotfiles: 'deny', maxAge: '7d' }));

// ─── ARQUIVOS ESTÁTICOS DOS MÓDULOS E TUTORIAIS ──────────────────────────────
const APPS = [
    'login-autenticacao', 'portal', 'usuarios', 'precos', 'compra',
    'transportadoras', 'cotacoes', 'faturamento', 'frete', 'receber',
    'pagar', 'lucro', 'licitacoes', 'estoque', 
    'tutorial' // O tutorial inteiro é servido daqui
];

const MOBILE_BLOCKED_MODULES = ['tutorial'];

function isBackendFile(filePath) {
    const rel = path.relative(__dirname, filePath).replace(/\\/g, '/');
    return /\/(routes\.js|server\.js)$/i.test(rel) || /\.env/i.test(rel);
}

APPS.forEach(appName => {
    const appPath = path.join(__dirname, 'apps', appName);
    if (!fs.existsSync(appPath)) {
        console.log(`⚠️  Pasta não encontrada: ${appPath}`);
        return;
    }

    const mobileIndexPath = path.join(appPath, 'm', 'index.html');
    const hasMobile = () => fs.existsSync(mobileIndexPath);

    // Redirecionamento mobile
    app.get(`/${appName}`, (req, res, next) => {
        const ua = String(req.headers['user-agent'] || '').toLowerCase();
        const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
        const forceDesktop = req.query && (req.query.force === 'desktop' || req.query.v === 'desktop');

        if (!forceDesktop && isMobileUA && MOBILE_BLOCKED_MODULES.includes(appName)) {
            return res.redirect(302, '/portal/m');
        }

        if (!forceDesktop && isMobileUA && hasMobile()) {
            const originalUrl = req.originalUrl || req.url || '';
            const qi = originalUrl.indexOf('?');
            const qs = qi >= 0 ? originalUrl.substring(qi) : '';
            return res.redirect(302, `/${appName}/m${qs}`);
        }
        next();
    });

    // O express.static serve o index.html E todas as subpastas (ex: /tutorial/compra/)
    app.use(`/${appName}`, express.static(appPath, {
        index: 'index.html',
        dotfiles: 'deny',
        setHeaders: (res, filePath) => { if (isBackendFile(filePath)) res.status(404).end(); }
    }));

    console.log(`✅ Servindo /${appName}${hasMobile() ? `  (mobile: /${appName}/m)` : ''}`);
});

// ─── ROTA RAIZ ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'apps', 'login-autenticacao', 'index.html')));

// ─── API DO PORTAL ───────────────────────────────────────────────────────────
app.use('/api/auth', require('./apps/login-autenticacao/routes')(supabase, supabaseAdmin));
app.use('/api/portal', require('./apps/portal/routes')(supabase, supabaseAdmin));

// ─── MIDDLEWARE DE AUTENTICAÇÃO PARA TODAS AS ROTAS /api ─────────────────────
app.use('/api', verificarAutenticacao);

app.use('/api/usuarios', require('./apps/usuarios/routes')(supabase, supabaseAdmin));

// ─── DADOS COMPARTILHADOS ────────────────────────────────────────────────────
const { primeiroNome } = require('./lib/helpers');

app.get('/api/me', (req, res) => {
    const u = req.user || {};
    res.json({ id: u.id, name: u.name, first_name: primeiroNome(u), username: u.username, sector: u.sector, is_admin: !!u.is_admin, apps: u.apps || [] });
});

app.get('/api/vendedores', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('profiles').select('name, username, sector, is_admin, is_active').eq('is_active', true);
        if (error) throw error;
        const nomes = (data || []).filter(p => p.is_admin || /^(SETOR DE )?VENDAS$/i.test(String(p.sector || '').trim())).map(p => primeiroNome(p)).filter(Boolean);
        res.json([...new Set(nomes)].sort());
    } catch (err) { res.status(500).json({ error: 'Erro ao listar vendedores' }); }
});

// ─── NOTIFICAÇÕES ────────────────────────────────────────────────────────────
app.post('/api/notifications', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Mensagem inválida' });
        const { data, error } = await supabase.from('compranotifications').insert({ message }).select().single();
        if (error) throw error;
        res.status(201).json({ id: data.id });
    } catch (err) { res.status(500).json({ error: 'Erro interno' }); }
});

app.get('/api/notifications', async (req, res) => {
    try {
        const { data, error } = await supabase.from('compranotifications').select('*').order('created_at', { ascending: false }).limit(50);
        if (error) throw error;
        res.json(data || []);
    } catch (err) { res.status(500).json({ error: 'Erro ao buscar notificações' }); }
});

// ─── APIs DE MÓDULOS ─────────────────────────────────────────────────────────
app.use('/api/precos', require('./apps/precos/routes')(supabase));
app.use('/api', require('./apps/licitacoes/routes')(supabase));
app.use('/api', require('./apps/compra/routes')(supabase));
app.use('/api/transportadoras', require('./apps/transportadoras/routes')(supabase));
app.use('/api/cotacoes', require('./apps/cotacoes/routes')(supabase));
app.use('/api/pedidos', require('./apps/faturamento/routes')(supabase));
app.use('/api/fretes', require('./apps/frete/routes')(supabase));
app.use('/api/receber', require('./apps/receber/routes')(supabase));
app.use('/api', require('./apps/lucro/routes')(supabase));
app.use('/api', require('./apps/pagar/routes')(supabase));
app.use('/api', require('./apps/estoque/routes')(supabase));

// ─── VERIFICAÇÃO DE SESSÃO ───────────────────────────────────────────────────
app.post('/api/verify-session', async (req, res) => {
    try {
        const token = req.body?.sessionToken || req.headers['x-session-token'];
        const payload = verifySessionToken(token);
        if (!payload?.uid) return res.status(401).json({ valid: false, error: 'Sessão inválida' });

        const { data: profile, error } = await supabaseAdmin.from('profiles').select('id, code, username, name, sector, is_admin, is_active, apps').eq('id', payload.uid).maybeSingle();
        if (error || !profile || !profile.is_active) return res.status(401).json({ valid: false });
        if (!profile.is_admin && !dentroDoExpediente()) return res.status(401).json({ valid: false, silentLogout: true });

        return res.json({ valid: true, session: profile });
    } catch (err) {
        return res.status(500).json({ valid: false });
    }
});

// ─── 404 / ERROS ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: '404 - Rota não encontrada' });
});

app.use((error, req, res, next) => {
    console.error('Erro interno:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// ─── INICIAR ─────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ I.R. Comércio - Servidor Central rodando na porta ${PORT}`);
    console.log(`✅ Database: Supabase conectado`);
    console.log(`✅ Autenticação: Ativa (via Supabase)\n`);
    APPS.forEach(appName => {
        const appPath = path.join(__dirname, 'apps', appName);
        const mobilePath = path.join(appPath, 'm', 'index.html');
        const status = fs.existsSync(appPath) ? '✅' : '⚠️ ';
        const mobileTag = fs.existsSync(mobilePath) ? ' [mobile ✓]' : '';
        console.log(`  ${status} /${appName}${mobileTag}`);
    });
});

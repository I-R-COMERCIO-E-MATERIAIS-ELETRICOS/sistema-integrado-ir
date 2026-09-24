require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('❌ ERRO: Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
}

// Cliente com anon key: usado apenas para validar JWT de usuário
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com service_role: usado para operações administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ─── MIDDLEWARES ──────────────────────────────────────────────────────────────
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── ARQUIVOS ESTÁTICOS GLOBAIS (imagens do projeto) ─────────────────────────
app.use('/imagens', express.static(path.join(__dirname, 'imagens')));

// ─── LOG DE ACESSOS ───────────────────────────────────────────────────────────
const logFilePath = path.join(__dirname, 'acessos.log');

function registrarAcesso(req, res, next) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const clientIP = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.socket.remoteAddress;
    const cleanIP = (clientIP || '').replace('::ffff:', '');
    fs.appendFile(logFilePath, `[${new Date().toISOString()}] ${cleanIP} - ${req.method} ${req.path}\n`, () => {});
    next();
}
app.use(registrarAcesso);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
    try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        res.json({
            status: error ? 'unhealthy' : 'healthy',
            database: error ? 'disconnected' : 'connected',
            timestamp: new Date().toISOString()
        });
    } catch {
        res.json({ status: 'unhealthy', timestamp: new Date().toISOString() });
    }
});

// ─── MIDDLEWARE: VERIFICAÇÃO DE JWT (Supabase Auth) ─────────────────────────
async function verificarAutenticacao(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Não autenticado', redirectToLogin: true });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Sessão inválida', redirectToLogin: true });
        }

        // Busca dados complementares do usuário na tabela profiles
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('name, sector, is_admin, apps, authorized_ips')
            .eq('id', user.id)
            .single();

        req.user = {
            id: user.id,
            email: user.email,
            name: profile?.name || user.user_metadata?.name || user.email,
            sector: profile?.sector || user.user_metadata?.sector || 'Usuário',
            is_admin: profile?.is_admin || user.app_metadata?.is_admin || false,
            apps: profile?.apps || user.user_metadata?.apps || 'precos',
            authorized_ips: profile?.authorized_ips || user.user_metadata?.authorized_ips || []
        };
        req.accessToken = token;
        next();
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error.message);
        return res.status(500).json({ error: 'Erro ao verificar autenticação' });
    }
}

// ─── ROTAS DO MÓDULO LOGIN ───────────────────────────────────────────────────
const loginRoutes = require('./apps/login-e-autenticacao/routes');
app.use('/api/auth', loginRoutes(supabase, supabaseAdmin));

// ─── ARQUIVOS ESTÁTICOS DOS MÓDULOS ─────────────────────────────────────────
const APPS = ['login-e-autenticacao', 'precos', 'compra', 'vendas'];

APPS.forEach(appName => {
    const appPath = path.join(__dirname, 'apps', appName);
    if (fs.existsSync(appPath)) {
        app.get(`/${appName}`, (req, res) => res.sendFile(path.join(appPath, 'index.html')));
        app.get(`/${appName}/`, (req, res) => res.sendFile(path.join(appPath, 'index.html')));
        app.use(`/${appName}`, express.static(appPath, { index: false, dotfiles: 'deny' }));
        console.log(`✅ Servindo /${appName}`);
    }
});

// ─── ROTA RAIZ → LOGIN ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    const loginPath = path.join(__dirname, 'apps', 'login-e-autenticacao', 'index.html');
    if (fs.existsSync(loginPath)) res.sendFile(loginPath);
    else res.json({ message: 'I.R. Comércio - Sistema Central' });
});

// ─── API PROTEGIDA (exemplo de teste) ─────────────────────────────────────────
app.get('/api/me', verificarAutenticacao, (req, res) => {
    res.json(req.user);
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => { res.status(404).json({ error: '404 - Rota não encontrada' }); });

// ─── TRATAMENTO DE ERROS ──────────────────────────────────────────────────────
app.use((error, req, res, next) => {
    console.error('Erro interno:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// ─── INICIAR ──────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ I.R. Comércio - Servidor Central rodando na porta ${PORT}`);
    console.log(`✅ Database: Supabase conectado`);
    console.log(`✅ Autenticação: Supabase Auth\n`);
    console.log('📡 Rotas registradas:');
    console.log('  GET  /health              → Health check');
    console.log('  POST /api/auth/register   → Criar usuário (admin)');
    console.log('  POST /api/auth/setup-admin → Criar admin inicial');
    console.log('  GET  /api/me              → Dados do usuário logado\n');
});

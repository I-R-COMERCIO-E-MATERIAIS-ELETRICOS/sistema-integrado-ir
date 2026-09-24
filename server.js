require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── SUPABASE ────────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ─── MIDDLEWARES ─────────────────────────────────────────────
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── IMAGENS GLOBAIS (compartilhadas entre módulos) ──────────
app.use('/imagens', express.static(path.join(__dirname, 'aplicativos', 'imagens')));

// ─── HEALTH ──────────────────────────────────────────────────
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

// ─── MÓDULO LOGIN ────────────────────────────────────────────
const loginRoutes = require('./aplicativos/login-e-autenticacao/routes');
app.use('/api/auth', loginRoutes(supabase, supabaseAdmin));

// ─── ARQUIVOS ESTÁTICOS DO MÓDULO LOGIN ──────────────────────
const loginPath = path.join(__dirname, 'aplicativos', 'login-e-autenticacao');

app.get('/login-e-autenticacao', (req, res) => res.sendFile(path.join(loginPath, 'index.html')));
app.get('/login-e-autenticacao/', (req, res) => res.sendFile(path.join(loginPath, 'index.html')));
app.use('/login-e-autenticacao', express.static(loginPath, { index: false, dotfiles: 'deny' }));

// ─── RAIZ → LOGIN ────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(loginPath, 'index.html')));

// ─── 404 ─────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: '404 - Rota não encontrada' }));

// ─── ERROS ───────────────────────────────────────────────────
app.use((error, req, res, next) => {
    console.error('Erro interno:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// ─── INICIAR ─────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ I.R. Comércio — Servidor rodando na porta ${PORT}`);
    console.log(`✅ Supabase conectado`);
    console.log(`✅ Autenticação: Supabase Auth`);
    console.log(`\n📡 Rotas disponíveis:`);
    console.log(`  GET  /                          → Tela de login`);
    console.log(`  GET  /login-e-autenticacao      → Tela de login`);
    console.log(`  GET  /health                    → Health check`);
    console.log(`  GET  /api/auth/config           → Config pública do Supabase`);
    console.log(`  GET  /api/auth/profile          → Perfil do usuário logado`);
    console.log(`  POST /api/auth/users            → Criar usuário (admin)`);
    console.log(`  POST /api/auth/setup-admin      → Criar primeiro admin\n`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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
if (!process.env.SESSION_SECRET) {
    console.error('❌ SESSION_SECRET não configurado');
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

// ─── IMAGENS GLOBAIS ─────────────────────────────────────────
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

// ─── APIs DOS MÓDULOS ────────────────────────────────────────
app.use('/api/auth',     require('./aplicativos/login-e-autenticacao/routes')(supabase, supabaseAdmin));
app.use('/api/portal',   require('./aplicativos/portal/routes')(supabase, supabaseAdmin));
app.use('/api/usuarios', require('./aplicativos/usuarios/routes')(supabase, supabaseAdmin));

// ─── ARQUIVOS ESTÁTICOS DOS MÓDULOS ──────────────────────────
const MODULES = ['login-e-autenticacao', 'portal', 'usuarios'];

MODULES.forEach(name => {
    const dir = path.join(__dirname, 'aplicativos', name);
    if (!fs.existsSync(dir)) return;

    // Rota principal (desktop)
    app.get(`/${name}`,  (req, res) => res.sendFile(path.join(dir, 'index.html')));
    app.get(`/${name}/`, (req, res) => res.sendFile(path.join(dir, 'index.html')));

    // Rota mobile (subpasta m/)
    const mDir = path.join(dir, 'm');
    if (fs.existsSync(mDir)) {
        app.get(`/${name}/m`,  (req, res) => res.sendFile(path.join(mDir, 'index.html')));
        app.get(`/${name}/m/`, (req, res) => res.sendFile(path.join(mDir, 'index.html')));
    }

    // Estáticos (CSS, JS, imagens)
    app.use(`/${name}`, express.static(dir, { index: false, dotfiles: 'deny' }));
});

// ─── RAIZ → LOGIN ────────────────────────────────────────────
app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, 'aplicativos', 'login-e-autenticacao', 'index.html'))
);

// ─── 404 ─────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: '404 - Rota não encontrada' }));

// ─── ERROS ───────────────────────────────────────────────────
app.use((error, req, res, next) => {
    console.error('Erro interno:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// ─── START ───────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ I.R. Comércio — Servidor rodando na porta ${PORT}`);
    console.log(`✅ Supabase conectado`);
    console.log(`✅ Autenticação: username + senha\n`);
});

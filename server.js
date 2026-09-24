// ─── SUPABASE ────────────────────────────────────────────────
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── IMAGENS ─────────────────────────────────────────────────
app.use('/imagens', express.static(path.join(__dirname, 'imagens')));

// ─── MÓDULO LOGIN ────────────────────────────────────────────
const loginRoutes = require('./apps/login-e-autenticacao/routes');
app.use('/api/auth', loginRoutes(supabase, supabaseAdmin));

// ─── ARQUIVOS ESTÁTICOS DO MÓDULO ────────────────────────────
const loginPath = path.join(__dirname, 'apps', 'login-e-autenticacao');
app.get('/login-e-autenticacao', (req, res) => res.sendFile(path.join(loginPath, 'index.html')));
app.get('/login-e-autenticacao/', (req, res) => res.sendFile(path.join(loginPath, 'index.html')));
app.use('/login-e-autenticacao', express.static(loginPath, { index: false, dotfiles: 'deny' }));

// ─── RAIZ → LOGIN ────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(loginPath, 'index.html')));

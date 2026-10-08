require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

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

const logActivity = require('./aplicativos/shared/logActivity');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/imagens', express.static(path.join(__dirname, 'aplicativos', 'imagens')));
app.use('/shared', express.static(path.join(__dirname, 'aplicativos', 'shared')));

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

// Validação da sessão usada pelos módulos que recebem o token pela URL/sessionStorage.
function verifySessionToken(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    try {
        const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET)
            .update(body)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        const a = Buffer.from(sig);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
        const payload = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(body.length / 4) * 4, '='), 'base64').toString('utf8'));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch { return null; }
}

app.post('/api/verify-session', async (req, res) => {
    try {
        const token = req.body?.sessionToken || req.headers['x-session-token'];
        const payload = verifySessionToken(token);
        if (!payload?.uid) return res.status(401).json({ valid: false, error: 'Sessão inválida' });

        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('id, code, username, name, sector, is_admin, is_active')
            .eq('id', payload.uid)
            .maybeSingle();

        if (error || !profile || !profile.is_active) {
            return res.status(401).json({ valid: false, error: 'Sessão inválida' });
        }

        res.json({
            valid: true,
            session: {
                id: profile.id,
                code: profile.code,
                username: profile.username,
                name: profile.name,
                sector: profile.sector,
                is_admin: profile.is_admin
            }
        });
    } catch (error) {
        console.error('[verify-session]', error.message);
        res.status(500).json({ valid: false, error: 'Erro ao validar sessão' });
    }
});

// ─── APIs ───────────────────────────────────────────────────
app.use('/api/auth',            require('./aplicativos/login-e-autenticacao/routes')(supabase, supabaseAdmin));
app.use('/api/portal',          require('./aplicativos/portal/routes')(supabase, supabaseAdmin));
app.use('/api/usuarios',        require('./aplicativos/usuarios/routes')(supabase, supabaseAdmin));
app.use('/api/licitacoes',      require('./aplicativos/licitacoes/routes')(supabase, supabaseAdmin));
app.use('/api/precos',          require('./aplicativos/precos/routes')(supabase, supabaseAdmin));
app.use('/api',                 require('./aplicativos/compra/routes')(supabase, supabaseAdmin, logActivity));
app.use('/api/transportadoras', require('./aplicativos/transportadoras/routes')(supabase, supabaseAdmin, logActivity));
app.use('/api/cotacoes',        require('./aplicativos/cotacoes/routes')(supabase, supabaseAdmin));
app.use('/api',                  require('./aplicativos/faturamento/routes')(supabase, supabaseAdmin));

// O sistema é desktop-first. Em dispositivos móveis, bloqueia a interface antes do login
// para evitar que páginas parcialmente responsivas sejam exibidas.
app.use((req, res, next) => {
    const ua = String(req.headers['user-agent'] || '').toLowerCase();
    const mobile = /android|iphone|ipad|ipod|iemobile|opera mini|blackberry|windows phone|mobile safari/.test(ua);
    if (!mobile || req.path.startsWith('/api/')) return next();
    res.status(200).send(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Acesso em dispositivo móvel</title><style>body{margin:0;background:#F4F5F7;color:#111;font-family:Inter,Segoe UI,Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}.card{max-width:520px;background:#fff;border:1px solid #E1E4E8;border-radius:16px;padding:36px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.14)}.icon{width:54px;height:54px;margin:0 auto 18px;border-radius:14px;background:#FF521D;color:#fff;display:flex;align-items:center;justify-content:center;font-size:27px;font-weight:700}.card h1{font-size:22px;margin:0 0 12px}.card p{color:#5B6470;line-height:1.65;margin:0}</style></head><body><div class="card"><div class="icon">I.R.</div><h1>Acesso disponível em computador</h1><p>Este sistema foi desenvolvido para uso em computadores e notebooks. Para uma experiência adequada e completa, acesse-o por um dispositivo desktop.</p></div></body></html>`);
});

// ─── ARQUIVOS ESTÁTICOS DOS MÓDULOS ─────────────────────────
const MODULES = [
    'login-e-autenticacao',
    'portal',
    'usuarios',
    'licitacoes',
    'precos',
    'compra',
    'transportadoras',
    'cotacoes',
    'faturamento',
    'tutorial'
];

MODULES.forEach(name => {
    const dir = path.join(__dirname, 'aplicativos', name);
    if (!fs.existsSync(dir)) return;

    app.get(`/${name}`,  (req, res) => res.sendFile(path.join(dir, 'index.html')));
    app.get(`/${name}/`, (req, res) => res.sendFile(path.join(dir, 'index.html')));

    app.use(`/${name}`, express.static(dir, { index: false, dotfiles: 'deny' }));
});

app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, 'aplicativos', 'login-e-autenticacao', 'index.html'))
);

app.use((req, res) => res.status(404).json({ error: '404 - Rota não encontrada' }));
app.use((error, req, res, next) => {
    console.error('Erro interno:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ I.R. Comércio — Servidor rodando na porta ${PORT}`);
});

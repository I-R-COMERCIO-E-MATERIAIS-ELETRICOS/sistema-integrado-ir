// aplicativos/login-e-autenticacao/routes.js
const express = require('express');
const crypto = require('crypto');

// Token próprio = HMAC-SHA256 assinado com SESSION_SECRET
// Payload: { uid, username, exp }
function signToken(payload, secret) {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig  = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    return `${body}.${sig}`;
}

function verifyToken(token, secret) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    // Comparação em tempo constante
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch { return null; }
}

module.exports = function (supabase, supabaseAdmin) {
    const router = express.Router();
    const SESSION_SECRET = process.env.SESSION_SECRET;
    if (!SESSION_SECRET) {
        console.error('❌ SESSION_SECRET não configurado');
        process.exit(1);
    }

    // ─── LOGIN ──────────────────────────────────────────────────
    // Recebe { username, password }
    // 1. Busca o auth_email em profiles
    // 2. Autentica no Supabase Auth
    // 3. Gera token próprio e devolve
    router.post('/login', async (req, res) => {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
        }

        // Bloqueia tentativa com @ no username — login é SÓ por username
        const cleanUsername = String(username).trim().toLowerCase();
        if (cleanUsername.includes('@')) {
            return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
        }

        try {
            // Busca o usuário na tabela profiles (auth_email é interno)
            const { data: profile, error: pErr } = await supabaseAdmin
                .from('profiles')
                .select('id, username, auth_email, name, sector, is_admin, is_active')
                .eq('username', cleanUsername)
                .maybeSingle();

            // Falha genérica — não revela se o username existe
            if (pErr || !profile || !profile.auth_email) {
                return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
            }

            if (!profile.is_active) {
                return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
            }

            // Autentica no Supabase Auth usando service_role — o front nunca vê
            const { data: auth, error: aErr } = await supabaseAdmin.auth.signInWithPassword({
                email: profile.auth_email,
                password
            });

            if (aErr || !auth?.session) {
                return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
            }

            // Gera token próprio (válido por 12h)
            const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
            const token = signToken({
                uid: profile.id,
                username: profile.username,
                exp
            }, SESSION_SECRET);

            res.json({
                success: true,
                token,
                expiresIn: 12 * 60 * 60,
                user: {
                    id: profile.id,
                    username: profile.username,
                    name: profile.name,
                    sector: profile.sector,
                    is_admin: profile.is_admin
                }
            });
        } catch (err) {
            console.error('Erro no login:', err.message);
            res.status(500).json({ error: 'Erro interno' });
        }
    });

    // ─── LOGOUT ─────────────────────────────────────────────────
    // Como o token é stateless, basta o front descartá-lo.
    // Se um dia quiser revogação, guarde tokens numa tabela blacklist.
    router.post('/logout', (req, res) => {
        res.json({ success: true });
    });

    // ─── PERFIL DO USUÁRIO LOGADO ───────────────────────────────
    // Valida o token próprio (não o JWT do Supabase)
    router.get('/profile', async (req, res) => {
        const auth = req.headers['authorization'];
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
        const payload = verifyToken(token, SESSION_SECRET);
        if (!payload) return res.status(401).json({ error: 'Sessão inválida' });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, username, name, contact_email, contact_phone, sector, is_admin, is_active, apps')
            .eq('id', payload.uid)
            .single();

        if (!profile || !profile.is_active) {
            return res.status(401).json({ error: 'Sessão inválida' });
        }

        res.json(profile);
    });

    // Exporta para reuso em outros módulos
    router.verifyToken = (token) => verifyToken(token, SESSION_SECRET);

    return router;
};

const express = require('express');
const crypto = require('crypto');

function b64urlEncode(str) {
    return Buffer.from(str, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function b64urlDecode(str) {
    let s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return Buffer.from(s, 'base64').toString('utf8');
}

function signToken(payload, secret) {
    const body = b64urlEncode(JSON.stringify(payload));
    const sig  = crypto.createHmac('sha256', secret).update(body).digest('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${body}.${sig}`;
}

function verifyToken(token, secret) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    try {
        const payload = JSON.parse(b64urlDecode(body));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch { return null; }
}

module.exports = function (supabase, supabaseAdmin) {
    const router = express.Router();
    const SESSION_SECRET = process.env.SESSION_SECRET;

    router.post('/login', async (req, res) => {
        console.log('[LOGIN] body:', JSON.stringify(req.body));

        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });

        const cleanUsername = String(username).trim().toLowerCase();
        if (cleanUsername.includes('@')) return res.status(401).json({ error: 'Usuário ou senha incorretos.' });

        try {
            const { data: profile, error: pErr } = await supabaseAdmin
                .from('profiles')
                .select('id, username, auth_email, name, sector, is_admin, is_active')
                .eq('username', cleanUsername)
                .maybeSingle();

            console.log('[LOGIN] profile:', JSON.stringify(profile));
            if (pErr) console.log('[LOGIN] erro profiles:', pErr.message);

            if (pErr || !profile || !profile.auth_email || !profile.is_active) {
                return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
            }

            const { data: auth, error: aErr } = await supabaseAdmin.auth.signInWithPassword({
                email: profile.auth_email,
                password
            });

            if (aErr) {
                console.log('[LOGIN] ERRO AUTH:', aErr.message);
                return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
            }
            if (!auth?.session) {
                console.log('[LOGIN] sem session');
                return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
            }

            const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
            const token = signToken({ uid: profile.id, username: profile.username, exp }, SESSION_SECRET);

            console.log('[LOGIN] sucesso. token gerado com', token.length, 'chars');

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
            console.log('[LOGIN] EXCEÇÃO:', err.message);
            res.status(500).json({ error: 'Erro interno' });
        }
    });

    router.post('/logout', (req, res) => res.json({ success: true }));

    router.get('/config', (req, res) => {
        res.json({
            url: process.env.SUPABASE_URL,
            anonKey: process.env.SUPABASE_ANON_KEY
        });
    });

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

        if (!profile || !profile.is_active) return res.status(401).json({ error: 'Sessão inválida' });
        res.json(profile);
    });

    return router;
};

const express = require('express');
const crypto = require('crypto');

function b64urlEncode(str) {
    return Buffer.from(str, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
    let s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return Buffer.from(s, 'base64').toString('utf8');
}
function signToken(payload, secret) {
    const body = b64urlEncode(JSON.stringify(payload));
    const sig  = crypto.createHmac('sha256', secret).update(body).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${body}.${sig}`;
}
function verifyToken(token, secret) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const payload = JSON.parse(b64urlDecode(body));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch { return null; }
}

function agoraBrasilia() {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}
function dentroDoHorarioComercial() {
    const d = agoraBrasilia();
    const dow = d.getDay();
    const min = d.getHours() * 60 + d.getMinutes();
    if (dow === 0 || dow === 6) return false;
    if (dow >= 1 && dow <= 4) return min < 17 * 60 + 30;
    if (dow === 5) return min < 17 * 60;
    return false;
}

module.exports = function (supabase, supabaseAdmin) {
    const router = express.Router();
    const SESSION_SECRET = process.env.SESSION_SECRET;

    // Sempre grava — sucesso ou falha
    function registrarLogin(payload) {
        supabaseAdmin.from('login_logs').insert([{
            user_id: payload.user_id || null,
            username: payload.username || null,
            ip_address: payload.ip_address || null,
            user_agent: payload.user_agent || null,
            success: payload.success === true,
            failure_reason: payload.failure_reason || null,
            created_at: new Date().toISOString()
        }]).then(() => {});
    }

    router.post('/login', async (req, res) => {
        const { username, password } = req.body || {};
        const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || null;
        const ua = req.headers['user-agent'] || null;

        if (!username || !password) {
            registrarLogin({ username, ip_address: ip, user_agent: ua, success: false, failure_reason: 'campos obrigatórios' });
            return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
        }

        const cleanUsername = String(username).trim().toLowerCase();
        if (cleanUsername.includes('@')) {
            registrarLogin({ username: cleanUsername, ip_address: ip, user_agent: ua, success: false, failure_reason: 'username com @' });
            return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
        }

        try {
            const { data: profile, error: pErr } = await supabaseAdmin
                .from('profiles')
                .select('id, code, username, auth_email, name, sector, is_admin, is_active')
                .eq('username', cleanUsername)
                .maybeSingle();

            if (pErr || !profile || !profile.auth_email) {
                registrarLogin({ username: cleanUsername, ip_address: ip, user_agent: ua, success: false, failure_reason: 'usuário não encontrado' });
                return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
            }

            if (!profile.is_active) {
                registrarLogin({ user_id: profile.id, username: cleanUsername, ip_address: ip, user_agent: ua, success: false, failure_reason: 'usuário inativo' });
                return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
            }

            const { data: auth, error: aErr } = await supabaseAdmin.auth.signInWithPassword({
                email: profile.auth_email,
                password
            });

            if (aErr || !auth?.session) {
                registrarLogin({
                    user_id: profile.id, username: cleanUsername, ip_address: ip, user_agent: ua,
                    success: false,
                    failure_reason: aErr?.message || 'senha incorreta'
                });
                return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
            }

            if (!profile.is_admin && !dentroDoHorarioComercial()) {
                registrarLogin({
                    user_id: profile.id, username: cleanUsername, ip_address: ip, user_agent: ua,
                    success: false,
                    failure_reason: 'fora do horário permitido'
                });
                return res.status(403).json({
                    error: 'Não autorizado. Não é possível acessar o sistema fora do horário permitido'
                });
            }

            registrarLogin({ user_id: profile.id, username: cleanUsername, ip_address: ip, user_agent: ua, success: true });

            const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
            const token = signToken({ uid: profile.id, username: profile.username, is_admin: profile.is_admin, exp }, SESSION_SECRET);

            res.json({
                success: true,
                token,
                expiresIn: 12 * 60 * 60,
                user: {
                    id: profile.id,
                    code: profile.code,
                    username: profile.username,
                    name: profile.name,
                    sector: profile.sector,
                    is_admin: profile.is_admin
                }
            });
        } catch (err) {
            console.error('[LOGIN] exceção:', err.message);
            registrarLogin({ username: cleanUsername, ip_address: ip, user_agent: ua, success: false, failure_reason: 'exceção: ' + err.message });
            res.status(500).json({ error: 'Erro interno' });
        }
    });

    router.post('/logout', (req, res) => res.json({ success: true }));

    router.get('/config', (req, res) => {
        res.json({ url: process.env.SUPABASE_URL, anonKey: process.env.SUPABASE_ANON_KEY });
    });

    router.get('/profile', async (req, res) => {
        const auth = req.headers['authorization'];
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
        const payload = verifyToken(token, SESSION_SECRET);
        if (!payload) return res.status(401).json({ error: 'Sessão inválida' });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, code, username, name, contact_email, contact_phone, sector, is_admin, is_active, apps')
            .eq('id', payload.uid)
            .single();

        if (!profile || !profile.is_active) return res.status(401).json({ error: 'Sessão inválida' });
        res.json(profile);
    });

    return router;
};

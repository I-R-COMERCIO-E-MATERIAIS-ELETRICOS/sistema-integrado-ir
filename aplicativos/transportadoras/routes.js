// ============================================================
// apps/transportadoras/routes.js
// Rotas da API de Transportadoras
// ============================================================

const express = require('express');
const crypto  = require('crypto');

function verifyToken(token, secret) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch { return null; }
}

function toUpperCase(v) { return v ? String(v).toUpperCase() : ''; }
function toLowerCase(v) { return v ? String(v).toLowerCase() : ''; }

module.exports = function (supabase, supabaseAdmin) {
    const router = express.Router();
    const admin  = supabaseAdmin || supabase;
    const SESSION_SECRET = process.env.SESSION_SECRET;

    async function requireAuth(req, res, next) {
        const auth = req.headers['authorization'];
        const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
        const sessionToken = bearer || req.headers['x-session-token'];
        if (!sessionToken) return res.status(401).json({ error: 'Não autenticado' });

        let profile = null;
        const payload = verifyToken(sessionToken, SESSION_SECRET);
        if (payload && payload.uid) {
            const { data } = await admin
                .from('profiles')
                .select('id, username, name, sector, is_admin, is_active, apps')
                .eq('id', payload.uid)
                .single();
            profile = data;
        }

        if (!profile) {
            const { data: sess } = await admin
                .from('active_sessions')
                .select('*, users(id, username, name, is_admin, is_active, sector, apps)')
                .eq('session_token', sessionToken)
                .eq('is_active', true)
                .gt('expires_at', new Date().toISOString())
                .single();
            if (sess && sess.users) profile = sess.users;
        }

        if (!profile || !profile.is_active) {
            return res.status(401).json({ error: 'Sessão inválida' });
        }

        if (!profile.is_admin) {
            const apps = Array.isArray(profile.apps) ? profile.apps : [];
            if (!apps.includes('transportadoras')) {
                return res.status(403).json({ error: 'Sem acesso ao módulo' });
            }
        }

        req.user = profile;
        next();
    }

    router.get('/', requireAuth, async (req, res) => {
        try {
            const page  = Math.max(1, parseInt

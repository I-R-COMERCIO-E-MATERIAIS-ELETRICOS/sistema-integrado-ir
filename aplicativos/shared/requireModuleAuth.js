const crypto = require('crypto');

function verifyToken(token, secret) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    try {
        const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
        const a = Buffer.from(sig), b = Buffer.from(expected);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch { return null; }
}

module.exports = function requireModuleAuth(db, moduleId) {
    return async function (req, res, next) {
        try {
            const auth = req.headers['authorization'];
            const headerToken = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
            const token = req.headers['x-session-token'] || headerToken;
            const payload = verifyToken(token, process.env.SESSION_SECRET);
            if (!payload?.uid) return res.status(401).json({ error: 'Sessão inválida' });

            const { data: profile, error } = await db
                .from('profiles')
                .select('id, code, username, name, sector, is_admin, is_active, apps')
                .eq('id', payload.uid)
                .maybeSingle();

            if (error || !profile || !profile.is_active) {
                return res.status(401).json({ error: 'Sessão inválida' });
            }

            const allowed = profile.is_admin || (Array.isArray(profile.apps) && profile.apps.includes(moduleId));
            if (!allowed) return res.status(403).json({ error: 'Acesso negado a este módulo' });

            req.user = profile;
            next();
        } catch (err) {
            console.error(`[${moduleId} auth]`, err.message);
            res.status(500).json({ error: 'Erro interno de autenticação' });
        }
    };
};

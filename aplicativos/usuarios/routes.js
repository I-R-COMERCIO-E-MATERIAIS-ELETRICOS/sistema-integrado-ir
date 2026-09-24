const express = require('express');
const crypto = require('crypto');

function verifyToken(token, secret) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch { return null; }
}

const FALLBACK_DOMAIN = 'ir.local';

module.exports = function (supabase, supabaseAdmin) {
    const router = express.Router();
    const SESSION_SECRET = process.env.SESSION_SECRET;

    const VALID_MODULES = [
        'vendas', 'precos', 'compra', 'transportadoras', 'cotacoes',
        'faturamento', 'frete', 'estoque', 'receber', 'pagar', 'lucro', 'licitacoes'
    ];

    async function requireAdmin(req, res, next) {
        const auth = req.headers['authorization'];
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
        const payload = verifyToken(token, SESSION_SECRET);
        if (!payload) return res.status(401).json({ error: 'Não autenticado' });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('is_admin, is_active')
            .eq('id', payload.uid)
            .single();

        if (!profile?.is_admin || !profile?.is_active) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        req.adminUser = { id: payload.uid, username: payload.username };
        next();
    }

    router.get('/meta/modules', requireAdmin, (req, res) => {
        res.json([
            { id: 'vendas',          name: 'Painel' },
            { id: 'precos',          name: 'Tabela de Preços' },
            { id: 'compra',          name: 'Ordens de Compra' },
            { id: 'transportadoras', name: 'Transportadoras' },
            { id: 'cotacoes',        name: 'Cotações de Frete' },
            { id: 'faturamento',     name: 'Pedidos de Faturamento' },
            { id: 'frete',           name: 'Controle de Frete' },
            { id: 'receber',         name: 'Contas a Receber' },
            { id: 'pagar',           name: 'Contas a Pagar' },
            { id: 'lucro',           name: 'Lucro Real' }
        ]);
    });

    router.get('/', requireAdmin, async (req, res) => {
        try {
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .select('id, username, name, contact_email, contact_phone, sector, is_admin, is_active, apps, created_at')
                .order('name');
            if (error) throw error;
            res.json(data || []);
        } catch (err) {
            console.error('Erro ao listar usuários:', err.message);
            res.status(500).json({ error: 'Erro ao listar usuários' });
        }
    });

    router.post('/', requireAdmin, async (req, res) => {
        const { username, name, sector, password, is_active, contact_email, contact_phone, apps } = req.body;

        if (!username || !name || !sector || !password) {
            return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
        }

        const cleanUsername = String(username).trim().toLowerCase();
        if (cleanUsername.includes('@')) {
            return res.status(400).json({ error: 'Nome de usuário não pode conter @' });
        }

        const cleanContactEmail = (contact_email || '').trim().toLowerCase();
        const authEmail = cleanContactEmail || `${cleanUsername}@${FALLBACK_DOMAIN}`;
        const cleanApps = Array.isArray(apps) ? apps.filter(a => VALID_MODULES.includes(a)) : [];

        try {
            const { data: dup } = await supabaseAdmin
                .from('profiles').select('id').eq('username', cleanUsername).maybeSingle();
            if (dup) return res.status(409).json({ error: 'Usuário já existe' });

            if (cleanContactEmail) {
                const { data: dupEmail } = await supabaseAdmin
                    .from('profiles').select('id').eq('auth_email', authEmail).maybeSingle();
                if (dupEmail) return res.status(409).json({ error: 'Já existe um usuário com este e-mail' });
            }

            const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: authEmail,
                password,
                email_confirm: true,
                user_metadata: { name, sector, username: cleanUsername }
            });

            if (authError) {
                if (authError.message.includes('already')) {
                    return res.status(409).json({ error: 'E-mail já cadastrado no sistema' });
                }
                throw authError;
            }

            const isAdmin = sector === 'Administrador';

            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: created.user.id,
                    auth_email: authEmail,
                    username: cleanUsername,
                    name,
                    contact_email: cleanContactEmail || null,
                    contact_phone: (contact_phone || '').trim() || null,
                    sector,
                    is_admin: isAdmin,
                    is_active: is_active !== false,
                    apps: isAdmin ? [] : cleanApps
                }, { onConflict: 'id' })
                .select('id, username, name, contact_email, contact_phone, sector, is_admin, is_active, apps, created_at')
                .single();

            if (profileError) {
                await supabaseAdmin.auth.admin.deleteUser(created.user.id);
                throw profileError;
            }

            res.status(201).json(profile);
        } catch (err) {
            console.error('Erro ao criar usuário:', err.message);
            res.status(500).json({ error: 'Erro ao criar usuário: ' + err.message });
        }
    });

    router.put('/:id', requireAdmin, async (req, res) => {
        const { name, sector, password, is_active, contact_email, contact_phone, apps } = req.body;
        const { id } = req.params;

        try {
            const updates = {};
            if (name !== undefined)          updates.name = name;
            if (sector !== undefined) {
                updates.sector = sector;
                updates.is_admin = sector === 'Administrador';
            }
            if (is_active !== undefined)     updates.is_active = is_active;
            if (contact_email !== undefined) updates.contact_email = (contact_email || '').trim().toLowerCase() || null;
            if (contact_phone !== undefined) updates.contact_phone = (contact_phone || '').trim() || null;

            if (apps !== undefined) {
                const cleanApps = Array.isArray(apps) ? apps.filter(a => VALID_MODULES.includes(a)) : [];
                updates.apps = (sector === 'Administrador') ? [] : cleanApps;
            }

            const { data: profile, error } = await supabaseAdmin
                .from('profiles').update(updates).eq('id', id)
                .select('id, username, name, contact_email, contact_phone, sector, is_admin, is_active, apps, created_at')
                .single();

            if (error) throw error;

            if (password) {
                const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
                if (pwErr) throw pwErr;
            }

            if (is_active !== undefined) {
                await supabaseAdmin.auth.admin.updateUserById(id, {
                    ban_duration: is_active ? 'none' : '876000h'
                });
            }

            res.json(profile);
        } catch (err) {
            console.error('Erro ao atualizar usuário:', err.message);
            res.status(500).json({ error: 'Erro ao atualizar: ' + err.message });
        }
    });

    router.delete('/:id', requireAdmin, async (req, res) => {
        const { id } = req.params;
        try {
            if (req.adminUser.id === id) {
                return res.status(400).json({ error: 'Você não pode excluir a si mesmo' });
            }
            await supabaseAdmin.from('profiles').delete().eq('id', id);
            await supabaseAdmin.auth.admin.deleteUser(id);
            res.status(204).end();
        } catch (err) {
            console.error('Erro ao excluir usuário:', err.message);
            res.status(500).json({ error: 'Erro ao excluir: ' + err.message });
        }
    });

    return router;
};

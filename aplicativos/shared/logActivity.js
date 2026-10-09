// ============================================================
// logActivity.js
// Registra uma ação no activity_logs.
// Agora é async e devolve o resultado — quem chama pode dar await.
// ============================================================

module.exports = async function logActivity(supabaseAdmin, req, payload) {
    try {
        const user = req.user || {};

        // Força o username em MAIÚSCULO pra bater com o filtro do módulo
        const username = (user.username || user.name || '').toString().trim().toUpperCase() || null;
        const userId   = user.id || null;

        const row = {
            user_id:     userId,
            username:    username,
            action:      payload.action,
            module:      payload.module,
            target_id:   payload.target_id   || null,
            target_code: payload.target_code || null,
            details:     payload.details     || null,
            created_at:  new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('activity_logs')
            .insert([row])
            .select()
            .single();

        if (error) {
            console.error('[logActivity] erro:', error.message, '| row:', row);
            return { ok: false, error: error.message };
        }

        console.log('[logActivity] ✓', row.module, row.action, row.target_code, 'por', row.username);
        return { ok: true, data };
    } catch (e) {
        console.error('[logActivity] exception:', e.message);
        return { ok: false, error: e.message };
    }
};

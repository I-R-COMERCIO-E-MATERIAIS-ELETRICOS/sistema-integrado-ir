// aplicativos/shared/logActivity.js
//
// Helper para registrar atividades no activity_logs.
// Uso:
//   const logActivity = require('../shared/logActivity');
//   logActivity(supabaseAdmin, req, {
//       action: 'create' | 'update' | 'delete' | 'check' | 'uncheck',
//       module: 'usuarios' | 'precos' | 'compra' | ...,
//       target_id: uuid,
//       target_code: number,
//       details: { ... }
//   });

module.exports = function logActivity(supabaseAdmin, req, payload) {
    try {
        const user = req.user || {};
        supabaseAdmin.from('activity_logs').insert([{
            user_id:     user.id       || null,
            username:    user.username || null,
            action:      payload.action,
            module:      payload.module,
            target_id:   payload.target_id   || null,
            target_code: payload.target_code || null,
            details:     payload.details     || null,
            created_at:  new Date().toISOString()
        }]).then(() => {});
    } catch (e) {
        console.error('[logActivity] erro:', e.message);
    }
};

:root {
    --primary: #FF521D;
    --primary-hover: #E8451A;
    --primary-soft: rgba(255, 82, 29, 0.10);
    --bg: #F4F5F7;
    --card: #FFFFFF;
    --dark: #0A0A0A;
    --text: #111111;
    --text-2: #5B6470;
    --text-3: #9CA3AF;
    --border: #E1E4E8;
    --input-bg: #F7F8FA;
    --success: #22C55E;
    --danger: #EF4444;
    --safe-top: env(safe-area-inset-top, 0px);
    --safe-bottom: env(safe-area-inset-bottom, 0px);
    color-scheme: light only;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
}
button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }

/* ─── HOME ───────────────────────────────────────────── */
.tut-home {
    max-width: 1200px;
    margin: 0 auto;
    padding: 3rem 2rem 5rem;
}
.tut-home-header { text-align: center; margin-bottom: 3rem; }
.tut-home-header h1 {
    font-size: 2rem; font-weight: 700; letter-spacing: -0.03em;
    margin-bottom: 0.75rem;
}
.tut-home-header p {
    color: var(--text-2); font-size: 1rem; max-width: 560px;
    margin: 0 auto; line-height: 1.6;
}
.tut-modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
}
.tut-module-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.5rem 1.25rem;
    text-align: left;
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    cursor: pointer;
    display: flex; flex-direction: column; gap: 0.5rem;
    overflow: hidden;
}
.tut-module-card:hover {
    transform: translateY(-2px);
    border-color: var(--primary);
    box-shadow: 0 6px 20px rgba(255, 82, 29, 0.12);
}
.tut-module-card strong {
    font-size: 1rem; font-weight: 700; color: var(--text);
}
.tut-module-card span {
    font-size: 0.82rem; color: var(--text-2); line-height: 1.5;
}
.tut-module-card .tut-card-icon {
    width: 40px; height: 40px;
    min-width: 40px; min-height: 40px;
    max-width: 40px; max-height: 40px;
    border-radius: 10px;
    background: var(--primary-soft);
    color: var(--primary);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
    overflow: hidden;
}
.tut-module-card .tut-card-icon svg {
    width: 20px; height: 20px;
    min-width: 20px; min-height: 20px;
    max-width: 20px; max-height: 20px;
    stroke: currentColor; fill: none;
    stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
    display: block;
}

/* ─── STAGE (simulação) ─────────────────────────────── */
.tut-stage {
    display: flex; flex-direction: column;
    min-height: 100vh;
}
.tut-toolbar {
    background: var(--dark); color: #fff;
    padding: 0.75rem 1.5rem;
    display: flex; align-items: center; gap: 1rem;
    position: sticky; top: 0; z-index: 50;
}
.tut-back {
    display: inline-flex; align-items: center; gap: 0.5rem;
    color: #fff; font-size: 0.85rem; font-weight: 600;
    padding: 0.4rem 0.75rem; border-radius: 8px;
    transition: background 0.15s ease;
}
.tut-back:hover { background: rgba(255,255,255,0.08); }
.tut-back svg { width: 16px; height: 16px; }
.tut-current-module {
    font-size: 0.9rem; font-weight: 600;
    color: rgba(255,255,255,0.85);
}

.tut-module-area {
    flex: 1;
    padding: 2rem;
    background: var(--bg);
}

/* ─── CHAT FLUTUANTE ────────────────────────────────── */
.tut-chat {
    position: fixed;
    bottom: 24px; right: 24px;
    width: 380px; max-width: calc(100vw - 32px);
    max-height: 520px;
    background: var(--card);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    border: 1px solid var(--border);
    display: flex; flex-direction: column;
    z-index: 9000;
    animation: slideInChat 0.3s ease;
}
@keyframes slideInChat {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
}
.tut-chat-header {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
}
.tut-chat-avatar {
    width: 34px; height: 34px;
    min-width: 34px; min-height: 34px;
    border-radius: 50%;
    background: var(--primary-soft);
    color: var(--primary);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
}
.tut-chat-avatar svg { width: 18px; height: 18px; }
.tut-chat-title {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column;
    line-height: 1.2;
}
.tut-chat-title strong { font-size: 0.9rem; }
.tut-chat-title span { font-size: 0.72rem; color: var(--text-3); }
.tut-chat-close {
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px; color: var(--text-3);
    transition: background 0.15s ease;
    flex-shrink: 0;
}
.tut-chat-close:hover { background: var(--bg); color: var(--text); }
.tut-chat-close svg { width: 16px; height: 16px; }

.tut-chat-body {
    flex: 1; overflow-y: auto;
    padding: 1rem;
    display: flex; flex-direction: column; gap: 0.75rem;
    scrollbar-width: thin;
}
.tut-chat-body::-webkit-scrollbar { width: 5px; }
.tut-chat-body::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }

.tut-msg {
    max-width: 92%;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 0.88rem; line-height: 1.5;
}
.tut-msg.tut {
    background: var(--primary-soft);
    color: var(--text);
    align-self: flex-start;
    border-bottom-left-radius: 4px;
}
.tut-msg.user {
    background: var(--primary);
    color: #fff;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
}
.tut-msg.success {
    background: rgba(34, 197, 94, 0.12);
    color: #16A34A;
    border: 1px solid rgba(34, 197, 94, 0.35);
    font-weight: 600;
}

.tut-chat-actions {
    display: flex; gap: 0.6rem;
    padding: 0.85rem 1rem;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
}
.tut-btn-primary, .tut-btn-secondary {
    flex: 1; padding: 0.7rem;
    border-radius: 10px;
    font-size: 0.88rem; font-weight: 600;
    transition: opacity 0.15s ease, transform 0.1s ease;
}
.tut-btn-primary { background: var(--primary); color: #fff; }
.tut-btn-primary:hover:not(:disabled) { opacity: 0.92; }
.tut-btn-secondary { background: var(--input-bg); color: var(--text-2); border: 1px solid var(--border); }
.tut-btn-secondary:hover:not(:disabled) { background: var(--bg); }
.tut-btn-primary:disabled, .tut-btn-secondary:disabled {
    opacity: 0.4; cursor: not-allowed;
}

/* ─── HIGHLIGHT ─────────────────────────────────────── */
.tut-highlight {
    position: relative;
    z-index: 8000;
    outline: 3px solid var(--primary);
    outline-offset: 4px;
    border-radius: 8px;
    animation: tutPulse 1.4s ease-in-out infinite;
    box-shadow: 0 0 0 9999px rgba(0,0,0,0.45);
}
@keyframes tutPulse {
    0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.45), 0 0 0 3px rgba(255,82,29,0.4); }
    50%      { box-shadow: 0 0 0 9999px rgba(0,0,0,0.45), 0 0 0 12px rgba(255,82,29,0); }
}

/* ─── Layouts internos dos "módulos falsos" ─────────── */
.tut-fake-container {
    max-width: 1400px; margin: 0 auto;
}
.tut-fake-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap; gap: 1rem;
}
.tut-fake-header h2 {
    font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em;
}
.tut-fake-btn {
    background: #3B82F6; color: #fff;
    border: none; padding: 0.65rem 1.25rem; border-radius: 8px;
    font-size: 0.9rem; font-weight: 600;
    display: inline-flex; align-items: center; gap: 0.5rem;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(59,130,246,0.3);
}
.tut-fake-btn:hover { background: #2563EB; }

.tut-fake-table-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.tut-fake-table {
    width: 100%; border-collapse: separate; border-spacing: 0;
}
.tut-fake-table thead { background: var(--dark); }
.tut-fake-table th {
    padding: 13px 16px; text-align: left;
    font-size: 0.78rem; font-weight: 600;
    color: #fff; text-transform: uppercase; letter-spacing: 0.5px;
}
.tut-fake-table td {
    padding: 13px 16px;
    border-bottom: 1px solid rgba(128,128,128,0.1);
    font-size: 0.88rem;
}
.tut-fake-table tr:last-child td { border-bottom: none; }
.tut-fake-table tr:nth-child(even) { background: #FAFAFA; }

.tut-fake-badge {
    display: inline-block; padding: 3px 8px;
    border-radius: 6px; font-size: 0.7rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.04em;
}
.tut-fake-badge.ativo  { background: rgba(34,197,94,0.12); color: #16A34A; }
.tut-fake-badge.inativo { background: rgba(239,68,68,0.12); color: #DC2626; }

.tut-fake-action {
    padding: 6px 12px; border-radius: 6px; font-size: 0.8rem;
    font-weight: 500; cursor: pointer; border: none;
    color: #fff; margin: 0 2px;
}
.tut-fake-action.edit { background: #6B7280; }
.tut-fake-action.delete { background: #EF4444; }

/* ─── Responsivo ─────────────────────────────────────── */
@media (max-width: 1024px) {
    .tut-chat { width: 340px; }
    .tut-module-area { padding: 1.5rem 1rem; }
}
@media (max-width: 768px) {
    .tut-home { padding: 2rem 1rem 4rem; }
    .tut-modules-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
    .tut-chat {
        width: calc(100vw - 24px);
        right: 12px; left: 12px; bottom: 12px;
        max-height: 60vh;
    }
}

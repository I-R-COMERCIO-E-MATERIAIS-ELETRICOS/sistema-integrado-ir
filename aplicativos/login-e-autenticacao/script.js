// ============================================================
// I.R. Comércio — Login (Supabase Auth)
// ============================================================

let supabaseClient = null;

const loginForm     = document.getElementById('loginForm');
const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn      = document.getElementById('loginBtn');
const messageBox    = document.getElementById('messageBox');
const toggleBtn     = document.getElementById('togglePassword');

// ─── Supabase ────────────────────────────────────────────────
async function initSupabase() {
    try {
        const res = await fetch('/api/auth/config');
        if (!res.ok) throw new Error('config');
        const cfg = await res.json();
        supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey, {
            auth: { persistSession: true, autoRefreshToken: true, storage: window.localStorage }
        });
    } catch {
        showMessage('Falha ao carregar configuração. Recarregue a página.');
    }
}

// ─── Helpers ─────────────────────────────────────────────────
function showMessage(text) {
    messageBox.textContent = text;
    messageBox.className = 'message error show';
    setTimeout(() => messageBox.classList.remove('show'), 5000);
}

function markInvalid(input) {
    input.classList.add('invalid');
    setTimeout(() => input.classList.remove('invalid'), 1400);
    input.focus();
}

// ─── Mostrar/ocultar senha ───────────────────────────────────
toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.textContent = isPassword ? 'Ocultar' : 'Mostrar';
    passwordInput.focus();
});

// ─── Submit ──────────────────────────────────────────────────
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email)    { markInvalid(emailInput);    return; }
    if (!password) { markInvalid(passwordInput); return; }

    if (!supabaseClient) {
        showMessage('Sistema não configurado. Recarregue a página.');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="btn-spinner"></span> Autenticando...';
    messageBox.classList.remove('show');

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            showMessage(
                error.message === 'Invalid login credentials'
                    ? 'E-mail ou senha incorretos.'
                    : (error.message || 'Não foi possível entrar.')
            );
            return;
        }

        if (!data.session) {
            showMessage('Sessão não pôde ser criada. Tente novamente.');
            return;
        }

        window.location.href = `/vendas#access_token=${data.session.access_token}`;

    } catch {
        showMessage('Erro ao realizar login. Tente novamente.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Entrar';
    }
});

// ─── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await initSupabase();

    if (supabaseClient) {
        const { data } = await supabaseClient.auth.getSession();
        if (data?.session) {
            window.location.href = `/vendas#access_token=${data.session.access_token}`;
        }
    }
});

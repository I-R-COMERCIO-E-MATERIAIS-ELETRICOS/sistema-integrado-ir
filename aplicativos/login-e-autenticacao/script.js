// ============================================================
// I.R. Comércio — Login (via backend)
// O front só conhece /api/auth/login. Nada de credenciais.
// ============================================================

const loginForm     = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn      = document.getElementById('loginBtn');
const messageBox    = document.getElementById('messageBox');
const toggleBtn     = document.getElementById('togglePassword');

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

// ─── Toggle senha ────────────────────────────────────────────
toggleBtn.addEventListener('click', () => {
    const isPwd = passwordInput.type === 'password';
    passwordInput.type = isPwd ? 'text' : 'password';
    toggleBtn.textContent = isPwd ? 'Ocultar' : 'Mostrar';
    passwordInput.focus();
});

// ─── Submit ──────────────────────────────────────────────────
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!username) { markInvalid(usernameInput); return; }
    if (!password) { markInvalid(passwordInput); return; }

    // Bloqueia e-mail no campo — login é só por username
    if (username.includes('@')) {
        showMessage('Use seu nome de usuário, não o e-mail.');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="btn-spinner"></span> Autenticando...';
    messageBox.classList.remove('show');

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.token) {
            showMessage(data.error || 'Usuário ou senha incorretos.');
            return;
        }

        sessionStorage.setItem('irToken', data.token);
        sessionStorage.setItem('irUser', JSON.stringify(data.user));

        window.location.href = '/portal';

    } catch {
        showMessage('Erro ao realizar login. Tente novamente.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Entrar';
    }
});

// ─── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Se já tem token, tenta o portal direto
    if (sessionStorage.getItem('irToken')) {
        window.location.href = '/portal';
    }
});

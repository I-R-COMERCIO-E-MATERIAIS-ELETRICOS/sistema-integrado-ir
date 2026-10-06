(function () {
    const uaMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
    const smallTouch = window.innerWidth < 900 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (uaMobile || smallTouch) document.body.classList.add('mobile-blocked');
})();

const loginForm     = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn      = document.getElementById('loginBtn');
const messageBox    = document.getElementById('messageBox');
const toggleBtn     = document.getElementById('togglePassword');

function showMessage(text) {
    messageBox.textContent = text;
    messageBox.className = 'message error show';
    setTimeout(() => messageBox.classList.remove('show'), 7000);
}

function markInvalid(input) {
    input.classList.add('invalid');
    setTimeout(() => input.classList.remove('invalid'), 1400);
    input.focus();
}

toggleBtn.addEventListener('click', () => {
    const isPwd = passwordInput.type === 'password';
    passwordInput.type = isPwd ? 'text' : 'password';
    toggleBtn.textContent = isPwd ? 'Ocultar' : 'Mostrar';
    passwordInput.focus();
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!username) { markInvalid(usernameInput); return; }
    if (!password) { markInvalid(passwordInput); return; }

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

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('irToken')) {
        window.location.href = '/portal';
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const stages = Array.from(document.querySelectorAll('.module-stage'));
    if (!stages.length) return;
    let current = 0;
    setInterval(() => {
        stages[current]?.classList.remove('active');
        current = (current + 1) % stages.length;
        stages[current]?.classList.add('active');
    }, 4200);
});

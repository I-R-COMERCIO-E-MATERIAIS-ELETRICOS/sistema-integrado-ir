const norm = s => String(s || '').trim().toUpperCase();

function primeiroNome(user) {
    const n = (user && (user.name || user.username)) || '';
    return norm(String(n).trim().split(/\s+/)[0]);
}

function setorNormalizado(user) {
    const s = norm(user && user.sector).replace(/^SETOR DE /, '');
    return s;
}

function ehAdmin(user) {
    return !!(user && (user.is_admin || setorNormalizado(user) === 'ADMINISTRADOR'));
}

function podeConfirmar(user, setor) {
    return ehAdmin(user) || setorNormalizado(user) === norm(setor);
}

function exigirSetor(setor) {
    return (req, res, next) => {
        if (podeConfirmar(req.user, setor)) return next();
        res.status(403).json({ error: `Somente o setor ${setor.charAt(0) + setor.slice(1).toLowerCase()} e administradores podem realizar esta ação` });
    };
}

module.exports = { primeiroNome, setorNormalizado, ehAdmin, podeConfirmar, exigirSetor };

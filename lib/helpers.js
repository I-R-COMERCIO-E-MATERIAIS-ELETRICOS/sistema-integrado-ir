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

const MODULE_IDS = ['usuarios','precos','compra','transportadoras','cotacoes','faturamento','frete','receber','pagar','lucro','licitacoes','estoque'];
const MODULE_ALIASES = {
    'usuarios':'usuarios','usuários':'usuarios',
    'tabela de preços':'precos','tabela de precos':'precos','preços':'precos','precos':'precos',
    'ordens de compra':'compra','ordem de compra':'compra','compras':'compra','compra':'compra',
    'transportadoras':'transportadoras',
    'cotações de frete':'cotacoes','cotacoes de frete':'cotacoes','cotações':'cotacoes','cotacoes':'cotacoes',
    'pedidos de faturamento':'faturamento','faturamento':'faturamento',
    'controle de frete':'frete','frete':'frete',
    'contas a receber':'receber','receber':'receber',
    'contas a pagar':'pagar','pagar':'pagar',
    'lucro real':'lucro','lucro':'lucro',
    'licitações':'licitacoes','licitacoes':'licitacoes',
    'estoque':'estoque'
};

// Aceita array, string JSON, string "a,b" ou objeto; devolve ids canônicos de módulos.
function normalizarApps(apps) {
    let lista = apps;
    if (typeof lista === 'string') {
        const t = lista.trim();
        try { lista = JSON.parse(t); } catch { lista = t.replace(/^[{\[]|[}\]]$/g, '').split(','); }
    }
    if (!Array.isArray(lista)) return [];
    const out = new Set();
    lista.forEach(v => {
        let k = String(v == null ? '' : v).trim().replace(/^["']|["']$/g, '').replace(/^\//, '').toLowerCase();
        if (!k) return;
        const id = MODULE_ALIASES[k] || (MODULE_IDS.includes(k) ? k : null);
        if (id) out.add(id);
    });
    return [...out];
}

module.exports = { normalizarApps, MODULE_IDS, primeiroNome, setorNormalizado, ehAdmin, podeConfirmar, exigirSetor };

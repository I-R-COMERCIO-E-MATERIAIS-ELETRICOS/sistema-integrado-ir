(function () {
    const norm = s => String(s || '').trim().toUpperCase();
    const IR = window.IR = window.IR || {};

    IR.token = function () {
        return sessionStorage.getItem('irToken') || sessionStorage.getItem('cotacoesSession') ||
            sessionStorage.getItem('freteSession') || sessionStorage.getItem('faturamentoSession') ||
            sessionStorage.getItem('receberSession') || sessionStorage.getItem('pagarSession') ||
            new URLSearchParams(location.search).get('sessionToken') || '';
    };
    IR.setToken = function (t) { if (t) IR._tok = t; };
    IR.headers = function () {
        const t = IR._tok || IR.token();
        return { 'Content-Type': 'application/json', 'X-Session-Token': t, 'Authorization': 'Bearer ' + t };
    };

    IR.me = async function () {
        if (IR._me) return IR._me;
        try {
            const r = await fetch('/api/me', { headers: IR.headers() });
            if (r.ok) IR._me = await r.json();
        } catch (e) {}
        return IR._me || { name: '', first_name: '', sector: '', is_admin: false };
    };

    IR.podeConfirmar = async function (setor) {
        const me = await IR.me();
        const s = norm(me.sector).replace(/^SETOR DE /, '');
        return !!me.is_admin || s === 'ADMINISTRADOR' || s === norm(setor);
    };

    IR.vendedores = async function () {
        if (IR._vend) return IR._vend;
        try {
            const r = await fetch('/api/vendedores', { headers: IR.headers() });
            if (r.ok) IR._vend = await r.json();
        } catch (e) {}
        return IR._vend || [];
    };

    IR.preencherVendedores = async function (select, selecionado) {
        if (!select) return;
        const lista = await IR.vendedores();
        const atual = norm(selecionado || select.value);
        const nomes = lista.slice();
        if (atual && !nomes.includes(atual)) nomes.push(atual);
        select.innerHTML = '<option value="">Selecione...</option>' +
            nomes.map(n => `<option value="${n}"${n === atual ? ' selected' : ''}>${n}</option>`).join('');
        if (atual) select.value = atual;
    };

    IR.dataHora = function (v) {
        if (!v) return '';
        const d = new Date(v);
        return isNaN(d) ? '' : d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    IR.bloquearCheckbox = function (cb, msg) {
        cb.disabled = true;
        cb.title = msg || 'Sem permissão';
        cb.style.cursor = 'not-allowed';
        const lb = cb.parentElement && cb.parentElement.querySelector('label');
        if (lb) { lb.style.cursor = 'not-allowed'; lb.style.opacity = '.6'; }
    };
})();

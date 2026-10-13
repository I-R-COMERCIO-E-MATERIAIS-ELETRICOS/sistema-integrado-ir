/* ================================================================
 * shared/ir-common.js
 * Utilitários globais compartilhados por todos os módulos.
 * ================================================================ */
(function (global) {
    'use strict';

    const IR = {
        _token: null,
        _user: null,
        _denied: false,

        // ─── TOKEN / SESSÃO ─────────────────────────────────────────
        setToken(token) {
            this._token = token || null;
            if (token) {
                try { sessionStorage.setItem('irToken', token); } catch (_) {}
            }
        },
        getToken() {
            if (this._token) return this._token;
            try {
                const url = new URLSearchParams(location.search).get('sessionToken');
                if (url) { this.setToken(url); return url; }
                const s = sessionStorage.getItem('irToken');
                if (s) { this._token = s; return s; }
            } catch (_) {}
            return null;
        },
        token() { return this.getToken(); },

        // ─── ERRO PADRONIZADO ───────────────────────────────────────
        ERRO_CAMPOS_OBRIGATORIOS: 'Verifique se todas as informações obrigatórias estão preenchidas',

        // ─── ACESSO NEGADO EM TELA CHEIA ────────────────────────────
        // Regra: se estamos dentro de iframe, avisa o portal via postMessage
        // para que ele trate em tela cheia. Se estamos top-level, monta o overlay.
        denied(mensagem, opts) {
            opts = opts || {};
            const isIframe = window.parent && window.parent !== window;
            const tipo = /expir|sess[aã]o/i.test(mensagem || '')
                ? 'ir-session-expired'
                : (opts.moduleDenied ? 'ir-module-denied' : 'ir-access-denied');
            const modulo = opts.module || (location.pathname.split('/')[1] || '');
            if (isIframe) {
                window.parent.postMessage({ type: tipo, module: modulo }, '*');
                return;
            }
            if (this._denied) return;
            this._denied = true;
            const html = `
                <div class="ir-fullscreen-denied" role="alert">
                    <h1>${(mensagem || 'ACESSO NEGADO').toUpperCase()}</h1>
                    <p>${opts.subtitle || 'Você não tem permissão para acessar esta área.'}</p>
                    <a href="/portal">Voltar ao Portal</a>
                </div>`;
            document.body.innerHTML = html;
            this._injectDeniedStyles();
        },

        _injectDeniedStyles() {
            if (document.getElementById('ir-denied-style')) return;
            const s = document.createElement('style');
            s.id = 'ir-denied-style';
            s.textContent = `
                .ir-fullscreen-denied {
                    position: fixed; inset: 0; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; text-align: center;
                    background: #F8F9FA; color: #1A1A1A; padding: 2rem; z-index: 2147483647;
                    font-family: 'Inter','Segoe UI',system-ui,sans-serif;
                }
                .ir-fullscreen-denied h1 { font-size: 2rem; margin-bottom: 1rem; }
                .ir-fullscreen-denied p { color: #6B7280; margin-bottom: 2rem; max-width: 480px; }
                .ir-fullscreen-denied a {
                    display: inline-block; background: #3B82F6; color: #fff;
                    padding: 14px 32px; border-radius: 8px; text-decoration: none;
                    font-weight: 600; transition: .2s;
                }
                .ir-fullscreen-denied a:hover { opacity: .9; }
            `;
            document.head.appendChild(s);
        },

        // ─── FETCH PADRONIZADO ──────────────────────────────────────
        async fetchJSON(url, opts) {
            opts = opts || {};
            const headers = Object.assign({
                'Accept': 'application/json',
                'X-Session-Token': this.getToken() || ''
            }, opts.headers || {});
            const res = await fetch(url, Object.assign({}, opts, { headers }));
            if (res.status === 401) {
                this.denied('Sua sessão expirou');
                return null;
            }
            if (res.status === 403) {
                let body = {};
                try { body = await res.clone().json(); } catch (_) {}
                if (body.moduleDenied) {
                    this.denied('Sem acesso a este módulo', { moduleDenied: true, module: body.module });
                } else {
                    this.denied('Acesso negado');
                }
                return null;
            }
            return res;
        },

        // ─── UTILS ──────────────────────────────────────────────────
        escapeHtml(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        },
        formatMoney(v) {
            const n = parseFloat(v) || 0;
            return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        },
        formatDate(d) {
            if (!d) return '';
            if (typeof d === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d;
            if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
                const [a, m, dia] = d.slice(0, 10).split('-');
                return `${dia}/${m}/${a}`;
            }
            const dt = new Date(d);
            return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('pt-BR');
        },
        formatDateTime(d) {
            if (!d) return '';
            const dt = new Date(d);
            if (isNaN(dt.getTime())) return '';
            const dia = String(dt.getDate()).padStart(2, '0');
            const mes = String(dt.getMonth() + 1).padStart(2, '0');
            const ano = dt.getFullYear();
            const hh = String(dt.getHours()).padStart(2, '0');
            const mm = String(dt.getMinutes()).padStart(2, '0');
            return `${dia}/${mes}/${ano} ${hh}:${mm}`;
        },
        primeiroNome(u) {
            const nome = (u && (u.name || u.nome || u.username)) || '';
            return String(nome).trim().split(/\s+/)[0] || '';
        },
        uuid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        // ─── TOAST ──────────────────────────────────────────────────
        toast(msg, type) {
            type = type || 'success';
            document.querySelectorAll('.ir-toast').forEach(t => t.remove());
            const el = document.createElement('div');
            el.className = 'ir-toast ir-toast-' + type;
            el.textContent = msg;
            document.body.appendChild(el);
            requestAnimationFrame(() => el.classList.add('show'));
            setTimeout(() => {
                el.classList.remove('show');
                setTimeout(() => el.remove(), 300);
            }, 3000);
        },

        // ─── CONFIRM ────────────────────────────────────────────────
        // Modal com botões Sim (verde) e Não (vermelho), alinhados à direita
        confirm(message, opts) {
            return new Promise(resolve => {
                opts = opts || {};
                const existing = document.getElementById('ir-confirm');
                if (existing) existing.remove();
                const wrap = document.createElement('div');
                wrap.id = 'ir-confirm';
                wrap.className = 'ir-modal-overlay show';
                wrap.innerHTML = `
                    <div class="ir-modal-box ir-modal-confirm">
                        <button class="ir-close" aria-label="Fechar">✕</button>
                        <div class="ir-confirm-msg">${message}</div>
                        <div class="ir-confirm-actions">
                            <button type="button" class="ir-btn-green" data-yes>Sim</button>
                            <button type="button" class="ir-btn-red" data-no>Não</button>
                        </div>
                    </div>`;
                document.body.appendChild(wrap);
                const done = (val) => {
                    wrap.classList.remove('show');
                    setTimeout(() => { wrap.remove(); resolve(val); }, 180);
                };
                wrap.querySelector('[data-yes]').onclick = () => done(true);
                wrap.querySelector('[data-no]').onclick = () => done(false);
                wrap.querySelector('.ir-close').onclick = () => done(false);
                wrap.addEventListener('click', e => { if (e.target === wrap) done(false); });
            });
        },

        // ─── SPLASH: nunca renderizar nos módulos ───────────────────
        // Os módulos devem ser exibidos sem carregamento próprio: o Portal
        // controla o loader. Este helper esconde qualquer splash por garantia.
        suppressSplash() {
            const hide = () => {
                const s = document.getElementById('splashScreen');
                if (s) s.style.display = 'none';
            };
            hide();
            document.addEventListener('DOMContentLoaded', hide);
        },

        // ─── APPS: lista para checagem local (opcional) ─────────────
        MODULES: [
            'usuarios','precos','compra','transportadoras','cotacoes','faturamento',
            'frete','receber','pagar','lucro','licitacoes','estoque'
        ],

        async podeConfirmar(setor) {
            try {
                const r = await fetch('/api/me', { headers: { 'X-Session-Token': this.getToken() || '' }});
                if (!r.ok) return false;
                const me = await r.json();
                this._user = me;
                if (me.is_admin) return true;
                return String(me.sector || '').toUpperCase().includes(String(setor || '').toUpperCase());
            } catch { return false; }
        },

        async preencherVendedores(selectEl) {
            if (!selectEl) return;
            try {
                const r = await fetch('/api/vendedores', { headers: { 'X-Session-Token': this.getToken() || '' }});
                if (!r.ok) return;
                const nomes = await r.json();
                const cur = selectEl.value;
                selectEl.innerHTML = '<option value="">Selecione...</option>' +
                    (nomes || []).map(n => `<option value="${n}">${n}</option>`).join('');
                if (cur) selectEl.value = cur;
            } catch (_) {}
        }
    };

    // Aliases legados
    IR.setToken = IR.setToken.bind(IR);
    IR.getToken = IR.getToken.bind(IR);
    IR.podeConfirmar = IR.podeConfirmar.bind(IR);
    IR.preencherVendedores = IR.preencherVendedores.bind(IR);
    IR.escapeHtml = IR.escapeHtml.bind(IR);
    IR.formatMoney = IR.formatMoney.bind(IR);
    IR.formatDate = IR.formatDate.bind(IR);
    IR.formatDateTime = IR.formatDateTime.bind(IR);
    IR.toast = IR.toast.bind(IR);
    IR.confirm = IR.confirm.bind(IR);

    global.IR = IR;
})(window);

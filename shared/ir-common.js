/* ================================================================
 * shared/ir-common.js
 * Utilitários globais compartilhados por todos os módulos.
 * Carregar SEMPRE após o CSS global, antes dos scripts locais.
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
                const url = new URLSearchParams(location.search);
                const fromUrl = url.get('sessionToken') || url.get('access_token');
                if (fromUrl) {
                    this.setToken(fromUrl);
                    // Limpa o parâmetro da URL sem recarregar
                    url.delete('sessionToken');
                    url.delete('access_token');
                    const qs = url.toString();
                    history.replaceState({}, document.title,
                        location.pathname + (qs ? '?' + qs : ''));
                    return fromUrl;
                }
                const s = sessionStorage.getItem('irToken');
                if (s) { this._token = s; return s; }
            } catch (_) {}
            return null;
        },

        token() { return this.getToken(); },

        // ─── ERRO PADRONIZADO ───────────────────────────────────────
        ERRO_CAMPOS_OBRIGATORIOS: 'Verifique se todas as informações obrigatórias estão preenchidas',

        // ─── ACESSO NEGADO / SESSÃO EXPIRADA ────────────────────────
        // Dentro de iframe: avisa o portal via postMessage (a tela de
        // login/portal trata em tela cheia, evitando que o próprio
        // iframe renderize a tela de login por engano).
        // Fora de iframe: monta um overlay em tela cheia.
        denied(mensagem, opts) {
            opts = opts || {};
            const isIframe = window.parent && window.parent !== window;
            const modulo = opts.module || (location.pathname.split('/')[1] || '');
            let tipo = 'ir-access-denied';
            if (/expir|sess[aã]o/i.test(mensagem || '')) tipo = 'ir-session-expired';
            else if (opts.moduleDenied) tipo = 'ir-module-denied';

            if (isIframe) {
                try {
                    window.parent.postMessage({ type: tipo, module: modulo, message: mensagem || '' }, '*');
                } catch (_) {}
                return;
            }

            if (this._denied) return;
            this._denied = true;

            document.body.innerHTML = `
                <div class="ir-fullscreen-denied" role="alert">
                    <h1>${(mensagem || 'ACESSO NEGADO').toUpperCase()}</h1>
                    <p>${opts.subtitle || 'Você não tem permissão para acessar esta área.'}</p>
                    <a href="/portal">Voltar ao Portal</a>
                </div>`;
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
        // Anexa X-Session-Token, trata 401 (sessão) e 403 (módulo negado).
        // Retorna o objeto Response em caso de sucesso, ou null se já
        // tratou o erro de autenticação/acesso.
        async fetchJSON(url, opts) {
            opts = opts || {};
            const headers = Object.assign({
                'Accept': 'application/json',
                'X-Session-Token': this.getToken() || ''
            }, opts.headers || {});

            let res;
            try {
                res = await fetch(url, Object.assign({}, opts, { headers }));
            } catch (err) {
                // Erro de rede — propaga para o chamador decidir
                throw err;
            }

            if (res.status === 401) {
                this.denied('Sua sessão expirou');
                return null;
            }

            if (res.status === 403) {
                let body = {};
                try { body = await res.clone().json(); } catch (_) {}
                if (body.moduleDenied) {
                    this.denied('Sem acesso a este módulo', {
                        moduleDenied: true,
                        module: body.module || ''
                    });
                } else {
                    this.denied(body.error || 'Acesso negado');
                }
                return null;
            }

            return res;
        },

        // ─── UTILS ──────────────────────────────────────────────────
        escapeHtml(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },

        formatMoney(v) {
            const n = parseFloat(v) || 0;
            return 'R$ ' + n.toFixed(2)
                .replace('.', ',')
                .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
            const hh  = String(dt.getHours()).padStart(2, '0');
            const mm  = String(dt.getMinutes()).padStart(2, '0');
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
        // Modal com botões Sim (verde) e Não (vermelho), centralizados.
        confirm(message, opts) {
            opts = opts || {};
            return new Promise(resolve => {
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
                            <button type="button" class="ir-btn-green" data-yes>${opts.confirmText || 'Sim'}</button>
                            <button type="button" class="ir-btn-red" data-no>${opts.cancelText || 'Não'}</button>
                        </div>
                    </div>`;
                document.body.appendChild(wrap);

                const done = (val) => {
                    wrap.classList.remove('show');
                    setTimeout(() => { wrap.remove(); resolve(val); }, 180);
                };

                wrap.querySelector('[data-yes]').onclick = () => done(true);
                wrap.querySelector('[data-no]').onclick  = () => done(false);
                wrap.querySelector('.ir-close').onclick  = () => done(false);
                wrap.addEventListener('click', e => { if (e.target === wrap) done(false); });

                // Fechar com ESC
                const onEsc = (e) => {
                    if (e.key === 'Escape') {
                        document.removeEventListener('keydown', onEsc);
                        done(false);
                    }
                };
                document.addEventListener('keydown', onEsc);
            });
        },

        // ─── SPLASH: nunca exibir nos módulos ───────────────────────
        // O carregamento é feito pelo Portal. Caso algum módulo ainda
        // tenha um #splashScreen no HTML, ele é escondido.
        suppressSplash() {
            const hide = () => {
                const s = document.getElementById('splashScreen');
                if (s) s.style.display = 'none';
            };
            hide();
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', hide);
            }
        },

        // ─── LISTA DE MÓDULOS (referência) ──────────────────────────
        MODULES: [
            'usuarios','precos','compra','transportadoras','cotacoes',
            'faturamento','frete','receber','pagar','lucro','licitacoes','estoque'
        ],

        // ─── PERMISSÃO ──────────────────────────────────────────────
        async podeConfirmar(setor) {
            try {
                const r = await fetch('/api/me', {
                    headers: { 'X-Session-Token': this.getToken() || '' }
                });
                if (!r.ok) return false;
                const me = await r.json();
                this._user = me;
                if (me.is_admin) return true;
                return String(me.sector || '').toUpperCase()
                    .includes(String(setor || '').toUpperCase());
            } catch { return false; }
        },

        // ─── VENDEDORES ─────────────────────────────────────────────
        async preencherVendedores(selectEl, valorSelecionado) {
            if (!selectEl) return;
            try {
                const r = await fetch('/api/vendedores', {
                    headers: { 'X-Session-Token': this.getToken() || '' }
                });
                if (!r.ok) return;
                const nomes = await r.json();
                const cur = valorSelecionado !== undefined && valorSelecionado !== null
                    ? valorSelecionado
                    : selectEl.value;
                selectEl.innerHTML = '<option value="">Selecione...</option>' +
                    (nomes || []).map(n => `<option value="${n}">${n}</option>`).join('');
                if (cur) selectEl.value = cur;
            } catch (_) {}
        },

        // ─── DATA/HORA BRASÍLIA ─────────────────────────────────────
        agoraBrasilia() {
            return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        }
    };

    // Aliases legados (chamadas frequentes nos módulos existentes)
    IR.vendedores = IR.preencherVendedores.bind(IR);
    IR._vend = [];

    global.IR = IR;

    // Esconde splash por padrão em todos os módulos
    IR.suppressSplash();
})(window);

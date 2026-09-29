async function carregarTudo() {
    try {
        await loadPrecos(state.currentPage);
        await atualizarMarcasDisponiveis();
    } catch (err) {
        console.error('Erro ao carregar:', err);
    } finally {
        // Avisa o portal que o módulo terminou de carregar
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'ir-module-ready', module: 'precos' }, '*');
            }
        } catch (e) {}
    }
}

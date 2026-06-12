// ============================================================================
// UTILS.JS - Funções utilitárias compartilhadas do Frontend
// ============================================================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('custom-toast');        
    const toastMessage = document.getElementById('toast-message');

    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.className = ''; // Limpa classes anteriores
    toast.classList.add(type); // Adiciona 'success' ou 'error'
    toast.classList.add('show');

    // Esconde a notificação após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function getFullUrl(path) {
    // Se o caminho não começar com http (é um caminho local /uploads/), adiciona a base da API        
    if (path && !path.startsWith('http') && !path.startsWith('/')) {
        return `/${path}`;
    }
    return path;
}

function getTexto(item, campo) {
    const lang = localStorage.getItem('selectedLanguage') || 'pt';

    // Se for inglês E existir tradução, retorna inglês. Senão, retorna PT. 
    if (lang === 'en' && item[campo + '_en']) {
        return item[campo + '_en'];
    }
    // O controller agora retorna 'titulo_pt', mas vamos garantir compatibilidade
    return item[campo + '_pt'] || item[campo];
}

function formatarData(dataISO, lang) {
    if (!dataISO) return '';
    const data = new Date(dataISO);
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

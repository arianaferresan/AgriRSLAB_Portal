document.addEventListener('DOMContentLoaded', () => {
    carregarProjetos();
    configurarFiltros();
});

// Recarrega projetos quando o idioma mudar
window.addEventListener('languageChange', () => {
    carregarProjetos();
});

async function carregarProjetos() {
    try {
        // Pega o idioma do localStorage para fazer a requisição correta
        const lang = localStorage.getItem('selectedLanguage') || 'pt';
        const resposta = await fetch(`/api/projetos/publicos?lang=${lang}`);
        const projetos = await resposta.json();

        // salva para filtros
        window.todosProjetos = projetos;

        renderizarProjetos(projetos);

    } catch (erro) {
        console.error("Erro ao carregar projetos:", erro);
    }
}

// ===============================================
// RENDERIZA LISTA 
// ===============================================
// Função auxiliar para pegar texto baseado no idioma


function renderizarProjetos(lista) {

    lista.sort((a, b) => {
        if (a.destaque === b.destaque) return 0;
        return a.destaque ? -1 : 1;
    });

    const container = document.getElementById('lista-projetos');
    const containerHome = document.getElementById('projeto-destaque-home'); // Novo container na Home
    const mensagem = document.getElementById('mensagem');

    // =========================================================
    // RENDERIZAÇÃO NA PÁGINA DE PROJETOS (GALERIA)
    // =========================================================
    if (container) {
        container.innerHTML = '';

        if (!lista || lista.length === 0) {
            if (mensagem) mensagem.style.display = 'block';
            return;
        }

        if (mensagem) mensagem.style.display = 'none';

        lista.forEach((proj) => {
            const tituloExibicao = getTexto(proj, 'titulo');
            const destaqueClasse = proj.destaque ? 'item-destaque' : '';

            const a = document.createElement('a');
            a.href = `../pagina-projetos/projeto-detalhe.html?id=${proj.id}`; // Ajuste de caminho relativo pode ser necessário dependendo de onde o script é chamado
            // Se estiver na home, o caminho seria 'pagina-projetos/projeto-detalhe.html', mas aqui estamos assumindo estrutura padrão.
            // Melhor usar caminho absoluto ou verificar location.pathname

            // Correção para caminho relativo universal
            const pathPrefix = window.location.pathname.includes('pagina-inicial') ? '../pagina-projetos/' : '';
            a.href = `${pathPrefix}projeto-detalhe.html?id=${proj.id}`;

            a.className = `item-galeria ${destaqueClasse} ${proj.fase || ''}`;

            const img = document.createElement('img');
            img.src = proj.url_imagem;
            img.alt = tituloExibicao;

            const divOverlay = document.createElement('div');
            divOverlay.className = 'overlay-texto';
            divOverlay.textContent = tituloExibicao;

            a.appendChild(img);
            a.appendChild(divOverlay);

            container.appendChild(a);
        });
    }

    // =========================================================
    // RENDERIZAÇÃO NA HOME (APENAS DESTAQUE)
    // =========================================================
    if (containerHome) {
        containerHome.innerHTML = '';
        const destaque = lista.find(p => p.destaque);

        if (destaque) {
            const tituloExibicao = getTexto(destaque, 'titulo');
            const a = document.createElement('a');
            // Na home, o link deve apontar para a pasta de projetos
            a.href = `../pagina-projetos/projeto-detalhe.html?id=${destaque.id}`;
            a.className = `item-galeria item-destaque`; // Mantém classes de estilo

            const img = document.createElement('img');
            img.src = destaque.url_imagem;
            img.alt = tituloExibicao;

            const divOverlay = document.createElement('div');
            divOverlay.className = 'overlay-texto';
            divOverlay.textContent = tituloExibicao;

            a.appendChild(img);
            a.appendChild(divOverlay);
            containerHome.appendChild(a);
        }
    }
}

// ===============================================
// FILTROS 
// ===============================================
function configurarFiltros() {
    const botoes = document.querySelectorAll('.botao-filtro');

    botoes.forEach(botao => {
        botao.addEventListener('click', () => {
            botoes.forEach(b => b.classList.remove('ativo'));
            botao.classList.add('ativo');

            const filtro = botao.getAttribute('data-filtro');

            if (filtro === 'todos') {
                renderizarProjetos(window.todosProjetos);
                return;
            }

            const filtrados = window.todosProjetos.filter(
                proj => proj.fase === filtro
            );

            renderizarProjetos(filtrados);
        });
    });
}

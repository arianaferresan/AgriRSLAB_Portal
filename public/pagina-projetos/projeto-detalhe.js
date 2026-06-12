document.addEventListener('DOMContentLoaded', carregarProjeto);



/**
 * Retorna mensagens traduzidas conforme o idioma selecionado.
 */
function getMensagem(chave) {
    const lang = localStorage.getItem('selectedLanguage') || 'pt';
    const mensagens = {
        'autores_nao_informados': {
            'pt': 'Autores não informados',
            'en': 'Authors not informed'
        }
    };
    return mensagens[chave] ? mensagens[chave][lang] : '';
}

async function carregarProjeto() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const detalhesContainer = document.querySelector('.detalhes_projetos');

    if (!id) {
        if (detalhesContainer) {
            detalhesContainer.innerHTML = '';
            const p = document.createElement('p');
            p.textContent = 'Projeto não encontrado.';
            detalhesContainer.appendChild(p);
        }
        return;
    }

    try {
        const resposta = await fetch(`/api/projetos/${id}`);
        const projeto = await resposta.json();

        console.log("DETALHE CARREGADO:", projeto);

        if (!projeto || projeto.erro) {
            if (detalhesContainer) {
                detalhesContainer.innerHTML = '';
                const p = document.createElement('p');
                p.textContent = 'Projeto não encontrado.';
                detalhesContainer.appendChild(p);
            }
            return;
        }

        // Título do navegador
        document.getElementById('titulo-pagina').textContent = getTexto(projeto, 'titulo');

        // Título
        document.getElementById('titulo').textContent = getTexto(projeto, 'titulo');

        // Autores (pulando linha por quebra de vírgula) de forma segura
        const autoresElement = document.getElementById('autores');
        autoresElement.innerHTML = '';
        if (projeto.autores) {
            const partes = projeto.autores.split(',');
            partes.forEach((parte, index) => {
                autoresElement.appendChild(document.createTextNode(parte.trim()));
                if (index < partes.length - 1) {
                    autoresElement.appendChild(document.createElement('br'));
                }
            });
        } else {
            autoresElement.textContent = getMensagem('autores_nao_informados');
        }

        // Conteúdo
        document.getElementById('conteudo').textContent = getTexto(projeto, 'conteudo');

        // Imagem
        if (projeto.url_imagem) {
            document.getElementById('imagem').src = projeto.url_imagem;
            document.getElementById('imagem').alt = getTexto(projeto, 'titulo');
        } else {
            document.getElementById('imagem').style.display = 'none';
        }

    } catch (erro) {
        console.error("Erro ao carregar detalhes:", erro);
    }
}

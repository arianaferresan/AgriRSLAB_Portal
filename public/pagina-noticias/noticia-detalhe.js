document.addEventListener('DOMContentLoaded', carregarPaginaNoticia);

function formatarData(dataISO) {
    if (!dataISO) return 'Data não informada';
    const data = new Date(dataISO);
    const dia = String(data.getUTCDate()).padStart(2, '0');
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
    const ano = data.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
}

function configurarCompartilhamento() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    
    const setHref = (id, link) => {
        const el = document.getElementById(id);
        if (el) el.href = link;
    };

    setHref("shareWhatsApp", `https://api.whatsapp.com/send?text=${title}%20${url}`);
    setHref("shareEmail", `mailto:?subject=${title}&body=Veja%20essa%20matéria:%20${url}`);
    setHref("shareLinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${url}`);
}

async function carregarNoticiaDetalhe(id) {
    try {
        const resposta = await fetch(`/api/noticias/${id}`);
        const noticiaTextoElement = document.getElementById('noticia-texto');
        if (resposta.status === 404) {
            document.getElementById('noticia-titulo').textContent = 'Notícia não encontrada.';
            document.getElementById('noticia-data').textContent = '';
            
            noticiaTextoElement.innerHTML = '';
            const p = document.createElement('p');
            p.className = 'texto-conteudo';
            p.textContent = 'A notícia que você procura não existe ou foi removida.';
            noticiaTextoElement.appendChild(p);
            return null;
        }
        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);
        }
        
        const noticia = await resposta.json();
        
        // Preenche o conteúdo principal
        document.getElementById('page-title').textContent = noticia.titulo;
        document.getElementById('noticia-titulo').textContent = noticia.titulo;
        document.getElementById('noticia-data').textContent = formatarData(noticia.data_criacao);
        
        const subtituloElement = document.getElementById('noticia-subtitulo');
        if (noticia.subtitulo) {
             subtituloElement.textContent = noticia.subtitulo;
             subtituloElement.style.display = 'block';
        } else {
            subtituloElement.style.display = 'none';
        }
        
        // O texto completo deve ser inserido em seu bloco de forma segura
        noticiaTextoElement.innerHTML = '';
        const pTexto = document.createElement('p');
        pTexto.className = 'texto-conteudo';
        pTexto.textContent = noticia.texto || 'Conteúdo em breve.';
        noticiaTextoElement.appendChild(pTexto);
        
        // Imagem
        const imagemElement = document.getElementById('noticia-imagem');
        if (noticia.url_imagem) {
            imagemElement.src = noticia.url_imagem.startsWith('/uploads') ? noticia.url_imagem : `../${noticia.url_imagem}`;
            imagemElement.alt = noticia.titulo;
            imagemElement.style.display = 'block';
        } else {
            imagemElement.style.display = 'none';
        }

        configurarCompartilhamento();
        return noticia;

    } catch (erro) {
        console.error("Erro ao carregar notícia:", erro);
        document.getElementById('noticia-titulo').textContent = 'Erro ao carregar notícia.';
        document.getElementById('noticia-data').textContent = 'Verifique a conexão com o servidor.';
        document.getElementById('noticia-subtitulo').style.display = 'none';
        
        const noticiaTextoElement = document.getElementById('noticia-texto');
        noticiaTextoElement.innerHTML = '';
        const pErro = document.createElement('p');
        pErro.className = 'texto-conteudo';
        pErro.textContent = 'Falha ao buscar conteúdo.';
        noticiaTextoElement.appendChild(pErro);
        return null;
    }
}

async function carregarSugeridas(idAtual) {
    const container = document.getElementById('sugeridas-container');
    container.innerHTML = '';
    const pLoading = document.createElement('p');
    pLoading.textContent = 'Carregando sugestões...';
    container.appendChild(pLoading);

    if (!idAtual) {
        container.innerHTML = '';
        const pErroId = document.createElement('p');
        pErroId.textContent = 'Não é possível carregar sugestões sem o ID da notícia atual.';
        container.appendChild(pErroId);
        return;
    }
    
    try {
        const resposta = await fetch(`/api/noticias/sugeridas?idAtual=${idAtual}`);
        
       if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        const sugeridas = await resposta.json();
        container.innerHTML = ''; 

        if (sugeridas.length === 0) {
            const pVazio = document.createElement('p');
            pVazio.textContent = 'Nenhuma outra notícia sugerida no momento.';
            container.appendChild(pVazio);
            return;
        }

        sugeridas.forEach(noticia => {
            const linkHref = noticia.url_noticia 
                ? noticia.url_noticia 
                : `noticias2.html?id=${noticia.id_noticias}`;
            
            const targetAttr = noticia.url_noticia ? '_blank' : '_self';

            const a = document.createElement('a');
            a.href = linkHref;
            a.target = targetAttr;

            const divCard = document.createElement('div');
            divCard.className = 'noticia-sugerida';

            const img = document.createElement('img');
            img.src = noticia.url_imagem;
            img.alt = noticia.titulo;
            img.onerror = () => { img.style.display = 'none'; };
            divCard.appendChild(img);

            const divInfo = document.createElement('div');
            
            const h4 = document.createElement('h4');
            h4.textContent = noticia.titulo;
            divInfo.appendChild(h4);

            const pResumo = document.createElement('p');
            pResumo.textContent = noticia.subtitulo || (noticia.texto ? noticia.texto.substring(0, 80) + '...' : '');
            divInfo.appendChild(pResumo);

            const spanData = document.createElement('span');
            spanData.textContent = formatarData(noticia.data_criacao);
            divInfo.appendChild(spanData);

            const pLerMais = document.createElement('p');
            pLerMais.className = 'continuar-lendo';
            pLerMais.textContent = 'Ler mais';
            divInfo.appendChild(pLerMais);

            divCard.appendChild(divInfo);
            a.appendChild(divCard);
            container.appendChild(a);
        });

    } catch (erro) {
        console.error("Erro ao carregar sugestões:", erro);
        container.innerHTML = '';
        const pErroGeral = document.createElement('p');
        pErroGeral.textContent = 'Falha ao carregar sugestões.';
        container.appendChild(pErroGeral);
    }
}


async function carregarPaginaNoticia() {
    // 1. Pega o ID da URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
        document.getElementById('noticia-titulo').textContent = 'Erro: ID da notícia não fornecido.';
        document.getElementById('noticia-data').textContent = '';
        
        const noticiaTextoElement = document.getElementById('noticia-texto');
        noticiaTextoElement.innerHTML = '';
        const pErroVoltar = document.createElement('p');
        pErroVoltar.className = 'texto-conteudo';
        pErroVoltar.textContent = 'Tente voltar para a lista de notícias.';
        noticiaTextoElement.appendChild(pErroVoltar);
        return;
    }

    // 2. Carrega a notícia principal
    const noticia = await carregarNoticiaDetalhe(id);
    
    // 3. Se a notícia principal foi carregada, busca as sugeridas
    if (noticia) {
        carregarSugeridas(id);
    }
}
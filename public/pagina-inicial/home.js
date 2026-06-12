document.addEventListener('DOMContentLoaded', () => {
    // A função carregarProjetoDestaque foi removida pois o projetos.js já cuida disso
    // e o elemento #projeto-destaque não existe mais no HTML atual.
    traduzirHome();
    carregarNoticiasHome();
});

// Escuta mudanças de idioma e atualiza o conteúdo da página
window.addEventListener('languageChange', () => {
    traduzirHome();
    carregarNoticiasHome(); // Recarrega as notícias no novo idioma
});

const dicionarioHome = {
    pt: {
        carregando: 'Carregando notícias...',
        semNoticias: 'Nenhuma notícia publicada no momento.',
        semTitulo: 'Notícia sem título',
        imagemPrincipal: 'Notícia principal',
        leiaMais: 'Leia mais',
        semOutras: 'Nenhuma outra notícia por aqui ainda.',
        erro: 'Não foi possível carregar as notícias agora.',
        verTodas: 'Ver todas as notícias',
        tituloAreas: 'Inovação no Campo <br>Nossas Áreas de Pesquisa',
        sloganProjetos: 'Nossas pesquisas transformam dados de satélite em soluções para uma agricultura mais produtiva e sustentável.',
        tituloNoticias: 'Últimas Notícias',
        btVerProjetos: 'Ver todos os projetos',
        anuncioTitulo: 'AgriRS',
        anuncioTexto: 'Conectando tecnologia, ciência e responsabilidade socioambiental para gerar conhecimento e apoiar a tomada de decisões.',
        areas: {
            mapeamento: { titulo: 'Mapeamento Agrícola', texto: 'O AgriRS Lab usa satélites e sensoriamento remoto para mapear as principais culturas do Brasil, auxiliando no planejamento agrícola e na análise de uso e ocupação do solo.' },
            previsao: { titulo: 'Previsão de Safras e Perdas', texto: 'Aplicação de modelos climáticos e dados orbitais para mitigar riscos e garantir a segurança alimentar.' },
            monitoramento: { titulo: 'Monitoramento de Safras', texto: 'Identificação dos ciclos de cultivo por satélite, apoiando o manejo de campo e a estimativa de produtividade.' },
            desmatamento: { titulo: 'Detecção de Desmatamento', texto: 'Uso de sensoriamento remoto e algoritmos para detectar mudanças no uso da terra e apoiar a preservação dos biomas.' },
            recursos: { titulo: 'Gestão de Recursos Hídricos', texto: 'Análise de bacias hidrográficas e avaliação do impacto ambiental para promover práticas agrícolas sustentáveis.' }
        }
    },
    en: {
        carregando: 'Loading news...',
        semNoticias: 'No news published at the moment.',
        semTitulo: 'Untitled news',
        imagemPrincipal: 'Main news',
        leiaMais: 'Read more',
        semOutras: 'No other news here yet.',
        erro: 'Could not load news right now.',
        verTodas: 'See all news',
        tituloAreas: 'Innovation in the Field <br>Our Research Areas',
        sloganProjetos: 'Our research transforms satellite data into solutions for more productive and sustainable agriculture.',
        tituloNoticias: 'Latest News',
        btVerProjetos: 'See all projects',
        anuncioTitulo: 'AgriRS',
        anuncioTexto: 'Connecting technology, science, and socio-environmental responsibility to generate knowledge and support decision-making.',
        areas: {
            mapeamento: { titulo: 'Agricultural Mapping', texto: 'AgriRS Lab uses satellites and remote sensing to map Brazil\'s main crops, assisting in agricultural planning and land use analysis.' },
            previsao: { titulo: 'Crop and Loss Forecasting', texto: 'Application of climate models and orbital data to mitigate risks and ensure food security.' },
            monitoramento: { titulo: 'Crop Monitoring', texto: 'Identification of crop cycles by satellite, supporting field management and productivity estimation.' },
            desmatamento: { titulo: 'Deforestation Detection', texto: 'Use of remote sensing and algorithms to detect changes in land use and support biome preservation.' },
            recursos: { titulo: 'Water Resources Management', texto: 'Analysis of watersheds and environmental impact assessment to promote sustainable agricultural practices.' }
        }
    }
};

function traduzirHome() {
    const lang = localStorage.getItem('selectedLanguage') || 'pt';
    const traducoes = dicionarioHome[lang] || dicionarioHome.pt;

    // Traduz textos estáticos
    const areasTitulo = document.querySelector('.areas-titulo');
    if (areasTitulo) areasTitulo.innerHTML = traducoes.tituloAreas;

    const projetosSlogan = document.querySelector('.projetos-slogan');
    if (projetosSlogan) projetosSlogan.textContent = traducoes.sloganProjetos;

    const noticiaTitulo = document.querySelector('.noticia-titulo');
    if (noticiaTitulo) noticiaTitulo.textContent = traducoes.tituloNoticias;

    const btVerProjetos = document.querySelector('.acesso-projetos-bt');
    if (btVerProjetos) btVerProjetos.textContent = traducoes.btVerProjetos;

    const anuncioTitulo = document.querySelector('.anuncio_texto h1');
    if (anuncioTitulo) anuncioTitulo.textContent = traducoes.anuncioTitulo;

    const anuncioTexto = document.querySelector('.anuncio_p');
    if (anuncioTexto) anuncioTexto.textContent = traducoes.anuncioTexto;

    // Traduz cards de áreas (assumindo ordem fixa ou adicionando IDs seria melhor, mas vamos pela ordem)
    const cards = document.querySelectorAll('.area-card');
    const chavesAreas = ['mapeamento', 'previsao', 'monitoramento', 'desmatamento', 'recursos'];

    cards.forEach((card, index) => {
        if (chavesAreas[index]) {
            const h3 = card.querySelector('h3');
            const p = card.querySelector('p');
            if (h3) h3.textContent = traducoes.areas[chavesAreas[index]].titulo;
            if (p) p.textContent = traducoes.areas[chavesAreas[index]].texto;
        }
    });
}

async function carregarNoticiasHome() {
    const principalCard = document.getElementById('noticia-principal');
    const principalImagem = document.getElementById('noticia-principal-imagem');
    const principalTitulo = document.getElementById('noticia-principal-titulo');
    const principalSubtitulo = document.getElementById('noticia-principal-subtitulo');
    const principalData = document.getElementById('noticia-principal-data');
    const principalLink = document.getElementById('noticia-principal-link');
    const secundarias = document.getElementById('noticias-secundarias');
    const mensagem = document.getElementById('noticias-mensagem');
    const verTodasLink = document.querySelector('.ver-todas a');

    if (!principalCard || !secundarias) return;

    const lang = localStorage.getItem('selectedLanguage') || 'pt';
    const traducoes = dicionarioHome[lang] || dicionarioHome.pt;

    // Atualiza texto do link "Ver todas"
    if (verTodasLink) {
        verTodasLink.textContent = traducoes.verTodas;
    }

    setEstado(mensagem, traducoes.carregando);
    secundarias.innerHTML = `<p class="estado-informativo">${traducoes.carregando}</p>`;

    try {
        const noticias = await buscarNoticiasParaHome(lang);

        if (!Array.isArray(noticias) || noticias.length === 0) {
            ocultarElemento(principalCard);
            secundarias.innerHTML = `<p class="estado-informativo">${traducoes.semNoticias}</p>`;
            setEstado(mensagem, '');
            return;
        }

        const [principal, ...resto] = noticias;

        preencherNoticiaPrincipal(principal, {
            card: principalCard,
            imagem: principalImagem,
            titulo: principalTitulo,
            subtitulo: principalSubtitulo,
            data: principalData,
            link: principalLink
        }, lang, traducoes);

        preencherNoticiasSecundarias(resto.slice(0, 2), secundarias, lang, traducoes);
        setEstado(mensagem, '');
    } catch (erro) {
        console.error('Erro ao carregar notícias da home:', erro);
        ocultarElemento(principalCard);
        secundarias.innerHTML = '';
        setEstado(mensagem, traducoes.erro);
    }
}

function preencherNoticiaPrincipal(noticia, refs, lang, traducoes) {
    const { card, imagem, titulo, subtitulo, data, link } = refs;

    titulo.textContent = (noticia && noticia.titulo) || traducoes.semTitulo;
    subtitulo.textContent = resumirTexto(
        (noticia && (noticia.subtitulo || noticia.texto)) || '',
        240
    );

    aplicarImagem(imagem, noticia && noticia.url_imagem);
    if (imagem) imagem.alt = (noticia && noticia.titulo) || traducoes.imagemPrincipal;

    if (data) {
        data.textContent = formatarData(noticia && noticia.data_criacao, lang);
        data.dateTime = (noticia && noticia.data_criacao) || '';
    }

    const linkHref = noticia.url_noticia
        ? noticia.url_noticia
        : `../pagina-noticias/noticias2.html?id=${noticia.id_noticias}`;

    if (link) {
        link.textContent = traducoes.leiaMais;
    }

    if (card) {
        card.href = linkHref;
        if (noticia.url_noticia) {
            card.target = '_blank';
        } else {
            card.removeAttribute('target');
        }
        card.style.display = 'flex';
    }
}

function preencherNoticiasSecundarias(lista, container, lang, traducoes) {
    container.innerHTML = '';

    if (!lista || lista.length === 0) {
        const pVazio = document.createElement('p');
        pVazio.className = 'estado-informativo';
        pVazio.textContent = traducoes.semOutras;
        container.appendChild(pVazio);
        return;
    }

    lista.forEach((noticia) => {
        const link = document.createElement('a');
        link.className = 'card-noticia-link';

        const linkHref = noticia.url_noticia
            ? noticia.url_noticia
            : `../pagina-noticias/noticias2.html?id=${noticia.id_noticias}`;

        link.href = linkHref;
        if (noticia.url_noticia) {
            link.target = '_blank';
        }

        const divCard = document.createElement('div');
        divCard.className = 'card-noticia';

        const img = document.createElement('img');
        img.src = (noticia && noticia.url_imagem) || '';
        img.alt = (noticia && noticia.titulo) || 'Notícia';
        divCard.appendChild(img);

        const divTexto = document.createElement('div');
        divTexto.className = 'texto';

        const h3 = document.createElement('h3');
        h3.textContent = (noticia && noticia.titulo) || traducoes.semTitulo;
        divTexto.appendChild(h3);

        const pResumo = document.createElement('p');
        pResumo.textContent = resumirTexto((noticia && (noticia.subtitulo || noticia.texto)) || '', 140);
        divTexto.appendChild(pResumo);

        const divFooter = document.createElement('div');
        divFooter.className = 'noticia-principal-footer';

        const spanData = document.createElement('span');
        spanData.className = 'dateEvent';
        const time = document.createElement('time');
        time.textContent = formatarData(noticia && noticia.data_criacao, lang);
        spanData.appendChild(time);
        divFooter.appendChild(spanData);

        const spanLerMais = document.createElement('span');
        spanLerMais.className = 'continuar-lendo';
        spanLerMais.textContent = traducoes.leiaMais;
        divFooter.appendChild(spanLerMais);

        divTexto.appendChild(divFooter);
        divCard.appendChild(divTexto);
        link.appendChild(divCard);

        aplicarImagem(img, noticia && noticia.url_imagem);

        container.appendChild(link);
    });
}

async function buscarNoticiasParaHome(lang) {
    try {
        const respostaDestaques = await fetch(`/api/noticias/destaques?lang=${lang}`);
        if (respostaDestaques.ok) {
            const destaques = await respostaDestaques.json();
            if (Array.isArray(destaques) && destaques.length > 0) {
                return destaques;
            }
        }
    } catch (erro) {
        console.warn('Falha ao carregar destaques, buscando todas as notícias.', erro);
    }

    const respostaTodas = await fetch(`/api/noticias?lang=${lang}`);
    if (!respostaTodas.ok) throw new Error('Erro ao buscar notícias');
    return respostaTodas.json();
}

function resumirTexto(texto, limite) {
    const limpo = limparTexto(texto);
    if (limpo.length <= limite) return limpo;
    return `${limpo.slice(0, limite).trim()}...`;
}

function limparTexto(texto) {
    if (!texto) return '';
    return texto.replace(/<[^>]*>?/gm, '').trim();
}

function formatarData(dataISO, lang) {
    if (!dataISO) return '';
    const data = new Date(dataISO);
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function aplicarImagem(imgEl, url) {
    if (!imgEl) return;
    if (!url) {
        imgEl.style.display = 'none';
        imgEl.removeAttribute('src');
        return;
    }
    imgEl.style.display = 'block';
    imgEl.src = url;
    imgEl.onerror = () => {
        imgEl.style.display = 'none';
    };
}

function setEstado(elemento, texto) {
    if (!elemento) return;
    elemento.textContent = texto || '';
    elemento.style.display = texto ? 'block' : 'none';
}

function ocultarElemento(el) {
    if (el) el.style.display = 'none';
}

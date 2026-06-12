// =========================================
// CONFIGURAÇÕES GLOBAIS
// =========================================
const ITENS_POR_PAGINA = 10;
let todasAsNoticias = [];
let noticiasFiltradas = [];
let itensVisiveis = 0;
let ultimoMesRenderizado = '';

// =========================================
// TRADUÇÃO DINÂMICA
// =========================================
const dicionario = {
    'pt': {
        'principaisNoticias': 'Principais Notícias',
        'eventos': 'Eventos',
        'proximasDefesas': 'Próximas Defesas',
        'verTodas': 'Ver todas as notícias',
        'carregandoDestaques': 'Carregando destaques...',
        'erroDestaques': 'Não foi possível carregar os destaques.',
        'carregandoDefesas': 'Carregando defesas...',
        'erroDefesas': 'Erro ao carregar defesas.',
        'nenhumaDefesa': 'Nenhuma defesa agendada no momento.',
        'carregandoEventos': 'Carregando notícias...',
        'erroEventos': 'Erro ao carregar notícias.',
        'nenhumEvento': 'Nenhuma notícia encontrada.',
        'lerMais': 'Ler mais',
        'verMaisNoticias': 'Ver mais notícias',
        'nenhumaNoticia': 'Nenhuma notícia encontrada.',
        'carregandoNoticias': 'Carregando notícias...',
        'erroNoticias': 'Erro ao carregar notícias.'
    },
    'en': {
        'principaisNoticias': 'Main News',
        'eventos': 'Events',
        'proximasDefesas': 'Upcoming Defenses',
        'verTodas': 'See all news',
        'carregandoDestaques': 'Loading highlights...',
        'erroDestaques': 'Could not load highlights.',
        'carregandoDefesas': 'Loading defenses...',
        'erroDefesas': 'Error loading defenses.',
        'nenhumaDefesa': 'No defenses scheduled at the moment.',
        'carregandoEventos': 'Loading news...',
        'erroEventos': 'Error loading news.',
        'nenhumEvento': 'No news found.',
        'lerMais': 'Read more',
        'verMaisNoticias': 'See more news',
        'nenhumaNoticia': 'No news found.',
        'carregandoNoticias': 'Loading news...',
        'erroNoticias': 'Error loading news.'
    }
};

// =========================================
// FUNÇÕES AUXILIARES
// =========================================
function formatarData(dataISO, lang = 'pt') {
    if (!dataISO) return '';
    const locale = lang === 'pt' ? 'pt-BR' : 'en-US';
    const data = new Date(dataISO);
    const dia = String(data.getUTCDate()).padStart(2, '0');
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
    const ano = data.getUTCFullYear();
    return locale === 'pt-BR' ? `${dia}/${mes}/${ano}` : `${mes}/${dia}/${ano}`;
}

function getNomeMes(dataISO, lang = 'pt') {
    if (!dataISO) return '';
    const locale = lang === 'pt' ? 'pt-BR' : 'en-US';
    const data = new Date(dataISO);
    return data.toLocaleString(locale, { month: 'long', timeZone: 'UTC' });
}

// =========================================
// INICIALIZAÇÃO
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    const containerCompleto = document.getElementById('container-noticias-dinamicas');
    const containerDestaques = document.getElementById('cards-noticias');

    // PÁGINA "TODAS AS NOTÍCIAS" (notícias1)
    if (containerCompleto) {
        const filtroAno = document.getElementById("YearSelection");
        const filtroCategoria = document.getElementById("CategorySelection");
        const btnVerMais = document.querySelector(".btn-ver-mais");

        if (filtroAno) filtroAno.addEventListener("change", () => aplicarFiltros(true));
        if (filtroCategoria) filtroCategoria.addEventListener("change", () => aplicarFiltros(true));
        if (btnVerMais) btnVerMais.addEventListener("click", carregarMaisNoticias);

        traduzirPaginaCompleta();
        window.addEventListener('languageChange', traduzirPaginaCompleta);
    }
    // PÁGINA HOME
    else if (containerDestaques) {
        traduzirPagina();
        window.addEventListener('languageChange', traduzirPagina);
    }

    configurarCarrosseis();
    configurarCompartilhamento();
});

function traduzirPagina() {
    const lang = localStorage.getItem('selectedLanguage') || 'pt';
    const traducoes = dicionario[lang] || dicionario['pt'];

    // Traduz títulos estáticos
    const titulosSecao = document.querySelectorAll('.titulo-secao');
    if (titulosSecao.length > 0) {
        if (titulosSecao[0]) titulosSecao[0].textContent = traducoes.principaisNoticias;
        if (titulosSecao[1]) titulosSecao[1].textContent = traducoes.eventos;
        if (titulosSecao[2]) titulosSecao[2].textContent = traducoes.proximasDefesas;
    }

    // Recarrega conteúdo dinâmico com o idioma correto
    carregarDestaques(lang, traducoes);
    carregarDefesas(lang, traducoes);
    carregarEventosDoMes(lang, traducoes);
}

function traduzirPaginaCompleta() {
    const lang = localStorage.getItem('selectedLanguage') || 'pt';
    const traducoes = dicionario[lang] || dicionario['pt'];

    const btnVerMais = document.querySelector(".btn-ver-mais");
    if (btnVerMais) {
        btnVerMais.textContent = traducoes.verMaisNoticias;
    }
    carregarTodasNoticias(lang, traducoes);
}

// =========================================
// LÓGICA PRINCIPAL (notícias1)
// =========================================
async function carregarTodasNoticias(lang = 'pt', traducoes = dicionario.pt) {
    const container = document.getElementById('container-noticias-dinamicas');
    container.innerHTML = `<p class="loading">${traducoes.carregandoNoticias}</p>`;

    try {
        const response = await fetch(`/api/noticias?lang=${lang}`);
        if (!response.ok) throw new Error('Erro na API');

        todasAsNoticias = await response.json();
        aplicarFiltros(true);

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="erro">${traducoes.erroNoticias}</p>`;
    }
}

function aplicarFiltros(resetar = false) {
    const filtroAnoEl = document.getElementById("YearSelection");
    const filtroCatEl = document.getElementById("CategorySelection");
    const lang = localStorage.getItem('selectedLanguage') || 'pt';

    const filtroAno = filtroAnoEl ? filtroAnoEl.value : "todos";
    const filtroCategoria = filtroCatEl ? filtroCatEl.value : "todas";

    noticiasFiltradas = todasAsNoticias.filter(noticia => {
        if (!noticia.data_criacao) return false;

        const dataObj = new Date(noticia.data_criacao);
        const anoNoticia = dataObj.getUTCFullYear().toString();

        const catNoticia = noticia.categoria ? noticia.categoria.toLowerCase().trim() : '';
        const filtroCatValor = filtroCategoria.toLowerCase().trim();

        const anoValido = ["todos", "todas", "ano"].includes(filtroAno.toLowerCase());
        const matchAno = anoValido || (anoNoticia === filtroAno);

        const catValida = ["todos", "todas", "categoria"].includes(filtroCatValor);
        const matchCat = catValida || (catNoticia === filtroCatValor);

        return matchAno && matchCat;
    });

    noticiasFiltradas.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));

    if (resetar) {
        itensVisiveis = 0;
        document.getElementById('container-noticias-dinamicas').innerHTML = '';
        ultimoMesRenderizado = '';
    }

    carregarMaisNoticias();
}

// =========================================
// LÓGICA: PÁGINA HOME
// =========================================
async function carregarDestaques(lang = 'pt', traducoes = dicionario.pt) {
    const container = document.getElementById('cards-noticias');
    const btnVerTodasOriginal = container.querySelector('.ver-todas');
    
    container.innerHTML = '';
    const pLoading = document.createElement('p');
    pLoading.textContent = traducoes.carregandoDestaques;
    container.appendChild(pLoading);

    try {
        const response = await fetch(`/api/noticias/destaques?lang=${lang}`);
        if (!response.ok) throw new Error('Erro API Destaques');

        const destaques = await response.json();
        container.innerHTML = '';

        destaques.slice(0, 3).forEach(noticia => {
            const dataFormatada = new Date(noticia.data_criacao).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
                day: '2-digit', month: 'short', year: 'numeric'
            }).toUpperCase().replace('.', '').replace(/ DE /g, ' ');

            const linkHref = noticia.url_noticia 
                ? noticia.url_noticia 
                : `noticias2.html?id=${noticia.id_noticias}`;
            
            const targetAttr = noticia.url_noticia ? '_blank' : '_self';

            const a = document.createElement('a');
            a.href = linkHref;
            a.target = targetAttr;
            a.className = 'card-destaque-link';

            const divCard = document.createElement('div');
            divCard.className = 'card-noticia';

            const img = document.createElement('img');
            img.src = noticia.url_imagem;
            img.alt = noticia.titulo;
            img.onerror = () => { img.style.display = 'none'; };
            divCard.appendChild(img);

            const divTexto = document.createElement('div');
            divTexto.className = 'texto';

            const h3 = document.createElement('h3');
            h3.textContent = noticia.titulo;
            divTexto.appendChild(h3);

            const pSub = document.createElement('p');
            pSub.textContent = noticia.subtitulo || '';
            divTexto.appendChild(pSub);

            const spanData = document.createElement('span');
            spanData.textContent = dataFormatada;
            divTexto.appendChild(spanData);

            const pLerMais = document.createElement('p');
            pLerMais.className = 'continuar-lendo';
            pLerMais.textContent = traducoes.lerMais;
            divTexto.appendChild(pLerMais);

            divCard.appendChild(divTexto);
            a.appendChild(divCard);
            container.appendChild(a);
        });

        if (btnVerTodasOriginal) {
            const linkBtn = btnVerTodasOriginal.querySelector('a');
            if (linkBtn) linkBtn.textContent = traducoes.verTodas;
            container.appendChild(btnVerTodasOriginal);
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = '';
        const pErro = document.createElement('p');
        pErro.textContent = traducoes.erroDestaques;
        container.appendChild(pErro);
    }
}

async function carregarDefesas(lang = 'pt', traducoes = dicionario.pt) {
    const container = document.querySelector('.cards-defesas');
    if (!container) return;

    container.innerHTML = '';
    const pLoading = document.createElement('p');
    pLoading.style.cssText = 'padding: 20px; color: #555; width: 100%; text-align: center;';
    pLoading.textContent = traducoes.carregandoDefesas;
    container.appendChild(pLoading);

    try {
        const response = await fetch(`/api/noticias/defesas?lang=${lang}`);
        if (!response.ok) throw new Error('Erro API Defesas');

        let todasAsNoticias = await response.json();

        // FILTRO: Apenas categoria "Defesa"
        const defesas = todasAsNoticias.filter(noticia =>
            noticia.categoria && noticia.categoria.toLowerCase().trim() === 'defesa'
        );

        container.innerHTML = '';

        if (defesas.length === 0) {
            const pVazio = document.createElement('p');
            pVazio.style.cssText = 'padding: 20px; color: #555; width: 100%; text-align: center;';
            pVazio.textContent = traducoes.nenhumaDefesa;
            container.appendChild(pVazio);
            return;
        }

        const defesasParaExibir = defesas.slice(0, 6);

        defesasParaExibir.forEach(defesa => {
            const divCard = document.createElement('div');
            divCard.className = 'card-defesa';

            const img = document.createElement('img');
            img.src = defesa.url_imagem;
            img.alt = defesa.titulo;
            img.onerror = () => { img.src = '../../imagens/1.1Imagens Git/logo_404notfound.png'; };
            divCard.appendChild(img);

            const h3 = document.createElement('h3');
            h3.textContent = defesa.titulo || '';
            divCard.appendChild(h3);

            const pSub = document.createElement('p');
            pSub.textContent = defesa.subtitulo || '';
            divCard.appendChild(pSub);

            const spanData = document.createElement('span');
            spanData.textContent = formatarData(defesa.data_criacao, lang);
            divCard.appendChild(spanData);

            container.appendChild(divCard);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = '';
        const pErro = document.createElement('p');
        pErro.style.cssText = 'padding: 20px; color: red; width: 100%; text-align: center;';
        pErro.textContent = traducoes.erroDefesas;
        container.appendChild(pErro);
    }
}

async function carregarEventosDoMes(lang = 'pt', traducoes = dicionario.pt) {
    const container = document.querySelector('.conteudo-linha');
    if (!container) return;

    container.innerHTML = '';
    const pLoading = document.createElement('p');
    pLoading.style.cssText = 'padding: 20px; color: #555; width: 100%; text-align: center;';
    pLoading.textContent = traducoes.carregandoEventos;
    container.appendChild(pLoading);

    try {
        // Busca os eventos filtrados pelo backend
        const response = await fetch(`/api/noticias/eventos?lang=${lang}`);
        if (!response.ok) throw new Error('Erro API Notícias');

        let todasAsNoticias = await response.json();
        todasAsNoticias.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));

        container.innerHTML = '';

        if (todasAsNoticias.length === 0) {
            const pVazio = document.createElement('p');
            pVazio.style.cssText = 'padding: 20px; color: #555; width: 100%; text-align: center;';
            pVazio.textContent = traducoes.nenhumEvento;
            container.appendChild(pVazio);
            return;
        }

        todasAsNoticias.forEach(noticia => {
            const divEvento = document.createElement('div');
            divEvento.className = 'evento';

            const divData = document.createElement('div');
            divData.className = 'data';
            
            const spanDia = document.createElement('span');
            spanDia.className = 'dia';
            spanDia.textContent = formatarDataEventoDIA(noticia.data_criacao, lang);
            divData.appendChild(spanDia);

            const spanMes = document.createElement('span');
            spanMes.className = 'mes';
            spanMes.textContent = formatarDataEventoMES(noticia.data_criacao, lang);
            divData.appendChild(spanMes);
            
            divEvento.appendChild(divData);

            const divInfo = document.createElement('div');
            divInfo.className = 'info';

            const h3 = document.createElement('h3');
            h3.textContent = noticia.titulo;
            divInfo.appendChild(h3);

            const pSub = document.createElement('p');
            pSub.textContent = noticia.subtitulo || '';
            divInfo.appendChild(pSub);

            divEvento.appendChild(divInfo);
            container.appendChild(divEvento);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = '';
        const pErro = document.createElement('p');
        pErro.style.cssText = 'padding: 20px; color: red; width: 100%; text-align: center;';
        pErro.textContent = traducoes.erroEventos;
        container.appendChild(pErro);
    }
}

// =========================================
// FUNÇÕES Página notícias 1
// =========================================
function carregarMaisNoticias() {
    const container = document.getElementById('container-noticias-dinamicas');
    const btnContainer = document.querySelector(".ver-todas");
    const lang = localStorage.getItem('selectedLanguage') || 'pt';
    const traducoes = dicionario[lang] || dicionario['pt'];

    if (noticiasFiltradas.length === 0) {
        container.innerHTML = '';
        const pAviso = document.createElement('p');
        pAviso.className = 'aviso';
        pAviso.textContent = traducoes.nenhumaNoticia;
        container.appendChild(pAviso);
        if (btnContainer) btnContainer.style.display = 'none';
        return;
    }

    const proximoLote = noticiasFiltradas.slice(itensVisiveis, itensVisiveis + ITENS_POR_PAGINA);

    proximoLote.forEach(noticia => {
        const dataNoticia = noticia.data_criacao;
        const nomeMes = getNomeMes(dataNoticia, lang);
        const chaveMes = nomeMes;

        if (chaveMes !== ultimoMesRenderizado) {
            const h2Mes = document.createElement('h2');
            h2Mes.className = 'titulo-mes';
            h2Mes.textContent = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
            container.appendChild(h2Mes);
            ultimoMesRenderizado = chaveMes;
        }

        const linkHref = noticia.url_noticia 
            ? noticia.url_noticia 
            : `noticias2.html?id=${noticia.id_noticias}`;
        
        const targetAttr = noticia.url_noticia ? '_blank' : '_self';

        const a = document.createElement('a');
        a.href = linkHref;
        a.target = targetAttr;
        a.className = 'link-card';

        const divCard = document.createElement('div');
        divCard.className = 'card-noticia';

        const img = document.createElement('img');
        img.className = 'imageNotice';
        img.src = noticia.url_imagem;
        img.alt = noticia.titulo;
        img.onerror = () => { img.style.display = 'none'; };
        divCard.appendChild(img);

        const divTexto = document.createElement('div');
        divTexto.className = 'texto';

        const spanTag = document.createElement('span');
        spanTag.className = 'tagEvent';
        spanTag.textContent = noticia.categoria || 'Geral';
        divTexto.appendChild(spanTag);

        const h3 = document.createElement('h3');
        h3.textContent = noticia.titulo;
        divTexto.appendChild(h3);

        const pResumo = document.createElement('p');
        pResumo.textContent = noticia.texto ? noticia.texto.substring(0, 120) + '...' : '';
        divTexto.appendChild(pResumo);

        const spanData = document.createElement('span');
        spanData.className = 'dateEvent';
        const time = document.createElement('time');
        time.dateTime = dataNoticia;
        time.textContent = formatarData(dataNoticia, lang);
        spanData.appendChild(time);
        divTexto.appendChild(spanData);

        const pLerMais = document.createElement('p');
        pLerMais.className = 'continuar-lendo';
        pLerMais.textContent = traducoes.lerMais;
        divTexto.appendChild(pLerMais);

        divCard.appendChild(divTexto);
        a.appendChild(divCard);
        container.appendChild(a);
    });

    itensVisiveis += proximoLote.length;

    if (itensVisiveis >= noticiasFiltradas.length) {
        if (btnContainer) btnContainer.style.display = 'none';
    } else {
        if (btnContainer) btnContainer.style.display = 'block';
    }
}

// =========================================
// FUNÇÕES GERAIS
// =========================================
function configurarCarrosseis() {
    const cardsDefesas = document.querySelector('.cards-defesas');
    if (cardsDefesas) {
        document.querySelector('.seta-direita')?.addEventListener('click', () => {
            cardsDefesas.scrollBy({ left: 200, behavior: 'smooth' });
        });
        document.querySelector('.seta-esquerda')?.addEventListener('click', () => {
            cardsDefesas.scrollBy({ left: -200, behavior: 'smooth' });
        });
    }

    const conteudoLinha = document.querySelector('.conteudo-linha');
    if (conteudoLinha) {
        document.querySelector('.seta-baixo')?.addEventListener('click', () => {
            conteudoLinha.scrollBy({ top: 100, behavior: 'smooth' });
        });
        document.querySelector('.seta-cima')?.addEventListener('click', () => {
            conteudoLinha.scrollBy({ top: -100, behavior: 'smooth' });
        });
    }
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

function formatarDataEventoDIA(dataISO, lang = 'pt') {
    if (!dataISO) return '';
    const data = new Date(dataISO);
    const dia = String(data.getUTCDate()).padStart(2, '0');
    return `${dia}`;
}

function formatarDataEventoMES(dataISO, lang = 'pt') {
    if (!dataISO) return '';
    const locale = lang === 'pt' ? 'pt-BR' : 'en-US';
    const data = new Date(dataISO);
    const mes = data.toLocaleString(locale, { month: 'short', timeZone: 'UTC' }).toUpperCase().replace('.', '');
    return `${mes}`;
}

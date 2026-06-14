// Dicionário de traduções APENAS para o Header e Footer
const headerFooterTranslations = {
  "en": {
    "navHome": "Home",
    "navArticles": "Articles and Publications",
    "navNews": "News",
    "navMembers": "Members",
    "navProjects": "Projects",
    "navAbout": "About",
    "navJobs": "Jobs",
    "navContact": "Contact Us",
    "searchPlaceholder": "Search...",
    "footerAdminAccess": "Administrative area access:",
    "footerAccessButton": "Access",
    "footerOurEmail": "Our E-mail:",
    "footerSocialMedia": "Our social media:",
    "footerOurLocation": "Our location:",
    "footerCopyright": "Copyright © AgriRS "
  },
  "pt": {
    "navHome": "Início",
    "navArticles": "Artigos e Publicações",
    "navNews": "Notícias",
    "navMembers": "Membros",
    "navProjects": "Projetos",
    "navAbout": "Sobre",
    "navJobs": "Vagas",
    "navContact": "Fale Conosco",
    "searchPlaceholder": "Pesquisar...",
    "footerAdminAccess": "Acesso à área administrativa:",
    "footerAccessButton": "Acesso",
    "footerOurEmail": "Nosso E-mail:",
    "footerSocialMedia": "Nossas redes sociais:",
    "footerOurLocation": "Nossa localização:",
    "footerCopyright": "Copyright © AgriRS "
  }
};

// Função que aplica as traduções
function applyHeaderFooterTranslations(lang) {
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');

  const elementsToTranslate = [];
  if (header) elementsToTranslate.push(...header.querySelectorAll('[data-i18n-key], [data-i18n-placeholder]'));
  if (footer) elementsToTranslate.push(...footer.querySelectorAll('[data-i18n-key], [data-i18n-placeholder]'));

  elementsToTranslate.forEach(element => {
    const key = element.getAttribute('data-i18n-key');
    const placeholderKey = element.getAttribute('data-i18n-placeholder');

    if (key && headerFooterTranslations[lang] && headerFooterTranslations[lang][key]) {
      // Se for um input de busca, não use innerHTML, pois ele não tem conteúdo.
      if (element.id !== 'search') {
        element.innerHTML = headerFooterTranslations[lang][key];
      }
    }
    if (placeholderKey && headerFooterTranslations[lang] && headerFooterTranslations[lang][placeholderKey]) {
      element.setAttribute('placeholder', headerFooterTranslations[lang][placeholderKey]);
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  // Inicializa o VLibras imediatamente para garantir que apareça em todas as páginas.
  inicializarVLibras();

  // === CARREGAR HEADER ===
  fetch("../HeaderFooter/header.html")
    .then(response => {
      if (!response.ok) throw new Error("Erro ao carregar o header");
      return response.text();
    })
    .then(data => {
      const headerElement = document.querySelector("header");
      if (headerElement) {
        headerElement.innerHTML = data;
        // Após carregar o header, inicializa suas funcionalidades
        inicializarMenuHamburguer();
        inicializarBuscaGlobal();
        inicializarControleIdioma(); // Nova função para o seletor de idioma
        marcarLinkAtual();

        // Aplica a tradução inicial assim que o header é carregado
        applyHeaderFooterTranslations(localStorage.getItem('selectedLanguage') || 'pt');
      }
    })
    .catch(error => console.error("Erro ao carregar header:", error));


  // === CARREGAR FOOTER ===
  fetch("../HeaderFooter/footer.html")
    .then(response => {
      if (!response.ok) throw new Error("Erro ao carregar o footer");
      return response.text();
    })
    .then(data => {
      const footerElement = document.querySelector("footer");
      if (footerElement) {
        footerElement.innerHTML = data;

        // === INSERIR ANO AUTOMÁTICO ===
        const anoElemento = document.getElementById("ano");
        if (anoElemento) {
          anoElemento.textContent = new Date().getFullYear();
        }

        // Aplica a tradução inicial assim que o footer é carregado
        applyHeaderFooterTranslations(localStorage.getItem('selectedLanguage') || 'pt');
      }
    })
    .catch(error => console.error("Erro ao carregar footer:", error));
});

// === FUNÇÃO PARA CONTROLAR O MENU ===
function inicializarMenuHamburguer() {
  const hamburguer = document.getElementById("hamburguer");
  const menu = document.getElementById("navHeader"); // Usar o container da nav

  if (!hamburguer || !menu) {
    console.warn("Elementos do menu não encontrados no header.");
    return;
  }

  hamburguer.addEventListener("click", (e) => {
    e.stopPropagation(); // Impede que o clique feche o menu imediatamente
    const isOpen = menu.classList.toggle("active");
    hamburguer.setAttribute("aria-expanded", String(isOpen));
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      menu.classList.remove("active");
      hamburguer.setAttribute("aria-expanded", "false");
    }
  });

  // Fecha o menu ao clicar fora dele
  document.addEventListener("click", (event) => {
    const cliqueDentroMenu = menu.contains(event.target);
    const cliqueNoHamburguer = hamburguer.contains(event.target);
    if (!cliqueDentroMenu && !cliqueNoHamburguer) {
      menu.classList.remove("active");
      hamburguer.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      menu.classList.remove("active");
      hamburguer.setAttribute("aria-expanded", "false");
      hamburguer.focus();
    }
  });
}

// === ATIVAR BUSCA GLOBAL ===
function inicializarBuscaGlobal() {
  const input = document.getElementById("search");
  const botao = document.getElementById("searchBtn");

  if (!input || !botao) {
    console.warn("Campo de busca não encontrado no header.");
    return;
  }

  // Quando tecla Enter
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") executarBusca();
  });

  // Quando clica no botão
  botao.addEventListener("click", executarBusca);

  function executarBusca() {
    const termo = input.value.trim();
    if (termo) {
      window.location.href = `/pagina-busca/buscar.html?q=${encodeURIComponent(termo)}`;
    }
  }
}

// === FUNÇÃO PARA CONTROLAR O IDIOMA ===
function inicializarControleIdioma() {
  // Define o idioma padrão se não existir
  if (!localStorage.getItem('selectedLanguage')) {
    localStorage.setItem('selectedLanguage', 'pt');
  }

  // Torna a função de mudança de idioma global para os botões `onclick`
  window.mudarIdioma = function (lang) {
    localStorage.setItem('selectedLanguage', lang);
    applyHeaderFooterTranslations(lang); // Reaplica a tradução imediatamente
    // Dispara um evento para que o i18n.js e outros scripts possam "ouvir" a mudança
    window.dispatchEvent(new Event('languageChange')); // Notifica todos os listeners
  }

  document.querySelectorAll('.language-button[data-lang]').forEach((button) => {
    const lang = button.getAttribute('data-lang');
    button.setAttribute('aria-pressed', String(lang === localStorage.getItem('selectedLanguage')));
    button.addEventListener('click', () => {
      window.mudarIdioma(lang);
      document.querySelectorAll('.language-button[data-lang]').forEach((item) => {
        item.setAttribute('aria-pressed', String(item.getAttribute('data-lang') === lang));
      });
    });
  });
}

function marcarLinkAtual() {
  const caminhoAtual = window.location.pathname;

  document.querySelectorAll('.decorationHeaderMenu[href]').forEach((link) => {
    const destino = new URL(link.getAttribute('href'), window.location.href).pathname;

    if (caminhoAtual === destino || caminhoAtual.endsWith(destino)) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

/**
 * Adiciona o widget do VLibras à página.
 * Garante que o script seja adicionado apenas uma vez.
 */
function inicializarVLibras() {
  // Se o widget já existe, não faz nada.
  if (document.querySelector('[vw]')) return;

  // 1. Cria os elementos HTML do widget
  const vwContainer = document.createElement('div');
  vwContainer.setAttribute('vw', '');
  vwContainer.classList.add('enabled');
  vwContainer.innerHTML = `
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper>
            <div class="vw-plugin-top-wrapper"></div>
        </div>
    `;
  document.body.appendChild(vwContainer);

  // 2. Cria e anexa o script principal do VLibras de forma segura
  const pluginScript = document.createElement('script');
  pluginScript.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
  pluginScript.async = true;
  pluginScript.onload = () => {
    new window.VLibras.Widget('https://vlibras.gov.br/app');
  };
  document.body.appendChild(pluginScript);
}

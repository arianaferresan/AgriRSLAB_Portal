(function () {
  const DEFAULT_SOBRE = {
    titulo: "Sobre o AgriRSLab",
    subtitulo: "Sensoriamento remoto aplicado à agricultura e ao meio ambiente",
    texto_principal:
      "O AgriRSLab, vinculado ao Programa de Pós-Graduação em Sensoriamento Remoto do Instituto Nacional de Pesquisas Espaciais (INPE), dedica-se ao avanço do conhecimento científico e tecnológico na aplicação de sensoriamento remoto para a agricultura e o meio ambiente.",
    missao:
      "Desenvolver soluções inovadoras para o monitoramento agrícola, avaliação de impactos ambientais e gestão de recursos naturais.",
    visao:
      "Ser referência em pesquisa, desenvolvimento e formação em sensoriamento remoto aplicado à agricultura sustentável.",
    valores:
      "Ciência aplicada\nInovação responsável\nColaboração\nSustentabilidade\nTransparência",
    url_imagem: "../assets/5. Parceiros/membros.png",
  };

  const elements = {
    imagem: document.querySelector(".sobre-img img"),
    titulo: document.getElementById("sobre-titulo"),
    subtitulo: document.getElementById("sobre-subtitulo"),
    texto: document.getElementById("sobre-texto"),
    missao: document.getElementById("sobre-missao"),
    visao: document.getElementById("sobre-visao"),
    valores: document.getElementById("sobre-valores"),
  };

  function renderSobre(content) {
    const data = { ...DEFAULT_SOBRE, ...content };

    elements.imagem.src = data.url_imagem || DEFAULT_SOBRE.url_imagem;
    elements.imagem.alt = data.titulo || "Imagem institucional do AgriRSLab";
    elements.titulo.textContent = data.titulo;
    elements.subtitulo.textContent = data.subtitulo;
    elements.texto.textContent = data.texto_principal;
    elements.missao.textContent = data.missao;
    elements.visao.textContent = data.visao;

    elements.valores.innerHTML = "";
    String(data.valores || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        elements.valores.appendChild(li);
      });
  }

  async function carregarSobre() {
    try {
      const response = await fetch("/api/sobre/publico");
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.mensagem || "Erro ao carregar conteúdo Sobre.");
      }

      renderSobre(data);
    } catch (error) {
      console.error(error.message);
      renderSobre(DEFAULT_SOBRE);
    }
  }

  document.addEventListener("DOMContentLoaded", carregarSobre);
})();

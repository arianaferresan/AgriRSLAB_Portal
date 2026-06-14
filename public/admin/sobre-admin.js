(function () {
  const API_URL = "/api/sobre/admin";
  const FALLBACK_STORAGE_KEY = "adminSobreDraftFallback";
  const DEFAULT_CONTENT = {
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
    url_imagem: "/assets/5. Parceiros/membros.png",
  };

  const fields = {
    titulo: document.getElementById("sobre-titulo"),
    subtitulo: document.getElementById("sobre-subtitulo"),
    texto: document.getElementById("sobre-texto"),
    missao: document.getElementById("sobre-missao"),
    visao: document.getElementById("sobre-visao"),
    valores: document.getElementById("sobre-valores"),
    imagemUrl: document.getElementById("sobre-imagem-url"),
    imagemArquivo: document.getElementById("sobre-imagem-arquivo"),
  };

  const preview = {
    imagem: document.getElementById("preview-sobre-imagem"),
    titulo: document.getElementById("preview-sobre-titulo"),
    subtitulo: document.getElementById("preview-sobre-subtitulo"),
    texto: document.getElementById("preview-sobre-texto"),
    missao: document.getElementById("preview-sobre-missao"),
    visao: document.getElementById("preview-sobre-visao"),
    valores: document.getElementById("preview-sobre-valores"),
  };

  const form = document.getElementById("form-sobre-admin");
  const feedback = document.getElementById("sobre-feedback");
  const saveButton = document.getElementById("btn-salvar-sobre");
  const cancelButton = document.getElementById("btn-cancelar-sobre");

  let lastLoadedContent = { ...DEFAULT_CONTENT };

  function getFallbackDraft() {
    try {
      const saved = localStorage.getItem(FALLBACK_STORAGE_KEY);
      return saved ? { ...DEFAULT_CONTENT, ...JSON.parse(saved) } : null;
    } catch (_error) {
      return null;
    }
  }

  function normalizeApiContent(content) {
    return {
      ...DEFAULT_CONTENT,
      ...content,
      texto_principal: content?.texto_principal || content?.texto || DEFAULT_CONTENT.texto_principal,
      url_imagem: content?.url_imagem || content?.imagemUrl || DEFAULT_CONTENT.url_imagem,
    };
  }

  function getFormData() {
    return {
      titulo: fields.titulo.value.trim(),
      subtitulo: fields.subtitulo.value.trim(),
      texto_principal: fields.texto.value.trim(),
      missao: fields.missao.value.trim(),
      visao: fields.visao.value.trim(),
      valores: fields.valores.value.trim(),
      url_imagem: fields.imagemUrl.value.trim(),
    };
  }

  function fillForm(content) {
    const normalized = normalizeApiContent(content);
    fields.titulo.value = normalized.titulo || "";
    fields.subtitulo.value = normalized.subtitulo || "";
    fields.texto.value = normalized.texto_principal || "";
    fields.missao.value = normalized.missao || "";
    fields.visao.value = normalized.visao || "";
    fields.valores.value = normalized.valores || "";
    fields.imagemUrl.value = normalized.url_imagem || "";
    fields.imagemArquivo.value = "";
    updatePreview();
  }

  function setFeedback(message, type) {
    feedback.textContent = message;
    feedback.className = `sobre-feedback sobre-feedback--${type}`;
  }

  function updatePreview(imageOverride) {
    const data = getFormData();
    const imageSrc = imageOverride || data.url_imagem || DEFAULT_CONTENT.url_imagem;

    preview.imagem.src = imageSrc;
    preview.titulo.textContent = data.titulo || DEFAULT_CONTENT.titulo;
    preview.subtitulo.textContent = data.subtitulo || DEFAULT_CONTENT.subtitulo;
    preview.texto.textContent = data.texto_principal || DEFAULT_CONTENT.texto_principal;
    preview.missao.textContent = data.missao || DEFAULT_CONTENT.missao;
    preview.visao.textContent = data.visao || DEFAULT_CONTENT.visao;

    preview.valores.innerHTML = "";
    (data.valores || DEFAULT_CONTENT.valores)
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        preview.valores.appendChild(li);
      });
  }

  function validate(data) {
    const requiredFields = ["titulo", "subtitulo", "texto_principal", "missao", "visao", "valores"];
    return requiredFields.every((fieldName) => data[fieldName]);
  }

  function setLoading(isLoading) {
    saveButton.disabled = isLoading;
    cancelButton.disabled = isLoading;
    saveButton.textContent = isLoading ? "Salvando..." : "Salvar alterações";
  }

  function buildPayload() {
    const data = getFormData();
    const formData = new FormData();

    formData.append("titulo", data.titulo);
    formData.append("subtitulo", data.subtitulo);
    formData.append("texto_principal", data.texto_principal);
    formData.append("missao", data.missao);
    formData.append("visao", data.visao);
    formData.append("valores", data.valores);
    formData.append("url_imagem", data.url_imagem);

    const file = fields.imagemArquivo.files && fields.imagemArquivo.files[0];
    if (file) {
      formData.append("imagem", file);
    }

    return formData;
  }

  async function loadContent() {
    setFeedback("Carregando conteúdo da API...", "info");

    try {
      const response = await fetch(API_URL);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.mensagem || "Erro ao carregar conteúdo da página Sobre.");
      }

      lastLoadedContent = normalizeApiContent(data);
      fillForm(lastLoadedContent);
      setFeedback("Conteúdo carregado da API.", "success");
    } catch (error) {
      const fallback = getFallbackDraft();
      if (fallback) {
        lastLoadedContent = normalizeApiContent(fallback);
        fillForm(lastLoadedContent);
        setFeedback(`${error.message} Usando rascunho local temporário.`, "error");
        return;
      }

      lastLoadedContent = { ...DEFAULT_CONTENT };
      fillForm(lastLoadedContent);
      setFeedback(`${error.message} Usando valores padrão seguros.`, "error");
    }
  }

  Object.values(fields).forEach((field) => {
    if (!field) return;
    field.addEventListener("input", () => updatePreview());
  });

  fields.imagemArquivo.addEventListener("change", () => {
    const file = fields.imagemArquivo.files && fields.imagemArquivo.files[0];
    if (!file) {
      updatePreview();
      return;
    }

    updatePreview(URL.createObjectURL(file));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = getFormData();
    if (!validate(data)) {
      setFeedback("Preencha todos os campos obrigatórios antes de salvar.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: "PUT",
        body: buildPayload(),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.mensagem || "Erro ao salvar conteúdo da página Sobre.");
      }

      lastLoadedContent = normalizeApiContent(result.sobre || result);
      localStorage.removeItem(FALLBACK_STORAGE_KEY);
      fillForm(lastLoadedContent);
      setFeedback(result.mensagem || "Conteúdo salvo com sucesso.", "success");
    } catch (error) {
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(data));
      setFeedback(`${error.message} Rascunho salvo localmente como fallback temporário.`, "error");
    } finally {
      setLoading(false);
    }
  });

  cancelButton.addEventListener("click", () => {
    fillForm(lastLoadedContent);
    setFeedback("Alterações não salvas foram descartadas.", "info");
  });

  loadContent();
})();

document.addEventListener("DOMContentLoaded", () => {
    // API usa a nova rota de admin
    const API_URL = '/api/noticias/admin'; 
    const API_URL_TOGGLE = '/api/noticias'; // Rota base para toggle e delete

    // --- Variáveis Globais ---
    let todasAsNoticias = [];
    let noticiasFiltradas = [];
    let itensVisiveis = 0;
    const ITENS_POR_PAGINA = 10;
    let ultimoMesRenderizado = '';
    let deleteId = null;

    // --- Elementos do DOM ---
    const container = document.getElementById("noticias-container");
    const filtroAno = document.getElementById("YearSelection");
    const filtroCategoria = document.getElementById("CategorySelection");
    const btnVerMais = document.querySelector(".btn-ver-mais");

    // Modais
    const modalCadastro = document.getElementById("modal-cadastro");
    const modalEdicao = document.getElementById("modal-edicao");
    const modalDelecao = document.getElementById("modal-delecao");
    const btnAbrirCadastro = document.getElementById("btn-abrir-cadastro");
    const closeButtons = document.querySelectorAll(".close-button");

    // Forms
    const formCadastro = document.getElementById("form-cadastro");
    const formEdicao = document.getElementById("form-edicao");

    // Deleção
    const btnConfirmarDelecao = document.getElementById("btn-confirmar-delecao");
    const btnCancelarDelecao = document.getElementById("btn-cancelar-delecao");
    const deleteTituloConfirm = document.getElementById("delete-titulo-confirm");

    // Toast
    const toast = document.getElementById("custom-toast");
    const toastMessage = document.getElementById("toast-message");

    // --- Funções Auxiliares ---
    
    
    function formatarDataParaInput(dataISO) {
        if (!dataISO) return '';
        return new Date(dataISO).toISOString().split('T')[0];
    }
    
    function formatarDataExibicao(dataISO) {
        if (!dataISO) return 'Data não definida';
        const data = new Date(dataISO);
        const dia = String(data.getUTCDate()).padStart(2, '0');
        const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
        const ano = data.getUTCFullYear();
        return `${dia}/${mes}/${ano}`;
    }
    
    function getNomeMes(dataISO) {
        if (!dataISO) return '';
        const data = new Date(dataISO);
        return data.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });
    }

    function truncarTexto(texto, limite = 100) {
        if (!texto) return '';
        // Remove quebras de linha e espaços múltiplos antes de truncar
        const textoLimpo = texto.replace(/\s+/g, ' ').trim(); 
        
        if (textoLimpo.length <= limite) {
            return textoLimpo;
        }
        return textoLimpo.substring(0, limite).trim() + '...';
    }

    // --- LÓGICA PRINCIPAL (Carregar, Filtrar, Renderizar) ---

    async function carregarTodasNoticias() {
        container.innerHTML = '<p class="loading">Carregando notícias...</p>';
        try {
            const response = await fetch(API_URL); // Busca na rota /admin
            if (!response.ok) throw new Error('Erro na API');
            
            todasAsNoticias = await response.json();
            
            // Inicia o filtro (que chama a renderização)
            aplicarFiltros(true);

        } catch (error) {
            console.error(error);
            container.innerHTML = '<p class="erro">Erro ao carregar notícias.</p>';
        }
    }

    function aplicarFiltros(resetar = false) {
        const ano = filtroAno.value;
        const categoria = filtroCategoria.value;

        noticiasFiltradas = todasAsNoticias.filter(noticia => {
            if (!noticia.data_criacao) return false;
            
            const dataObj = new Date(noticia.data_criacao);
            const anoNoticia = dataObj.getUTCFullYear().toString();
            const catNoticia = noticia.categoria ? noticia.categoria.toLowerCase().trim() : '';
            const filtroCatValor = categoria.toLowerCase().trim();

            const matchAno = (ano === "todos") || (anoNoticia === ano);
            const matchCat = (categoria === "todas") || (catNoticia === filtroCatValor);

            return matchAno && matchCat;
        });

        // Ordena por data (mais nova primeiro)
        noticiasFiltradas.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));

        if (resetar) {
            itensVisiveis = 0;
            container.innerHTML = ''; 
            ultimoMesRenderizado = ''; 
        }

        carregarMaisNoticias();
    }

    function carregarMaisNoticias() {
        if (noticiasFiltradas.length === 0) {
            container.innerHTML = '<p class="aviso">Nenhuma notícia encontrada para este filtro.</p>';
            btnVerMais.style.display = 'none';
            return;
        }

        const proximoLote = noticiasFiltradas.slice(itensVisiveis, itensVisiveis + ITENS_POR_PAGINA);

        proximoLote.forEach(noticia => {
            const dataNoticia = noticia.data_criacao; 
            const nomeMes = getNomeMes(dataNoticia);
            const anoNoticia = new Date(dataNoticia).getUTCFullYear();
            const chaveMes = nomeMes;

            if (chaveMes !== ultimoMesRenderizado) {
                const h2Mes = document.createElement('h2');
                h2Mes.className = 'titulo-mes-admin';
                h2Mes.textContent = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
                container.appendChild(h2Mes);
                ultimoMesRenderizado = chaveMes;
            }
            const textoResumido = truncarTexto(noticia.texto, 256);
            
            // Renderiza o Card de Admin de forma segura
            const card = document.createElement('div');
            card.className = 'admin-card-noticia';
            card.dataset.id = noticia.id_noticias;

            const divImg = document.createElement('div');
            divImg.className = 'card-imagem';
            const img = document.createElement('img');
            img.src = `../${noticia.url_imagem}`;
            img.alt = 'Capa';
            img.onerror = () => { img.src = '../../imagens/1.1Imagens Git/logo_404notfound.png'; };
            divImg.appendChild(img);
            card.appendChild(divImg);

            const divInfo = document.createElement('div');
            divInfo.className = 'card-info';
            
            const h4 = document.createElement('h4');
            h4.textContent = noticia.titulo;
            divInfo.appendChild(h4);

            const pSub = document.createElement('p');
            pSub.textContent = noticia.subtitulo || '';
            divInfo.appendChild(pSub);

            const pTexto = document.createElement('p');
            pTexto.textContent = textoResumido;
            divInfo.appendChild(pTexto);

            const spanExtra = document.createElement('span');
            
            const pCat = document.createElement('p');
            const strongCat = document.createElement('strong');
            strongCat.textContent = 'Categoria:';
            pCat.appendChild(strongCat);
            pCat.appendChild(document.createTextNode(` ${noticia.categoria || 'Geral'}`));
            spanExtra.appendChild(pCat);

            const pData = document.createElement('p');
            const strongData = document.createElement('strong');
            strongData.textContent = 'Data:';
            pData.appendChild(strongData);
            pData.appendChild(document.createTextNode(` ${formatarDataExibicao(noticia.data_criacao)}`));
            spanExtra.appendChild(pData);

            const pDest = document.createElement('p');
            const strongDest = document.createElement('strong');
            strongDest.textContent = 'Destaque:';
            pDest.appendChild(strongDest);
            pDest.appendChild(document.createTextNode(` ${noticia.destaque ? 'Sim' : 'Não'}`));
            spanExtra.appendChild(pDest);

            divInfo.appendChild(spanExtra);
            card.appendChild(divInfo);

            const divActions = document.createElement('div');
            divActions.className = 'card-actions';

            const divSwitch = document.createElement('div');
            divSwitch.className = 'switch-container';
            const lblExibir = document.createElement('label');
            lblExibir.className = 'switch-label';
            lblExibir.textContent = 'Exibir:';
            divSwitch.appendChild(lblExibir);
            
            const lblSwitch = document.createElement('label');
            lblSwitch.className = 'switch';
            const inputSwitch = document.createElement('input');
            inputSwitch.type = 'checkbox';
            inputSwitch.className = 'toggle-exibir';
            inputSwitch.dataset.id = noticia.id_noticias;
            inputSwitch.checked = !!noticia.exibir;
            lblSwitch.appendChild(inputSwitch);
            const spanSlider = document.createElement('span');
            spanSlider.className = 'slider';
            lblSwitch.appendChild(spanSlider);
            divSwitch.appendChild(lblSwitch);
            divActions.appendChild(divSwitch);

            const btnUpdate = document.createElement('button');
            btnUpdate.className = 'btn-secondary btn-update';
            btnUpdate.textContent = 'Editar';
            divActions.appendChild(btnUpdate);

            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn-delete btn-deletar';
            btnDelete.textContent = 'Excluir';
            divActions.appendChild(btnDelete);

            card.appendChild(divActions);
            container.appendChild(card);
        });

        itensVisiveis += proximoLote.length;

        // Controla botão "Ver Mais"
        if (itensVisiveis >= noticiasFiltradas.length) {
            btnVerMais.style.display = 'none';
        } else {
            btnVerMais.style.display = 'block';
        }
    }

    // --- LÓGICA DOS MODAIS E CRUD ---

    // Abrir Modais
    btnAbrirCadastro.onclick = () => {
        formCadastro.reset();
        document.getElementById('cadastro-data').value = new Date().toISOString().split('T')[0]; // Põe data de hoje
        modalCadastro.style.display = "block";
    }

    function abrirModalEdicao(noticia) {
        formEdicao.reset();
        document.getElementById("edit-id").value = noticia.id_noticias;
        document.getElementById("edit-titulo").value = noticia.titulo;
        document.getElementById("edit-subtitulo").value = noticia.subtitulo || '';
        document.getElementById("edit-texto").value = noticia.texto || '';
        document.getElementById("edit-data").value = formatarDataParaInput(noticia.data_criacao);
        document.getElementById("edit-categoria").value = noticia.categoria;
        document.getElementById("edit-url_noticia").value = noticia.url_noticia || '';
        document.getElementById("edit-destaque").checked = noticia.destaque;
        document.getElementById("edit-exibir").checked = noticia.exibir;
        modalEdicao.style.display = "block";
    }

    function abrirModalDelecao(id, titulo) {
        deleteId = id;
        deleteTituloConfirm.textContent = titulo;
        modalDelecao.style.display = "block";
    }

    // Fechar Modais
    closeButtons.forEach(btn => {
        btn.onclick = () => {
            modalCadastro.style.display = "none";
            modalEdicao.style.display = "none";
            modalDelecao.style.display = "none";
        }
    });

    window.onclick = (event) => {
        if (event.target == modalCadastro) modalCadastro.style.display = "none";
        if (event.target == modalEdicao) modalEdicao.style.display = "none";
        if (event.target == modalDelecao) modalDelecao.style.display = "none";
    }

    // (CREATE) Cadastrar
    formCadastro.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(formCadastro);

        try {
            const response = await fetch(API_URL_TOGGLE, { // Rota base POST /
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error(await response.text());
            showToast('Notícia cadastrada com sucesso!');
            modalCadastro.style.display = "none";
            carregarTodasNoticias();
        } catch (error) {
            showToast(error.message, true);
        }
    });

    // (UPDATE) Editar
    formEdicao.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-id").value;
        const formData = new FormData(formEdicao);

        try {
            const response = await fetch(`${API_URL_TOGGLE}/${id}`, { // Rota PUT /:id
                method: 'PUT',
                body: formData
            });
            if (!response.ok) throw new Error(await response.text());
            showToast('Notícia atualizada com sucesso!');
            modalEdicao.style.display = "none";
            carregarTodasNoticias();
        } catch (error) {
            showToast(error.message, true);
        }
    });

    // (DELETE) Deletar
    btnConfirmarDelecao.onclick = async () => {
        if (!deleteId) return;
        try {
            const response = await fetch(`${API_URL_TOGGLE}/${deleteId}`, { // Rota DELETE /:id
                method: 'DELETE'
            });
            if (!response.ok) throw new Error(await response.text());
            showToast('Notícia deletada com sucesso!');
            modalDelecao.style.display = "none";
            deleteId = null;
            carregarTodasNoticias();
        } catch (error) {
            showToast(error.message, true);
        }
    }

    btnCancelarDelecao.onclick = () => {
        modalDelecao.style.display = "none";
        deleteId = null;
    }

    // --- EVENT LISTENERS DINÂMICOS (para botões nos cards) ---
    container.addEventListener('click', async (e) => {
        const target = e.target;
        
        // Botão Editar
        if (target.classList.contains('btn-update')) {
            const card = target.closest('.admin-card-noticia');
            const id = card.dataset.id;
            // Busca o item específico na lista já carregada
            const noticiaCompleta = todasAsNoticias.find(n => n.id_noticias == id);
            if (noticiaCompleta) {
                abrirModalEdicao(noticiaCompleta);
            }
        }

        // Botão Deletar
        if (target.classList.contains('btn-deletar')) {
            const card = target.closest('.admin-card-noticia');
            const id = card.dataset.id;
            const titulo = card.querySelector('h4').textContent;
            abrirModalDelecao(id, titulo);
        }

        // Toggle Switch (Exibir)
        if (target.classList.contains('toggle-exibir')) {
            const id = target.dataset.id;
            const isChecked = target.checked; // Pega o estado atual
            
            try {
                const response = await fetch(`${API_URL_TOGGLE}/${id}/toggle`, {
                    method: 'PATCH'
                });
                
                if (!response.ok) throw new Error('Erro ao atualizar status');
                
                const data = await response.json();
                // Atualiza o dado localmente (para o filtro funcionar sem recarregar)
                const index = todasAsNoticias.findIndex(n => n.id_noticias == id);
                if (index > -1) todasAsNoticias[index].exibir = data.noticia.exibir;
                
                showToast(`Notícia ${data.noticia.exibir ? 'está visível' : 'foi ocultada'}.`);
            
            } catch (error) {
                showToast(error.message, true);
                target.checked = !isChecked; // Reverte a UI em caso de erro
            }
        }
    });

    // Listeners dos Filtros e Paginação
    filtroAno.addEventListener("change", () => aplicarFiltros(true));
    filtroCategoria.addEventListener("change", () => aplicarFiltros(true));
    btnVerMais.addEventListener("click", carregarMaisNoticias);

    // Carga Inicial
    carregarTodasNoticias();
});
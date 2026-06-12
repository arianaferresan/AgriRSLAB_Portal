// ============================================================================
// CONFIG
// ============================================================================
const API_BASE_URL = '/api/projetos';
const projetosContainer = document.getElementById('container-projetos');

// Modais
const modalCadastro = document.getElementById('modal-cadastro');
const modalAtualizacao = document.getElementById('modal-atualizacao');
const modalDelecao = document.getElementById('modal-delecao');

// Botões / formulários
const btnAbrirCadastro = document.getElementById('btn-abrir-cadastro');
const formCadastro = document.getElementById('form-cadastro');
const formAtualizacao = document.getElementById('form-atualizacao');
const btnConfirmarDelecao = document.getElementById('btn-confirmar-delecao');

let projetoParaDeletarId = null;

// ============================================================================
// HELPERS
// ============================================================================


function getStatusVisivel(exibir) {
    return exibir
        ? '<span class="status-visible">● Visível</span>'
        : '<span class="status-oculto">● Oculto</span>';
}



function resumo(conteudo) {
    if (!conteudo) return 'Sem descrição';
    let texto = conteudo.trim();
    if (texto.length > 150) texto = texto.slice(0, 150).trim() + '...';
    return texto;
}

// ============================================================================
// CRIAÇÃO DE CARDS
// ============================================================================
function criarProjetoCard(projeto) {
    const card = document.createElement('div');
    card.className = `artigo-card ${!projeto.exibir ? 'oculto' : ''}`;
    card.dataset.id = projeto.id;

    const imgUrl = getFullUrl(projeto.url_imagem);

    const img = document.createElement('img');
    img.src = imgUrl;
    img.alt = "Capa do projeto";
    img.onerror = () => { img.src = 'https://via.placeholder.com/300x200?text=Sem+Imagem'; };
    card.appendChild(img);

    const divContent = document.createElement('div');
    divContent.className = 'card-content';

    const h3 = document.createElement('h3');
    h3.textContent = projeto.titulo;
    divContent.appendChild(h3);

    if (projeto.destaque) {
        const pDestaque = document.createElement('p');
        pDestaque.className = 'status-destaque';
        pDestaque.textContent = '★ Projeto em Destaque';
        divContent.appendChild(pDestaque);
    }

    const pStatus = document.createElement('p');
    const strongStatus = document.createElement('strong');
    strongStatus.textContent = 'Status: ';
    pStatus.appendChild(strongStatus);
    const spanStatus = document.createElement('span');
    spanStatus.className = projeto.exibir ? 'status-visible' : 'status-oculto';
    spanStatus.textContent = projeto.exibir ? '● Visível' : '● Oculto';
    pStatus.appendChild(spanStatus);
    divContent.appendChild(pStatus);

    const pAutores = document.createElement('p');
    const strongAutores = document.createElement('strong');
    strongAutores.textContent = 'Autores: ';
    pAutores.appendChild(strongAutores);
    pAutores.appendChild(document.createTextNode(projeto.autores || 'Não informados'));
    divContent.appendChild(pAutores);

    const pDesc = document.createElement('p');
    const strongDesc = document.createElement('strong');
    strongDesc.textContent = 'Descrição: ';
    pDesc.appendChild(strongDesc);
    pDesc.appendChild(document.createTextNode(resumo(projeto.conteudo)));
    divContent.appendChild(pDesc);

    const divActions = document.createElement('div');
    divActions.className = 'card-actions';

    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-secondary btn-abrir-atualizacao';
    btnEditar.dataset.id = projeto.id;
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', abrirModalAtualizacao);
    divActions.appendChild(btnEditar);

    const btnDeletar = document.createElement('button');
    btnDeletar.className = 'btn-danger btn-abrir-delecao';
    btnDeletar.dataset.id = projeto.id;
    btnDeletar.dataset.titulo = projeto.titulo;
    btnDeletar.textContent = 'Excluir';
    btnDeletar.addEventListener('click', abrirModalDelecao);
    divActions.appendChild(btnDeletar);

    divContent.appendChild(divActions);
    card.appendChild(divContent);

    return card;
}

// ============================================================================
// LISTAGEM
// ============================================================================
async function carregarProjetos() {
    projetosContainer.innerHTML = '<h2>Carregando Projetos...</h2>';

    try {
        const response = await fetch(API_BASE_URL);
        const projetos = await response.json();

        projetosContainer.innerHTML = '';

        projetos.forEach(p => projetosContainer.appendChild(criarProjetoCard(p)));

        document.querySelectorAll('.btn-abrir-atualizacao')
            .forEach(btn => btn.addEventListener('click', abrirModalAtualizacao));

        document.querySelectorAll('.btn-abrir-delecao')
            .forEach(btn => btn.addEventListener('click', abrirModalDelecao));

    } catch (e) {
        projetosContainer.innerHTML =
            '<h2>Erro ao carregar projetos. Verifique o backend.</h2>';
    }
}

// ============================================================================
// MODAIS
// ============================================================================
function abrirModal(modal) {
    modal.style.display = 'flex';
}

function fecharModais() {
    modalCadastro.style.display = 'none';
    modalAtualizacao.style.display = 'none';
    modalDelecao.style.display = 'none';
}

btnAbrirCadastro.addEventListener('click', () => {
    fecharModais();
    formCadastro.reset();
    abrirModal(modalCadastro);
});

document.querySelectorAll('.close-button').forEach(btn =>
    btn.addEventListener('click', fecharModais)
);

document.getElementById('btn-cancelar-delecao').addEventListener('click', fecharModais);

window.addEventListener('click', e => {
    if (e.target === modalCadastro ||
        e.target === modalAtualizacao ||
        e.target === modalDelecao) {
        fecharModais();
    }
});

// ============================================================================
// ATUALIZAÇÃO
// ============================================================================
async function abrirModalAtualizacao(e) {
    const id = e.currentTarget.dataset.id;

    const response = await fetch(`${API_BASE_URL}/${id}`);
    const projeto = await response.json();

    document.getElementById('edit-id').value = projeto.id;
    document.getElementById('edit-titulo').value = projeto.titulo;
    document.getElementById('edit-autores').value = projeto.autores;
    document.getElementById('edit-conteudo').value = projeto.conteudo;
    document.getElementById('edit-exibir').checked = projeto.exibir;
    document.getElementById('edit-destaque').checked = projeto.destaque;
    document.getElementById('edit-fase').value = projeto.fase;

    const imgPreview = document.getElementById('edit-img-preview');
    imgPreview.src = getFullUrl(projeto.url_imagem);
    imgPreview.style.display = 'block';

    abrirModal(modalAtualizacao);
}

// ============================================================================
// DELEÇÃO
// ============================================================================
function abrirModalDelecao(e) {
    projetoParaDeletarId = e.currentTarget.dataset.id;
    document.getElementById('delete-titulo-confirm').textContent =
        e.currentTarget.dataset.titulo;

    fecharModais();
    abrirModal(modalDelecao);
}

btnConfirmarDelecao.addEventListener('click', async () => {
    const id = projetoParaDeletarId;

    await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });

    fecharModais();
    showToast('Projeto deletado com sucesso!');
    carregarProjetos();
});

// ============================================================================
// CADASTRO E ATUALIZAÇÃO
// ============================================================================
async function enviarFormulario(formData, method, url) {
    await fetch(url, { method, body: formData });

    fecharModais();
    showToast(method === 'POST'
        ? 'Projeto cadastrado!'
        : 'Projeto atualizado!');

    carregarProjetos();
}

formCadastro.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(formCadastro);
    enviarFormulario(fd, 'POST', API_BASE_URL);
});

formAtualizacao.addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const fd = new FormData(formAtualizacao);
    enviarFormulario(fd, 'PUT', `${API_BASE_URL}/${id}`);
});

// ============================================================================
// INIT
// ============================================================================
document.addEventListener('DOMContentLoaded', carregarProjetos);

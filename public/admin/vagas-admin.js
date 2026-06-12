// ============================================================
// CONFIG
// ============================================================
const API_URL = "/api/vagas";

let vagaSelecionada = null;

// Toast


// Modais
const modalCadastro = document.getElementById("modal-cadastro");
const modalEditar = document.getElementById("modal-editar");
const modalDeletar = document.getElementById("modal-deletar");

function abrirModal(modal) {
    modal.style.display = "flex";
}

function fecharModal(modal) {
    modal.style.display = "none";
}

document.querySelectorAll(".close-button").forEach(btn =>
    btn.addEventListener("click", () => {
        fecharModal(modalCadastro);
        fecharModal(modalEditar);
        fecharModal(modalDeletar);
    })
);

// ============================================================
// CAMPOS DINÂMICOS — REQUISITOS & BENEFÍCIOS
// ============================================================

function criarCampoItem(valor = "", tipo = "req") {
    const div = document.createElement("div");
    div.classList.add("campo-item");
    div.style.display = "flex";
    div.style.gap = "10px";
    div.style.marginBottom = "8px";

    const input = document.createElement("input");
    input.type = "text";
    input.value = valor;
    input.className = `input-${tipo}`;
    input.style.flex = "1";
    div.appendChild(input);

    const btnRemove = document.createElement("button");
    btnRemove.type = "button";
    btnRemove.className = "btn-danger btn-remove-item";
    btnRemove.textContent = "X";
    btnRemove.addEventListener("click", () => {
        div.remove();
    });
    div.appendChild(btnRemove);

    return div;
}


// ============================================================
// CARREGAR VAGAS
// ============================================================
async function carregarVagas() {
    const container = document.getElementById("container-vagas");
    container.innerHTML = "<h2>Carregando vagas...</h2>";

    try {
        const resp = await fetch(API_URL);
        const vagas = await resp.json();

        if (!vagas.length) {
            container.innerHTML = "";
            const pVazio = document.createElement("p");
            pVazio.textContent = "Nenhuma vaga cadastrada ainda.";
            container.appendChild(pVazio);
            return;
        }

        const tabela = document.createElement("table");
        tabela.classList.add("tabela-admin-membros");

        tabela.innerHTML = `
            <thead>
                <tr>
                    <th>Vaga</th>
                    <th>Data</th>
                    <th>Exibir</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = tabela.querySelector("tbody");

        vagas.forEach(v => {
            const data = new Date(v.data_criacao).toLocaleDateString("pt-BR");

            const tr = document.createElement("tr");
            if (!v.exibir) tr.classList.add("membro-oculto");

            // Coluna Vaga
            const tdVaga = document.createElement("td");
            tdVaga.textContent = v.titulo;
            tr.appendChild(tdVaga);

            // Coluna Data
            const tdData = document.createElement("td");
            tdData.textContent = data;
            tr.appendChild(tdData);

            // Coluna Exibir
            const tdExibir = document.createElement("td");
            const labelSwitch = document.createElement("label");
            labelSwitch.className = "switch";
            
            const inputToggle = document.createElement("input");
            inputToggle.type = "checkbox";
            inputToggle.className = "toggle-exibir";
            inputToggle.dataset.id = v.vaga_id;
            inputToggle.checked = !!v.exibir;
            inputToggle.addEventListener("change", toggleExibir);
            labelSwitch.appendChild(inputToggle);

            const spanSlider = document.createElement("span");
            spanSlider.className = "slider";
            labelSwitch.appendChild(spanSlider);

            tdExibir.appendChild(labelSwitch);
            tr.appendChild(tdExibir);

            // Coluna Ações
            const tdAcoes = document.createElement("td");
            const divAcoes = document.createElement("div");
            divAcoes.className = "acoes-tabela";

            const btnEditar = document.createElement("button");
            btnEditar.className = "btn-secondary btn-editar";
            btnEditar.dataset.id = v.vaga_id;
            btnEditar.textContent = "Editar";
            btnEditar.addEventListener("click", abrirEditar);
            divAcoes.appendChild(btnEditar);

            const btnDeletar = document.createElement("button");
            btnDeletar.className = "btn-danger btn-deletar";
            btnDeletar.dataset.id = v.vaga_id;
            btnDeletar.dataset.titulo = v.titulo;
            btnDeletar.textContent = "Excluir";
            btnDeletar.addEventListener("click", abrirDelecao);
            divAcoes.appendChild(btnDeletar);

            tdAcoes.appendChild(divAcoes);
            tr.appendChild(tdAcoes);

            tbody.appendChild(tr);
        });

        container.innerHTML = "";
        container.appendChild(tabela);

    } catch (e) {
        console.error(e);
        container.innerHTML = "";
        const pErro = document.createElement("p");
        pErro.textContent = "Erro ao carregar vagas.";
        container.appendChild(pErro);
    }
}

// BOTÕES DO MODAL DE CADASTRO
document.getElementById("btn-add-requisito").addEventListener("click", () => {
    document.getElementById("cad-requisitos-list")
        .appendChild(criarCampoItem("", "req"));
});

document.getElementById("btn-add-beneficio").addEventListener("click", () => {
    document.getElementById("cad-beneficios-list")
        .appendChild(criarCampoItem("", "benef"));
});


// BOTÕES DO MODAL DE EDIÇÃO
document.getElementById("btn-edit-add-requisito").addEventListener("click", () => {
    document.getElementById("edit-requisitos-list")
        .appendChild(criarCampoItem("", "req"));
});

document.getElementById("btn-edit-add-beneficio").addEventListener("click", () => {
    document.getElementById("edit-beneficios-list")
        .appendChild(criarCampoItem("", "benef"));
});


// ============================================================
// CADASTRAR VAGA
// ============================================================
document.getElementById("btn-abrir-cadastro").addEventListener("click", () => {
    document.getElementById("form-cadastro").reset();
    document.getElementById("cad-requisitos-list").innerHTML = "";
    document.getElementById("cad-beneficios-list").innerHTML = "";
    abrirModal(modalCadastro);
});

document.getElementById("form-cadastro").addEventListener("submit", async e => {
    e.preventDefault();

    const requisitos = [...document.querySelectorAll("#cad-requisitos-list .input-req")]
        .map(i => i.value.trim())
        .filter(i => i !== "");

    const beneficios = [...document.querySelectorAll("#cad-beneficios-list .input-benef")]
        .map(i => i.value.trim())
        .filter(i => i !== "");

    const dados = {
        titulo: document.getElementById("cad-titulo").value,
        descricao: document.getElementById("cad-descricao").value,
        link_candidatura: document.getElementById("cad-link").value,
        exibir: document.getElementById("cad-exibir").checked,
        requisitos,
        beneficios
    };

    try {
        const resp = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        if (!resp.ok) throw new Error();

        fecharModal(modalCadastro);
        showToast("Vaga cadastrada com sucesso!");
        carregarVagas();

    } catch (e) {
        showToast("Erro ao cadastrar vaga", "error");
    }
});


// ============================================================
// EDITAR VAGA
// ============================================================
async function abrirEditar(e) {
    const id = e.target.dataset.id;
    vagaSelecionada = id;

    try {
        const resp = await fetch(`${API_URL}/${id}`);
        const vaga = await resp.json();

        // preencher dados principais
        document.getElementById("edit-id").value = vaga.vaga_id;
        document.getElementById("edit-titulo").value = vaga.titulo;
        document.getElementById("edit-descricao").value = vaga.descricao;
        document.getElementById("edit-link").value = vaga.link_candidatura;
        document.getElementById("edit-exibir").checked = vaga.exibir;

        // limpar listas antigas
        document.getElementById("edit-requisitos-list").innerHTML = "";
        document.getElementById("edit-beneficios-list").innerHTML = "";

        // carregar requisitos
        vaga.requisitos?.forEach(req => {
            document.getElementById("edit-requisitos-list")
                .appendChild(criarCampoItem(req, "req"));
        });

        // carregar benefícios
        vaga.beneficios?.forEach(b => {
            document.getElementById("edit-beneficios-list")
                .appendChild(criarCampoItem(b, "benef"));
        });

        abrirModal(modalEditar);

    } catch {
        showToast("Erro ao carregar vaga", "error");
    }
}

document.getElementById("form-editar").addEventListener("submit", async e => {
    e.preventDefault();

    const id = document.getElementById("edit-id").value;

    const requisitos = [...document.querySelectorAll("#edit-requisitos-list .input-req")]
        .map(i => i.value.trim())
        .filter(i => i !== "");

    const beneficios = [...document.querySelectorAll("#edit-beneficios-list .input-benef")]
        .map(i => i.value.trim())
        .filter(i => i !== "");

    const dados = {
        titulo: document.getElementById("edit-titulo").value,
        descricao: document.getElementById("edit-descricao").value,
        link_candidatura: document.getElementById("edit-link").value,
        exibir: document.getElementById("edit-exibir").checked,
        requisitos,
        beneficios
    };

    try {
        const resp = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        if (!resp.ok) throw new Error();

        fecharModal(modalEditar);
        showToast("Vaga atualizada!");
        carregarVagas();

    } catch (e) {
        showToast("Erro ao atualizar", "error");
    }
});


// ============================================================
// DELETAR VAGA
// ============================================================
function abrirDelecao(e) {
    const id = e.target.dataset.id;
    const titulo = e.target.dataset.titulo;

    vagaSelecionada = id;
    document.getElementById("del-nome").textContent = titulo;
    abrirModal(modalDeletar);
}

document.getElementById("btn-confirmar-delete").addEventListener("click", async () => {
    try {
        const resp = await fetch(`${API_URL}/${vagaSelecionada}`, {
            method: "DELETE"
        });

        if (!resp.ok) throw new Error();

        fecharModal(modalDeletar);
        showToast("Vaga excluída!");
        carregarVagas();

    } catch {
        showToast("Erro ao excluir", "error");
    }
});

document.getElementById("btn-cancelar-delete").addEventListener("click", () => {
    fecharModal(modalDeletar);
});


// ============================================================
// TOGGLE EXIBIR
// ============================================================
async function toggleExibir(e) {
    const id = e.target.dataset.id;
    const novoValor = e.target.checked;

    try {
        await fetch(`${API_URL}/${id}/exibir`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ exibir: novoValor })
        });

        showToast("Exibição atualizada!");

    } catch {
        showToast("Erro ao alterar exibição", "error");
    }
}

// ============================================================
// INICIAR
// ============================================================
carregarVagas();

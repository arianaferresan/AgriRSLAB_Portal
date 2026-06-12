// Scroll existente (mantém)
function scrollToSection() {
    document.getElementById("verMestrado").scrollIntoView({ behavior: "smooth" });
}

// Dicionário de tradução
const dicionario = {
    'pt': {
        'requisitos': 'Requisitos:',
        'beneficios': 'Benefícios:',
        'candidatar': 'Candidatar-se',
        'nenhumaVaga': 'Nenhuma vaga disponível no momento.',
        'erroCarregar': 'Erro ao carregar vagas.'
    },
    'en': {
        'requisitos': 'Requirements:',
        'beneficios': 'Benefits:',
        'candidatar': 'Apply',
        'nenhumaVaga': 'No vacancies available at the moment.',
        'erroCarregar': 'Error loading vacancies.'
    }
};

// Novo código que carrega vagas (necessário!)
document.addEventListener("DOMContentLoaded", carregarVagas);

// Recarrega vagas quando o idioma mudar
window.addEventListener('languageChange', carregarVagas);

async function carregarVagas() {
    const container = document.getElementById("lista-vagas");

    if (!container) {
        console.error("Elemento #lista-vagas não encontrado.");
        return;
    }

    try {
        // Pega o idioma do localStorage
        const lang = localStorage.getItem('selectedLanguage') || 'pt';
        const traducoes = dicionario[lang] || dicionario['pt'];

        const resposta = await fetch(`/api/vagas/publicos?lang=${lang}`);
        const vagas = await resposta.json();

        if (!vagas.length) {
            container.innerHTML = `<p>${traducoes.nenhumaVaga}</p>`;
            return;
        }

        container.innerHTML = "";

        vagas.forEach(vaga => {
            const card = document.createElement("div");
            card.classList.add("card-vagas");

            const h4 = document.createElement("h4");
            h4.textContent = vaga.titulo;
            card.appendChild(h4);

            const pDesc = document.createElement("p");
            pDesc.textContent = vaga.descricao.substring(0, 180) + "...";
            card.appendChild(pDesc);

            const h5Req = document.createElement("h5");
            h5Req.textContent = traducoes.requisitos;
            card.appendChild(h5Req);

            const ulReq = document.createElement("ul");
            if (vaga.requisitos && Array.isArray(vaga.requisitos)) {
                vaga.requisitos.forEach(r => {
                    const li = document.createElement("li");
                    li.textContent = r;
                    ulReq.appendChild(li);
                });
            }
            card.appendChild(ulReq);

            const h5Ben = document.createElement("h5");
            h5Ben.textContent = traducoes.beneficios;
            card.appendChild(h5Ben);

            const ulBen = document.createElement("ul");
            if (vaga.beneficios && Array.isArray(vaga.beneficios)) {
                vaga.beneficios.forEach(b => {
                    const li = document.createElement("li");
                    li.textContent = b;
                    ulBen.appendChild(li);
                });
            }
            card.appendChild(ulBen);

            const btnCandidatar = document.createElement("a");
            btnCandidatar.href = `../pagina-vagas/vagas-candidatura.html?id=${vaga.vaga_id}`;
            btnCandidatar.className = "btn-vagas btn-primary-vagas btn-sm-vagas";
            btnCandidatar.textContent = traducoes.candidatar;
            card.appendChild(btnCandidatar);

            container.appendChild(card);
        });

    } catch (erro) {
        console.error("Erro ao carregar vagas:", erro);
        const lang = localStorage.getItem('selectedLanguage') || 'pt';
        const traducoes = dicionario[lang] || dicionario['pt'];
        container.innerHTML = `<p>${traducoes.erroCarregar}</p>`;
    }
}

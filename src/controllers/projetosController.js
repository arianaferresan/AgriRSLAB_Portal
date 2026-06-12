const { pool } = require('../database/dbConfig');
const fs = require('fs');
const path = require('path');
const translate = require('@iamtraction/google-translate');

// Pasta uploads/projetos
const uploadDir = path.resolve(__dirname, '..', 'upload', 'projetos');

// Garante que a pasta exista
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ------------------------------------------------------
// [C] Criar Projeto
// ------------------------------------------------------

async function createProjeto(req, res) {
    let { titulo, conteudo, autores, exibir, fase, destaque } = req.body;

    exibir = (exibir === 'on' || exibir === 'true' || exibir === true);
    destaque = (destaque === 'on' || destaque === 'true' || destaque === true);
    fase = fase || 'finalizado';

    // Se marcar destaque, desmarca todos os outros
    if (destaque) {
        await pool.query("UPDATE projetos SET destaque = false");
    }

    const imagemFile =
        req.files &&
            req.files['imagem'] &&
            req.files['imagem'][0]
            ? req.files['imagem'][0]
            : null;

    const final_imagem = imagemFile
        ? `/uploads/projetos/${imagemFile.filename}`
        : null;

    if (!titulo || !conteudo) {
        return res.status(400).json({
            mensagem: 'Titulo e conteudo sao obrigatorios.'
        });
    }
    const client = await pool.connect(); // Usar client para transação (rollback se falhar tradução)

    const query = `
        INSERT INTO projetos (titulo, conteudo, autores, url_imagem, exibir, fase, destaque)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `;
    const values = [titulo, conteudo, autores || null, final_imagem, exibir, fase, destaque];

    try {
        const resultado = await pool.query(query, values);
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('Erro ao criar projeto:', error.message);
        res.status(500).json({ mensagem: 'Erro interno ao criar projeto.' });
    }
}



// ------------------------------------------------------
// [R] Listar todos
// ------------------------------------------------------

async function getAllProjetos(req, res) {
    try {
        const resultado = await pool.query(
            'SELECT * FROM projetos ORDER BY id DESC'
        );
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao listar projetos:', error.message);
        res.status(500).json({ mensagem: 'Erro ao listar projetos.' });
    }
}


// ------------------------------------------------------
// [R] Listar publicos
// ------------------------------------------------------

async function getProjetosPublicados(req, res) {
    // Pega o idioma da query e extrai apenas o código principal (ex: 'en' de 'en-us')
    const langParam = req.query.lang || 'pt';
    const lang = langParam.split('-')[0];

    if (lang !== 'en') {
        console.log("Servindo projetos em Português (sem tradução).");
        // Se for 'pt', retorna os dados originais sem tradução
        try {
            const resultado = await pool.query(
                'SELECT * FROM projetos WHERE exibir = true ORDER BY id DESC'
            );
            return res.status(200).json(resultado.rows);
        } catch (error) {
            console.error('Erro ao listar projetos publicos:', error.message);
            return res.status(500).json({ mensagem: 'Erro ao listar projetos publicos.' });
        }
    }

    try {
        console.log(`Iniciando tradução para o idioma: ${lang}`);
        const dbResult = await pool.query(
            // Agora busca as colunas de tradução também
            'SELECT * FROM projetos WHERE exibir = true ORDER BY id DESC'
        );

        // Chama diretamente a função de cache, que é mais eficiente
        const projetosTraduzidos = await getProjetosTraduzidosComCache(dbResult.rows, lang);
        res.status(200).json(projetosTraduzidos);
    } catch (error) {
        console.error('Erro ao listar e traduzir projetos públicos:', error.message);
        res.status(500).json({ mensagem: 'Erro ao listar e traduzir projetos públicos.' });
    }
}

/**
 * Traduz e armazena em cache os projetos, se necessário.
 * @param {Array} projetos - Lista de projetos do banco de dados.
 * @param {string} targetLang - Código do idioma de destino (ex: 'en').
 * @returns {Promise<Array>} Lista de projetos com os campos traduzidos.
 */
async function getProjetosTraduzidosComCache(projetos, targetLang) {
    const projetosProcessados = await Promise.all(
        projetos.map(async (projeto) => {
            const tituloTraduzidoCampo = 'titulo_en';
            const conteudoTraduzidoCampo = 'conteudo_en';

            // Verifica se a tradução já existe no objeto do projeto
            if (projeto[tituloTraduzidoCampo] && projeto[conteudoTraduzidoCampo]) {
                return {
                    ...projeto,
                    titulo: projeto[tituloTraduzidoCampo],
                    conteudo: projeto[conteudoTraduzidoCampo],
                };
            }

            // Se não existe, traduz e salva no banco
            try {
                console.log(`Traduzindo e salvando cache para o projeto ID ${projeto.id} para o idioma '${targetLang}'...`);
                const [tituloTraduzido, conteudoTraduzido] = await Promise.all([
                    translate(projeto.titulo, { from: 'pt', to: targetLang }),
                    translate(projeto.conteudo, { from: 'pt', to: targetLang }),
                ]);

                const novoTitulo = tituloTraduzido.text;
                const novoConteudo = conteudoTraduzido.text;

                // Salva a tradução no banco de dados para futuras requisições
                const updateQuery = 'UPDATE projetos SET titulo_en = $1, conteudo_en = $2 WHERE id = $3';
                await pool.query(updateQuery, [novoTitulo, novoConteudo, projeto.id]);

                return {
                    ...projeto,
                    titulo: novoTitulo,
                    conteudo: novoConteudo,
                };
            } catch (error) {
                console.error(`Erro ao traduzir/salvar cache para o projeto ID ${projeto.id}:`, error.message);
                // Em caso de erro, retorna o projeto original para não quebrar a aplicação
                return projeto;
            }
        })
    );

    return projetosProcessados;
}


async function getProjetoById(req, res) {
    const { id } = req.params;

    try {
        const resultado = await pool.query(
            'SELECT * FROM projetos WHERE id = $1',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensagem: 'Projeto nao encontrado.' });
        }

        res.status(200).json(resultado.rows[0]);

    } catch (error) {
        console.error('Erro ao buscar projeto por ID:', error.message);
        res.status(500).json({ mensagem: 'Erro interno ao buscar projeto.'});
    }
}

// ------------------------------------------------------
// [U] Atualizar Projeto
// ------------------------------------------------------

async function updateProjeto(req, res) {
    const { id } = req.params;

    try {
        const resAntigo = await pool.query(
            'SELECT url_imagem FROM projetos WHERE id = $1',
            [id]
        );

        if (resAntigo.rows.length === 0) {
            return res.status(404).json({ mensagem: 'Projeto nao encontrado.' });
        }

        const projetoAntigo = resAntigo.rows[0];

        let { titulo, conteudo, autores, exibir, fase, destaque } = req.body;

        exibir = (exibir === 'on' || exibir === 'true' || exibir === true);
        destaque = (destaque === 'on' || destaque === 'true' || destaque === true);

        // Se marcar destaque, desmarca os outros
        if (destaque) {
            await pool.query("UPDATE projetos SET destaque = false");
        }

        const imagemFile =
            req.files &&
                req.files['imagem'] &&
                req.files['imagem'][0]
                ? req.files['imagem'][0]
                : null;

        const nova_imagem = imagemFile
            ? `/uploads/projetos/${imagemFile.filename}`
            : undefined;

        let sets = [];
        let values = [];
        let idx = 1;

        if (titulo) { sets.push(`titulo = $${idx++}`); values.push(titulo); }
        if (conteudo) { sets.push(`conteudo = $${idx++}`); values.push(conteudo); }
        if (autores) { sets.push(`autores = $${idx++}`); values.push(autores); }
        if (fase) { sets.push(`fase = $${idx++}`); values.push(fase); }

        if (nova_imagem !== undefined) {
            sets.push(`url_imagem = $${idx++}`);
            values.push(nova_imagem);
        }

        sets.push(`exibir = $${idx++}`);
        values.push(exibir);

        sets.push(`destaque = $${idx++}`);
        values.push(destaque);

        if (titulo || conteudo) {
            sets.push('titulo_en = NULL');
            sets.push('conteudo_en = NULL');
        }

        values.push(id);

        const query = `
            UPDATE projetos SET ${sets.join(', ')}
            WHERE id = $${idx}
            RETURNING *;
        `;

        const resultado = await pool.query(query, values);

        if (
            nova_imagem &&
            projetoAntigo.url_imagem &&
            projetoAntigo.url_imagem.startsWith('/uploads/projetos/')
        ) {
            const oldPath = path.join(
                uploadDir,
                projetoAntigo.url_imagem.replace('/uploads/projetos/', '')
            );
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        res.status(200).json(resultado.rows[0]);

    } catch (error) {
        console.error('Erro ao atualizar projeto:', error.message);
        res.status(500).json({ mensagem: 'Erro interno ao atualizar projeto.' });
    }
}



// ------------------------------------------------------
// [D] Deletar Projeto
// ------------------------------------------------------

async function deleteProjeto(req, res) {
    const { id } = req.params;

    try {
        const resProj = await pool.query(
            'SELECT url_imagem FROM projetos WHERE id = $1',
            [id]
        );

        if (resProj.rows.length === 0) {
            return res.status(404).json({ mensagem: 'Projeto nao encontrado.' });
        }

        const { url_imagem } = resProj.rows[0];

        await pool.query('DELETE FROM projetos WHERE id = $1', [id]);

        if (
            url_imagem &&
            url_imagem.startsWith('/uploads/projetos/')
        ) {
            const fullPath = path.join(
                uploadDir,
                url_imagem.replace('/uploads/projetos/', '')
            );
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        res.status(204).send();

    } catch (error) {
        console.error('Erro ao deletar projeto:', error.message);
        res.status(500).json({ mensagem: 'Erro interno ao deletar projeto.' });
    }
}

async function getProjetosPublicosComDestaque(req, res) {
    try {
        const destaque = await pool.query(
            "SELECT * FROM projetos WHERE exibir = true AND destaque = true LIMIT 1"
        );

        const outros = await pool.query(
            "SELECT * FROM projetos WHERE exibir = true AND destaque = false ORDER BY id DESC"
        );

        res.status(200).json({
            destaque: destaque.rows[0] || null,
            outros: outros.rows
        });

    } catch (error) {
        console.error('Erro ao listar projetos com destaque:', error.message);
        res.status(500).json({ mensagem: 'Erro ao listar projetos.' });
    }
}

// Função antiga foi substituída pela que usa cache
// A função 'traduzirProjetos' foi removida pois sua lógica foi integrada e otimizada
// na chamada direta a 'getProjetosTraduzidosComCache' dentro de 'getProjetosPublicados'.

// ------------------------------------------------------

module.exports = {
    createProjeto,
    getAllProjetos,
    getProjetosPublicados,
    getProjetoById,
    updateProjeto,
    deleteProjeto,
    getProjetosPublicosComDestaque,
};

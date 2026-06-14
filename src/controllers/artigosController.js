// src/controladores/artigosController.js

const { pool } = require('../database/dbConfig');
const fs = require('fs'); // Para deletar arquivos no servidor
const path = require('path');
// Importa a biblioteca de tradução
const translate = require('@iamtraction/google-translate');

// Caminho absoluto para a pasta de uploads
const uploadDir = path.resolve(__dirname, '..', 'upload');

// --- C.R.U.D. Artigos ---

// [C]RIAR Artigo (POST)
async function criarArtigo(req, res) {
    // Dados de texto enviados no corpo da requisição (body)
    let { titulo, link_doi, id_categoria, url_imagem, link_pdf: linkPdfUrl, exibir } = req.body;

    // Converte 'on' (de um checkbox/switch) para true, e a ausência para false.
    exibir = (exibir === 'on' || exibir === 'true' || exibir === true);

    // Dados dos arquivos de upload (se houver)
    const imagemFile = req.files['imagem'] ? req.files['imagem'][0] : null;
    const pdfFile = req.files['pdf'] ? req.files['pdf'][0] : null;
    const final_url_imagem = imagemFile ? `/uploads/${imagemFile.filename}` : url_imagem;
    const final_link_pdf = pdfFile ? `/uploads/${pdfFile.filename}` : linkPdfUrl;

    // Verifica se os campos obrigatórios foram preenchidos
    if (!titulo || !link_doi || !id_categoria || !final_url_imagem || !final_link_pdf) {
        return res.status(400).json({ mensagem: 'Faltam dados obrigatórios.' });
    }

    const client = await pool.connect(); // Usar client para transação (rollback se falhar tradução)

    try {
        await client.query('BEGIN');

        // 1. Insere em PT-BR (Tabela Original)
        const queryPT = `
        INSERT INTO artigos (titulo, link_doi, link_pdf, url_imagem, id_categoria, exibir)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, titulo;
        `;
        const valuesPT = [titulo, link_doi, final_link_pdf, final_url_imagem, id_categoria, exibir];
        const resPT = await client.query(queryPT, valuesPT);
        const novoArtigo = resPT.rows[0];

        // 2. Realiza a Tradução para Inglês
        // Nota: A biblioteca pode falhar se houver muitas requisições, ideal tratar erros.
        let tituloEn = titulo;
        try {
            const traducao = await translate(titulo, { from: 'pt', to: 'en' });
            tituloEn = traducao.text;
        } catch (errTraducao) {
            console.warn('Falha na tradução automática, usando original:', errTraducao.message);
        }

        // 3. Insere em EN-US (Nova Tabela)
        const queryEN = `INSERT INTO artigos_en (id_artigo, titulo) VALUES ($1, $2)`;
        await client.query(queryEN, [novoArtigo.id, tituloEn]);

        await client.query('COMMIT');
        res.status(201).json({ ...novoArtigo, titulo_en: tituloEn });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao cadastrar artigo:', error.message);
        res.status(500).json({ mensagem: 'Erro interno ao criar artigo.' });
    } finally {
        client.release();
    }
}


// [R]EAD - Listar Artigos (GET)
async function listarArtigos(req, res) {
    const query = `
        SELECT 
            a.id, a.titulo, a.link_doi, a.link_pdf, a.url_imagem, a.data_cadastro, a.exibir,
            c.nome AS categoria_nome
        FROM artigos a
        JOIN categoria_artigos c ON a.id_categoria = c.id
        ORDER BY a.data_cadastro DESC;
    `;

    try {
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao listar artigos:', error.message);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao listar artigos.' });
    }
}


// [U]PDATE - Atualizar Artigo (PUT)
async function atualizarArtigo(req, res) {
    const { id } = req.params;

    try {
        // 1. Busca o artigo existente para obter os caminhos de arquivo antigos
        const resAntigo = await pool.query('SELECT link_pdf, url_imagem FROM artigos WHERE id = $1', [id]);
        if (resAntigo.rows.length === 0) {
            return res.status(404).json({ mensagem: 'Artigo não encontrado para atualização.' });
        }
        const artigoAntigo = resAntigo.rows[0];

        // 2. Processa os dados recebidos
        let { titulo, link_doi, id_categoria, url_imagem_existente, link_pdf, exibir } = req.body;

        // Converte 'on' (de um checkbox/switch) para true. 
        // Se o campo não for enviado (checkbox desmarcado), o valor será false.
        const exibirFinal = (exibir === 'on' || exibir === 'true' || exibir === true);

        // Garante que só consideramos um arquivo se ele realmente foi enviado (tem um nome)
        const imagemFile = (req.files && req.files['imagem'] && req.files['imagem'][0].filename) ? req.files['imagem'][0] : null;
        const pdfFile = (req.files && req.files['pdf'] && req.files['pdf'][0].filename) ? req.files['pdf'][0] : null;



        // Define os novos caminhos/valores
        // Define a nova URL da imagem apenas se um novo arquivo foi upado ou uma nova URL foi fornecida.
        // Caso contrário, será `undefined` e não entrará na query de atualização, preservando o valor antigo.
        const nova_url_imagem = imagemFile ? `/uploads/${imagemFile.filename}` : (req.body['edit-url_imagem_input'] || undefined);

        // Define o novo link do PDF apenas se um novo arquivo foi upado ou uma nova URL foi fornecida.
        // Caso contrário, será `undefined` e não entrará na query de atualização.
        let novo_link_pdf;
        if (pdfFile) {
            // Prioridade 1: Um novo arquivo foi enviado.
            novo_link_pdf = `/uploads/${pdfFile.filename}`;
        } else if (link_pdf && link_pdf.trim() !== '') {
            // Prioridade 2: O campo de texto foi preenchido com uma nova URL.
            novo_link_pdf = link_pdf;
        }
        // Se nenhuma das condições acima for atendida (nenhum arquivo novo e campo de texto vazio),
        // `novo_link_pdf` permanecerá `undefined`, e o valor no banco de dados será preservado.

        // 3. Monta a query de atualização dinamicamente
        let setClauses = [];
        let values = [];
        let paramIndex = 1;

        if (titulo) { setClauses.push(`titulo = $${paramIndex++}`); values.push(titulo); }
        if (link_doi) { setClauses.push(`link_doi = $${paramIndex++}`); values.push(link_doi); }
        if (id_categoria) { setClauses.push(`id_categoria = $${paramIndex++}`); values.push(id_categoria); }

        // Apenas adiciona a cláusula de atualização da imagem se um novo valor foi realmente fornecido
        if (nova_url_imagem !== undefined) { setClauses.push(`url_imagem = $${paramIndex++}`); values.push(nova_url_imagem); }

        // Apenas adiciona a cláusula de atualização do PDF se um novo valor foi realmente fornecido
        if (novo_link_pdf !== undefined) {
            setClauses.push(`link_pdf = $${paramIndex++}`); values.push(novo_link_pdf);
        }

        // Sempre atualiza o campo 'exibir' com base no estado do switch (marcado ou não)
        setClauses.push(`exibir = $${paramIndex++}`);
        values.push(exibirFinal);

        // Se não houver campos para atualizar, retorna sucesso sem fazer nada no banco
        if (setClauses.length === 0) {
            return res.status(200).json(artigoAntigo);
        }

        values.push(id); // Adiciona o ID como último parâmetro para a cláusula WHERE

        const query = `
            UPDATE artigos SET ${setClauses.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *;
        `;

        const resultado = await pool.query(query, values);

        if (resultado.rowCount === 0) {
            return res.status(404).json({ mensagem: 'Artigo não encontrado.' });
        }

        // 4. Deleta arquivos antigos do servidor se eles foram substituídos
        // Deleta PDF antigo se um novo foi fornecido e o antigo era um upload
        if (novo_link_pdf && artigoAntigo.link_pdf && artigoAntigo.link_pdf.startsWith('/uploads/')) {
            const fullPathAntigo = path.join(uploadDir, artigoAntigo.link_pdf.replace('/uploads/', ''));
            if (fs.existsSync(fullPathAntigo)) {
                fs.unlinkSync(fullPathAntigo);
            }
        }

        // Deleta imagem antiga se uma nova foi fornecida e a antiga era um upload
        if (nova_url_imagem !== undefined && nova_url_imagem !== artigoAntigo.url_imagem && artigoAntigo.url_imagem && artigoAntigo.url_imagem.startsWith('/uploads/')) {
            const fullPathAntigo = path.join(uploadDir, artigoAntigo.url_imagem.replace('/uploads/', ''));
            if (fs.existsSync(fullPathAntigo)) {
                fs.unlinkSync(fullPathAntigo);
            }
        }

        res.status(200).json(resultado.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar artigo:', error.message);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao atualizar artigo.' });
    }
}


// [D]ELETE - Deletar Artigo (DELETE)
async function deletarArtigo(req, res) {
    const { id } = req.params;

    try {
        // 1. Busca o artigo para obter o caminho do PDF (e imagem, se for local)
        const resArtigo = await pool.query('SELECT link_pdf, url_imagem FROM artigos WHERE id = $1', [id]);
        if (resArtigo.rows.length === 0) {
            return res.status(404).json({ mensagem: 'Artigo não encontrado.' });
        }
        const { link_pdf, url_imagem } = resArtigo.rows[0];

        // 2. Deleta o registro do banco de dados
        const query = 'DELETE FROM artigos WHERE id = $1;';
        const resultado = await pool.query(query, [id]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({ mensagem: 'Artigo não encontrado.' });
        }

        // 3. Deleta o arquivo PDF (e imagem, se for caminho local) do servidor
        if (link_pdf && link_pdf.startsWith('/uploads/')) {
            const fullPathPdf = path.join(uploadDir, link_pdf.replace('/uploads/', ''));
            if (fs.existsSync(fullPathPdf)) {
                fs.unlinkSync(fullPathPdf);
            }
        }
        if (url_imagem && url_imagem.startsWith('/uploads/')) {
            const fullPathImg = path.join(uploadDir, url_imagem.replace('/uploads/', ''));
            if (fs.existsSync(fullPathImg)) {
                fs.unlinkSync(fullPathImg);
            }
        }

        res.status(204).send(); // 204 No Content para deleção bem sucedida
    } catch (error) {
        console.error('Erro ao deletar artigo:', error.message);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao deletar artigo.' });
    }
}


// Rota para Download do PDF
async function downloadPdf(req, res) {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT link_pdf FROM artigos WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ mensagem: 'Artigo não encontrado.' });
        }

        const link_pdf = result.rows[0].link_pdf;

        if (!link_pdf || link_pdf.trim() === '') {
            return res.status(404).json({ mensagem: 'Este artigo não possui um PDF associado.' });
        }

        // Se for um arquivo upado localmente
        if (link_pdf.startsWith('/uploads/')) {
            const fileName = link_pdf.replace('/uploads/', '');
            const fullPath = path.resolve(uploadDir, fileName);

            // Segurança: Prevenir Path Traversal (ex: ../../etc/passwd)
            const resolvedUploadDir = path.resolve(uploadDir);
            if (!fullPath.startsWith(resolvedUploadDir)) {
                return res.status(403).json({ mensagem: 'Acesso negado ao arquivo.' });
            }

            // Verifica existência do arquivo no disco
            if (!fs.existsSync(fullPath)) {
                return res.status(404).json({ mensagem: 'Arquivo PDF não encontrado no servidor.' });
            }

            // Realiza o download
            return res.download(fullPath, path.basename(fullPath), (err) => {
                if (err) {
                    console.error('Erro durante o envio do arquivo PDF:', err);
                    if (!res.headersSent) {
                        res.status(500).json({ mensagem: 'Erro interno ao enviar o arquivo.' });
                    }
                }
            });
        } else {
            // Se for um link externo, redireciona
            return res.redirect(link_pdf);
        }

    } catch (error) {
        console.error('Erro ao preparar download:', error.message);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao processar o download do PDF.' });
    }
}


// -------------------------------------

async function listarArtigosPublicos(req, res) {
    const query = `
        SELECT 
            a.id, a.titulo AS titulo_pt, 
            ae.titulo AS titulo_en,
            a.link_doi, a.link_pdf, a.url_imagem, a.data_cadastro, a.exibir,
            c.nome AS categoria_nome
        FROM artigos a
        JOIN categoria_artigos c ON a.id_categoria = c.id
        LEFT JOIN artigos_en ae ON a.id = ae.id_artigo
        WHERE a.exibir = TRUE
        ORDER BY a.data_cadastro DESC;
    `;

    try {
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao listar artigos públicos:', error.message);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao listar artigos.' });
    }
}


module.exports = {
    criarArtigo,
    listarArtigos,
    atualizarArtigo,
    deletarArtigo,
    downloadPdf,
    listarArtigosPublicos,
};
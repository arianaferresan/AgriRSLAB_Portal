// src/controllers/vagasController.js

const { pool } = require('../database/dbConfig');
const { translateText } = require('../services/translateService');


// ------------------------------------------------------------
// --- C.R.U.D. VAGAS ---
// ------------------------------------------------------------


// [C]RIAR Vaga (POST)
async function criarVaga(req, res) {
    const { titulo, descricao, link_candidatura, requisitos, beneficios, exibir } = req.body;

    // Validação básica
    if (!titulo || !descricao) {
        return res.status(400).json({ mensagem: 'Preencha título e descrição.' });
    }

    // Converte o valor recebido do checkbox/switch para booleano real
    const exibirFinal = (exibir === 'on' || exibir === 'true' || exibir === true);

    const query = `
        INSERT INTO vagas (titulo, descricao, link_candidatura, exibir)
        VALUES ($1, $2, $3, $4)
        RETURNING vaga_id;
    `;

    const values = [
        titulo,
        descricao,
        link_candidatura || null,
        exibirFinal
    ];

    try {
        // Insere vaga
        const vagaResult = await pool.query(query, values);
        const vagaId = vagaResult.rows[0].vaga_id;

        // Traduz e insere vaga em inglês (em segundo plano)
        translateVaga(vagaId, titulo, descricao).catch(err =>
            console.error('Erro ao traduzir vaga:', err)
        );

        // Insere requisitos
        if (Array.isArray(requisitos)) {
            for (const r of requisitos) {
                const reqResult = await pool.query(
                    `INSERT INTO requisitos_vaga (vaga_id, descricao) VALUES ($1, $2) RETURNING req_id`,
                    [vagaId, r]
                );
                const reqId = reqResult.rows[0].req_id;

                // Traduz requisito (em segundo plano)
                translateRequisito(reqId, r).catch(err =>
                    console.error('Erro ao traduzir requisito:', err)
                );
            }
        }

        // Insere benefícios
        if (Array.isArray(beneficios)) {
            for (const b of beneficios) {
                const benResult = await pool.query(
                    `INSERT INTO beneficios_vaga (vaga_id, descricao) VALUES ($1, $2) RETURNING benef_id`,
                    [vagaId, b]
                );
                const benefId = benResult.rows[0].benef_id;

                // Traduz benefício (em segundo plano)
                translateBeneficio(benefId, b).catch(err =>
                    console.error('Erro ao traduzir benefício:', err)
                );
            }
        }

        res.status(201).json({ mensagem: 'Vaga criada com sucesso.', vagaId });

    } catch (error) {
        console.error('Erro ao criar vaga:', error.message);
        res.status(500).json({ mensagem: 'Erro interno ao criar vaga.' });
    }
}


// [R]EAD – Listar vagas para ADMIN (GET)
async function listarVagas(req, res) {
    const query = `
        SELECT 
            v.*,
            COALESCE(
                (SELECT json_agg(r.descricao) FROM requisitos_vaga r WHERE r.vaga_id = v.vaga_id),
                '[]'::json
            ) as requisitos,
            COALESCE(
                (SELECT json_agg(b.descricao) FROM beneficios_vaga b WHERE b.vaga_id = v.vaga_id),
                '[]'::json
            ) as beneficios
        FROM vagas v
        ORDER BY v.data_criacao DESC;
    `;

    try {
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);

    } catch (error) {
        console.error('Erro ao listar vagas:', error.message);
        res.status(500).json({ mensagem: 'Erro interno ao listar vagas.' });
    }
}


// [R]EAD – Listar vagas públicas (Somente exibir = true)
async function listarVagasPublicas(req, res) {
    const lang = req.query.lang || 'pt';

    // Query diferente dependendo do idioma
    const query = lang === 'en'
        ? `SELECT 
            v.vaga_id,
            COALESCE(ve.titulo, v.titulo) as titulo,
            COALESCE(ve.descricao, v.descricao) as descricao,
            v.link_candidatura,
            v.data_criacao,
            v.exibir,
            COALESCE(
                (SELECT json_agg(COALESCE(re.descricao, r.descricao)) 
                 FROM requisitos_vaga r 
                 LEFT JOIN requisitos_vaga_en re ON r.req_id = re.req_id 
                 WHERE r.vaga_id = v.vaga_id),
                '[]'::json
            ) as requisitos,
            COALESCE(
                (SELECT json_agg(COALESCE(be.descricao, b.descricao)) 
                 FROM beneficios_vaga b 
                 LEFT JOIN beneficios_vaga_en be ON b.benef_id = be.benef_id 
                 WHERE b.vaga_id = v.vaga_id),
                '[]'::json
            ) as beneficios
        FROM vagas v
        LEFT JOIN vagas_en ve ON v.vaga_id = ve.vaga_id
        WHERE v.exibir = TRUE
        ORDER BY v.data_criacao DESC;`
        : `SELECT 
            v.vaga_id,
            v.titulo,
            v.descricao,
            v.link_candidatura,
            v.data_criacao,
            v.exibir,
            COALESCE(
                (SELECT json_agg(descricao) FROM requisitos_vaga r WHERE r.vaga_id = v.vaga_id),
                '[]'::json
            ) as requisitos,
            COALESCE(
                (SELECT json_agg(descricao) FROM beneficios_vaga b WHERE b.vaga_id = v.vaga_id),
                '[]'::json
            ) as beneficios
        FROM vagas v
        WHERE v.exibir = TRUE
        ORDER BY v.data_criacao DESC;`;

    try {
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);

    } catch (error) {
        console.error('Erro ao listar vagas públicas:', error.message);
        res.status(500).json({ mensagem: 'Erro interno ao listar vagas públicas.' });
    }
}


// [R]EAD – Buscar vaga por ID (GET)
// [R]EAD – Buscar vaga por ID (GET)
async function buscarVagaPorId(req, res) {
    const { id } = req.params;

    const query = `
        SELECT 
            v.*,
            ve.titulo as titulo_en,
            ve.descricao as descricao_en
        FROM vagas v
        LEFT JOIN vagas_en ve ON v.vaga_id = ve.vaga_id
        WHERE v.vaga_id = $1;
    `;

    try {
        const resultado = await pool.query(query, [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensagem: 'Vaga não encontrada.' });
        }

        const vaga = resultado.rows[0];

        // Busca requisitos (PT e EN)
        const reqs = await pool.query(
            `SELECT 
                r.descricao, 
                re.descricao as descricao_en 
             FROM requisitos_vaga r
             LEFT JOIN requisitos_vaga_en re ON r.req_id = re.req_id
             WHERE r.vaga_id = $1`,
            [id]
        );

        // Busca benefícios (PT e EN)
        const bens = await pool.query(
            `SELECT 
                b.descricao, 
                be.descricao as descricao_en 
             FROM beneficios_vaga b
             LEFT JOIN beneficios_vaga_en be ON b.benef_id = be.benef_id
             WHERE b.vaga_id = $1`,
            [id]
        );

        const vagaCompleta = {
            ...vaga,
            requisitos: reqs.rows.map(r => r.descricao),
            requisitos_en: reqs.rows.map(r => r.descricao_en || r.descricao), // Fallback para PT se não tiver EN
            beneficios: bens.rows.map(b => b.descricao),
            beneficios_en: bens.rows.map(b => b.descricao_en || b.descricao) // Fallback para PT se não tiver EN
        };

        res.status(200).json(vagaCompleta);

    } catch (error) {
        console.error('Erro ao buscar vaga:', error.message);
        res.status(500).json({ mensagem: 'Erro interno ao buscar vaga.' });
    }
}


// [U]PDATE – Atualizar vaga (PUT)
async function atualizarVaga(req, res) {
    const { id } = req.params;
    const { titulo, descricao, link_candidatura, requisitos, beneficios, exibir } = req.body;

    const exibirFinal = (exibir === 'on' || exibir === 'true' || exibir === true);

    try {
        // Atualiza vaga principal
        const query = `
            UPDATE vagas
            SET titulo = $1, descricao = $2, link_candidatura = $3, exibir = $4
            WHERE vaga_id = $5
        `;

        await pool.query(query, [
            titulo,
            descricao,
            link_candidatura || null,
            exibirFinal,
            id
        ]);

        // Atualiza tradução (em segundo plano)
        translateVaga(id, titulo, descricao, true).catch(err =>
            console.error('Erro ao atualizar tradução da vaga:', err)
        );

        // Limpa e reinsere requisitos
        await pool.query(`DELETE FROM requisitos_vaga WHERE vaga_id = $1`, [id]);

        if (Array.isArray(requisitos)) {
            for (const r of requisitos) {
                const reqResult = await pool.query(
                    `INSERT INTO requisitos_vaga (vaga_id, descricao) VALUES ($1, $2) RETURNING req_id`,
                    [id, r]
                );
                const reqId = reqResult.rows[0].req_id;

                // Traduz requisito (em segundo plano)
                translateRequisito(reqId, r).catch(err =>
                    console.error('Erro ao traduzir requisito:', err)
                );
            }
        }

        // Limpa e reinsere benefícios
        await pool.query(`DELETE FROM beneficios_vaga WHERE vaga_id = $1`, [id]);

        if (Array.isArray(beneficios)) {
            for (const b of beneficios) {
                const benResult = await pool.query(
                    `INSERT INTO beneficios_vaga (vaga_id, descricao) VALUES ($1, $2) RETURNING benef_id`,
                    [id, b]
                );
                const benefId = benResult.rows[0].benef_id;

                // Traduz benefício (em segundo plano)
                translateBeneficio(benefId, b).catch(err =>
                    console.error('Erro ao traduzir benefício:', err)
                );
            }
        }

        res.status(200).json({ mensagem: 'Vaga atualizada com sucesso.' });

    } catch (error) {
        console.error('Erro ao atualizar vaga:', error.message);
        res.status(500).json({ mensagem: 'Erro interno ao atualizar vaga.' });
    }
}


// [D]ELETE – Deletar vaga (DELETE)
async function deletarVaga(req, res) {
    const { id } = req.params;

    const query = `DELETE FROM vagas WHERE vaga_id = $1`;

    try {
        await pool.query(query, [id]);
        res.status(200).json({ mensagem: 'Vaga deletada com sucesso.' });

    } catch (error) {
        console.error('Erro ao deletar vaga:', error.message);
        res.status(500).json({ mensagem: 'Erro interno ao deletar vaga.' });
    }
}


// [PATCH] Atualizar exibição (mostrar/ocultar vaga)
async function atualizarExibir(req, res) {
    const { id } = req.params;
    const { exibir } = req.body;

    const query = `UPDATE vagas SET exibir = $1 WHERE vaga_id = $2`;

    try {
        await pool.query(query, [exibir, id]);
        res.status(200).json({ mensagem: 'Exibição atualizada.' });

    } catch (error) {
        console.error('Erro ao atualizar exibição:', error.message);
        res.status(500).json({ mensagem: 'Erro ao atualizar exibição.' });
    }
}


// ------------------------------------------------------------
// FUNÇÕES AUXILIARES DE TRADUÇÃO
// ------------------------------------------------------------

async function translateVaga(vagaId, titulo, descricao, isUpdate = false) {
    try {
        const tituloEn = await translateText(titulo);
        const descricaoEn = await translateText(descricao);

        if (!tituloEn || !descricaoEn) {
            console.warn('Tradução retornou null para vaga', vagaId);
            return;
        }

        if (isUpdate) {
            // Verifica se já existe tradução
            const checkQuery = `SELECT id_traducao FROM vagas_en WHERE vaga_id = $1`;
            const checkResult = await pool.query(checkQuery, [vagaId]);

            if (checkResult.rows.length > 0) {
                // Atualiza tradução existente
                const updateQuery = `
                    UPDATE vagas_en 
                    SET titulo = $1, descricao = $2 
                    WHERE vaga_id = $3
                `;
                await pool.query(updateQuery, [tituloEn, descricaoEn, vagaId]);
            } else {
                // Insere nova tradução
                const insertQuery = `
                    INSERT INTO vagas_en (vaga_id, titulo, descricao) 
                    VALUES ($1, $2, $3)
                `;
                await pool.query(insertQuery, [vagaId, tituloEn, descricaoEn]);
            }
        } else {
            // Insere nova tradução
            const insertQuery = `
                INSERT INTO vagas_en (vaga_id, titulo, descricao) 
                VALUES ($1, $2, $3)
            `;
            await pool.query(insertQuery, [vagaId, tituloEn, descricaoEn]);
        }
    } catch (error) {
        console.error('Erro ao traduzir vaga:', error);
    }
}

async function translateRequisito(reqId, descricao) {
    try {
        const descricaoEn = await translateText(descricao);

        if (!descricaoEn) {
            console.warn('Tradução retornou null para requisito', reqId);
            return;
        }

        const insertQuery = `
            INSERT INTO requisitos_vaga_en (req_id, descricao) 
            VALUES ($1, $2)
        `;
        await pool.query(insertQuery, [reqId, descricaoEn]);
    } catch (error) {
        console.error('Erro ao traduzir requisito:', error);
    }
}

async function translateBeneficio(benefId, descricao) {
    try {
        const descricaoEn = await translateText(descricao);

        if (!descricaoEn) {
            console.warn('Tradução retornou null para benefício', benefId);
            return;
        }

        const insertQuery = `
            INSERT INTO beneficios_vaga_en (benef_id, descricao) 
            VALUES ($1, $2)
        `;
        await pool.query(insertQuery, [benefId, descricaoEn]);
    } catch (error) {
        console.error('Erro ao traduzir benefício:', error);
    }
}


// ------------------------------------------------------------
// EXPORT
// ------------------------------------------------------------
module.exports = {
    criarVaga,
    listarVagas,
    listarVagasPublicas,
    buscarVagaPorId,
    atualizarVaga,
    deletarVaga,
    atualizarExibir
};

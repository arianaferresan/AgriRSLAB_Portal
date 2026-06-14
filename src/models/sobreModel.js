const { pool } = require('../database/dbConfig');

async function ensureSobreTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS sobre_conteudo (
            id INTEGER PRIMARY KEY DEFAULT 1,
            titulo VARCHAR(120) NOT NULL,
            subtitulo VARCHAR(180) NOT NULL,
            texto_principal TEXT NOT NULL,
            missao TEXT NOT NULL,
            visao TEXT NOT NULL,
            valores TEXT NOT NULL,
            url_imagem VARCHAR(500),
            atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            usuario_responsavel VARCHAR(100),
            CONSTRAINT sobre_conteudo_singleton CHECK (id = 1)
        );
    `);
}

async function getSobre() {
    await ensureSobreTable();

    const resultado = await pool.query(
        'SELECT * FROM sobre_conteudo WHERE id = 1 LIMIT 1'
    );

    return resultado.rows[0] || null;
}

async function upsertSobre(data) {
    await ensureSobreTable();

    const query = `
        INSERT INTO sobre_conteudo (
            id,
            titulo,
            subtitulo,
            texto_principal,
            missao,
            visao,
            valores,
            url_imagem,
            usuario_responsavel
        )
        VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
            titulo = EXCLUDED.titulo,
            subtitulo = EXCLUDED.subtitulo,
            texto_principal = EXCLUDED.texto_principal,
            missao = EXCLUDED.missao,
            visao = EXCLUDED.visao,
            valores = EXCLUDED.valores,
            url_imagem = EXCLUDED.url_imagem,
            usuario_responsavel = EXCLUDED.usuario_responsavel,
            atualizado_em = CURRENT_TIMESTAMP
        RETURNING *;
    `;

    const values = [
        data.titulo,
        data.subtitulo,
        data.texto_principal,
        data.missao,
        data.visao,
        data.valores,
        data.url_imagem || null,
        data.usuario_responsavel || null
    ];

    const resultado = await pool.query(query, values);
    return resultado.rows[0];
}

module.exports = {
    getSobre,
    upsertSobre,
    ensureSobreTable
};

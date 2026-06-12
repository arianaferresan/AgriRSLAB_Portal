const { pool } = require('../database/dbConfig');
const fs = require('fs');
const path = require('path');
const { translateNoticia } = require('../services/translateService');

// Caminho base da pasta de uploads de notícias
const uploadDir = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'noticias');

// --- Funções Auxiliares ---

/**
 * Retorna a query base com ou sem JOIN dependendo do idioma
 * @param {string} lang - Idioma desejado ('pt' ou 'en')
 * @returns {string} Query SQL
 */
function getTranslatedQuery(lang) {
  if (lang === 'en') {
    return `
      SELECT 
        n.id_noticias, n.data_criacao, n.url_imagem, n.categoria, 
        n.destaque, n.url_noticia, n.exibir,
        COALESCE(ne.titulo, n.titulo) as titulo,
        COALESCE(ne.subtitulo, n.subtitulo) as subtitulo,
        COALESCE(ne.texto, n.texto) as texto
      FROM noticias n
      LEFT JOIN noticias_en ne ON n.id_noticias = ne.id_noticia
    `;
  }
  return 'SELECT * FROM noticias n';
}

// --- Funções Públicas ---

// GET ALL notícias (Público - Filtra por exibir=true)
async function getAllNoticias(req, res) {
  const lang = req.query.lang || 'pt';
  const baseQuery = getTranslatedQuery(lang);
  try {
    const result = await pool.query(`${baseQuery} WHERE n.exibir = true ORDER BY n.data_criacao DESC`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    res.status(500).json({ error: 'Erro ao buscar notícias' });
  }
};

// GET notícias DESTAQUE
async function getDestaqueNoticias(req, res) {
  const lang = req.query.lang || 'pt';
  const baseQuery = getTranslatedQuery(lang);
  try {
    const result = await pool.query(
      `${baseQuery} WHERE n.destaque = true AND n.exibir = true ORDER BY n.data_criacao DESC`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar notícias destaque:', error);
    res.status(500).json({ error: 'Erro ao buscar notícias destaque' });
  }
};

// GET apenas Defesas
async function getDefesasNoticias(req, res) {
  const lang = req.query.lang || 'pt';
  const baseQuery = getTranslatedQuery(lang);
  try {
    const result = await pool.query(
      `${baseQuery}
       WHERE n.exibir = true
         AND LOWER(TRIM(n.categoria)) = 'defesa'
       ORDER BY n.data_criacao DESC`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar defesas:', error);
    res.status(500).json({ error: 'Erro ao buscar notícias de defesa' });
  }
};

// GET apenas Eventos do Mês Atual (Categoria: Curso)
async function getEventosMesAtual(req, res) {
  const lang = req.query.lang || 'pt';
  const baseQuery = getTranslatedQuery(lang);
  try {
    const result = await pool.query(
      `${baseQuery}
       WHERE n.exibir = true
         AND LOWER(TRIM(n.categoria)) = 'curso'
         AND n.data_criacao >= date_trunc('month', CURRENT_DATE)
         AND n.data_criacao < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
       ORDER BY n.data_criacao DESC`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar eventos do mês:', error);
    res.status(500).json({ error: 'Erro ao buscar eventos do mês' });
  }
};

// --- Funções de Admin ---

// GET ALL notícias (Admin - Traz todas)
async function getAllNoticiasAdmin(_req, res) {
  try {
    const result = await pool.query('SELECT * FROM noticias ORDER BY data_criacao DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar notícias (admin):', error);
    res.status(500).json({ error: 'Erro ao buscar notícias (admin)' });
  }
};

// CREATE noticia (com Multer e tradução automática)
async function createNoticia(req, res) {
  let { titulo, subtitulo, data_criacao, texto, categoria, destaque, url_noticia, exibir } = req.body;

  exibir = (exibir === 'on' || exibir === 'true' || exibir === true);
  destaque = (destaque === 'on' || destaque === 'true' || destaque === true);

  if (!req.file) {
    return res.status(400).json({ error: 'A imagem da notícia é obrigatória.' });
  }

  const url_imagem = `/uploads/noticias/${req.file.filename}`;

  try {
    // 1. Insere a notícia em português
    const result = await pool.query(
      `INSERT INTO noticias (titulo, subtitulo, data_criacao, url_imagem, texto, categoria, destaque, url_noticia, exibir)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [titulo, subtitulo, data_criacao, url_imagem, texto, categoria, destaque, url_noticia, exibir]
    );

    const noticia = result.rows[0];

    // 2. Traduz automaticamente para inglês (em background, não bloqueia resposta)
    translateNoticia(titulo, subtitulo, texto)
      .then(({ tituloEn, subtituloEn, textoEn }) => {
        // 3. Salva a tradução na tabela noticias_en
        return pool.query(
          `INSERT INTO noticias_en (id_noticia, titulo, subtitulo, texto)
           VALUES ($1, $2, $3, $4)`,
          [noticia.id_noticias, tituloEn, subtituloEn, textoEn]
        );
      })
      .then(() => {
        console.log(`Tradução criada para notícia ID ${noticia.id_noticias}`);
      })
      .catch(error => {
        console.error('Erro ao traduzir notícia:', error);
        // Não falha a criação da notícia se a tradução falhar
      });

    res.status(201).json({
      message: 'Notícia criada com sucesso!',
      noticia
    });
  } catch (error) {
    console.error('Erro ao criar notícia:', error);
    res.status(500).json({ error: 'Erro ao criar notícia' });
  }
}

// UPDATE noticia (com Multer e tradução automática)
async function updateNoticia(req, res) {
  const { id } = req.params;
  let { titulo, subtitulo, data_criacao, texto, categoria, destaque, url_noticia, exibir } = req.body;

  exibir = (exibir === 'on' || exibir === 'true' || exibir === true);
  destaque = (destaque === 'on' || destaque === 'true' || destaque === true);

  try {
    const oldData = await pool.query('SELECT url_imagem FROM noticias WHERE id_noticias = $1', [id]);
    const oldImagePath = oldData.rows[0]?.url_imagem;

    let nova_url_imagem;

    if (req.file) {
      nova_url_imagem = `/uploads/noticias/${req.file.filename}`;

      if (oldImagePath) {
        const relativeOldPath = oldImagePath.replace('/public/', '');
        const fullOldPath = path.join(__dirname, '..', '..', 'public', relativeOldPath);
        if (fs.existsSync(fullOldPath)) {
          fs.unlinkSync(fullOldPath);
        }
      }
    } else {
      nova_url_imagem = oldImagePath;
    }

    const final_url_noticia = (url_noticia === '') ? null : url_noticia;

    // 4. Atualiza o banco
  const result = await pool.query(
      `UPDATE noticias
       SET 
         titulo = $1, subtitulo = $2, data_criacao = $3, url_imagem = $4, 
         texto = $5, categoria = $6, destaque = $7, url_noticia = $8, exibir = $9
       WHERE id_noticias = $10
       RETURNING *`,
      [titulo, subtitulo, data_criacao, nova_url_imagem, texto, categoria, destaque, final_url_noticia, exibir, id] 
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notícia não encontrada para atualização' });
    }

    // Atualiza a tradução (em background)
    translateNoticia(titulo, subtitulo, texto)
      .then(async ({ tituloEn, subtituloEn, textoEn }) => {
        // Verifica se já existe tradução
        const existingTranslation = await pool.query(
          'SELECT id_traducao FROM noticias_en WHERE id_noticia = $1',
          [id]
        );

        if (existingTranslation.rows.length > 0) {
          // Atualiza tradução existente
          await pool.query(
            `UPDATE noticias_en 
             SET titulo = $1, subtitulo = $2, texto = $3
             WHERE id_noticia = $4`,
            [tituloEn, subtituloEn, textoEn, id]
          );
        } else {
          // Cria nova tradução
          await pool.query(
            `INSERT INTO noticias_en (id_noticia, titulo, subtitulo, texto)
             VALUES ($1, $2, $3, $4)`,
            [id, tituloEn, subtituloEn, textoEn]
          );
        }
        console.log(`Tradução atualizada para notícia ID ${id}`);
      })
      .catch(error => {
        console.error('Erro ao atualizar tradução:', error);
      });

    res.status(200).json({
      message: 'Notícia atualizada com sucesso!',
      noticia: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar notícia:', error);
    res.status(500).json({ error: 'Erro ao atualizar notícia' });
  }
}

// DELETE noticia (com fs.unlink)
async function deleteNoticia(req, res) {
  const { id } = req.params;

  try {
    const oldData = await pool.query('SELECT url_imagem FROM noticias WHERE id_noticias = $1', [id]);
    if (oldData.rows.length === 0) {
      return res.status(404).json({ error: 'Notícia não encontrada para exclusão' });
    }
    const oldImagePath = oldData.rows[0].url_imagem;

    // Deleta do banco (CASCADE vai deletar a tradução automaticamente)
    await pool.query('DELETE FROM noticias WHERE id_noticias = $1', [id]);

    // Deleta o arquivo de imagem do disco
    if (oldImagePath) {
      const relativeOldPath = oldImagePath.replace('/public/', '');
      const fullOldPath = path.join(__dirname, '..', '..', 'public', relativeOldPath);
      if (fs.existsSync(fullOldPath)) {
        fs.unlinkSync(fullOldPath);
      }
    }

    res.status(200).json({ message: 'Notícia deletada com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar notícia:', error);
    res.status(500).json({ error: 'Erro ao deletar notícia' });
  }
}

// PATCH (Toggle) Exibir
async function toggleNoticiaExibir(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE noticias SET exibir = NOT exibir WHERE id_noticias = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notícia não encontrada' });
    }
    res.status(200).json({
      message: 'Status de exibição atualizado!',
      noticia: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar exibição da notícia:', error);
    res.status(500).json({ error: 'Erro ao atualizar exibição' });
  }
}

// Deletar todas as notícias
async function deleteAllNoticias(_req, res) {
  try {
    await pool.query('TRUNCATE TABLE noticias RESTART IDENTITY CASCADE');
    res.status(200).json({ message: 'Todas as notícias foram deletadas com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar todas as notícias:', error);
    res.status(500).json({ error: 'Erro ao deletar todas as notícias' });
  }
}

async function getNoticiaById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM noticias WHERE id_noticias = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notícia não encontrada' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar notícia por ID:', error);
    res.status(500).json({ error: 'Erro ao buscar notícia' });
  }
};

async function getNoticiasSugeridas(req, res) {
  const { idAtual } = req.query; 

  try {
    const result = await pool.query(
      `SELECT * FROM noticias 
       WHERE exibir = true AND id_noticias != $1
       ORDER BY data_criacao DESC
       LIMIT 3`,
      [idAtual]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar notícias sugeridas:', error);
    res.status(500).json({ error: 'Erro ao buscar notícias sugeridas' });
  }
};


module.exports = {
  // Públicas
  getAllNoticias,
  getDestaqueNoticias,
  getDefesasNoticias,
  getEventosMesAtual,
  getNoticiasSugeridas,
  // Admin
  getAllNoticiasAdmin,
  createNoticia,
  updateNoticia,
  deleteNoticia,
  deleteAllNoticias,
  toggleNoticiaExibir,

  getNoticiaById
};

const sobreModel = require('../models/sobreModel');

const DEFAULT_SOBRE = {
    titulo: 'Sobre o AgriRSLab',
    subtitulo: 'Sensoriamento remoto aplicado à agricultura e ao meio ambiente',
    texto_principal:
        'O AgriRSLab, vinculado ao Programa de Pós-Graduação em Sensoriamento Remoto do Instituto Nacional de Pesquisas Espaciais (INPE), dedica-se ao avanço do conhecimento científico e tecnológico na aplicação de sensoriamento remoto para a agricultura e o meio ambiente.',
    missao:
        'Desenvolver soluções inovadoras para o monitoramento agrícola, avaliação de impactos ambientais e gestão de recursos naturais.',
    visao:
        'Ser referência em pesquisa, desenvolvimento e formação em sensoriamento remoto aplicado à agricultura sustentável.',
    valores:
        'Ciência aplicada\nInovação responsável\nColaboração\nSustentabilidade\nTransparência',
    url_imagem: '/assets/5. Parceiros/membros.png',
    atualizado_em: null,
    usuario_responsavel: null
};

function normalizeText(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizePayload(body, imageUrl, user) {
    return {
        titulo: normalizeText(body.titulo),
        subtitulo: normalizeText(body.subtitulo),
        texto_principal: normalizeText(body.texto_principal || body.texto),
        missao: normalizeText(body.missao),
        visao: normalizeText(body.visao),
        valores: normalizeText(body.valores),
        url_imagem: normalizeText(imageUrl || body.url_imagem || body.imagemUrl),
        usuario_responsavel: user?.mail || null
    };
}

function validateSobre(data) {
    const requiredFields = [
        ['titulo', 'Título'],
        ['subtitulo', 'Subtítulo'],
        ['texto_principal', 'Texto principal'],
        ['missao', 'Missão'],
        ['visao', 'Visão'],
        ['valores', 'Valores']
    ];

    const missing = requiredFields
        .filter(([field]) => !data[field])
        .map(([, label]) => label);

    if (missing.length > 0) {
        return `Campos obrigatórios ausentes: ${missing.join(', ')}.`;
    }

    return null;
}

function toPublicDto(row) {
    const source = row || DEFAULT_SOBRE;

    return {
        titulo: source.titulo,
        subtitulo: source.subtitulo,
        texto_principal: source.texto_principal,
        missao: source.missao,
        visao: source.visao,
        valores: source.valores,
        url_imagem: source.url_imagem || DEFAULT_SOBRE.url_imagem,
        atualizado_em: source.atualizado_em || null
    };
}

function toAdminDto(row) {
    const source = row || DEFAULT_SOBRE;

    return {
        ...toPublicDto(source),
        usuario_responsavel: source.usuario_responsavel || null
    };
}

async function getSobreAdmin() {
    const row = await sobreModel.getSobre();
    return toAdminDto(row);
}

async function getSobrePublico() {
    const row = await sobreModel.getSobre();
    return toPublicDto(row);
}

async function saveSobre(body, imageUrl, user) {
    const data = normalizePayload(body, imageUrl, user);
    const validationError = validateSobre(data);

    if (validationError) {
        const error = new Error(validationError);
        error.statusCode = 400;
        throw error;
    }

    const saved = await sobreModel.upsertSobre(data);
    return toAdminDto(saved);
}

module.exports = {
    getSobreAdmin,
    getSobrePublico,
    saveSobre,
    DEFAULT_SOBRE
};

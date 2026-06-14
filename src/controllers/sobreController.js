const sobreService = require('../services/sobreService');

async function getSobreAdmin(req, res) {
    try {
        const sobre = await sobreService.getSobreAdmin();
        res.status(200).json(sobre);
    } catch (error) {
        console.error('Erro ao buscar conteúdo Sobre para admin:', error.message);
        res.status(500).json({ mensagem: 'Erro ao buscar conteúdo da página Sobre.' });
    }
}

async function getSobrePublico(_req, res) {
    try {
        const sobre = await sobreService.getSobrePublico();
        res.status(200).json(sobre);
    } catch (error) {
        console.error('Erro ao buscar conteúdo público Sobre:', error.message);
        res.status(500).json({ mensagem: 'Erro ao buscar conteúdo público da página Sobre.' });
    }
}

async function salvarSobre(req, res) {
    try {
        const imageFile = req.file || null;
        const imageUrl = imageFile ? `/uploads/sobre/${imageFile.filename}` : null;
        const sobre = await sobreService.saveSobre(req.body, imageUrl, req.user);

        res.status(200).json({
            mensagem: 'Conteúdo da página Sobre salvo com sucesso.',
            sobre
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        if (statusCode >= 500) {
            console.error('Erro ao salvar conteúdo Sobre:', error.message);
        }

        res.status(statusCode).json({
            mensagem: error.statusCode ? error.message : 'Erro ao salvar conteúdo da página Sobre.'
        });
    }
}

module.exports = {
    getSobreAdmin,
    getSobrePublico,
    salvarSobre
};

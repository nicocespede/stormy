module.exports = {
    category: 'Privados',
    description: 'Reinicia por completo las estadísticas.',
    aliases: ['restart-stats'],

    maxArgs: 0,
    slash: false,
    ownerOnly: true,

    callback: async () => {
        const statSchema = require('../../models/stat-schema');
        await statSchema.deleteMany({});
        return '¡Estadísticas reiniciadas!';
    }
}
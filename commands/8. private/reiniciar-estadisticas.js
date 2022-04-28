const { executeQuery } = require('../../app/postgres');

module.exports = {
    category: 'Privados',
    description: 'Reinicia por completo las estadísticas.',
    aliases: ['restart-stats'],

    maxArgs: 0,
    slash: false,
    ownerOnly: true,

    callback: async () => {
        await executeQuery(`DELETE FROM "stats";`).catch(console.error);
        return '¡Estadísticas reiniciadas!';
    }
}
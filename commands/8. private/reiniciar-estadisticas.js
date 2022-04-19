module.exports = {
    category: 'Privados',
    description: 'Reinicia por completo las estadísticas.',
    aliases: ['restart-stats'],

    maxArgs: 0,
    slash: false,
    permissions: ['ADMINISTRATOR'],

    callback: async () => {
        await executeQuery(`DELETE FROM "stats";`).catch(console.error);
        return '¡Estadísticas reiniciadas!';
    }
}
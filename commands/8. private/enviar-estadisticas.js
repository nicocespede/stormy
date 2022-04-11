const { updateStats, pushCounter, updateCounter, getCounters } = require("../../app/cache");

module.exports = {
    category: 'Privados',
    description: 'Envía a la base de datos las estadísticas recolectadas.',
    aliases: ['push-stats'],

    maxArgs: 0,
    slash: false,
    permissions: ['ADMINISTRATOR'],

    callback: async () => {
        var stats = await updateStats();
        stats.forEach(async stat => await pushCounter(stat['stats_id']));
        await updateStats();
        for (const key in getCounters()) updateCounter(key);
        return '¡Estadísticas enviadas a la base de datos!';
    }
}
const { updateStats, getStats, addTimestamp } = require("../../app/cache");
const { pushDifference } = require("../../app/general");

module.exports = {
    category: 'Privados',
    description: 'Envía a la base de datos las estadísticas recolectadas.',
    aliases: ['push-stats'],

    maxArgs: 0,
    slash: false,
    permissions: ['ADMINISTRATOR'],

    callback: async () => {
        var stats = !getStats() ? await updateStats() : getStats();
        stats.forEach(async stat => {
            await pushDifference(stat['stats_id']);
            addTimestamp(stat['stats_id'], new Date());
        });
        return '¡Estadísticas enviadas a la base de datos!';
    }
}
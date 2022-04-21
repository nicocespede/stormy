const { getStats, updateStats } = require("../../app/cache");
const { updateStat } = require("../../app/postgres");
const { isListed } = require("../../app/general");

module.exports = {
    category: 'Privados',
    description: 'Resta el tiempo indicado a las estadísticas del ID indicado.',

    minArgs: 5,
    maxArgs: 5,
    slash: false,
    permissions: ['ADMINISTRATOR'],

    callback: async ({args}) => {
        var stats = !getStats() ? await updateStats() : getStats();
        if (!isListed(args[0], stats, 'stats_id'))
            return 'El ID ingresado no tiene estadísticas registradas.';
        stats.forEach(async stat => {
            if (stat['stats_id'] === args[0]) {
                var days = stat['stats_days'] - parseInt(args[1]);
                var hours = stat['stats_hours'] - parseInt(args[2]);
                var minutes = stat['stats_minutes'] - parseInt(args[3]);
                var seconds = stat['stats_seconds'] - parseInt(args[4]);
                if (!isNaN(days) && !isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
                    await updateStat(args[0], days, hours, minutes, seconds);
                }
                return;
            }
        });
        await updateStats();
        return '¡Tiempo restado!';
    }
}
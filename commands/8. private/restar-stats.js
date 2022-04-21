const { getStats, updateStats } = require("../../app/cache");
const { updateStat } = require("../../app/postgres");
const { isListed, fullToSeconds, secondsToFull } = require("../../app/general");

module.exports = {
    category: 'Privados',
    description: 'Resta el tiempo indicado a las estadísticas del ID indicado.',

    minArgs: 5,
    maxArgs: 5,
    slash: false,
    permissions: ['ADMINISTRATOR'],

    callback: async ({ args }) => {
        var stats = !getStats() ? await updateStats() : getStats();
        if (!isListed(args[0], stats, 'stats_id'))
            return 'El ID ingresado no tiene estadísticas registradas.';
        stats.forEach(async stat => {
            if (stat['stats_id'] === args[0]) {
                var totalTime = fullToSeconds(stat['stats_days'], stat['stats_hours'], stat['stats_minutes'], stat['stats_seconds'])
                    - fullToSeconds(parseInt(args[1]), parseInt(args[2]), parseInt(args[3]), parseInt(args[4]));
                if (!isNaN(totalTime)) {
                    var { days, hours, minutes, seconds } = secondsToFull(totalTime);
                    await updateStat(args[0], days, hours, minutes, seconds);
                }
                return;
            }
        });
        await updateStats();
        return '¡Tiempo restado!';
    }
}
const { getStats, updateStats } = require("../../app/cache");
const { updateStat } = require("../../app/postgres");
const { isListed, fullToSeconds, secondsToFull } = require("../../app/general");

module.exports = {
    category: 'Privados',
    description: 'Resta el tiempo indicado a las estadísticas del ID indicado.',

    minArgs: 5,
    maxArgs: 5,
    expectedArgs: '<ID> <días> <horas> <minutos> <segundos>',
    slash: false,
    ownerOnly: true,

    callback: async ({ args }) => {
        const stats = !getStats() ? await updateStats() : getStats();
        const id = args[0];
        const argsDays = args[1];
        const argsHours = args[2];
        const argsMinutes = args[3];
        const argsSeconds = args[4];
        if (!isListed(id, stats, 'stats_id'))
            return 'El ID ingresado no tiene estadísticas registradas.';
        stats.forEach(async stat => {
            if (stat['stats_id'] === id) {
                var totalTime = fullToSeconds(stat['stats_days'], stat['stats_hours'], stat['stats_minutes'], stat['stats_seconds'])
                    - fullToSeconds(parseInt(argsDays), parseInt(argsHours), parseInt(argsMinutes), parseInt(argsSeconds));
                if (!isNaN(totalTime)) {
                    const { days, hours, minutes, seconds } = secondsToFull(totalTime);
                    await updateStat(id, days, hours, minutes, seconds);
                }
                return;
            }
        });
        await updateStats();
        return '¡Tiempo restado!';
    }
}
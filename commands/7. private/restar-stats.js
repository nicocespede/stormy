const { CommandArgs } = require("../../src/typedefs");
const { getStats, updateStats } = require("../../src/cache");
const { fullToSeconds, secondsToFull } = require("../../src/common");
const { updateStat } = require("../../src/mongodb");
const { fileLogCommandUsage } = require("../../src/util");

module.exports = {
    category: 'Privados',
    description: 'Resta el tiempo indicado a las estadísticas del ID indicado.',

    minArgs: 5,
    maxArgs: 5,
    expectedArgs: '<ID> <días> <horas> <minutos> <segundos>',
    slash: false,
    ownerOnly: true,

    /** @param {CommandArgs} */
    callback: async ({ args, interaction, message, user }) => {
        fileLogCommandUsage('restar-stats', interaction, message, user);

        const stats = getStats() || await updateStats();
        const id = args[0];
        const argsDays = args[1];
        const argsHours = args[2];
        const argsMinutes = args[3];
        const argsSeconds = args[4];
        if (!Object.keys(stats).includes(id))
            return 'El ID ingresado no tiene estadísticas registradas.';
        const stat = stats[id];
        const totalTime = fullToSeconds(stat.days, stat.hours, stat.minutes, stat.seconds)
            - fullToSeconds(parseInt(argsDays), parseInt(argsHours), parseInt(argsMinutes), parseInt(argsSeconds));
        if (!isNaN(totalTime)) {
            const { days, hours, minutes, seconds } = secondsToFull(totalTime);
            await updateStat(id, days, hours, minutes, seconds);
        }
        await updateStats();
        return '¡Tiempo restado!';
    }
}
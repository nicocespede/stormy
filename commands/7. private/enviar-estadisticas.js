const { ICallbackObject } = require("wokcommands");
const { getTimestamps } = require("../../src/cache");
const { pushDifferences } = require("../../src/common");
const { logToFile, logToFileCommandUsage } = require("../../src/util");

const COMMAND_NAME = 'enviar-estadisticas';
const MODULE_NAME = `commands.private.${COMMAND_NAME}`;

module.exports = {
    category: 'Privados',
    description: 'Envía a la base de datos las estadísticas recolectadas.',
    aliases: ['push-stats'],

    maxArgs: 0,
    slash: false,
    ownerOnly: true,

    /** @param {ICallbackObject}*/
    callback: async ({ user }) => {
        logToFileCommandUsage(COMMAND_NAME, null, null, user);

        const timestamps = getTimestamps();
        if (Object.keys(timestamps).length > 0) {
            logToFile(`${MODULE_NAME}.callback`, `Pushing all stats and restarting all timestamps`);

            await pushDifferences(true);

            return '¡Estadísticas enviadas a la base de datos!';
        }
        return '¡No hay estadísticas para enviar!';
    }
}
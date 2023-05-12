const { CommandArgs } = require("../../src/typedefs");
const { getTimestamps } = require("../../src/cache");
const { pushDifferences } = require("../../src/common");
const { fileLog, fileLogCommandUsage } = require("../../src/util");

const COMMAND_NAME = 'enviar-estadisticas';
const MODULE_NAME = `commands.private.${COMMAND_NAME}`;

module.exports = {
    category: 'Privados',
    description: 'Envía a la base de datos las estadísticas recolectadas.',
    aliases: ['push-stats'],

    maxArgs: 0,
    slash: false,
    ownerOnly: true,

    /** @param {CommandArgs}*/
    callback: async ({ interaction, message, user }) => {
        fileLogCommandUsage(COMMAND_NAME, null, interaction, message, user);

        const timestamps = getTimestamps();
        if (Object.keys(timestamps).length > 0) {
            fileLog(`${MODULE_NAME}.callback`, `Pushing all stats and restarting all timestamps`);

            await pushDifferences(true);

            return '¡Estadísticas enviadas a la base de datos!';
        }
        return '¡No hay estadísticas para enviar!';
    }
}
const { addTimestamp, getTimestamps } = require("../../src/cache");
const { pushDifferences } = require("../../src/common");
const { fileLog } = require("../../src/util");

module.exports = {
    category: 'Privados',
    description: 'Envía a la base de datos las estadísticas recolectadas.',
    aliases: ['push-stats'],

    maxArgs: 0,
    slash: false,
    ownerOnly: true,

    callback: async () => {
        const timestamps = getTimestamps();
        if (Object.keys(timestamps).length > 0) {
            fileLog(`[enviar-estadisticas.callback] Pushing all stats and restarting all timestamps`);

            await pushDifferences();
            for (const key in timestamps) if (Object.hasOwnProperty.call(timestamps, key))
                addTimestamp(key, new Date());
            return '¡Estadísticas enviadas a la base de datos!';
        }
        return '¡No hay estadísticas para enviar!';
    }
}
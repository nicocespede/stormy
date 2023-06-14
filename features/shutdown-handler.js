const { Client } = require("discord.js");
const { getIds, getTimestamps, timeouts } = require("../src/cache");
const { pushDifferences } = require("../src/common");
const { DEV_ENV, CONSOLE_YELLOW } = require("../src/constants");
const { emergencyShutdown } = require("../src/music");
const { logToFileListenerTriggered, consoleLog, logToFile } = require("../src/util");

const MODULE_NAME = 'features.shutdown-handler';

/** @param {Client} client */
module.exports = client => {
    const shutdownEvent = !DEV_ENV ? 'SIGTERM' : 'SIGINT';
    process.on(shutdownEvent, async () => {
        logToFileListenerTriggered(MODULE_NAME, shutdownEvent);

        consoleLog('> Reinicio inminente...', CONSOLE_YELLOW);

        // disconnects music bot
        const ids = await getIds();
        await emergencyShutdown(ids.guilds.default);

        // send stats
        const timestamps = getTimestamps();
        if (Object.keys(timestamps).length > 0) {
            consoleLog('> Enviando estadísticas a la base de datos', CONSOLE_YELLOW);
            logToFile(`${MODULE_NAME}.${shutdownEvent}Listener`, `Pushing all stats before shutdown`);

            await pushDifferences(false);
        }

        //clears timeouts
        consoleLog(`> Terminando ${Object.keys(timeouts).length} loops`, CONSOLE_YELLOW);
        for (const key in timeouts) if (Object.hasOwnProperty.call(timeouts, key))
            clearTimeout(timeouts[key]);

        //ends discord client
        consoleLog('> Desconectando bot', CONSOLE_YELLOW);
        client.destroy();

        //exits process
        consoleLog('> Terminando proceso', CONSOLE_YELLOW);
        process.exit();
    });
};

module.exports.config = {
    displayName: 'Controlador de apagado',
    dbName: 'SHUTDOWN_HANDLER'
}
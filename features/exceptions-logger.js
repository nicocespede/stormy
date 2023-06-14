const { Client } = require("discord.js");
const { logToFileError, consoleLogError, consoleLog } = require("../src/util");
const { CONSOLE_YELLOW } = require("../src/constants");

const MODULE_NAME = 'features.exceptions-logger';

/** @param {Client} client */
module.exports = client => {
    process.on('uncaughtException', async error => {
        logToFileError(MODULE_NAME, error);
        consoleLogError("> Excepción no controlada de tipo '" + error.name + "'");

        await new Promise(res => setTimeout(res, 1000 * 3));

        //ends discord client
        consoleLog('> Desconectando bot', CONSOLE_YELLOW);
        client.destroy();

        //exits process
        consoleLog('> Terminando proceso', CONSOLE_YELLOW);
        process.exit();
    });
};

module.exports.config = {
    displayName: 'Logger de excepciones',
    dbName: 'EXCEPTIONS_LOGGER'
}
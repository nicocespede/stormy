const { ActivityType } = require("discord.js");
const { PREFIX, CONSOLE_YELLOW } = require("../src/constants");
const { consoleLog } = require("../src/util");

module.exports = client => {
    let exec = false;
    client.on('shardReady', () => {
        if (!exec)
            exec = true;
        else {
            consoleLog('> Asignando actividad a la presencia...', CONSOLE_YELLOW);
            client.user.setPresence({ activities: [{ name: `${PREFIX}ayuda`, type: ActivityType.Listening }] });
        }
    });
};

module.exports.config = {
    displayName: 'Mantenedor de presencia',
    dbName: 'PRESENCE_KEEPER'
}
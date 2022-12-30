const { ActivityType } = require("discord.js");
const { prefix } = require("../src/constants");
const { log } = require("../src/util");

module.exports = client => {
    const exec = false;
    client.on('shardReady', () => {
        if (!exec)
            exec = true;
        else {
            log('> Asignando actividad a la presencia...', 'yellow');
            client.user.setPresence({ activities: [{ name: `${prefix}ayuda`, type: ActivityType.Listening }] });
        }
    });
};

module.exports.config = {
    displayName: 'Mantenedor de presencia',
    dbName: 'PRESENCE_KEEPER'
}
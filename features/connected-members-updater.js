const { Client } = require("discord.js");
const { getIds, timeouts } = require('../src/cache');
const { logToFileError, consoleLogError } = require('../src/util');

const MODULE_NAME = 'features.connected-members-updater';

/** @param {Client} client */
module.exports = async client => {
    const ids = await getIds();

    try {
        const guild = await client.guilds.fetch(ids.guilds.default);

        const check = async () => {
            try {
                const members = await guild.members.fetch();
                const membersCounter = members.filter(m => !m.user.bot && m.presence && m.presence.status !== 'offline').size;
                const connectedMembersName = `🟢 Conectados: ${membersCounter}`;
                const channel = await guild.channels.fetch(ids.channels.connectedMembers);
                if (channel && channel.name !== connectedMembersName)
                    await channel.setName(connectedMembersName);
            } catch (error) {
                consoleLogError(`> Error al actualizar el contador de miembros conectados`);
                logToFileError(MODULE_NAME + '.check', error);
            }

            timeouts[MODULE_NAME] = setTimeout(check, 1000 * 60 * 5);
        };

        check();
    } catch (error) {
        consoleLogError('> Error al obtener servidor')
        logToFileError(MODULE_NAME, error);
    }
};

module.exports.config = {
    displayName: 'Actualizador de miembros conectados',
    dbName: 'CONNECTED_MEMBERS_UPDATER'
};
const { getIds, timeouts } = require('../src/cache');
const { CONSOLE_RED } = require('../src/constants');
const { consoleLog } = require('../src/util');

module.exports = async client => {
    const ids = await getIds();
    const guild = await client.guilds.fetch(ids.guilds.default).catch(console.error);

    const check = async () => {
        try {
            const members = await guild.members.fetch();
            const membersCounter = members.filter(m => !m.user.bot && m.presence && m.presence.status !== 'offline').size;
            const connectedMembersName = `🟢 Conectados: ${membersCounter}`;
            const channel = await guild.channels.fetch(ids.channels.connectedMembers);
            if (channel.name !== connectedMembersName)
                await channel.setName(connectedMembersName);
        } catch (error) {
            consoleLog(`> Error al actualizar el contador de miembros conectados:\n${error.stack}`, CONSOLE_RED);
        }

        timeouts['connected-members-updater'] = setTimeout(check, 1000 * 60 * 5);
    };
    check();
};

module.exports.config = {
    displayName: 'Actualizador de miembros conectados',
    dbName: 'CONNECTED_MEMBERS_UPDATER'
};
const chalk = require('chalk');
chalk.level = 1;
const { getIds, updateIds, timeouts } = require('../app/cache');

module.exports = async client => {
    const ids = getIds() || await updateIds();
    const guild = await client.guilds.fetch(ids.guilds.default).catch(console.error);

    const check = async () => {
        const members = await guild.members.fetch();
        const membersCounter = members.filter(m => !m.user.bot && m.presence && m.presence.status !== 'offline').size;
        const connectedMembersName = `🟢 Conectados: ${membersCounter}`;
        const channel = await guild.channels.fetch(ids.channels.connectedMembers).catch(console.error);
        if (channel.name !== connectedMembersName) {
            await channel.setName(connectedMembersName).catch(console.error);
            console.log(chalk.blue('> Contador de miembros conectados actualizado'));
        }

        timeouts['connected-members-updater'] = setTimeout(check, 1000 * 60 * 5);
    };
    check();
};

module.exports.config = {
    displayName: 'Actualizador de miembros conectados',
    dbName: 'CONNECTED_MEMBERS_UPDATER'
};
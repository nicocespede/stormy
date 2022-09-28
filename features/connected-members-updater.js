const chalk = require('chalk');
chalk.level = 1;
const { getIds, updateIds } = require('../app/cache');

module.exports = client => {
    const check = async () => {
        const ids = getIds() || await updateIds();
        client.guilds.fetch(ids.guilds.default).then(async guild => {
            const members = await guild.members.fetch();
            const membersCounter = members.filter(m => !m.user.bot && m.presence && m.presence.status !== 'offline').size;
            const connectedMembersName = `🟢 Conectados: ${membersCounter}`;
            guild.channels.fetch(ids.channels.connectedMembers).then(channel => {
                if (channel.name !== connectedMembersName)
                    channel.setName(connectedMembersName).then(_ => console.log(chalk.blue('> Contador de miembros conectados actualizado'))).catch(console.error);
            }).catch(console.error);
        }).catch(console.error);

        setTimeout(check, 1000 * 60 * 5);
    };
    check();
};

module.exports.config = {
    displayName: 'Actualizador de miembros conectados',
    dbName: 'CONNECTED_MEMBERS_UPDATER'
};
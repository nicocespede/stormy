const { getBanned, updateBanned, getIds, updateIds } = require("../app/cache");
const { countMembers } = require("../app/general");

module.exports = (client, instance) => {
    client.on('guildMemberRemove', async member => {
        const banned = !getBanned().ids ? await updateBanned() : getBanned();
        member.guild.bans.fetch().then(async bans => {
            if (bans.size === banned.ids.length) {
                const ids = !getIds() ? await updateIds() : getIds();
                client.channels.fetch(ids.channels.welcome).then(channel => {
                    const { guild } = member;
                    const goodbyeMessages = instance.messageHandler.getEmbed(guild, 'GREETINGS', 'GOODBYE');
                    var random = Math.floor(Math.random() * (goodbyeMessages.length));
                    channel.send({ content: goodbyeMessages[random].replace('{TAG}', member.user.tag) });
                    countMembers(client);
                }).catch(console.error);
            }
        }).catch(console.error);
    });
};

module.exports.config = {
    displayName: 'Mensaje de despedida',
    dbName: 'GOODBYE_MESSAGE'
}
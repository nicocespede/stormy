const { getBanned, updateBanned } = require("../app/cache");
const { ids, goodbye } = require("../app/constants");
const { countMembers } = require("../app/general");

module.exports = client => {
    client.on('guildMemberRemove', async member => {
        const banned = !getBanned().ids ? await updateBanned() : getBanned();
        member.guild.bans.fetch().then(bans => {
            if (bans.size === banned.ids.length)
                client.channels.fetch(ids.channels.welcome).then(channel => {
                    var random = Math.floor(Math.random() * (goodbye.length));
                    channel.send({ content: goodbye[random].replace(/%USERNAME%/g, `**${member.user.tag}**`) });
                    countMembers(client);
                }).catch(console.error);
        }).catch(console.error);
    });
};

module.exports.config = {
    displayName: 'Mensaje de despedida',
    dbName: 'GOODBYE_MESSAGE'
}
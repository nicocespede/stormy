const { getBanned, updateBanned } = require("../app/cache");
const { ids, goodbye } = require("../app/constants");

module.exports = client => {
    client.on('guildMemberRemove', async member => {
        var banned = !getBanned() ? await updateBanned() : getBanned();
        member.guild.bans.fetch().then(bans => {
            if (bans.size === banned.length)
                client.channels.fetch(ids.channels.welcome).then(channel => {
                    var random = Math.floor(Math.random() * (goodbye.length));
                    channel.send({ content: goodbye[random].replace(/%USERNAME%/g, `<@${member.user.id}>`) });
                }).catch(console.error);
        }).catch(console.error);
    });
};

module.exports.config = {
    displayName: 'Mensaje de despedida',
    dbName: 'GOODBYE_MESSAGE'
}
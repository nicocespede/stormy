const { getBanned, updateBanned } = require("../app/cache");
const { ids, unbanned } = require("../app/constants");
const { isListed } = require("../app/general");
const { deleteBan } = require("../app/postgres");

module.exports = client => {
    client.on('guildBanRemove', async ban => {
        var banned = !getBanned() ? await updateBanned() : getBanned();
        if (isListed(ban.user.id, banned, 'bans_id'))
            await deleteBan(ban.user.id).then(async () => await updateBanned()).catch(console.error);
        client.channels.fetch(ids.channels.welcome).then(channel => {
            var random = Math.floor(Math.random() * (unbanned.length));
            channel.send(unbanned[random].replace(/%USERNAME%/g, `<@${ban.user.id}>`));
        }).catch(console.error);
    });
};

module.exports.config = {
    displayName: 'Mensaje de desbaneo',
    dbName: 'UNBAN_MESSAGE'
}
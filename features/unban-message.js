const { getBanned, updateBanned } = require("../app/cache");
const { ids, unbanned, gifs } = require("../app/constants");
const { deleteBan } = require("../app/mongodb");

module.exports = client => {
    client.on('guildBanRemove', async ban => {
        const banned = !getBanned().ids ? await updateBanned() : getBanned();
        if (banned.ids.includes(ban.user.id))
            await deleteBan(ban.user.id).then(async () => await updateBanned()).catch(console.error);
        client.channels.fetch(ids.channels.welcome).then(channel => {
            var random = Math.floor(Math.random() * (unbanned.length));
            const msg = { content: unbanned[random].replace(/%USERNAME%/g, `**${ban.user.tag}**`), files: [] };
            random = Math.floor(Math.random() * (gifs.unbanned.length));
            msg.files.push(gifs.unbanned[random]);
            channel.send(msg);
        }).catch(console.error);
    });
};

module.exports.config = {
    displayName: 'Mensaje de desbaneo',
    dbName: 'UNBAN_MESSAGE'
}
const { getBanned, updateBanned, updateSombraBans } = require("../app/cache");
const { ids, bannedWithoutReason, bannedWithReason } = require("../app/constants");
const { isListed } = require("../app/general");
const { addBan, addSombraBan } = require("../app/postgres");

module.exports = client => {
    client.on('guildBanAdd', async ban => {
        await new Promise(res => setTimeout(res, 3000));
        var banned = !getBanned() ? await updateBanned() : getBanned();
        if (!isListed(ban.user.id, banned, 'bans_id'))
            await addBan([ban.user.id, ban.user.tag, ban.reason, "Desconocido"]).then(async () => await updateBanned()).catch(console.error);
        client.channels.fetch(ids.channels.welcome).then(channel => {
            if (ban.reason === null || ban.reason === "") {
                var random = Math.floor(Math.random() * (bannedWithoutReason.length));
                channel.send(bannedWithoutReason[random].replace(/%USERNAME%/g, `<@${ban.user.id}>`));
            } else {
                var random = Math.floor(Math.random() * (bannedWithReason.length));
                channel.send(bannedWithReason[random].replace(/%USERNAME%/g, `<@${ban.user.id}>`)
                    .replace(/%REASON%/g, `${ban.reason}`));
            }
        }).catch(console.error);
        if (ban.user.id == ids.users.sombra)
            addSombraBan(ban.reason).then(async () => await updateSombraBans()).catch(console.error);
    });
};

module.exports.config = {
    displayName: 'Mensaje de baneo',
    dbName: 'BAN_MESSAGE'
}
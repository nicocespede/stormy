const { updateBanned, updateSombraBans, getBansResponsibles, removeBanResponsible } = require("../app/cache");
const { ids, bannedWithoutReason, bannedWithReason } = require("../app/constants");
const { countMembers } = require("../app/general");
const { addBan, addSombraBan } = require("../app/postgres");

module.exports = client => {
    client.on('guildBanAdd', async ban => {
        const bansResponsibles = getBansResponsibles();
        var responsible = 'Desconocido';
        if (bansResponsibles[ban.user.id]) {
            responsible = bansResponsibles[ban.user.id];
            removeBanResponsible(ban.user.id);
        }
        await addBan([ban.user.id, ban.user.tag, ban.reason, responsible]).then(async () => {
            await updateBanned();
            client.channels.fetch(ids.channels.welcome).then(channel => {
                if (ban.reason === null || ban.reason === "") {
                    var random = Math.floor(Math.random() * (bannedWithoutReason.length));
                    channel.send(bannedWithoutReason[random].replace(/%USERNAME%/g, `**${ban.user.tag}**`));
                } else {
                    var random = Math.floor(Math.random() * (bannedWithReason.length));
                    channel.send(bannedWithReason[random].replace(/%USERNAME%/g, `**${ban.user.tag}**`).replace(/%REASON%/g, `${ban.reason}`));
                }
            }).catch(console.error);
            if (ban.user.id === ids.users.sombra)
                addSombraBan(ban.reason).then(async () => await updateSombraBans()).catch(console.error);
            countMembers(client);
        }).catch(console.error);
    });
};

module.exports.config = {
    displayName: 'Mensaje de baneo',
    dbName: 'BAN_MESSAGE'
}
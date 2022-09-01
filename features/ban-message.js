const { updateBanned, updateSombraBans, getBansResponsibles, removeBanResponsible } = require("../app/cache");
const { ids, bannedWithoutReason, bannedWithReason, gifs } = require("../app/constants");
const { countMembers } = require("../app/general");
const { addBan, addSombraBan } = require("../app/mongodb");

module.exports = client => {
    client.on('guildBanAdd', async ban => {
        await new Promise(res => setTimeout(res, 1000 * 1));
        const bansResponsibles = getBansResponsibles();
        var responsible = 'Desconocido';
        if (bansResponsibles[ban.user.id]) {
            responsible = bansResponsibles[ban.user.id];
            removeBanResponsible(ban.user.id);
        }
        const reason = !ban.reason || ban.reason.trim().length === 0 ? null : ban.reason;
        await addBan(ban.user.id, ban.user.tag, responsible, reason).then(async () => {
            await updateBanned();
            client.channels.fetch(ids.channels.welcome).then(channel => {
                const msg = { content: '', files: [] }
                if (!reason) {
                    var random = Math.floor(Math.random() * (bannedWithoutReason.length));
                    msg.content = bannedWithoutReason[random].replace(/%USERNAME%/g, `**${ban.user.tag}**`);
                } else {
                    var random = Math.floor(Math.random() * (bannedWithReason.length));
                    msg.content = bannedWithReason[random].replace(/%USERNAME%/g, `**${ban.user.tag}**`).replace(/%REASON%/g, `${reason}`);
                }
                random = Math.floor(Math.random() * (gifs.banned.length));
                msg.files.push(gifs.banned[random]);
                channel.send(msg);
            }).catch(console.error);
            if (ban.user.id === ids.users.sombra)
                addSombraBan(reason).then(async () => await updateSombraBans()).catch(console.error);
            countMembers(client);
        }).catch(console.error);
    });
};

module.exports.config = {
    displayName: 'Mensaje de baneo',
    dbName: 'BAN_MESSAGE'
}
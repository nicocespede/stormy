const { updateBanned, updateSombraBans, getBansResponsibles, removeBanResponsible, getIds, updateIds } = require("../app/cache");
const { gifs } = require("../app/constants");
const { countMembers } = require("../app/general");
const { addBan, addSombraBan } = require("../app/mongodb");

module.exports = (client, instance) => {
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
            const ids = !getIds() ? await updateIds() : getIds();
            client.channels.fetch(ids.channels.welcome).then(channel => {
                const msg = { content: '', files: [] }
                const { guild } = ban;
                const bannedMessages = instance.messageHandler.getEmbed(guild, 'BANS', reason ? 'BANNED_WITH_REASON' : 'BANNED_WITHOUT_REASON');
                var random = Math.floor(Math.random() * (bannedMessages.length));
                msg.content = bannedMessages[random].replace('{TAG}', ban.user.tag).replace('{REASON}', reason);
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
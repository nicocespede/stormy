const { EmbedBuilder } = require("discord.js");
const { updateBanned, updateSombraBans, getBansResponsibles, removeBanResponsible, getIds } = require("../src/cache");
const { getBannedMemberEmbedInfo } = require("../src/characters");
const { countMembers } = require("../src/common");
const { getUserTag } = require("../src/util");
const { addBan, addSombraBan } = require("../src/mongodb");

module.exports = client => {
    client.on('guildBanAdd', async ban => {
        await new Promise(res => setTimeout(res, 1000 * 1));
        const bansResponsibles = getBansResponsibles();
        const responsible = bansResponsibles[ban.user.id] || 'Desconocido';
        if (bansResponsibles[ban.user.id])
            removeBanResponsible(ban.user.id);
        const reason = !ban.reason || ban.reason.trim().length === 0 ? null : ban.reason;
        const embedInfo = await getBannedMemberEmbedInfo(getUserTag(ban.user), reason);
        await addBan(ban.user.id, getUserTag(ban.user), responsible, embedInfo.character, reason).catch(console.error);
        await updateBanned();
        const ids = await getIds();
        const channel = await client.channels.fetch(ids.channels.welcome).catch(console.error);
        channel.send({
            embeds: [new EmbedBuilder()
                .setTitle(embedInfo.title)
                .setDescription(embedInfo.description)
                .setColor(embedInfo.color)
                .setThumbnail(embedInfo.thumbnail)]
        });
        if (ban.user.id === ids.users.sombra)
            addSombraBan(reason).then(async () => await updateSombraBans()).catch(console.error);
        countMembers(client);
    });
};

module.exports.config = {
    displayName: 'Mensaje de baneo',
    dbName: 'BAN_MESSAGE'
}
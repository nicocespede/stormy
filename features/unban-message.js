const { EmbedBuilder } = require("discord.js");
const { getBanned, updateBanned, getIds } = require("../src/cache");
const { getUnbannedMemberEmbedInfo } = require("../src/characters");
const { deleteBan } = require("../src/mongodb");

module.exports = client => {
    client.on('guildBanRemove', async ban => {
        const banned = getBanned() || await updateBanned();
        if (Object.keys(banned).includes(ban.user.id)) {
            await deleteBan(ban.user.id).catch(console.error);
            await updateBanned();
            const ids = await getIds();
            const channel = await client.channels.fetch(ids.channels.welcome).catch(console.error);
            const embedInfo = await getUnbannedMemberEmbedInfo(ban.user.tag, banned[ban.user.id].character);
            channel.send({
                embeds: [new EmbedBuilder()
                    .setTitle(embedInfo.title)
                    .setDescription(embedInfo.description)
                    .setColor(embedInfo.color)
                    .setThumbnail(embedInfo.thumbnail)]
            });
        }
    });
};

module.exports.config = {
    displayName: 'Mensaje de desbaneo',
    dbName: 'UNBAN_MESSAGE'
}
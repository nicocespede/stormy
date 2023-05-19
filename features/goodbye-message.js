const { EmbedBuilder } = require("discord.js");
const { getBanned, updateBanned, getIds } = require("../src/cache");
const { getMemberLeaveEmbedInfo } = require("../src/characters");
const { countMembers } = require("../src/common");

module.exports = client => {
    client.on('guildMemberRemove', async member => {
        const banned = getBanned() || await updateBanned();
        const bans = await member.guild.bans.fetch().catch(console.error);
        if (bans.size === Object.keys(banned).length) {
            const ids = await getIds();
            const channel = await client.channels.fetch(ids.channels.welcome).catch(console.error);
            const embedInfo = await getMemberLeaveEmbedInfo(member.user.tag);
            channel.send({
                embeds: [new EmbedBuilder()
                    .setTitle(embedInfo.title)
                    .setDescription(embedInfo.description)
                    .setColor(embedInfo.color)
                    .setThumbnail(embedInfo.thumbnail)]
            });
            countMembers(client);
        }
    });
};

module.exports.config = {
    displayName: 'Mensaje de despedida',
    dbName: 'GOODBYE_MESSAGE'
}
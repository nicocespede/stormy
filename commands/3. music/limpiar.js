const { EmbedBuilder } = require("discord.js");
const { getIds, updateIds } = require("../../app/cache");
const { githubRawURL } = require("../../app/constants");

module.exports = {
    category: 'Música',
    description: 'Limpia la cola de reproducción.',
    aliases: ['clear'],

    slash: 'both',

    maxArgs: 0,
    guildOnly: true,

    callback: async ({ guild, member, user, channel, client, instance }) => {
        const embed = new EmbedBuilder().setColor(instance.color);
        const reply = { custom: true, ephemeral: true };

        const ids = getIds() || await updateIds();
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            return reply;
        }
        if (!member.voice.channel) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en un canal de voz para limpiar la cola!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }
        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para limpiar la cola!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay canciones en la cola!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        if (!queue.tracks[0]) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay más canciones luego de la actual!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        await queue.clear();

        reply.embeds = [embed.setDescription(`❌ La cola de reproducción fue limpiada.`)
            .setThumbnail(`${githubRawURL}/assets/thumbs/music/empty.png`)];
        reply.ephemeral = false;
        return reply;
    }
}
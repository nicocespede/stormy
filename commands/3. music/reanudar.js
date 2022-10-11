const { EmbedBuilder } = require("discord.js");
const { getIds, updateIds } = require("../../app/cache");
const { githubRawURL } = require("../../app/constants");

module.exports = {
    category: 'Música',
    description: 'Reanuda la reproducción.',
    aliases: ['resume', 'reproducir', 'p', 'play'],

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
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en un canal de voz para reanudar la reproducción!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para reanudar la reproducción!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay ninguna canción para reanudar!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        const success = queue.setPaused(false);

        reply.embeds = [embed.setDescription(success ? "▶️ Música reanudada." : `🛑 ¡La música no está pausada!`)
            .setThumbnail(`${githubRawURL}/assets/thumbs/music/${success ? `resume-button` : `no-entry`}.png`)];
        reply.ephemeral = false;
        return reply;
    }
}
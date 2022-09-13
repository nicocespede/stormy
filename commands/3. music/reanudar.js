const { EmbedBuilder } = require("discord.js");
const { ids } = require("../../app/constants");

module.exports = {
    category: 'Música',
    description: 'Reanuda la reproducción.',
    aliases: ['resume', 'reproducir', 'p', 'play'],

    slash: 'both',

    maxArgs: 0,
    guildOnly: true,

    callback: ({ guild, member, user, channel, client }) => {
        var embed = new EmbedBuilder().setColor([195, 36, 255]);
        var reply = { custom: true, ephemeral: true, files: [`./assets/thumbs/music/icons8-no-entry-64.png`] };
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            reply.files = [];
            return reply;
        }

        if (!member.voice.channel) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en un canal de voz para reanudar la reproducción!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para reanudar la reproducción!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay ninguna canción para reanudar!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const success = queue.setPaused(false);

        reply.embeds = [embed.setDescription(success ? "▶️ Música reanudada." : `🛑 ¡La música no está pausada!`)
            .setThumbnail(success ? `attachment://icons8-resume-button-64.png` : `attachment://icons8-no-entry-64.png`)];
        reply.ephemeral = false;
        reply.files = [success ? `./assets/thumbs/music/icons8-resume-button-64.png` : `./assets/thumbs/music/icons8-no-entry-64.png`];
        return reply;
    }
}
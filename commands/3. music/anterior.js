const { EmbedBuilder } = require("discord.js");
const { ids } = require("../../app/constants");

module.exports = {
    category: 'Música',
    description: 'Reproduce la canción anterior.',
    aliases: ['ant', 'previous', 'prev'],

    slash: 'both',

    maxArgs: 0,
    guildOnly: true,

    callback: async ({ guild, member, user, channel, client }) => {
        var errorEmbed = new EmbedBuilder().setColor([195, 36, 255]);
        var reply = { custom: true, ephemeral: true, files: [`./assets/thumbs/music/icons8-no-entry-64.png`] };
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            reply.files = [];
            return reply;
        }
        if (!member.voice.channel) {
            reply.embeds = [errorEmbed.setDescription("🛑 ¡Debes estar en un canal de voz para usar este comando!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }
        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            reply.embeds = [errorEmbed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para usar este comando!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            reply.embeds = [errorEmbed.setDescription("🛑 ¡No hay música reproduciéndose!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        if (!queue.previousTracks[1]) {
            reply.embeds = [errorEmbed.setDescription("🛑 ¡No había otra canción antes!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        await queue.back();

        reply.embeds = [new EmbedBuilder()
            .setDescription(`⏮️ Reproduciendo canción anterior.`)
            .setColor([195, 36, 255])
            .setThumbnail(`attachment://icons8-backward-button-64.png`)];
        reply.ephemeral = false;
        reply.files = [`./assets/thumbs/music/icons8-backward-button-64.png`];

        return reply;
    }
}
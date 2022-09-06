const { MessageEmbed } = require("discord.js");
const { ids } = require("../../app/constants");
const { containsAuthor, cleanTitle } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Muestra la canción actual en reproducción.',
    aliases: ['current'],

    slash: 'both',

    maxArgs: 0,
    guildOnly: true,

    callback: async ({ guild, member, user, channel, client }) => {
        var errorEmbed = new MessageEmbed().setColor([195, 36, 255]);
        var reply = { custom: true, ephemeral: true };
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            return reply;
        }
        if (!member.voice.channel) {
            reply.embeds = [errorEmbed.setDescription("🛑 ¡Debes estar en un canal de voz para usar este comando!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            reply.files = [`./assets/thumbs/music/icons8-no-entry-64.png`];
            return reply;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            reply.embeds = [errorEmbed.setDescription("🛑 No hay música reproduciéndose.")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            reply.files = [`./assets/thumbs/music/icons8-no-entry-64.png`];
            return reply;
        }

        const track = queue.current;

        const progress = queue.createProgressBar();
        const timestamp = queue.getPlayerTimestamp();

        const filteredTitle = await cleanTitle(track.title);
        reply.embeds = [new MessageEmbed()
            .setColor([195, 36, 255])
            .setDescription(`${progress}\n\n**Progreso:** ${timestamp.progress}%\n**Volumen:** ${queue.volume}%\n**URL:** ${track.url}\n**Agregada por:** ${track.requestedBy.tag}`)
            .setImage(track.thumbnail)
            .setTitle(filteredTitle + (!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ''))];
        reply.ephemeral = false;
        return reply;
    }
}
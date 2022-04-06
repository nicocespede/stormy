const { MessageEmbed } = require("discord.js");
const { isAMusicChannel, containsAuthor } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Muestra la canción actual en reproducción.',
    aliases: ['current'],

    slash: 'both',

    maxArgs: 0,
    guildOnly: true,

    callback: ({ guild, member, user, message, channel, client, interaction }) => {
        var errorEmbed = new MessageEmbed().setColor([195, 36, 255]);
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;
        if (!isAMusicChannel(channel.id)) {
            messageOrInteraction.reply({ content: `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, ephemeral: true });
            return;
        }
        if (!member.voice.channel) {
            messageOrInteraction.reply({
                embeds: [errorEmbed.setDescription("🛑 ¡Debes estar en un canal de voz para usar este comando!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            messageOrInteraction.reply({
                embeds: [errorEmbed.setDescription("🛑 No hay música reproduciéndose.")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }

        const track = queue.current;

        const progress = queue.createProgressBar();
        const timestamp = queue.getPlayerTimestamp();

        messageOrInteraction.reply({
            embeds: [new MessageEmbed()
                .setColor([195, 36, 255])
                .setDescription(`${progress}\n\n**Progreso:** ${timestamp.progress}%\n**Volumen:** ${queue.volume}%\n**URL:** ${track.url}\n**Agregada por:** ${track.requestedBy.tag}`)
                .setThumbnail(track.thumbnail)
                .setTitle(track.title + (!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ''))]
        });
        return;
    }
}
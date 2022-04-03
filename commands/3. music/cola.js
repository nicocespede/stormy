const { MessageEmbed, MessageAttachment } = require("discord.js");
const { isAMusicChannel } = require("../../app/music");

function containsAuthor(track) {
    const author = track.author.split(' ');
    var ret = false;
    for (let i = 0; i < author.length; i++) {
        const element = author[i];
        if (track.title.includes(element)) {
            ret = true;
            break;
        }
    }
    return ret;
}

module.exports = {
    category: 'Música',
    description: 'Muestra la cola de reproducción.',
    aliases: ['queue'],

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
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            messageOrInteraction.reply({
                embeds: [errorEmbed.setDescription("🛑 No hay música reproduciéndose.")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        if (!queue.tracks[0]) {
            messageOrInteraction.reply({
                embeds: [errorEmbed.setDescription("🛑 ¡No hay más canciones en la cola!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        const embed = new MessageEmbed();

        embed.setColor([195, 36, 255]);
        embed.setThumbnail(`attachment://icons8-playlist-64.png`);

        const tracks = queue.tracks.map((track, i) => {
            if (track.url.includes('youtube') && containsAuthor(track))
                `**${i + 1}**. ${track.title} - **${track.duration}**`;
            else
                `**${i + 1}**. ${track.title} | ${track.author} - **${track.duration}**`;
        });

        const songs = queue.tracks.length;

        var description = `**▶️ Ahora reproduciendo:**\n\n${queue.current.title} - **${queue.current.duration}**\n\n**📄 Cola de reproducción:**\n\n`
        var songsShown;
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            var aux = description + track + '\n';
            if (aux.length <= 4096)
                description = aux;
            else {
                songsShown = i - 1;
                break;
            }
        }

        embed.setDescription(description);

        embed.setFooter({ text: songs > songsShown ? `+otras ${songs - songsShown} canciones...` : `` });

        messageOrInteraction.reply({
            embeds: [embed],
            files: [new MessageAttachment(`./assets/thumbs/music/icons8-playlist-64.png`)]
        });
        return;
    }
}
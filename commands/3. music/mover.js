const { MessageEmbed, MessageAttachment } = require("discord.js");
const { updateLastAction, musicActions } = require("../../app/cache");
const { isAMusicChannel, containsAuthor } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Mueve una canción determinada de la cola de reproducción a la posición deseada.',
    aliases: ['move'],

    options: [
        {
            name: 'número',
            description: 'El número de la canción que se quiere mover.',
            required: true,
            type: 'NUMBER'
        },
        {
            name: 'posición',
            description: 'El número de la posición a la que se quiere mover la canción.',
            required: true,
            type: 'NUMBER'
        }
    ],
    slash: 'both',

    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '<número> <posición>',
    guildOnly: true,

    callback: ({ guild, member, user, message, channel, args, client, interaction }) => {
        var embed = new MessageEmbed().setColor([195, 36, 255]);
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;
        if (!isAMusicChannel(channel.id)) {
            messageOrInteraction.reply({ content: `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, ephemeral: true });
            return;
        }
        if (!member.voice.channel) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡Debes estar en un canal de voz para usar este comando!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }
        if (guild.me.voice.channel && member.voice.channel.id !== guild.me.voice.channel.id) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para usar este comando!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡No hay ninguna canción para mover!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        if (queue.tracks.length <= 1) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡No hay suficientes canciones en la cola para mover!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        const songIndex = parseInt(args[0] - 1);
        var positionIndex = parseInt(args[1] - 1);

        if (songIndex < 0 || songIndex >= queue.tracks.length || isNaN(songIndex)) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 El número de canción ingresado es inválido.")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        if (isNaN(positionIndex)) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 El número de posición ingresado es inválido.")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        var song = queue.remove(songIndex);
        if (positionIndex <= 0) {
            positionIndex = 0;
            var auxString = 'al principio';
        }
        else if (positionIndex >= queue.tracks.length - 1) {
            positionIndex = queue.tracks.length - 1;
            var auxString = 'al final';
        } else
            var auxString = `a la posición ${positionIndex + 1}`;
        updateLastAction(musicActions.moving);
        queue.insert(song, positionIndex);

        messageOrInteraction.reply({
            embeds: [embed.setDescription(`🔁 **${song.title}${!song.url.includes('youtube') || !containsAuthor(song) ? ` | ${song.author}` : ``}** movida ${auxString}.`)
                .setThumbnail(`attachment://icons8-repeat-64.png`)],
            files: [new MessageAttachment(`./assets/thumbs/music/icons8-repeat-64.png`)]
        });
        return;
    }
}
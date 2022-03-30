const { MessageEmbed, MessageAttachment } = require("discord.js");
const { isAMusicChannel } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Saltear hasta una canción determinada de la cola de reproducción.',
    aliases: ['saltear-hasta', 'saltar-hasta', 'skip-to'],

    options: [
        {
            name: 'número',
            description: 'El número de la canción a la que se quiere saltar.',
            required: true,
            type: 'NUMBER'
        }
    ],
    slash: 'both',

    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '<número>',
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
                embeds: [embed.setDescription("🛑 ¡No hay ninguna canción para saltear!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        const index = parseInt(args[0]) - 1;

        if (index < 1 || index >= queue.tracks.length || isNaN(index)) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription(`🛑 El número ingresado es inválido.`)
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        queue.jump(index);
        messageOrInteraction.reply({
            embeds: [embed.setDescription(`⏭️ **${index + 1} canciones** salteadas.`)
                .setThumbnail(`attachment://icons8-end-64.png`)],
            files: [new MessageAttachment(`./assets/thumbs/music/icons8-end-64.png`)]
        });
        return;
    }
}
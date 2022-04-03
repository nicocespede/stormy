const { MessageEmbed, MessageAttachment } = require("discord.js");
const { isAMusicChannel } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Baraja la cola de reproducción.',
    aliases: ['shuffle'],

    slash: 'both',

    maxArgs: 0,
    guildOnly: true,

    callback: ({ guild, member, user, message, channel, client, interaction }) => {
        var embed = new MessageEmbed().setColor([195, 36, 255]);
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;
        if (!isAMusicChannel(channel.id)) {
            messageOrInteraction.reply({ content: `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, ephemeral: true });
            return;
        }
        if (!member.voice.channel) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡Debes estar en un canal de voz para parar barajar!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }
        if (guild.me.voice.channel && member.voice.channel.id !== guild.me.voice.channel.id) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para parar barajar!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡No hay ninguna cola de reproducción para barajar!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        if (queue.tracks.length <= 1) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡No hay suficientes canciones en la cola para barajar!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        const success = queue.shuffle();

        messageOrInteraction.reply({
            embeds: [embed.setDescription(success ? "🔀 Cola de reproducción barajada." : `🛑 ¡Ocurrió un error!`)
                .setThumbnail(success ? `attachment://icons8-shuffle-64.png` : `attachment://icons8-no-entry-64.png`)],
            files: [new MessageAttachment(success ? `./assets/thumbs/music/icons8-shuffle-64.png` : `./assets/thumbs/music/icons8-no-entry-64.png`)]
        });
        return;
    }
}
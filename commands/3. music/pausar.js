const { MessageEmbed } = require("discord.js");
const { isAMusicChannel } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Pausa la reproducción.',
    aliases: ['pause'],

    slash: 'both',

    maxArgs: 0,
    guildOnly: true,

    callback: ({ guild, member, user, message, channel, client, interaction }) => {
        var embed = new MessageEmbed().setColor([195, 36, 255]);
        var messageOrInteraction = message ? message : interaction;
        if (!isAMusicChannel(channel.id)) {
            messageOrInteraction.reply({ content: `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, ephemeral: true });
            return;
        }
        if (!member.voice.channel) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡Debes estar en un canal de voz para pausar la música!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }
        if (guild.me.voice.channel && member.voice.channel.id !== guild.me.voice.channel.id) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para pausar la reproducción!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }

        const queue = client.player.getQueue(guild.id);


        if (!queue || !queue.playing) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡No hay ninguna canción para pausar!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }

        const success = queue.setPaused(true);

        messageOrInteraction.reply({
            embeds: [embed.setDescription(success ? "⏸ Música pausada." : `🛑 ¡La música ya está pausada!`)
                .setThumbnail(success ? `attachment://icons8-pause-button-64.png` : `attachment://icons8-no-entry-64.png`)],
            files: [success ? `./assets/thumbs/music/icons8-pause-button-64.png` : `./assets/thumbs/music/icons8-no-entry-64.png`]
        });
        return;
    }
}
const { MessageEmbed } = require("discord.js");
const { updateLastAction, musicActions } = require("../../app/cache");
const { isAMusicChannel } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Para la reproducción (hace que el bot se desconecte del canal).',
    aliases: ['stop'],

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
                embeds: [embed.setDescription("🛑 ¡Debes estar en un canal de voz para parar música!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }
        if (guild.me.voice.channel && member.voice.channel.id !== guild.me.voice.channel.id) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para parar la reproducción!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡No hay ninguna canción para parar!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }

        updateLastAction(musicActions.stopping);
        queue.destroy();

        messageOrInteraction.reply({
            embeds: [embed.setDescription("⏹️ Música parada, 👋 ¡adiós!")
                .setThumbnail(`attachment://icons8-stop-64.png`)],
            files: [`./assets/thumbs/music/icons8-stop-64.png`]
        });
        return;
    }
}
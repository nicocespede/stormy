const { MessageEmbed } = require("discord.js");
const { isAMusicChannel } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Limpia la cola de reproducción.',
    aliases: ['clear'],

    slash: 'both',

    maxArgs: 0,
    guildOnly: true,

    callback: async ({ guild, member, user, message, channel, client, interaction }) => {
        var errorEmbed = new MessageEmbed().setColor([195, 36, 255]);
        var messageOrInteraction = message ? message : interaction;
        if (!isAMusicChannel(channel.id)) {
            messageOrInteraction.reply({ content: `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, ephemeral: true });
            return;
        }
        if (!member.voice.channel) {
            messageOrInteraction.reply({
                embeds: [errorEmbed.setDescription("🛑 ¡Debes estar en un canal de voz para limpiar la cola!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }
        if (guild.me.voice.channel && member.voice.channel.id !== guild.me.voice.channel.id) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para limpiar la cola!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡No hay canciones en la cola!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }

        if (!queue.tracks[0]) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡No hay más canciones luego de la actual!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }

        await queue.clear();

        messageOrInteraction.reply({
            embeds: [new MessageEmbed()
                .setDescription(`❌ La cola de reproducción fue limpiada.`)
                .setColor([195, 36, 255])
                .setThumbnail(`attachment://icons8-delete-64.png`)],
            files: [`./assets/thumbs/music/icons8-delete-64.png`]
        });
        return;
    }
}
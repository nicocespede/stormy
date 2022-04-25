const { MessageEmbed } = require("discord.js");
const { ids } = require("../../app/constants");

module.exports = {
    category: 'Música',
    description: 'Saltea la canción actual.',
    aliases: ['saltear', 'siguiente', 'sig', 'next', 'skip'],

    slash: 'both',

    maxArgs: 0,
    guildOnly: true,

    callback: ({ guild, member, user, channel, client }) => {
        var embed = new MessageEmbed().setColor([195, 36, 255]);
        var reply = { custom: true, ephemeral: true, files: [`./assets/thumbs/music/icons8-no-entry-64.png`] };
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            reply.files = [];
            return reply;
        }

        if (!member.voice.channel) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en un canal de voz para saltear una canción!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        if (guild.me.voice.channel && member.voice.channel.id !== guild.me.voice.channel.id) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para saltear canciones!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay ninguna canción para saltear!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const success = queue.skip();

        reply.embeds = [embed.setDescription(success ? `⏭️ Canción salteada.` : `🛑 Ocurrió un error.`)
            .setThumbnail(success ? `attachment://icons8-end-64.png` : `attachment://icons8-no-entry-64.png`)];
        reply.ephemeral = false;
        reply.files = [success ? `./assets/thumbs/music/icons8-end-64.png` : `./assets/thumbs/music/icons8-no-entry-64.png`];
        return reply;
    }
}
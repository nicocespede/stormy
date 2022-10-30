const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getIds, updateIds } = require("../../src/cache");
const { githubRawURL } = require("../../src/constants");
const { handleErrorInMusicChannel } = require("../../src/music");

module.exports = {
    category: 'Música',
    description: 'Saltear hasta una canción determinada de la cola de reproducción.',
    aliases: ['saltear-hasta', 'saltar-hasta', 'skip-to'],

    options: [
        {
            name: 'número',
            description: 'El número de la canción a la que se quiere saltar.',
            required: true,
            type: ApplicationCommandOptionType.Integer
        }
    ],
    slash: 'both',

    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '<número>',
    guildOnly: true,

    callback: async ({ guild, member, user, message, channel, args, client, interaction, instance }) => {
        const embed = new EmbedBuilder().setColor(instance.color);
        const number = message ? args[0] : interaction.options.getInteger('número');
        const reply = { custom: true, ephemeral: true };

        const ids = getIds() || await updateIds();
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `🛑 Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            return reply;
        }

        if (!member.voice.channel) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en un canal de voz para usar este comando!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            handleErrorInMusicChannel(message, interaction, reply, channel);
            return;
        }

        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para usar este comando!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            handleErrorInMusicChannel(message, interaction, reply, channel);
            return;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay ninguna canción para saltear!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            handleErrorInMusicChannel(message, interaction, reply, channel);
            return;
        }

        const index = parseInt(number) - 1;

        if (index < 0 || index >= queue.tracks.length || isNaN(index)) {
            reply.embeds = [embed.setDescription(`🛑 El número ingresado es inválido.`)
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            handleErrorInMusicChannel(message, interaction, reply, channel);
            return;
        }

        queue.skipTo(index);
        reply.embeds = [embed.setDescription(`⏭️ **${index + 1} canciones** salteadas.`)
            .setThumbnail(`${githubRawURL}/assets/thumbs/music/end.png`)];
        reply.ephemeral = false;
        return reply;
    }
}
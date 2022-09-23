const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getIds, updateIds } = require("../../app/cache");

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

    callback: async ({ guild, member, user, message, channel, args, client, interaction }) => {
        const embed = new EmbedBuilder().setColor([195, 36, 255]);
        const number = message ? args[0] : interaction.options.getInteger('número');
        const reply = { custom: true, ephemeral: true, files: [`./assets/thumbs/music/icons8-no-entry-64.png`] };

        const ids = !getIds() ? await updateIds() : getIds();
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            reply.files = [];
            return reply;
        }

        if (!member.voice.channel) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en un canal de voz para usar este comando!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para usar este comando!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay ninguna canción para saltear!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const index = parseInt(number) - 1;

        if (index < 0 || index >= queue.tracks.length || isNaN(index)) {
            reply.embeds = [embed.setDescription(`🛑 El número ingresado es inválido.`)
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        queue.skipTo(index);
        reply.embeds = [embed.setDescription(`⏭️ **${index + 1} canciones** salteadas.`)
            .setThumbnail(`attachment://icons8-end-64.png`)];
        reply.ephemeral = false;
        reply.files = [`./assets/thumbs/music/icons8-end-64.png`];
        return reply;
    }
}
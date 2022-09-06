const { MessageEmbed, Constants } = require("discord.js");
const { updateLastAction } = require("../../app/cache");
const { ids, musicActions } = require("../../app/constants");
const { containsAuthor, cleanTitle } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Mueve una canción determinada de la cola de reproducción a la posición deseada.',
    aliases: ['move'],

    options: [
        {
            name: 'número',
            description: 'El número de la canción que se quiere mover.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.INTEGER
        },
        {
            name: 'posición',
            description: 'El número de la posición a la que se quiere mover la canción.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.INTEGER
        }
    ],
    slash: 'both',

    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '<número> <posición>',
    guildOnly: true,

    callback: async ({ guild, member, user, message, channel, args, client, interaction }) => {
        var embed = new MessageEmbed().setColor([195, 36, 255]);
        const number = message ? args[0] : interaction.options.getInteger('número');
        const position = message ? args[1] : interaction.options.getInteger('posición');
        var reply = { custom: true, ephemeral: true, files: [`./assets/thumbs/music/icons8-no-entry-64.png`] };
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

        if (guild.me.voice.channel && member.voice.channel.id !== guild.me.voice.channel.id) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para usar este comando!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay ninguna canción para mover!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        if (queue.tracks.length <= 1) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay suficientes canciones en la cola para mover!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const songIndex = parseInt(number - 1);

        if (songIndex < 0 || songIndex >= queue.tracks.length || isNaN(songIndex)) {
            reply.embeds = [embed.setDescription("🛑 El número de canción ingresado es inválido.")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        var positionIndex = parseInt(position - 1);

        if (isNaN(positionIndex)) {
            reply.embeds = [embed.setDescription("🛑 El número de posición ingresado es inválido.")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const song = queue.remove(songIndex);
        if (positionIndex <= 0) {
            positionIndex = 0;
            var auxString = 'al principio';
        } else if (positionIndex >= queue.tracks.length - 1) {
            positionIndex = queue.tracks.length - 1;
            var auxString = 'al final';
        } else
            var auxString = `a la posición ${positionIndex + 1}`;
        updateLastAction(musicActions.MOVING_SONG);
        queue.insert(song, positionIndex);

        const filteredTitle = await cleanTitle(song.title);
        reply.embeds = [embed.setDescription(`🔁 **${filteredTitle}${!song.url.includes('youtube') || !containsAuthor(song) ? ` | ${song.author}` : ``}** movida ${auxString}.`)
            .setThumbnail(`attachment://icons8-repeat-64.png`)];
        reply.ephemeral = false;
        reply.files = [`./assets/thumbs/music/icons8-repeat-64.png`];
        return reply;
    }
}
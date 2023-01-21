const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { updateLastAction, getIds, updateIds } = require("../../src/cache");
const { MusicActions, githubRawURL } = require("../../src/constants");
const { containsAuthor, cleanTitle, handleErrorInMusicChannel, setMusicPlayerMessage } = require("../../src/music");

module.exports = {
    category: 'Música',
    description: 'Mueve una canción determinada de la cola de reproducción a la posición deseada.',
    aliases: ['move'],

    options: [
        {
            name: 'número',
            description: 'El número de la canción que se quiere mover.',
            required: true,
            type: ApplicationCommandOptionType.Integer
        },
        {
            name: 'posición',
            description: 'El número de la posición a la que se quiere mover la canción.',
            required: true,
            type: ApplicationCommandOptionType.Integer
        }
    ],
    slash: 'both',

    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '<número> <posición>',
    guildOnly: true,

    callback: async ({ guild, member, user, message, channel, args, client, interaction, instance }) => {
        const embed = new EmbedBuilder().setColor(instance.color);
        const number = message ? args[0] : interaction.options.getInteger('número');
        const position = message ? args[1] : interaction.options.getInteger('posición');
        const reply = { ephemeral: true, fetchReply: true };

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
            reply.embeds = [embed.setDescription("🛑 ¡No hay ninguna canción para mover!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            handleErrorInMusicChannel(message, interaction, reply, channel);
            return;
        }

        if (queue.tracks.length <= 1) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay suficientes canciones en la cola para mover!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            handleErrorInMusicChannel(message, interaction, reply, channel);
            return;
        }

        const songIndex = parseInt(number - 1);

        if (songIndex < 0 || songIndex >= queue.tracks.length || isNaN(songIndex)) {
            reply.embeds = [embed.setDescription("🛑 El número de canción ingresado es inválido.")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            handleErrorInMusicChannel(message, interaction, reply, channel);
            return;
        }

        let positionIndex = parseInt(position - 1);

        if (isNaN(positionIndex)) {
            reply.embeds = [embed.setDescription("🛑 El número de posición ingresado es inválido.")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            handleErrorInMusicChannel(message, interaction, reply, channel);
            return;
        }

        const song = queue.remove(songIndex);
        let auxString;
        if (positionIndex <= 0) {
            positionIndex = 0;
            auxString = 'al principio';
        } else if (positionIndex >= queue.tracks.length - 1) {
            positionIndex = queue.tracks.length - 1;
            auxString = 'al final';
        } else
            auxString = `a la posición ${positionIndex + 1}`;
        updateLastAction(MusicActions.MOVING_SONG);
        queue.insert(song, positionIndex);

        const filteredTitle = await cleanTitle(song.title);
        reply.embeds = [embed.setDescription(`🔁 **${filteredTitle}${!song.url.includes('youtube') || !containsAuthor(song) ? ` | ${song.author}` : ``}** movida ${auxString}.`)
            .setThumbnail(`${githubRawURL}/assets/thumbs/music/sorting-arrows.png`)];
        reply.ephemeral = false;
        const replyMessage = message ? await message.reply(reply) : await interaction.reply(reply);
        updateLastAction(MusicActions.MOVING_SONG);
        setMusicPlayerMessage(queue, queue.current, `🔁 ${user.tag} movió una canción de la cola.`);

        setTimeout(async () => {
            if (message) message.delete();
            replyMessage.delete();
        }, 1000 * 30);
    }
}
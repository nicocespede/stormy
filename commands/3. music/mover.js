const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { updateLastAction, getIds, getGithubRawUrl } = require("../../src/cache");
const { MusicActions } = require("../../src/constants");
const { getUserTag } = require("../../src/util");
const { containsAuthor, cleanTitle, setMusicPlayerMessage, handleErrorEphemeral } = require("../../src/music");
const { useMasterPlayer } = require("discord-player");

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

    callback: async ({ guild, member, user, message, channel, args, interaction, instance }) => {
        const embed = new EmbedBuilder().setColor(instance.color);
        const number = message ? args[0] : interaction.options.getInteger('número');
        const position = message ? args[1] : interaction.options.getInteger('posición');
        const reply = { ephemeral: true, fetchReply: true };

        const ids = await getIds();
        if (!ids.channels.musica.includes(channel.id)) {
            handleErrorEphemeral(reply, embed, `🛑 Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, message, interaction, channel);
            return;
        }

        if (!member.voice.channel) {
            handleErrorEphemeral(reply, embed, "🛑 ¡Debes estar en un canal de voz para usar este comando!", message, interaction, channel);
            return;
        }

        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            handleErrorEphemeral(reply, embed, "🛑 ¡Debes estar en el mismo canal de voz que yo para usar este comando!", message, interaction, channel);
            return;
        }

        const player = useMasterPlayer();
        const queue = player.nodes.get(guild.id);

        if (!queue || !queue.node.isPlaying()) {
            handleErrorEphemeral(reply, embed, "🛑 ¡No hay ninguna canción para mover!", message, interaction, channel);
            return;
        }

        if (queue.getSize() <= 1) {
            handleErrorEphemeral(reply, embed, "🛑 ¡No hay suficientes canciones en la cola para mover!", message, interaction, channel);
            return;
        }

        const songIndex = parseInt(number - 1);

        if (songIndex < 0 || songIndex >= queue.getSize() || isNaN(songIndex)) {
            handleErrorEphemeral(reply, embed, "🛑 El número de canción ingresado es inválido.", message, interaction, channel);
            return;
        }

        let positionIndex = parseInt(position - 1);

        if (isNaN(positionIndex)) {
            handleErrorEphemeral(reply, embed, "🛑 El número de posición ingresado es inválido.", message, interaction, channel);
            return;
        }

        const song = queue.node.remove(songIndex);
        let auxString;
        if (positionIndex <= 0) {
            positionIndex = 0;
            auxString = 'al principio';
        } else if (positionIndex >= queue.getSize() - 1) {
            positionIndex = queue.getSize() - 1;
            auxString = 'al final';
        } else
            auxString = `a la posición ${positionIndex + 1}`;
        updateLastAction(MusicActions.MOVING_SONG);
        queue.insertTrack(song, positionIndex);

        const filteredTitle = await cleanTitle(song.title);
        reply.embeds = [embed.setDescription(`🔁 **${filteredTitle}${!song.url.includes('youtube') || !containsAuthor(song) ? ` | ${song.author}` : ``}** movida ${auxString}.`)
            .setThumbnail(await getGithubRawUrl(`assets/thumbs/music/sorting-arrows.png`))];
        reply.ephemeral = false;
        const replyMessage = message ? await message.reply(reply) : await interaction.reply(reply);
        updateLastAction(MusicActions.MOVING_SONG);
        setMusicPlayerMessage(queue, queue.currentTrack, `🔁 ${getUserTag(user)} movió una canción de la cola.`);

        setTimeout(async () => {
            if (message) message.delete();
            replyMessage.delete();
        }, 1000 * 30);
    }
}
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getIds, updateLastAction } = require("../../src/cache");
const { GITHUB_RAW_URL, MusicActions } = require("../../src/constants");
const { containsAuthor, cleanTitle, setMusicPlayerMessage, handleErrorEphemeral } = require("../../src/music");
const { useMasterPlayer } = require("discord-player");

const orderArgs = array => {
    const uniqueArray = array.filter((item, pos, self) => self.indexOf(item) == pos)
    return uniqueArray.sort((a, b) => a - b).reverse();
}

const validateArgs = (array, queueLength) => {
    let ret = true;
    for (let i = 0; i < array.length; i++) {
        array[i] = array[i] - 1;
        const parsed = parseInt(array[i]);
        if (parsed < 0 || parsed >= queueLength || isNaN(parsed)) {
            ret = false;
            break;
        } else
            array[i] = parsed;
    }
    return ret;
}

module.exports = {
    category: 'Música',
    description: 'Quita una o más canciones de la cola de reproducción.',
    aliases: ['remover', 'remove'],

    options: [
        {
            name: 'números',
            description: 'Los números de las canciones que se quieren quitar.',
            required: true,
            type: ApplicationCommandOptionType.String
        }
    ],
    slash: 'both',

    minArgs: 1,
    expectedArgs: '<números>',
    guildOnly: true,

    callback: async ({ guild, member, user, message, channel, args, interaction, instance }) => {
        const embed = new EmbedBuilder().setColor(instance.color);
        const numbers = message ? args : interaction.options.getString('números').split(' ');
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
            handleErrorEphemeral(reply, embed, "🛑 ¡No hay canciones en la cola!", message, interaction, channel);
            return;
        }

        if (!validateArgs(numbers, queue.getSize())) {
            handleErrorEphemeral(reply, embed, "🛑 Alguno de los números ingresados es inválido.", message, interaction, channel);
            return;
        }

        const ordered = orderArgs(numbers);
        const description = [];
        for (let i = 0; i < ordered.length; i++) {
            const track = queue.removeTrack(ordered[i]);
            const filteredTitle = await cleanTitle(track.title);
            description.push(`[${filteredTitle}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**\n`);
        }

        reply.embeds = [embed.setDescription('❌ Se quitó de la cola de reproducción:\n\n' + description.reverse().join(''))
            .setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/music/delete.png`)];
        reply.ephemeral = false;
        const replyMessage = message ? await message.reply(reply) : await interaction.reply(reply);
        updateLastAction(MusicActions.REMOVING);
        setMusicPlayerMessage(queue, queue.currentTrack, `❌ ${user.tag} quitó **${ordered.length} ${ordered.length > 1 ? 'canciones' : 'canción'}** de la cola.`);

        setTimeout(async () => {
            if (message) message.delete();
            replyMessage.delete();
        }, 1000 * 30);
    }
}
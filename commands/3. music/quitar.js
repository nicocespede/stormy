const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getIds, updateIds } = require("../../app/cache");
const { githubRawURL } = require("../../app/constants");
const { containsAuthor, cleanTitle, handleErrorInMusicChannel } = require("../../app/music");

function orderArgs(array) {
    var uniqueArray = array.filter(function (item, pos, self) {
        return self.indexOf(item) == pos;
    })
    return uniqueArray.sort(function (a, b) {
        return a - b;
    }).reverse();
}

function validateArgs(array, queueLength) {
    var ret = true;
    for (let i = 0; i < array.length; i++) {
        array[i] = array[i] - 1;
        var parsed = parseInt(array[i]);
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

    callback: async ({ guild, member, user, message, channel, args, client, interaction, instance }) => {
        const embed = new EmbedBuilder().setColor(instance.color);
        const numbers = message ? args : interaction.options.getString('números').split(' ');
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
            reply.embeds = [embed.setDescription("🛑 ¡No hay canciones en la cola!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            handleErrorInMusicChannel(message, interaction, reply, channel);
            return;
        }

        if (!validateArgs(numbers, queue.tracks.length)) {
            reply.embeds = [embed.setDescription("🛑 Alguno de los números ingresados es inválido.")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            handleErrorInMusicChannel(message, interaction, reply, channel);
            return;
        }

        const ordered = orderArgs(numbers);
        const description = [];
        for (let i = 0; i < ordered.length; i++) {
            const track = queue.remove(ordered[i]);
            const filteredTitle = await cleanTitle(track.title);
            description.push(`[${filteredTitle}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**\n`);
        }

        reply.embeds = [embed.setDescription('❌ Se quitó de la cola de reproducción:\n\n' + description.reverse().join(''))
            .setThumbnail(`${githubRawURL}/assets/thumbs/music/delete.png`)];
        reply.ephemeral = false;
        return reply;
    }
}
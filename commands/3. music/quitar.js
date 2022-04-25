const { MessageEmbed, Constants } = require("discord.js");
const { ids } = require("../../app/constants");
const { containsAuthor } = require("../../app/music");

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
            type: Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    slash: 'both',

    minArgs: 1,
    expectedArgs: '<números>',
    guildOnly: true,

    callback: ({ guild, member, user, message, channel, args, client, interaction }) => {
        var embed = new MessageEmbed().setColor([195, 36, 255]);
        const numbers = message ? args : interaction.options.getString('números').split(' ');
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
            reply.embeds = [embed.setDescription("🛑 ¡No hay canciones en la cola!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        if (!validateArgs(numbers, queue.tracks.length)) {
            reply.embeds = [embed.setDescription("🛑 Alguno de los números ingresados es inválido.")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const ordered = orderArgs(numbers);
        var description = [];
        for (let i = 0; i < ordered.length; i++) {
            const track = queue.remove(ordered[i]);
            description.push(`[${track.title}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**\n`);
        }

        reply.embeds = [embed.setDescription('❌ Se quitó de la cola de reproducción:\n\n' + description.reverse().join(''))
            .setThumbnail(`attachment://icons8-delete-64.png`)];
        reply.ephemeral = false;
        reply.files = [`./assets/thumbs/music/icons8-delete-64.png`];
        return reply;
    }
}
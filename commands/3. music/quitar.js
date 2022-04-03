const { MessageEmbed, MessageAttachment } = require("discord.js");
const { isAMusicChannel, containsAuthor } = require("../../app/music");

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
            type: 'STRING'
        }
    ],
    slash: 'both',

    minArgs: 1,
    expectedArgs: '<números>',
    guildOnly: true,

    callback: ({ guild, member, user, message, channel, args, client, interaction }) => {
        var embed = new MessageEmbed().setColor([195, 36, 255]);
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;
        if (!isAMusicChannel(channel.id)) {
            messageOrInteraction.reply({ content: `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, ephemeral: true });
            return;
        }
        if (!member.voice.channel) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡Debes estar en un canal de voz para usar este comando!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }
        if (guild.me.voice.channel && member.voice.channel.id !== guild.me.voice.channel.id) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para usar este comando!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 ¡No hay canciones en la cola!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        if (!validateArgs(args, queue.tracks.length)) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription("🛑 Alguno de los números ingresados es inválido.")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-entry-64.png`)],
                ephemeral: true
            });
            return;
        }

        var ordered = orderArgs(args);
        var description = [];
        for (let i = 0; i < ordered.length; i++) {
            const track = queue.remove(ordered[i]);
                description.push(`[${track.title}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**\n`);
        }

        messageOrInteraction.reply({
            embeds: [embed.setDescription('❌ Se quitó de la cola de reproducción:\n\n' + description.reverse().join(''))
                .setThumbnail(`attachment://icons8-delete-64.png`)],
            files: [new MessageAttachment(`./assets/thumbs/music/icons8-delete-64.png`)]
        });
        return;
    }
}
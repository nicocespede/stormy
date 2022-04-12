const { MessageEmbed, Util, Constants } = require('discord.js');
const { prefix } = require('../../app/cache');
const { isAMusicChannel, containsAuthor } = require("../../app/music");
const Genius = require("genius-lyrics");
const Client = new Genius.Client();

module.exports = {
    category: 'Música',
    description: 'Muestra la letra de la canción actual o la de la canción ingresada.',
    aliases: ['lyrics'],
    options: [
        {
            name: 'canción',
            description: 'El nombre de la canción de la que se quiere la letra.',
            required: false,
            type: Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    slash: 'both',

    expectedArgs: '[canción]',
    guildOnly: true,

    callback: async ({ guild, user, message, channel, args, client, interaction, text }) => {
        var embed = new MessageEmbed().setColor([195, 36, 255]);
        var messageOrInteraction = message ? message : interaction;
        if (!isAMusicChannel(channel.id)) {
            messageOrInteraction.reply({ content: `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, ephemeral: true });
            return;
        }

        if (!args[0]) {
            const queue = client.player.getQueue(guild.id);

            if (!queue || !queue.playing) {
                messageOrInteraction.reply({
                    embeds: [embed.setDescription(`🛑 ¡No hay ninguna canción de la cual mostrar la letra! Podés usar el comando ${prefix}letra seguido del nombre de la canción que buscás.`)
                        .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                    files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                    ephemeral: true
                });
                return;
            }

            const searches = await Client.songs.search(queue.current.title + (!queue.current.url.includes('youtube') || !containsAuthor(queue.current) ? ` - ${queue.current.author}` : ``));
            const firstSong = searches[0];
            var lyrics = await firstSong.lyrics();
            lyrics = lyrics.replace(/[[]/g, '**[');
            lyrics = lyrics.replace(/[\]]/g, ']**');
            var messages = Util.splitMessage(lyrics);
            await messageOrInteraction.reply({ content: messages[0], ephemeral: true });
            messages.slice(1).forEach(async element => {
                await channel.send({
                    content: element,
                    ephemeral: true
                });
            });
            return;
        } else {
            const searches = await Client.songs.search(text);
            const firstSong = searches[0];
            var lyrics = await firstSong.lyrics();
            lyrics = lyrics.replace(/[[]/g, '**[');
            lyrics = lyrics.replace(/[\]]/g, ']**');
            var messages = Util.splitMessage(lyrics);
            await messageOrInteraction.reply({ content: messages[0], ephemeral: true });
            messages.slice(1).forEach(async element => {
                await channel.send({
                    content: element,
                    ephemeral: true
                });
            });
        }
        return;
    }
}
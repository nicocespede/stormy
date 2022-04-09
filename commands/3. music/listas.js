const { MessageEmbed } = require('discord.js');
const { isAMusicChannel } = require('../../app/music');
const { prefix, getPlaylists, updatePlaylists } = require('../../app/cache');

module.exports = {
    category: 'Música',
    description: 'Responde con las listas de reproducción guardadas.',
    aliases: ['playlists', 'pls'],

    maxArgs: 0,
    slash: 'both',

    callback: async ({ user, message, channel, interaction }) => {
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;

        if (!isAMusicChannel(channel.id)) {
            messageOrInteraction.reply({ content: `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, ephemeral: true });
            return;
        }

        var playlists = getPlaylists();
        if (playlists.names === []) playlists = await updatePlaylists();
        var description = `Hola <@${user.id}>, para reproducir una lista de reproducción utiliza el comando \`${prefix}play\` seguido del nombre de la lista.\n\nLas listas de reproducción guardadas son:\n\n`;
        for (var i = 0; i < playlists.names.length; i++)
            description += `**${i + 1}.** ${playlists.names[i]} - ${playlists.urls[i]}\n\n`;

        messageOrInteraction.reply({
            embeds: [new MessageEmbed()
                .setTitle(`**Listas de reproducción**`)
                .setDescription(description)
                .setColor([195, 36, 255])
                .setThumbnail(`attachment://icons8-playlist-64.png`)],
            files: ['./assets/thumbs/music/icons8-playlist-64.png'],
            ephemeral: true
        });
        return;
    }
}
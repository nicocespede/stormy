const { MessageEmbed } = require('discord.js');
const { getPlaylists, updatePlaylists } = require('../../app/cache');
const { prefix, ids } = require('../../app/constants');

module.exports = {
    category: 'Música',
    description: 'Responde con las listas de reproducción guardadas.',
    aliases: ['playlists', 'pls'],

    maxArgs: 0,
    slash: 'both',

    callback: async ({ user, channel }) => {
        var reply = { custom: true, ephemeral: true };

        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            return reply;
        }

        const playlists = getPlaylists().names.length === 0 ? await updatePlaylists() : getPlaylists();
        var description = `Hola <@${user.id}>, para reproducir una lista de reproducción utiliza el comando \`${prefix}play\` seguido del nombre de la lista.\n\nLas listas de reproducción guardadas son:\n\n`;
        for (var i = 0; i < playlists.names.length; i++)
            description += `**${i + 1}.** ${playlists.names[i]} - ${playlists.urls[i]}\n\n`;

        reply.embeds = [new MessageEmbed()
            .setTitle(`**Listas de reproducción**`)
            .setDescription(description)
            .setColor([195, 36, 255])
            .setThumbnail(`attachment://icons8-playlist-64.png`)];
        reply.files = ['./assets/thumbs/music/icons8-playlist-64.png'];
        return reply;
    }
}
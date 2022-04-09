const { Constants } = require('discord.js');
const { getPlaylists, prefix, updatePlaylists } = require('../../app/cache');
const { isAMusicChannel } = require('../../app/music');
const { addPlaylist } = require('../../app/postgres');

module.exports = {
    category: 'Música',
    description: 'Guarda una lista de reproducción.',
    aliases: ['agregar-pl', 'agregar-playlist'],

    minArgs: 2,
    expectedArgs: '<nombre> <url>',
    slash: 'both',
    options: [
        {
            name: 'nombre',
            description: 'El nombre que tendrá la lista de reproducción.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.STRING
        },
        {
            name: 'url',
            description: 'La URL de la lista de reproducción.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    guildOnly: true,

    callback: async ({ channel, message, args, interaction, user }) => {
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;

        if (!isAMusicChannel(channel.id)) {
            messageOrInteraction.reply({ content: `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, ephemeral: true });
            return;
        }

        var playlists = getPlaylists().names === [] ? await updatePlaylists() : getPlaylists();
        var url = args.pop();
        var name = args.join(' ').toLowerCase();
        if (!url.includes('http') || !url.includes('www')) {
            messageOrInteraction.reply({ content: `¡Uso incorrecto! La URL es inválida. Usá **"${prefix}agregar-lista <nombre> <url>"**.`, ephemeral: true });
            return;
        } else if (playlists.names.includes(name)) {
            messageOrInteraction.reply({ content: `Ya hay una lista de reproducción guardada con ese nombre.`, ephemeral: true });
            return;
        } else
            addPlaylist([name, url]).then(async () => {
                await updatePlaylists();
                messageOrInteraction.reply({ content: `Se agregó la lista de reproducción **${name}**.` });
            }).catch(console.error);
        return;
    }
}
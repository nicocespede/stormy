const { Constants } = require('discord.js');
const { getPlaylists, updatePlaylists } = require('../../app/cache');
const { prefix, ids } = require('../../app/constants');
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
        const url = message ? args.pop() : interaction.options.getString('url');
        const argsName = message ? args.join(' ') : interaction.options.getString('nombre');
        var reply = { custom: true, ephemeral: true };

        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            return reply;
        }

        const playlists = getPlaylists().names.length === 0 ? await updatePlaylists() : getPlaylists();
        const name = argsName.toLowerCase();
        if (!url.includes('http') || !url.includes('www'))
            reply.content = `¡Uso incorrecto! La URL es inválida. Usá **"${prefix}agregar-lista <nombre> <url>"**.`;
        else if (playlists.names.includes(name))
            reply.content = `Ya hay una lista de reproducción guardada con ese nombre.`;
        else
            await addPlaylist([name, url]).then(async () => {
                await updatePlaylists();
                reply.content = `Se agregó la lista de reproducción **${name}**.`;
                reply.ephemeral = false;
            }).catch(console.error);
        return reply;
    }
}
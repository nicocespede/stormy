const { Constants } = require('discord.js');
const { getPlaylists, updatePlaylists } = require('../../app/cache');
const { ids } = require('../../app/constants');
const { deletePlaylist } = require('../../app/postgres');

module.exports = {
    category: 'Música',
    description: 'Borra una lista de reproducción guardada.',
    aliases: ['borrar-pl', 'eliminar-lista', 'eliminar-playlist', 'eliminar-pl'],

    minArgs: 1,
    expectedArgs: '<nombre>',
    slash: 'both',
    options: [
        {
            name: 'nombre',
            description: 'El nombre de la lista de reproducción que se quiere borrar.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    guildOnly: true,

    callback: async ({ channel, message, args, interaction, user }) => {
        const argsName = message ? args.join(' ') : interaction.options.getString('nombre');
        var reply = { custom: true, ephemeral: true };

        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            return reply;
        }

        const playlists = getPlaylists().names.length === 0 ? await updatePlaylists() : getPlaylists();
        const name = argsName.toLowerCase();
        if (!playlists.names.includes(name))
            reply.content = `La lista que intentás borrar no existe.`;
        else
            await deletePlaylist(name).then(async () => {
                await updatePlaylists();
                reply.content = `La lista de reproducción fue borrada de manera exitosa.`;
                reply.ephemeral = false;
            }).catch(console.error);
        return reply;
    }
}
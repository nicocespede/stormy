const { getPlaylists, updatePlaylists } = require('../../app/cache');
const { isAMusicChannel } = require('../../app/music');
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
            type: 'STRING'
        }
    ],
    guildOnly: true,

    callback: ({ channel, message, args, interaction, user }) => {
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;

        if (!isAMusicChannel(channel.id)) {
            messageOrInteraction.reply({ content: `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, ephemeral: true });
            return;
        }

        var playlists = getPlaylists();
        var name = args.join(' ').toLowerCase();
        if (!playlists.names.includes(name)) {
            messageOrInteraction.reply({ content: `La lista que intentás borrar no existe.`, ephemeral: true });
            return;
        } else
            deletePlaylist(name).then(async () => {
                await updatePlaylists();
                messageOrInteraction.reply({ content: `La lista de reproducción fue borrada de manera exitosa.` });
            }).catch(console.error);
        return;
    }
}
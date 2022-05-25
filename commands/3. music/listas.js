const { MessageEmbed, Constants } = require('discord.js');
const { getPlaylists, updatePlaylists } = require('../../app/cache');
const { prefix, ids } = require('../../app/constants');
const { addPlaylist, deletePlaylist } = require('../../app/postgres');

module.exports = {
    category: 'Música',
    description: 'Guarda listas de reproducción.',
    aliases: ['playlists', 'pls'],

    options: [{
        name: 'ver',
        description: 'Responde con las listas de reproducción guardadas.',
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
    }, {
        name: 'agregar',
        description: 'Guarda una lista de reproducción.',
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
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
        ]
    }, {
        name: 'borrar',
        description: 'Borra una lista de reproducción guardada.',
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'nombre',
                description: 'El nombre de la lista de reproducción que se quiere borrar.',
                required: true,
                type: Constants.ApplicationCommandOptionTypes.STRING
            }
        ]
    }],
    minArgs: 1,
    expectedArgs: '<subcomando>',
    slash: 'both',

    callback: async ({ user, channel, message, interaction, args }) => {
        const subCommand = message ? args.shift() : interaction.options.getSubcommand();
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });

        var reply = { ephemeral: true };

        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }

        if (subCommand === 'ver') {
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
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        } else if (subCommand === 'agregar') {
            const url = message ? args.pop() : interaction.options.getString('url');
            const argsName = message ? args.join(' ') : interaction.options.getString('nombre');

            if (!argsName) {
                reply.content = `¡Uso incorrecto! Debés introducir un nombre para la lista. Usá **"${prefix}listas agregar <nombre> <url>"**.`;
                message ? deferringMessage.edit(reply) : interaction.editReply(reply);
                return;
            }

            const playlists = getPlaylists().names.length === 0 ? await updatePlaylists() : getPlaylists();
            const name = argsName.toLowerCase();
            if (!url || !url.includes('http') || !url.includes('www'))
                reply.content = `¡Uso incorrecto! Debés introducir una URL válida. Usá **"${prefix}listas agregar <nombre> <url>"**.`;
            else if (playlists.names.includes(name))
                reply.content = `Ya hay una lista de reproducción guardada con ese nombre.`;
            else
                await addPlaylist([name, url]).then(async () => {
                    await updatePlaylists();
                    reply.content = `Se agregó la lista de reproducción **${name}**.`;
                    reply.ephemeral = false;
                }).catch(console.error);
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        } else if (subCommand === 'borrar' || subCommand === 'eliminar') {
            const argsName = message ? args.join(' ') : interaction.options.getString('nombre');

            if (!argsName) {
                reply.content = `¡Uso incorrecto! Debés introducir el nombre de la lista. Usá **"${prefix}listas borrar <nombre> <url>"**.`;
                message ? deferringMessage.edit(reply) : interaction.editReply(reply);
                return;
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
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        } else {
            reply.content = 'Comando inválido, los comandos válidos son: _ver, agregar, borrar, eliminar_';
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }
    }
}
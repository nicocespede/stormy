const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { getPlaylists, updatePlaylists, getIds, updateIds } = require('../../app/cache');
const { prefix } = require('../../app/constants');
const { addPlaylist, deletePlaylist } = require('../../app/mongodb');

module.exports = {
    category: 'Música',
    description: 'Guarda listas de reproducción.',
    aliases: ['playlists', 'pls'],

    options: [{
        name: 'ver',
        description: 'Responde con las listas de reproducción guardadas.',
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: 'agregar',
        description: 'Guarda una lista de reproducción.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            {
                name: 'nombre',
                description: 'El nombre que tendrá la lista de reproducción.',
                required: true,
                type: ApplicationCommandOptionType.String
            },
            {
                name: 'url',
                description: 'La URL de la lista de reproducción.',
                required: true,
                type: ApplicationCommandOptionType.String
            }
        ]
    }, {
        name: 'borrar',
        description: 'Borra una lista de reproducción guardada.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            {
                name: 'nombre',
                description: 'El nombre de la lista de reproducción que se quiere borrar.',
                required: true,
                type: ApplicationCommandOptionType.String
            }
        ]
    }],
    minArgs: 1,
    expectedArgs: '<subcomando>',
    slash: 'both',

    callback: async ({ user, channel, message, interaction, args, instance, guild }) => {
        const subCommand = message ? args.shift() : interaction.options.getSubcommand();
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });

        const reply = { ephemeral: true };

        const ids = getIds() || await updateIds();
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }

        if (subCommand === 'ver') {
            const playlists = getPlaylists() || await updatePlaylists();
            let description = `Hola <@${user.id}>, para reproducir una lista de reproducción utiliza el comando \`${prefix}play\` seguido del nombre de la lista.\n\nLas listas de reproducción guardadas son:\n\n`;
            let i = 1;
            for (const name in playlists)
                if (Object.hasOwnProperty.call(playlists, name))
                    description += `**${i++}.** ${name} - ${playlists[name]}\n\n`;

            reply.embeds = [new EmbedBuilder()
                .setTitle(`**Listas de reproducción**`)
                .setDescription(description + `${Object.keys(playlists).length === 0 ? '_No hay ninguna lista de reproducción guardada aún._' : ''}`)
                .setColor([195, 36, 255])
                .setThumbnail(`attachment://icons8-playlist-64.png`)];
            reply.files = ['./assets/thumbs/music/icons8-playlist-64.png'];
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        } else if (subCommand === 'agregar') {
            const url = message ? args.pop() : interaction.options.getString('url');
            const argsName = message ? args.join(' ') : interaction.options.getString('nombre');

            if (!argsName) {
                reply.content = instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                    REASON: "Debés introducir un nombre para la lista.",
                    PREFIX: prefix,
                    COMMAND: "listas agregar",
                    ARGUMENTS: "`<nombre>` `<url>`"
                });
                message ? deferringMessage.edit(reply) : interaction.editReply(reply);
                return;
            }

            const playlists = getPlaylists() || await updatePlaylists();
            const name = argsName.toLowerCase();
            if (!url || !url.includes('http') || !url.includes('www'))
                reply.content = instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                    REASON: "Debés introducir una URL válida.",
                    PREFIX: prefix,
                    COMMAND: "listas agregar",
                    ARGUMENTS: "`<nombre>` `<url>`"
                });
            else if (Object.keys(playlists).includes(name))
                reply.content = `Ya hay una lista de reproducción guardada con ese nombre.`;
            else
                await addPlaylist(name, url).then(async () => {
                    await updatePlaylists();
                    reply.content = `Se agregó la lista de reproducción **${name}**.`;
                    reply.ephemeral = false;
                }).catch(console.error);
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        } else if (subCommand === 'borrar' || subCommand === 'eliminar') {
            const argsName = message ? args.join(' ') : interaction.options.getString('nombre');

            if (!argsName) {
                reply.content = instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                    REASON: "Debés introducir un nombre para la lista.",
                    PREFIX: prefix,
                    COMMAND: "listas borrar",
                    ARGUMENTS: "`<nombre>`"
                });
                message ? deferringMessage.edit(reply) : interaction.editReply(reply);
                return;
            }

            const playlists = getPlaylists() || await updatePlaylists();
            const name = argsName.toLowerCase();
            if (!Object.keys(playlists).includes(name))
                reply.content = `⚠ La lista que intentás borrar no existe.`;
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
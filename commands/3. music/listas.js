const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { getPlaylists, updatePlaylists, getIds, updateIds } = require('../../src/cache');
const { PREFIX, GITHUB_RAW_URL } = require('../../src/constants');
const { addPlaylist, deletePlaylist } = require('../../src/mongodb');
const { handleErrorEphemeral } = require('../../src/music');

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
        const reply = { ephemeral: true };

        const ids = getIds() || await updateIds();
        if (!ids.channels.musica.includes(channel.id)) {
            handleErrorEphemeral(reply, new EmbedBuilder().setColor(instance.color), `🛑 Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, message, interaction, channel);
            return;
        }

        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });

        if (subCommand === 'ver') {
            const playlists = getPlaylists() || await updatePlaylists();
            const embed = new EmbedBuilder()
                .setTitle(`**Listas de reproducción**`)
                .setColor(instance.color)
                .setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/music/playlist.png`);

            if (Object.keys(playlists).length === 0) {
                embed.setDescription('_No hay ninguna lista de reproducción guardada aún._');
                reply.embeds = [embed];
                message ? deferringMessage.edit(reply) : interaction.editReply(reply);
                return;
            }

            const fields = [];

            const ownedPlaylists = Object.entries(playlists).filter(([_, playlist]) => playlist.ownerId === user.id);
            if (ownedPlaylists.length > 0) {
                let ownedField = { name: 'Tus listas de reproducción', value: '' };
                let i = 0;
                for (const [name, playlist] of ownedPlaylists) {
                    i++;
                    const { url } = playlist;
                    const aux = ownedField.value + `**${i}.** [${name}](${url})\n\n`;
                    if (aux.length <= 1024) {
                        ownedField.value += `**${i}.** [${name}](${url})\n\n`;
                        continue;
                    }

                    fields.push(ownedField);
                    ownedField = { name: `\u200b`, value: `**${i}.** [${name}](${url})\n\n` };
                }
                fields.push(ownedField);
            }

            const othersPlaylists = Object.entries(playlists).filter(([_, playlist]) => playlist.ownerId !== user.id);
            if (othersPlaylists.length > 0) {
                let othersField = { name: 'Otras listas de reproducción', value: '', inline: true };
                let ownersField = { name: 'Agregada por', value: '', inline: true };
                const membersIds = othersPlaylists.map(([_, playlist]) => playlist.ownerId);
                const members = await guild.members.fetch(membersIds);
                let i = 0;
                for (const [name, playlist] of othersPlaylists) {
                    i++;
                    const { url, ownerId } = playlist;
                    const member = members.get(ownerId);
                    const aux = othersField.value + `**${i}.** [${name}](${url})\n\n`;
                    if (aux.length <= 1024) {
                        othersField.value += `**${i}.** [${name}](${url})\n\n`;
                        ownersField.value += `${member ? member.user.tag : 'Desconocido'}\n\n`;
                        continue;
                    }

                    fields.push(othersField);
                    fields.push(ownersField);
                    fields.push({ name: `\u200b`, value: '\u200b', inline: true });
                    othersField = { name: '\u200b', value: `**${i}.** [${name}](${url})\n\n`, inline: true };
                    ownersField = { name: '\u200b', value: `${member ? member.user.tag : 'Desconocido'}\n\n`, inline: true };

                }
                fields.push(othersField);
                fields.push(ownersField);
                fields.push({ name: `\u200b`, value: '\u200b', inline: true });
            }

            embed.setFields(fields)
                .setDescription(`Hola <@${user.id}>, para reproducir una lista de reproducción utiliza el comando \`${PREFIX}play\` seguido del nombre de la lista.\n\n`);
            reply.content = null;
            reply.embeds = [embed];
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }

        if (subCommand === 'agregar') {
            const url = message ? args.pop() : interaction.options.getString('url');
            const argsName = message ? args.join(' ') : interaction.options.getString('nombre');

            if (!argsName) {
                reply.content = instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                    REASON: "Debés introducir un nombre para la lista.",
                    PREFIX: PREFIX,
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
                    PREFIX: PREFIX,
                    COMMAND: "listas agregar",
                    ARGUMENTS: "`<nombre>` `<url>`"
                });
            else if (Object.keys(playlists).includes(name))
                reply.content = `⚠ Ya hay una lista de reproducción guardada con ese nombre.`;
            else {
                await addPlaylist(name, url, user.id).catch(console.error);
                await updatePlaylists();
                reply.content = `✅ Se agregó la lista de reproducción **${name}**.`;
                reply.ephemeral = false;
            }
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }

        if (subCommand === 'borrar' || subCommand === 'eliminar') {
            const argsName = message ? args.join(' ') : interaction.options.getString('nombre');

            if (!argsName) {
                reply.content = instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                    REASON: "Debés introducir un nombre para la lista.",
                    PREFIX: PREFIX,
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
            else if (playlists[name].ownerId !== user.id)
                reply.content = `⚠ No podés borrar una lista de otra persona.`;
            else {
                await deletePlaylist(name).catch(console.error);
                await updatePlaylists();
                reply.content = `✅ La lista de reproducción fue borrada de manera exitosa.`;
                reply.ephemeral = false;
            }
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }

        reply.content = 'Comando inválido, los comandos válidos son: _ver, agregar, borrar, eliminar_';
        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
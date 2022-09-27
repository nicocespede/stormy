const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const chalk = require("chalk");
chalk.level = 1;
const HenrikDevValorantAPI = require("unofficial-valorant-api");
const ValorantAPI = new HenrikDevValorantAPI();
const { getCrosshairs, updateCrosshairs } = require('../../app/cache');
const { prefix, githubRawURL } = require('../../app/constants');
const { addCrosshair, deleteCrosshair } = require('../../app/mongodb');

module.exports = {
    category: 'Juegos/Películas',
    description: 'Guarda miras de Valorant.',
    aliases: ['crosshairs'],

    options: [{
        name: 'listar',
        description: 'Responde con la lista de las miras guardadas.',
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: 'agregar',
        description: 'Guarda una mira de Valorant.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: 'nombre',
            description: 'El nombre de la mira.',
            required: true,
            type: ApplicationCommandOptionType.String
        }, {
            name: 'codigo',
            description: 'El código de la mira.',
            required: true,
            type: ApplicationCommandOptionType.String
        }]
    }, {
        name: 'borrar',
        description: 'Elimina una mira de Valorant.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: 'id',
            description: 'El ID de la mira que se quiere borrar.',
            required: true,
            type: ApplicationCommandOptionType.Integer
        }]
    }, {
        name: 'ver',
        description: 'Muestra una mira de Valorant.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: 'id',
            description: 'El ID de la mira que se quiere ver.',
            required: true,
            type: ApplicationCommandOptionType.Integer
        }]
    }],
    minArgs: 1,
    expectedArgs: '<subcomando>',
    slash: 'both',

    callback: async ({ user, message, interaction, args, instance, guild }) => {
        const subCommand = message ? args.shift() : interaction.options.getSubcommand();
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });

        const reply = { ephemeral: false };

        if (subCommand === 'listar') {
            const crosshairs = !getCrosshairs() ? await updateCrosshairs() : getCrosshairs();
            const userCrosshairsField = { name: 'Tus miras', value: '', inline: false };
            const crosshairsField = { name: 'Otras miras', value: '', inline: false };
            for (const ch in crosshairs)
                if (Object.hasOwnProperty.call(crosshairs, ch)) {
                    const crosshair = crosshairs[ch];
                    if (crosshair.owner === user.id)
                        userCrosshairsField.value += `**${ch}.** ${crosshair.name}\n`;
                    else
                        crosshairsField.value += `**${ch}.** ${crosshair.name}\n`;
                }
            if (userCrosshairsField.value === '') userCrosshairsField.value = 'No hay miras guardadas.';
            if (crosshairsField.value === '') crosshairsField.value = 'No hay miras guardadas.';

            if (message) reply.content = null;
            reply.embeds = [new EmbedBuilder()
                .setTitle(`**Miras**`)
                .setDescription(`Hola <@${user.id}>, para ver una mira utiliza el comando \`${prefix}ver-mira\` seguido del ID de la mira.\n\nLas miras guardadas son:\n\n`)
                .setFields([userCrosshairsField, crosshairsField])
                .setColor([255, 81, 82])
                .setThumbnail(`attachment://valorant-logo.png`)];
            reply.files = [`${githubRawURL}/assets/thumbs/games/valorant-logo.png`];
            reply.ephemeral = true;
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        } else if (subCommand === 'agregar') {
            const code = message ? args.pop() : interaction.options.getString('codigo');
            const name = message ? args.join(' ') : interaction.options.getString('nombre');

            if (!name || !code) {
                reply.content = instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                    REASON: `Debés introducir un nombre y un código para la mira.`,
                    PREFIX: prefix,
                    COMMAND: "miras agregar",
                    ARGUMENTS: "`<nombre>` `<codigo>`"
                });
                message ? deferringMessage.edit(reply) : interaction.editReply(reply);
                return;
            }

            await addCrosshair(name, code, user.id).then(async () => {
                reply.content = `✅ Se agregó la mira **${name}**.`;
            }).catch(error => {
                console.log(chalk.red(error));
                reply.content = `❌ Lo siento, se produjo un error al agregar la mira.`;
            });

            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            await new Promise(res => setTimeout(res, 1000 * 2));
            await updateCrosshairs();
            return;
        } else if (subCommand === 'borrar' || subCommand === 'eliminar') {
            const id = message ? parseInt(args[0]) : interaction.options.getInteger('id');

            if (!id) {
                reply.content = instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                    REASON: "Debés introducir el ID de la mira.",
                    PREFIX: prefix,
                    COMMAND: "miras borrar",
                    ARGUMENTS: "`<id>`"
                });
                message ? deferringMessage.edit(reply) : interaction.editReply(reply);
                return;
            }

            const crosshairs = !getCrosshairs() ? await updateCrosshairs() : getCrosshairs();
            if (!Object.keys(crosshairs).includes(id.toString()))
                reply.content = `⚠ La mira que intentás borrar no existe.`;
            else if (user.id != crosshairs[id].owner)
                reply.content = `⚠ Lo siento, no podés borrar una mira de otro usuario.`;
            else
                await deleteCrosshair(id).then(async () => {
                    await updateCrosshairs();
                    reply.content = `✅ La mira **${crosshairs[id].name}** fue borrada de manera exitosa.`;
                }).catch(error => {
                    console.log(chalk.red(error));
                    reply.content = `❌ Lo siento, se produjo un error al borrar la mira.`;
                });
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        } else if (subCommand === 'ver') {
            const crosshairs = !getCrosshairs() ? await updateCrosshairs() : getCrosshairs();
            const id = message ? parseInt(args[0]) : interaction.options.getInteger('id');

            if (!id) {
                reply.content = instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                    REASON: "Debés introducir el ID de la mira.",
                    PREFIX: prefix,
                    COMMAND: "miras ver",
                    ARGUMENTS: "`<id>`"
                });
                message ? deferringMessage.edit(reply) : interaction.editReply(reply);
                return;
            }

            if (isNaN(id) || !Object.keys(crosshairs).includes(id.toString())) {
                reply.content = `⚠ El ID es inválido.`;
                message ? deferringMessage.edit(reply) : interaction.editReply(reply);
                return;
            } else {
                const selectedCrosshair = crosshairs[id];
                let owner = '';
                await guild.members.fetch(selectedCrosshair.owner).then(member => owner = ` de ${member.user.username}`).catch(_ => owner = ` de usuario desconocido`);
                const crosshairData = await ValorantAPI.getCrosshair({ code: selectedCrosshair.code }).catch(console.error);

                if (message) reply.content = null;
                reply.embeds = [new EmbedBuilder()
                    .setTitle(selectedCrosshair.name + owner)
                    .setDescription(`Código de importación de la mira:\n\n` + selectedCrosshair.code)
                    .setColor([255, 81, 82])
                    .setImage(crosshairData.url)
                    .setThumbnail(`attachment://valorant-logo.png`)];
                reply.files = [`${githubRawURL}/assets/thumbs/games/valorant-logo.png`];
                reply.ephemeral = true;
                message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            }
            return;
        } else {
            reply.content = 'Comando inválido, los comandos válidos son: _listar, agregar, borrar, eliminar, ver_';
            reply.ephemeral = true;
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }
    }
}
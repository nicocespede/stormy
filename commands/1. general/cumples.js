const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ApplicationCommandOptionType, ButtonStyle } = require('discord.js');
const { getBirthdays, updateBirthdays, getGithubRawUrl } = require('../../src/cache');
const { PREFIX, CONSOLE_YELLOW } = require('../../src/constants');
const { addBirthday, deleteBirthday } = require('../../src/mongodb');
const { consoleLog, getUserTag } = require('../../src/util');

const validateDate = (instance, guild, date) => {
    const ret = {
        valid: false,
        reason: instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
            REASON: "Debe haber una fecha luego de la mención.",
            PREFIX: PREFIX,
            COMMAND: "cumples agregar",
            ARGUMENTS: "`<@amigo>` `<DD/MM>`"
        })
    };
    if (!date) return ret;
    ret.reason = 'La fecha debe estar en el formato DD/MM.';
    if (date.length !== 5) return ret;
    if (date.substring(2, 3) !== '/') return ret;
    const split = date.split('/');
    const day = parseInt(split[0]);
    const month = parseInt(split[1]);
    if (isNaN(day) || isNaN(month)) return ret;
    ret.reason = 'La fecha es inválida.';
    if (day < 1 || day > 31 || month < 1 || month > 12) return ret;
    const thirtyDaysMonths = [4, 6, 9, 11];
    if (month === 2 && day > 29) return ret;
    else if (thirtyDaysMonths.includes(month) && day > 30) return ret;
    ret.valid = true;
    return ret;
}

module.exports = {
    category: 'General',
    description: 'Guarda cumpleaños de usuarios.',
    aliases: ['cumpleaños'],

    options: [{
        name: 'ver',
        description: 'Responde con la lista de cumpleaños almacenados.',
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: 'agregar',
        description: 'Guarda el cumpleaños de un amigo.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            {
                name: 'amigo',
                description: 'La mención del cumpleañero.',
                required: true,
                type: ApplicationCommandOptionType.User
            },
            {
                name: 'fecha',
                description: 'La fecha (DD/MM) del cumpleaños.',
                required: true,
                type: ApplicationCommandOptionType.String
            }
        ]
    }, {
        name: 'borrar',
        description: 'Borra el cumpleaños de un amigo.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            {
                name: 'amigo',
                description: 'La mención del cumpleañero.',
                required: true,
                type: ApplicationCommandOptionType.User
            }
        ]
    }],
    minArgs: 1,
    maxArgs: 3,
    expectedArgs: '<subcomando>',
    slash: 'both',
    guildOnly: true,

    callback: async ({ guild, user, channel, message, interaction, args, instance }) => {
        const subCommand = message ? args.shift() : interaction.options.getSubcommand();

        if (subCommand === 'ver') {
            const birthdays = getBirthdays() || await updateBirthdays();
            const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            let description = `Hola <@${user.id}>, los cumpleaños registrados son:\n\n`;
            let fields = [];

            if (Object.keys(birthdays).length === 0)
                description += '_No hay cumpleaños guardados actualmente._';
            else {
                const usersField = { name: 'Usuario', value: '', inline: true };
                const datesField = { name: 'Fecha', value: '', inline: true };
                let previousMonth = -1;
                const members = await guild.members.fetch(Object.keys(birthdays)).catch(console.error);

                for (const key in birthdays) if (Object.hasOwnProperty.call(birthdays, key)) {
                    const { date, user: username } = birthdays[key];
                    const member = members.get(key);

                    if (!member) {
                        consoleLog(`> El usuario ${username} ya no está en el servidor.`, CONSOLE_YELLOW);
                        continue;
                    }

                    const month = date.getMonth();
                    if (previousMonth !== month) {
                        usersField.value += `\n**${months[month]}**\n`;
                        datesField.value += `\n\u200b\n`;
                    }
                    usersField.value += `${member.user.username}\n`;
                    const dateInt = date.getDate();
                    const monthInt = month + 1;
                    datesField.value += `${dateInt < 10 ? `0${dateInt}` : dateInt}/${monthInt < 10 ? `0${monthInt}` : monthInt}\n`;
                    previousMonth = month;
                }

                fields = [usersField, datesField];
            }

            return {
                custom: true,
                embeds: [new EmbedBuilder()
                    .setTitle(`**Cumpleaños**`)
                    .setDescription(description)
                    .setColor(instance.color)
                    .addFields(fields)
                    .setThumbnail(await getGithubRawUrl('assets/thumbs/birthday.png'))],
                ephemeral: true
            };
        }

        if (subCommand === 'agregar') {
            const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
            if (!target)
                return {
                    content: instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                        REASON: "Debe haber una mención luego del comando.",
                        PREFIX: PREFIX,
                        COMMAND: "cumples agregar",
                        ARGUMENTS: "`<@amigo>` `<DD/MM>`"
                    }),
                    custom: true,
                    ephemeral: true
                }

            const date = message ? args[1] : interaction.options.getString('fecha');
            const birthdays = getBirthdays() || await updateBirthdays();

            const validDate = validateDate(instance, guild, date);
            if (!validDate.valid)
                return { content: validDate.reason, custom: true, ephemeral: true };

            if (Object.keys(birthdays).includes(target.user.id))
                return { content: `⚠ Este usuario ya tiene registrado su cumpleaños.`, custom: true, ephemeral: true };

            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder().setCustomId('add_yes')
                    .setEmoji('✔️')
                    .setLabel('Confirmar')
                    .setStyle(ButtonStyle.Success))
                .addComponents(new ButtonBuilder().setCustomId('add_no')
                    .setEmoji('❌')
                    .setLabel('Cancelar')
                    .setStyle(ButtonStyle.Danger));
            const messageOrInteraction = message ? message : interaction;
            const reply = await messageOrInteraction.reply({
                components: [row],
                content: `⚠ ¿Estás seguro de querer agregar el cumpleaños de **${getUserTag(target.user)}** en la fecha **${date}**?\n\u200b`,
                ephemeral: true
            });

            const filter = btnInt => user.id === btnInt.user.id;

            const collector = channel.createMessageComponentCollector({ filter, max: 1, time: 1000 * 15 });

            collector.on('end', async collection => {
                const edit = { components: [] };
                if (!collection.first())
                    edit.content = '⌛ La acción expiró.';
                else if (collection.first().customId === 'add_no')
                    edit.content = '❌ La acción fue cancelada.';
                else {
                    const splittedDate = date.split('/');
                    const today = new Date();
                    let realDate = new Date(`${today.getFullYear()}-${splittedDate[1]}-${splittedDate[0]}T03:00Z`);
                    if (today > realDate && (today.getDate() !== realDate.getDate() || today.getMonth() !== realDate.getMonth()))
                        realDate.setFullYear(realDate.getFullYear() + 1);
                    await addBirthday(target.user.id, target.user.username, realDate).catch(console.error);
                    edit.content = '✅ La acción fue completada.';
                    channel.send({ content: `✅ Se agregó el cumpleaños de **${getUserTag(target.user)}** en la fecha ${date}.` });
                    await updateBirthdays();
                }
                message ? await reply.edit(edit) : await interaction.editReply(edit);
            });
            return;
        }

        if (subCommand === 'borrar' || subCommand === 'eliminar') {
            const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
            const birthdays = getBirthdays() || await updateBirthdays();
            if (!target)
                return {
                    content: instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                        REASON: "Debe haber una mención luego del comando.",
                        PREFIX: PREFIX,
                        COMMAND: "cumples borrar",
                        ARGUMENTS: "`<@amigo>`"
                    }),
                    custom: true,
                    ephemeral: true
                };
            else if (!Object.keys(birthdays).includes(target.user.id))
                return { content: `⚠ El cumpleaños que intentás borrar no existe.`, custom: true, ephemeral: true };
            else {
                const row = new ActionRowBuilder()
                    .addComponents(new ButtonBuilder().setCustomId('delete_yes')
                        .setEmoji('✔️')
                        .setLabel('Confirmar')
                        .setStyle(ButtonStyle.Success))
                    .addComponents(new ButtonBuilder().setCustomId('delete_no')
                        .setEmoji('❌')
                        .setLabel('Cancelar')
                        .setStyle(ButtonStyle.Danger));

                const messageOrInteraction = message ? message : interaction;
                const reply = await messageOrInteraction.reply({
                    components: [row],
                    content: `⚠ ¿Estás seguro de querer borrar el cumpleaños de **${getUserTag(target.user)}**?`,
                    ephemeral: true
                });

                const filter = (btnInt) => {
                    return user.id === btnInt.user.id;
                }

                const collector = channel.createMessageComponentCollector({ filter, max: 1, time: 1000 * 15 });

                collector.on('end', async collection => {
                    const edit = { components: [] };
                    if (!collection.first())
                        edit.content = '⌛ La acción expiró.';
                    else if (collection.first().customId === 'delete_yes')
                        await deleteBirthday(target.user.id).then(async () => {
                            edit.content = '✅ La acción fue completada.';
                            channel.send({ content: `✅ El cumpleaños fue borrado de manera exitosa.` });
                            updateBirthdays();
                        }).catch(console.error);
                    else
                        edit.content = '❌ La acción fue cancelada.';
                    message ? await reply.edit(edit) : await interaction.editReply(edit);
                });
            }
            return;
        }

        return {
            content: '⚠ Comando inválido, los comandos válidos son: _ver, agregar, borrar, eliminar_',
            custom: true
        };
    }
}
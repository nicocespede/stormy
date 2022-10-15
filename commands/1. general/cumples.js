const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ApplicationCommandOptionType, ButtonStyle } = require('discord.js');
const { getBirthdays, updateBirthdays } = require('../../app/cache');
const { prefix, githubRawURL } = require('../../app/constants');
const { addBirthday, deleteBirthday } = require('../../app/mongodb');

const validateDate = (instance, guild, date) => {
    var ret = {
        valid: false,
        reason: instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
            REASON: "Debe haber una fecha luego de la mención.",
            PREFIX: prefix,
            COMMAND: "cumples agregar",
            ARGUMENTS: "`<@amigo>` `<DD/MM>`"
        })
    };
    if (!date) return ret;
    ret.reason = 'La fecha debe estar en el formato DD/MM.';
    if (date.length != 5) return ret;
    if (date.substring(2, 3) != '/') return ret;
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
                    const bday = birthdays[key];
                    const member = members.get(key);

                    if (!member) {
                        console.log(chalk.yellow(`> El usuario con ID ${key} ya no está en el servidor.`));
                        continue;
                    }

                    const month = parseInt(bday.month) - 1;
                    if (previousMonth != month) {
                        usersField.value += `\n**${months[month]}**\n`;
                        datesField.value += `\n\u200b\n`;
                    }
                    usersField.value += `${member.user.username}\n`;
                    datesField.value += `${bday.day}/${bday.month}\n`;
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
                    .setThumbnail(`${githubRawURL}/assets/thumbs/birthday.png`)],
                ephemeral: true
            };
        } else if (subCommand === 'agregar') {
            const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
            const date = message ? args[1] : interaction.options.getString('fecha');
            const birthdays = getBirthdays() || await updateBirthdays();
            if (!target)
                return {
                    content: instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                        REASON: "Debe haber una mención luego del comando.",
                        PREFIX: prefix,
                        COMMAND: "cumples agregar",
                        ARGUMENTS: "`<@amigo>` `<DD/MM>`"
                    }),
                    custom: true,
                    ephemeral: true
                }
            else {
                const validDate = validateDate(instance, guild, date);
                if (!validDate.valid)
                    return { content: validDate.reason, custom: true, ephemeral: true }
                else if (Object.keys(birthdays).includes(target.user.id))
                    return { content: `⚠ Este usuario ya tiene registrado su cumpleaños.`, custom: true, ephemeral: true }
                else {
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
                        content: `⚠ ¿Estás seguro de querer agregar el cumpleaños de **${target.user.tag}** en la fecha **${date}**?`,
                        ephemeral: true
                    });

                    const filter = (btnInt) => {
                        return user.id === btnInt.user.id;
                    }

                    const collector = channel.createMessageComponentCollector({ filter, max: 1, time: 1000 * 15 });

                    collector.on('end', async collection => {
                        var edit = { components: [] };
                        if (!collection.first())
                            edit.content = '⌛ La acción expiró.';
                        else if (collection.first().customId === 'add_yes') {
                            await addBirthday(target.user.id, target.user.username, date.split('/')[0], date.split('/')[1]).then(async () => {
                                edit.content = '✅ La acción fue completada.';
                                channel.send({ content: `Se agregó el cumpleaños de **${target.user.tag}** en la fecha ${date}.` });
                                await updateBirthdays();
                            }).catch(console.error);
                        } else
                            edit.content = '❌ La acción fue cancelada.';
                        message ? await reply.edit(edit) : await interaction.editReply(edit);
                    });
                }
            }
            return;
        } else if (subCommand === 'borrar' || subCommand === 'eliminar') {
            const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
            const birthdays = getBirthdays() || await updateBirthdays();
            if (!target)
                return {
                    content: instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                        REASON: "Debe haber una mención luego del comando.",
                        PREFIX: prefix,
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
                    content: `⚠ ¿Estás seguro de querer borrar el cumpleaños de **${target.user.tag}**?`,
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
                            channel.send({ content: `El cumpleaños fue borrado de manera exitosa.` });
                            updateBirthdays();
                        }).catch(console.error);
                    else
                        edit.content = '❌ La acción fue cancelada.';
                    message ? await reply.edit(edit) : await interaction.editReply(edit);
                });
            }
            return;
        } else
            return {
                content: '⚠ Comando inválido, los comandos válidos son: _ver, agregar, borrar, eliminar_',
                custom: true
            };
    }
}
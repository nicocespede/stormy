const { MessageEmbed, MessageButton, MessageActionRow, Constants } = require('discord.js');
const { getBirthdays, updateBirthdays } = require('../../app/cache');
const { addBday, deleteBday } = require('../../app/postgres');
const { prefix } = require('../../app/constants');
const { sendBdayAlert } = require('../../app/general');

const validateDate = (date) => {
    var ret = { valid: false, reason: `¡Uso incorrecto! Debe haber una mención luego del comando. Usá **"${prefix}cumples agregar <@amigo> <DD/MM>"**.` };
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
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
    }, {
        name: 'agregar',
        description: 'Guarda el cumpleaños de un amigo.',
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'amigo',
                description: 'La mención del cumpleañero.',
                required: true,
                type: Constants.ApplicationCommandOptionTypes.USER
            },
            {
                name: 'fecha',
                description: 'La fecha (DD/MM) del cumpleaños.',
                required: true,
                type: Constants.ApplicationCommandOptionTypes.STRING
            }
        ]
    }, {
        name: 'borrar',
        description: 'Borra el cumpleaños de un amigo.',
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'amigo',
                description: 'La mención del cumpleañero.',
                required: true,
                type: Constants.ApplicationCommandOptionTypes.USER
            }
        ]
    }],
    minArgs: 1,
    maxArgs: 3,
    expectedArgs: '<subcomando>',
    slash: 'both',
    guildOnly: true,

    callback: async ({ guild, user, channel, message, interaction, args, client }) => {
        const subCommand = message ? args.shift() : interaction.options.getSubcommand();

        if (subCommand === 'ver') {
            const birthdays = !getBirthdays() ? await updateBirthdays() : getBirthdays();
            var months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            var usersField = { name: 'Usuario', value: '', inline: true };
            var datesField = { name: 'Fecha', value: '', inline: true };
            var previousMonth = -1;
            for (const key in birthdays)
                if (Object.hasOwnProperty.call(birthdays, key)) {
                    const bday = birthdays[key];
                    await guild.members.fetch(key).then(member => {
                        const month = parseInt(bday.date.substring(3, 5)) - 1;
                        if (previousMonth != month) {
                            usersField.value += `\n**${months[month]}**\n`;
                            datesField.value += `\n\u200b\n`;
                        }
                        usersField.value += `${member.user.username}\n`;
                        datesField.value += `${bday.date}\n`;
                        previousMonth = month;
                    }).catch(() => deleteBday(key).then(async () => {
                        await updateBirthdays();
                        channel.send(`Se eliminó el cumpleaños de **${bday.user}** (el **${bday.date}**) ya que el usuario no está más en el servidor.`);
                    }).catch(console.error));
                }

            return {
                custom: true,
                embeds: [new MessageEmbed()
                    .setTitle(`**Cumpleaños**`)
                    .setDescription(`Hola <@${user.id}>, los cumpleaños registrados son:\n\n`)
                    .setColor([237, 0, 0])
                    .addFields([usersField, datesField])
                    .setThumbnail(`attachment://bday.png`)],
                ephemeral: true,
                files: [`./assets/thumbs/bday.png`]
            };
        } else if (subCommand === 'agregar') {
            const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
            const date = message ? args[1] : interaction.options.getString('fecha');
            const birthdays = !getBirthdays() ? await updateBirthdays() : getBirthdays();
            if (!target)
                return { content: `¡Uso incorrecto! Debe haber una mención luego del comando. Usá **"${prefix}cumples agregar <@amigo> <DD/MM>"**.`, custom: true, ephemeral: true }
            else if (!validateDate(date).valid)
                return { content: validateDate(date).reason, custom: true, ephemeral: true }
            else if (Object.keys(birthdays).includes(target.user.id))
                return { content: `Este usuario ya tiene registrado su cumpleaños.`, custom: true, ephemeral: true }
            else {
                const row = new MessageActionRow()
                    .addComponents(new MessageButton().setCustomId('add_yes')
                        .setEmoji('✔️')
                        .setLabel('Confirmar')
                        .setStyle('SUCCESS'))
                    .addComponents(new MessageButton().setCustomId('add_no')
                        .setEmoji('❌')
                        .setLabel('Cancelar')
                        .setStyle('DANGER'));
                const messageOrInteraction = message ? message : interaction;
                const reply = await messageOrInteraction.reply({
                    components: [row],
                    content: `¿Estás seguro de querer agregar el cumpleaños de **${target.user.tag}** en la fecha **${date}**?`,
                    ephemeral: true
                });

                const filter = (btnInt) => {
                    return user.id === btnInt.user.id;
                }

                const collector = channel.createMessageComponentCollector({ filter, max: 1, time: 1000 * 15 });

                collector.on('end', async collection => {
                    var edit = { components: [] };
                    if (!collection.first())
                        edit.content = 'La acción expiró.';
                    else if (collection.first().customId === 'add_yes') {
                        const newArray = [target.user.id, target.user.username, date, false];
                        await addBday(newArray).then(async () => {
                            edit.content = 'La acción fue completada.';
                            channel.send({ content: `Se agregó el cumpleaños de **${target.user.tag}** en la fecha ${date}.` });
                            await updateBirthdays();
                            sendBdayAlert(client);
                        }).catch(console.error);
                    } else
                        edit.content = 'La acción fue cancelada.';
                    message ? await reply.edit(edit) : await interaction.editReply(edit);
                });
            }
            return;
        } else if (subCommand === 'borrar' || subCommand === 'eliminar') {
            const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
            const birthdays = !getBirthdays() ? await updateBirthdays() : getBirthdays();
            if (!target)
                return { content: `¡Uso incorrecto! Debe haber una mención luego del comando. Usá **"${prefix}cumples borrar <@amigo>"**.`, custom: true, ephemeral: true };
            else if (!Object.keys(birthdays).includes(target.user.id))
                return { content: `El cumpleaños que intentás borrar no existe.`, custom: true, ephemeral: true };
            else {
                const row = new MessageActionRow()
                    .addComponents(new MessageButton().setCustomId('delete_yes')
                        .setEmoji('✔️')
                        .setLabel('Confirmar')
                        .setStyle('SUCCESS'))
                    .addComponents(new MessageButton().setCustomId('delete_no')
                        .setEmoji('❌')
                        .setLabel('Cancelar')
                        .setStyle('DANGER'));

                const messageOrInteraction = message ? message : interaction;
                const reply = await messageOrInteraction.reply({
                    components: [row],
                    content: `¿Estás seguro de querer borrar el cumpleaños de **${target.user.tag}**?`,
                    ephemeral: true
                });

                const filter = (btnInt) => {
                    return user.id === btnInt.user.id;
                }

                const collector = channel.createMessageComponentCollector({ filter, max: 1, time: 1000 * 15 });

                collector.on('end', async collection => {
                    var edit = { components: [] };
                    if (!collection.first())
                        edit.content = 'La acción expiró.';
                    else if (collection.first().customId === 'delete_yes')
                        await deleteBday(target.user.id).then(async () => {
                            edit.content = 'La acción fue completada.';
                            channel.send({ content: `El cumpleaños fue borrado de manera exitosa.` });
                            updateBirthdays();
                        }).catch(console.error);
                    else
                        edit.content = 'La acción fue cancelada.';
                    message ? await reply.edit(edit) : await interaction.editReply(edit);
                });
            }
            return;
        } else
            return {
                content: 'Comando inválido, los comandos válidos son: _ver, agregar, borrar, eliminar_',
                custom: true
            };
    }
}
const { getBirthdays, updateBirthdays } = require('../../app/cache');
const { addBday } = require('../../app/postgres');
const { sendBdayAlert, isListed } = require('../../app/general');
const { MessageActionRow, MessageButton, Constants } = require('discord.js');
const { prefix } = require('../../app/constants');

const validateDate = (date) => {
    var ret = { valid: false, reason: 'La fecha debe estar en el formato DD/MM.' };
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
    description: 'Guarda el cumpleaños de un amigo.',
    aliases: ['agregar-cumpleaños'],

    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '<@amigo> <DD/MM>',
    slash: 'both',
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
    ],
    guildOnly: true,

    callback: async ({ message, args, interaction, client, channel, user }) => {
        const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
        const date = message ? args[1] : interaction.options.getString('fecha');
        var birthdays = !getBirthdays() ? await updateBirthdays() : getBirthdays();
        if (!target)
            return { content: `¡Uso incorrecto! Debe haber una mención luego del comando. Usá **"${prefix}agregar-cumple <@amigo> <DD/MM>"**.`, custom: true, ephemeral: true }
        else if (!validateDate(date).valid)
            return { content: validateDate(date).reason, custom: true, ephemeral: true }
        else if (isListed(target.user.id, birthdays, 'bdays_id'))
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
                        updateBirthdays();
                        sendBdayAlert(client);
                    }).catch(console.error);
                } else
                    edit.content = 'La acción fue cancelada.';
                message ? await reply.edit(edit) : await interaction.editReply(edit);
            });
        }
        return;
    }
}
const { getThermalPasteDates, updateThermalPasteDates } = require('../../src/cache');
const { convertTZ } = require('../../src/util');
const { ActionRowBuilder, ButtonBuilder, ApplicationCommandOptionType, ButtonStyle } = require('discord.js');
const { prefix } = require('../../src/constants');
const { addThermalPasteDate, updateThermalPasteDate } = require('../../src/mongodb');

const validateDate = date => {
    const today = convertTZ(new Date());
    var ret = { valid: false, reason: 'La fecha debe estar en el formato DD/MM/AAAA.' };
    if (date.length !== 10) return ret;
    if (date.substring(2, 3) !== '/' || date.substring(5, 6) !== '/') return ret;
    const split = date.split('/');
    const day = parseInt(split[0]);
    const month = parseInt(split[1]);
    const year = parseInt(split[2]);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return ret;
    ret.reason = 'La fecha es inválida.';
    if (day < 1 || day > 31 || month < 1 || month > 12) return ret;
    const thirtyDaysMonths = [4, 6, 9, 11];
    if (month === 2 && day > 29) return ret;
    else if (thirtyDaysMonths.includes(month) && day > 30) return ret;
    if (convertTZ(`${month}/${day}/${year}`) > today) return ret;
    ret.valid = true;
    return ret;
};

const timeToString = (years, weeks, days) => {
    var ret = '';
    if (years !== 0)
        ret += years + ` año${years > 1 ? 's' : ''}`;
    if (weeks !== 0)
        ret += (ret !== '' ? ', ' : '') + weeks + ` semana${weeks > 1 ? 's' : ''}`;
    if (days !== 0)
        ret += (ret !== '' ? ', ' : '') + days + ` día${days > 1 ? 's' : ''}`;
    return ret;
};

const secondsToFull = (seconds) => {
    // calculate (and subtract) whole years
    var years = Math.floor(seconds / 31557600);
    seconds -= years * 31557600;
    // calculate (and subtract) whole weeks
    var weeks = Math.floor(seconds / 604800) % 52.17857;
    seconds -= weeks * 604800;
    // calculate (and subtract) whole days
    var days = Math.floor(seconds / 86400) % 7;
    return { years, weeks, days };
};

module.exports = {
    category: 'General',
    description: 'Recuerda o guarda/modifica la última fecha en que el usuario cambió su pasta térmica.',
    aliases: ['pasta-térmica'],

    minArgs: 0,
    maxArgs: 1,
    expectedArgs: '<DD/MM/AAAA>',
    slash: 'both',
    options: [
        {
            name: 'fecha',
            description: 'La fecha (DD/MM/AAAA) en que se cambió la pasta por última vez.',
            required: false,
            type: ApplicationCommandOptionType.String
        }
    ],

    callback: async ({ message, args, interaction, channel, user }) => {
        const reply = { custom: true, ephemeral: true };
        const date = message ? args[0] : interaction.options.getString('fecha');

        if (!date) {
            const dates = getThermalPasteDates() || await updateThermalPasteDates();
            const userDate = dates[user.id];
            if (!dates[user.id])
                reply.content = `Hola <@${user.id}>, no tenés registrada la última vez que cambiaste la pasta térmica, usá **"${prefix}pasta-termica <DD/MM/AAAA>"** para hacerlo.`;
            else {
                const totalTime = Math.abs(new Date() - userDate) / 1000;
                const { years, weeks, days } = secondsToFull(totalTime);
                reply.content = `Hola <@${user.id}>, la última vez que cambiaste la pasta térmica fue hace **${timeToString(years, weeks, days)}** (**${convertTZ(userDate).toLocaleDateString('es-AR')}**).`;
            }
            return reply;
        }

        if (!validateDate(date).valid) {
            reply.content = validateDate(date).reason;
            return reply;
        }

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
        const replyMessage = await messageOrInteraction.reply({
            components: [row],
            content: `¿Estás seguro de querer guardar la fecha **${date}** cómo tu último cambio de pasta térmica?`,
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
                const dates = getThermalPasteDates() || await updateThermalPasteDates();
                const msg = {};
                const split = date.split('/');
                const utcDate = new Date(`${split[2]}-${split[1]}-${split[0]}T03:00Z`);
                !dates[user.id] ? await addThermalPasteDate(user.id, utcDate).then(async () => msg.content = `Se agregó la fecha **${date}** como tu último cambio de pasta térmica.`).catch(console.error)
                    : await updateThermalPasteDate(user.id, utcDate).then(async () => msg.content = `Se actualizó tu fecha del último cambio de pasta térmica a **${date}**.`).catch(console.error);
                edit.content = '✅ La acción fue completada.';
                channel.send(msg);
                updateThermalPasteDates();

            }
            message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
        });
    }
}
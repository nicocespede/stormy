const { prefix, getThermalPasteDates, updateThermalPasteDates } = require('../../app/cache');
const { addThermalPasteDate, updateThermalPasteDate } = require('../../app/postgres');
const { convertTZ } = require('../../app/general');
const { MessageActionRow, MessageButton, Constants } = require('discord.js');

const validateDate = (date) => {
    const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
    var ret = { valid: false, reason: 'La fecha debe estar en el formato DD/MM/AAAA.' };
    if (date.length < 10) return ret;
    if (date.substring(2, 3) != '/' || date.substring(5, 6) != '/') return ret;
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
    if (convertTZ(`${month}/${day}/${year}`, 'America/Argentina/Buenos_Aires') > today) return ret;
    ret.valid = true;
    return ret;
};

const timeToString = (years, weeks, days) => {
    var ret = '';
    if (years != 0)
        ret += years + ` año${years > 1 ? 's' : ''}`;
    if (weeks != 0)
        ret += (ret != '' ? ', ' : '') + weeks + ` semana${weeks > 1 ? 's' : ''}`;
    if (days != 0)
        ret += (ret != '' ? ', ' : '') + days + ` día${days > 1 ? 's' : ''}`;
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

    minArgs: 0,
    maxArgs: 1,
    expectedArgs: '<DD/MM/AAAA>',
    slash: 'both',
    options: [
        {
            name: 'fecha',
            description: 'La fecha (DD/MM/AAAA) en que se cambió la pasta por última vez.',
            required: false,
            type: Constants.ApplicationCommandOptionTypes.STRING
        }
    ],

    callback: async ({ message, args, interaction, channel, user }) => {
        var messageOrInteraction = message ? message : interaction;
        if (args.length === 0) {
            var dates = Object.keys(getThermalPasteDates()).length === 0 ? await updateThermalPasteDates() : getThermalPasteDates();
            const userDate = dates[user.id];
            if (dates[user.id]) {
                const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
                const splittedUserDate = userDate.split('/');
                var totalTime = Math.abs(today - convertTZ(`${splittedUserDate[1]}/${splittedUserDate[0]}/${splittedUserDate[2]}`, 'America/Argentina/Buenos_Aires')) / 1000;
                const { years, weeks, days } = secondsToFull(totalTime);
                var msg = `Hola <@${user.id}>, la última vez que cambiaste la pasta térmica fue hace **${timeToString(years, weeks, days)}** (**${userDate}**).`;
            } else
                var msg = `Hola <@${user.id}>, no tenés registrada la última vez que cambiaste la pasta térmica, usá **"${prefix}pasta-termica <DD/MM/AAAA>"** para hacerlo.`;
            await messageOrInteraction.reply({
                content: msg,
                ephemeral: true
            });
        } else
            if (!validateDate(args[0]).valid)
                messageOrInteraction.reply({ content: validateDate(args[0]).reason, ephemeral: true });
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
                var reply = await messageOrInteraction.reply({
                    content: `¿Estás seguro de querer guardar la fecha **${args[0]}** cómo tu último cambio de pasta térmica?`,
                    components: [row],
                    ephemeral: true
                });

                const filter = (btnInt) => {
                    return user.id === btnInt.user.id;
                }

                const collector = channel.createMessageComponentCollector({ filter, max: 1, time: 1000 * 15 });

                collector.on('end', async collection => {
                    if (!collection.first()) {
                        message ? await reply.edit({ content: 'La acción expiró.', components: [], ephemeral: true })
                            : await interaction.editReply({ content: 'La acción expiró.', components: [], ephemeral: true });
                    } else if (collection.first().customId === 'add_yes') {
                        var dates = Object.keys(getThermalPasteDates()).length === 0 ? await updateThermalPasteDates() : getThermalPasteDates();
                        var msg;
                        !dates[user.id] ? await addThermalPasteDate(user.id, args[0]).then(async () => msg = { content: `Se agregó la fecha **${args[0]}** como tu último cambio de pasta térmica.`, components: [], ephemeral: true }).catch(console.error)
                            : await updateThermalPasteDate(user.id, args[0]).then(async () => msg = { content: `Se actualizó tu fecha del último cambio de pasta térmica a **${args[0]}**.`, components: [], ephemeral: true }).catch(console.error);
                        message ? await reply.edit({ content: 'La acción fue completada.', components: [], ephemeral: true })
                            : await interaction.editReply({ content: 'La acción fue completada.', components: [], ephemeral: true });
                        await updateThermalPasteDates();
                        await channel.send(msg);
                    } else
                        message ? await reply.edit({ content: 'La acción fue cancelada.', components: [], ephemeral: true })
                            : await interaction.editReply({ content: 'La acción fue cancelada.', components: [], ephemeral: true });

                });
            }
        return;
    }
}
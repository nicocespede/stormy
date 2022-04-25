const { Constants } = require('discord.js');
const { prefix, ids, reminders } = require('../../app/constants');

module.exports = {
    category: 'General',
    description: 'Le hace un recordatorio a un amigo.',
    options: [
        {
            name: 'amigo',
            description: 'La mención de quien recibe el recordatorio.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.USER
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<@amigo>',
    minArgs: 1,
    maxArgs: 1,

    callback: async ({ message, channel, interaction }) => {
        const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
        var options = { custom: true, ephemeral: true };
        if (!target)
            options.content = `¡Uso incorrecto! Debe haber una mención luego del comando. Usá **"${prefix}recordatorio <@amigo>"**.`;
        else if (target.user.id === ids.users.sombra) {
            var random = Math.floor(Math.random() * (reminders.sombra.length));
            options.content = `<@${target.user.id}> ${reminders.sombra[random]}`;
        } else if (target.user.id == ids.users.jimmy)
            options.content = `<@${target.user.id}> tu nivel de nene down supera los límites conocidos.`;
        else {
            const recordatorios = reminders.everyone;
            recordatorios.push(`tu nivel de nene down es ${Math.floor(Math.random() * 101)}%.`);
            var random = Math.floor(Math.random() * (recordatorios.length));
            options.content = `<@${target.user.id}> ${recordatorios[random]}`
            options.ephemeral = false;
        }
        if (message) channel.send(options)
        else return options;
    }
}
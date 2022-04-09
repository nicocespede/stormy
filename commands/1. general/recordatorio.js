const { Constants } = require('discord.js');
const { ids, prefix, reminders } = require('../../app/cache');
const { isAMention } = require('../../app/general');

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

    callback: async ({ guild, message, channel, args, interaction }) => {
        var mentionId;
        var options = {};
        if (message)
            mentionId = message.mentions.users.first().id;
        else if (interaction) {
            await guild.members.fetch(args[0]).then(member => mentionId = member.user.id).catch(console.error);
            args = `<@${args}>`;
        }
        if (message && !isAMention(args[0]))
            message.reply({ content: `¡Uso incorrecto! Debe haber una mención luego del comando. Usá **"${prefix}recordatorio <@amigo>"**.`, ephemeral: true });
        else if (mentionId === ids.users.sombra) {
            var random = Math.floor(Math.random() * (reminders.sombra.length));
            options = { content: `${args} ${reminders.sombra[random]}` };
        } else if (mentionId == ids.users.jimmy)
            options = { content: `${args} tu nivel de nene down supera los límites conocidos.` };
        else {
            var recordatorios = reminders.everyone;
            recordatorios.push(`tu nivel de nene down es ${Math.floor(Math.random() * 101)}%.`);
            var random = Math.floor(Math.random() * (recordatorios.length));
            options = { content: `${args} ${recordatorios[random]}` }
        }
        if (message)
            channel.send(options);
        else if (interaction)
            interaction.reply(options);
        return;
    }
}
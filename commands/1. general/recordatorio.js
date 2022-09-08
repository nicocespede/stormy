const { Constants } = require('discord.js');
const { prefix, ids } = require('../../app/constants');

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

    callback: async ({ message, channel, interaction, instance, guild }) => {
        const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
        var options = { custom: true, ephemeral: true };
        if (!target) {
            options.content = instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                REASON: "Debe haber una mención luego del comando.",
                PREFIX: prefix,
                COMMAND: "recordatorio",
                ARGUMENTS: "`<@amigo>`"
            });
            return options;
        } else if (target.user.id === ids.users.sombra) {
            const reminders = instance.messageHandler.getEmbed(guild, 'REMINDERS', 'SOMBRA');
            var random = Math.floor(Math.random() * (reminders.length));
            options.content = reminders[random].replace('{ID}', target.user.id);
        } else if (target.user.id == ids.users.jimmy)
            options.content = instance.messageHandler.getEmbed(guild, 'REMINDERS', 'JIMMY').replace('{ID}', target.user.id);
        else {
            const reminders = instance.messageHandler.getEmbed(guild, 'REMINDERS', 'EVERYONE');
            var random = Math.floor(Math.random() * (reminders.length));
            options.content = reminders[random].replace('{ID}', target.user.id).replace('{NUMBER}', Math.floor(Math.random() * 101));
            options.ephemeral = false;
        }
        if (message) channel.send(options)
        else return options;
    }
}
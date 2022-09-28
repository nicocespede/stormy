const { ApplicationCommandOptionType } = require('discord.js');
const { prefix } = require('../../app/constants');
const { getIds, updateIds } = require('../../app/cache');

module.exports = {
    category: 'General',
    description: 'Le hace un recordatorio a un amigo.',
    options: [
        {
            name: 'amigo',
            description: 'La mención de quien recibe el recordatorio.',
            required: true,
            type: ApplicationCommandOptionType.User
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
                COMMAND: "boquear",
                ARGUMENTS: "`<@amigo>`"
            });
            return options;
        } else {
            var key = 'EVERYONE';
            const ids = !getIds() ? await updateIds() : getIds();
            if (target.user.id === ids.users.sombra) key = 'SOMBRA';
            else if (target.user.id === ids.users.jimmy) key = 'JIMMY';
            const reminders = instance.messageHandler.getEmbed(guild, 'REMINDERS', key);
            var random = Math.floor(Math.random() * (reminders.length));
            options.content = reminders[random].replace('{ID}', target.user.id).replace('{NUMBER}', Math.floor(Math.random() * 101));
            options.ephemeral = false;
        }
        if (message) channel.send(options)
        else return options;
    }
}
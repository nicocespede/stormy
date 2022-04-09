const { Util, Constants } = require('discord.js');
const translate = require("translate");

module.exports = {
    category: 'General',
    description: 'Traduce un texto al español.',
    options: [
        {
            name: 'texto',
            description: 'El texto a traducir.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    slash: 'both',

    expectedArgs: '<texto>',
    minArgs: 1,

    callback: async ({ message, channel, text, interaction }) => {
        const translation = await translate(text.replace(/[&]/g, 'and'), "es");
        var messages = Util.splitMessage(`**Texto traducido al español:**\n\n${translation}`);
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;
        messageOrInteraction.reply({ content: messages[0] })
        if (messages.slice(1).length > 0)
            messages.forEach(async m => {
                await channel.send({ content: m })
            });
        return;
    }
}
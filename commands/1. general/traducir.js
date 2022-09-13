const { ApplicationCommandOptionType } = require('discord.js');
const translate = require("translate");
const { splitMessage } = require('../../app/general');

module.exports = {
    category: 'General',
    description: 'Traduce un texto al español.',
    options: [
        {
            name: 'texto',
            description: 'El texto a traducir.',
            required: true,
            type: ApplicationCommandOptionType.String
        }
    ],
    slash: 'both',

    expectedArgs: '<texto>',
    minArgs: 1,

    callback: async ({ message, channel, args, interaction }) => {
        const text = message ? args.join(' ') : interaction.options.getString('texto');
        const translation = await translate(text.replace(/[&]/g, 'and'), "es");
        var chunks = splitMessage(`**Texto traducido al español:**\n\n${translation}`, { char: ' ' });
        const messageOrInteraction = message ? message : interaction;
        await messageOrInteraction.reply({ content: chunks[0] });
        chunks.shift();
        if (chunks.length > 0)
            chunks.forEach(async m => await channel.send({ content: m }));
        return;
    }
}
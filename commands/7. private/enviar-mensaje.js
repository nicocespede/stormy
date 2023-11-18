const { ICommand } = require('wokcommands');
const { ApplicationCommandOptionType } = require("discord.js");
const { getSuccessEmbed, logToFileCommandUsage } = require('../../src/util');

/**@type {ICommand}*/
module.exports = {
    category: 'Privados',
    description: 'Envía un mensaje.',

    slash: true,
    ownerOnly: true,
    guildOnly: true,

    options: [
        {
            name: 'canal',
            description: 'El canal al que se envía el mensaje.',
            required: true,
            type: ApplicationCommandOptionType.Channel
        },
        {
            name: 'mensaje',
            description: 'El mensaje.',
            required: true,
            type: ApplicationCommandOptionType.String
        }
    ],

    callback: async ({ interaction, text, user }) => {
        logToFileCommandUsage('enviar-mensaje', text, interaction, user);

        const channel = interaction.options.getChannel('canal');
        const message = interaction.options.getString('mensaje');

        await channel.send(message);

        return { custom: true, embeds: [getSuccessEmbed('Mensaje enviado.')], ephemeral: true };
    }
}
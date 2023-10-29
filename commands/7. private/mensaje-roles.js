const { ICommand } = require('wokcommands');
const { ApplicationCommandOptionType } = require("discord.js");
const { getCollectorMessages, updateCollectorMessages } = require("../../src/cache");
const { addRolesMessage, updateRolesMessage } = require("../../src/mongodb");
const { getSuccessEmbed, logToFileCommandUsage } = require('../../src/util');
const { RolesMessagesData } = require('../../src/constants');

/**@type {ICommand}*/
module.exports = {
    category: 'Privados',
    description: 'Envía el mensaje para los roles.',

    slash: true,
    ownerOnly: true,
    guildOnly: true,

    options: [
        {
            name: 'tipo',
            description: 'El tipo de roles que tendrá el mensaje.',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: RolesMessagesData
        },
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
        logToFileCommandUsage('mensaje-roles', text, interaction, user);

        const type = interaction.options.getString('tipo');
        const channel = interaction.options.getChannel('canal');
        const message = interaction.options.getString('mensaje');

        const sentMessage = await channel.send(message);

        const collectorMessages = await getCollectorMessages();

        if (!collectorMessages[type])
            await addRolesMessage(type, channel.id, sentMessage.id);
        else
            await updateRolesMessage(type, channel.id, sentMessage.id);

        await updateCollectorMessages();

        return { custom: true, embeds: [getSuccessEmbed('Mensaje enviado.')], ephemeral: true };
    }
}
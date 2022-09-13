const { ApplicationCommandOptionType } = require("discord.js");
const { updateRolesMessageInfo } = require("../../app/cache");
const { updateRolesMessage } = require("../../app/mongodb");

module.exports = {
    category: 'Privados',
    description: 'Envía el mensaje para los roles.',
    aliases: ['roles-msg'],

    slash: 'both',
    ownerOnly: true,
    guildOnly: true,

    minArgs: 2,
    expectedArgs: '<canal> <mensaje>',
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

    callback: async ({ message, interaction, args }) => {
        args.shift();

        const text = args.join(' ');

        let channel = message ? message.mentions.channels.first() : interaction.options.getChannel('canal');

        const sentMessage = await channel.send(text);

        await updateRolesMessage(channel.id, sentMessage.id).then(async _ => await updateRolesMessageInfo());

        if (interaction)
            return { custom: true, content: 'Mensaje enviado.', ephemeral: true };
    }
}
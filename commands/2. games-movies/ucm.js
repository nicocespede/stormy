const { ApplicationCommandOptionType } = require('discord.js');
const { getIds, updateIds } = require('../../src/cache');
const { addAnnouncementsRole, sendChronologySettingMessage, sendChronologyElement } = require('../../src/common');

module.exports = {
    category: 'Juegos/Películas',
    description: 'Responde con los links de descarga de las películas del Universo Cinematográfico de Marvel.',

    options: [
        {
            name: 'numero',
            description: 'El número del elemento que se quiere ver.',
            required: false,
            type: ApplicationCommandOptionType.Integer
        }
    ],
    maxArgs: 1,
    expectedArgs: '[numero]',
    slash: 'both',

    callback: async ({ member, message, args, interaction, channel, guild, instance }) => {
        if (interaction) await interaction.deferReply({ ephemeral: true });

        const ids = getIds() || await updateIds();
        await addAnnouncementsRole(ids.roles.anunciosUcm, guild, member);

        const number = message ? args[0] : interaction.options.getInteger('numero');

        const collectionId = 'mcu';

        if (!number)
            sendChronologySettingMessage(channel, collectionId, guild, instance, interaction, member, message);
        else
            sendChronologyElement(channel, collectionId, instance, interaction, member, message, number);

    }
}
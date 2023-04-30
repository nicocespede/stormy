const { CommandArgs } = require("../../src/typedefs");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fileLogCommandUsage } = require("../../src/util");

module.exports = {
    category: 'General',
    description: 'Responde con los links de las salas para ver videos sincronizados.',

    maxArgs: 0,
    slash: 'both',

    /** @param {CommandArgs}*/
    callback: async ({ interaction, message, user }) => {
        fileLogCommandUsage('salas', interaction, message, user);

        const row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
                .setLabel('Watch 2gether')
                .setStyle(ButtonStyle.Link)
                .setURL('https://www.watch2gether.com/rooms/nckg-le03mozzfc19nz7uuf?lang=es'));

        const reply = { components: [row], content: '⚠ Presioná el botón para dirigirte a la sala:' };

        if (interaction)
            await interaction.deferReply();

        message ? await message.reply(reply) : await interaction.editReply(reply);
    }
}
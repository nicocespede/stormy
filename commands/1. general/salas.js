const { MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    category: 'General',
    description: 'Responde con los links de las salas para ver videos sincronizados.',

    maxArgs: 0,
    slash: 'both',

    callback: ({ message, interaction }) => {
        const row = new MessageActionRow()
            .addComponents(new MessageButton()
                .setLabel('Watch 2gether')
                .setStyle('LINK')
                .setURL('https://www.watch2gether.com/rooms/nckg-le03mozzfc19nz7uuf?lang=es'));

        if (message)
            message.reply({ content: 'Presione el botón para dirigirse a la sala:', components: [row] });
        if (interaction)
            interaction.reply({ content: 'Presione el botón para dirigirse a la sala:', components: [row] });
        return;
    }
}
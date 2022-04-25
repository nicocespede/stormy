const { MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    category: 'General',
    description: 'Responde con los links de las salas para ver videos sincronizados.',

    maxArgs: 0,
    slash: 'both',

    callback: () => {
        const row = new MessageActionRow()
            .addComponents(new MessageButton()
                .setLabel('Watch 2gether')
                .setStyle('LINK')
                .setURL('https://www.watch2gether.com/rooms/nckg-le03mozzfc19nz7uuf?lang=es'));

        return {
            components: [row],
            content: 'Presioná el botón para dirigirte a la sala:',
            custom: true
        };
    }
}
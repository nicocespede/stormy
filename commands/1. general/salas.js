const { MessageAttachment, MessageEmbed } = require('discord.js');

module.exports = {
    category: 'General',
    description: 'Responde con los links de las salas para ver videos sincronizados.',

    maxArgs: 0,
    slash: 'both',

    callback: ({ message, interaction }) => {
        const file = new MessageAttachment('./assets/thumbs/rooms.png');
        const embed = new MessageEmbed()
            .setTitle(`**Salas**`)
            .setDescription(`Sync Video: https://www.sync-video.com/r/stormersroom\n\n\nWatch 2gether: https://www.watch2gether.com/rooms/nckg-le03mozzfc19nz7uuf?lang=es`)
            .setColor([0, 143, 197])
            .setThumbnail(`attachment://rooms.png`);
        if (message)
            message.reply({ embeds: [embed], files: [file] });
        if (interaction)
            interaction.reply({ embeds: [embed], files: [file] });
        return;
    }
}
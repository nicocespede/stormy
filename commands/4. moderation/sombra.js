const { MessageEmbed } = require('discord.js');
const { getSombraBans, updateSombraBans } = require('../../app/cache');

module.exports = {
    category: 'Moderación',
    description: 'Responde con el historial de baneos de Sombra.',

    maxArgs: 0,
    slash: 'both',

    callback: async ({ message, instance, interaction }) => {
        var messageOrInteraction = message ? message : interaction;
        var bans = !getSombraBans() ? await updateSombraBans() : getSombraBans();
        var description = `**Sombra#9370** fue baneado ${bans.length} veces. A continuación la lista de las razones:\n\n`;
        for (var i = 0; i < bans.length; i++) {
            var actual = bans[i];
            if (actual['sombraBans_reason'] == "" || actual['sombraBans_reason'] == null)
                description += `**${i + 1}:** Sin razón de baneo.\n`;
            else
                description += `**${i + 1}:** ${actual['sombraBans_reason']}\n`;
        }
        description = description.replace(/[\\\n]+n/g, '\n');
        messageOrInteraction.reply({
            embeds: [new MessageEmbed()
                .setTitle('Bans de **Sombra#9370**')
                .setDescription(description)
                .setColor(instance.color)
                .setThumbnail(`attachment://sombra.jpeg`)],
            files: ['assets/thumbs/sombra.jpeg'],
            ephemeral: true
        });
        return;
    }
}
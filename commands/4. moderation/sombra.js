const { EmbedBuilder } = require('discord.js');
const { getSombraBans, updateSombraBans } = require('../../src/cache');
const { githubRawURL } = require('../../src/constants');

module.exports = {
    category: 'Moderación',
    description: 'Responde con el historial de baneos de Sombra.',

    maxArgs: 0,
    slash: 'both',

    callback: async ({ instance }) => {
        const bans = getSombraBans() || await updateSombraBans();
        let description = `**Sombra#9370** fue baneado ${bans.length} veces. A continuación la lista de las razones:\n\n`;
        for (var i = 0; i < bans.length; i++) {
            const reason = bans[i];
            description += `**${i + 1}:** ${!reason || reason === '' ? 'Sin razón de baneo.' : reason}\n`;
        }
        description = description.replace(/[\\\n]+n/g, '\n');
        return {
            custom: true,
            embeds: [new EmbedBuilder()
                .setTitle('Bans de **Sombra#9370**')
                .setDescription(description)
                .setColor(instance.color)
                .setThumbnail(`${githubRawURL}/assets/thumbs/sombra.jpeg`)],
            ephemeral: true
        };
    }
}
const { ICommand } = require("wokcommands");
const { EmbedBuilder } = require('discord.js');
const { getSombraBans, updateSombraBans, getGithubRawUrl } = require('../../src/cache');
const { logToFileCommandUsage } = require('../../src/util');

const thumbs = ['sombra', 'sombra-lgbt'];

/**@type {ICommand}*/
module.exports = {
    category: 'Moderación',
    description: 'Responde con el historial de baneos de Sombra.',

    maxArgs: 0,
    slash: 'both',

    callback: async ({ instance, interaction, user }) => {
        logToFileCommandUsage('sombra', null, interaction, user);

        const bans = getSombraBans() || await updateSombraBans();
        let description = `**Sombra#9370** fue baneado ${bans.length} veces. A continuación la lista de las razones:\n\n`;
        for (var i = 0; i < bans.length; i++) {
            const reason = bans[i];
            description += `**${i + 1}:** ${!reason || reason === '' ? 'Sin razón de baneo.' : reason}\n`;
        }
        description = description.replace(/[\\\n]+n/g, '\n');

        const random = Math.floor(Math.random() * (thumbs.length));
        return {
            custom: true,
            embeds: [new EmbedBuilder()
                .setTitle('Bans de **Sombra#9370**')
                .setDescription(description)
                .setColor(instance.color)
                .setThumbnail(await getGithubRawUrl(`assets/thumbs/${thumbs[random]}.jpeg`))],
            ephemeral: true
        };
    }
}
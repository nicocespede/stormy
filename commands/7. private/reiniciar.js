const { ICommand } = require("wokcommands");
const { DEV_ENV } = require("../../src/constants");
const { isOwner } = require("../../src/common");
const { getSimpleEmbed, getDenialEmbed, logToFileCommandUsage } = require("../../src/util");

/**@type {ICommand}*/
module.exports = {
    category: 'Privados',
    description: 'Reinicia el bot.',

    slash: true,

    callback: async ({ interaction, user }) => {
        logToFileCommandUsage('reiniciar', null, interaction, user);

        if (!(await isOwner(user.id)))
            return { embeds: [getDenialEmbed('Lo siento, no estás autorizado para usar este comando.')], custom: true, ephemeral: true };

        await interaction.reply({ embeds: [getSimpleEmbed('🔄 Comenzando reinicio, ¡adiós!')], ephemeral: true });
        process.emit(!DEV_ENV ? 'SIGTERM' : 'SIGINT');
    }
}
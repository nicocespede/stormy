const { testing } = require("../../src/constants");

module.exports = {
    category: 'Privados',
    description: 'Reinicia el bot.',

    slash: true,
    ownerOnly: true,

    callback: async ({ interaction }) => {
        await interaction.reply({ content: '🔄 Comenzando reinicio, ¡adiós!', ephemeral: true });
        process.emit(!testing ? 'SIGTERM' : 'SIGINT');
    }
}
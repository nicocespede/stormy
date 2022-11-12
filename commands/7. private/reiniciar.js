const { testing } = require("../../src/constants");
const { isOwner } = require("../../src/general");

module.exports = {
    category: 'Privados',
    description: 'Reinicia el bot.',

    slash: true,

    callback: async ({ interaction, user }) => {
        if (!(await isOwner(user.id)))
            return { content: '❌ Lo siento, no estás autorizado para usar este comando.', custom: true, ephemeral: true };

        await interaction.reply({ content: '🔄 Comenzando reinicio, ¡adiós!', ephemeral: true });
        process.emit(!testing ? 'SIGTERM' : 'SIGINT');
    }
}
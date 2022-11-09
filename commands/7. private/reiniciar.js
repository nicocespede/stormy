const { testing } = require("../../src/constants");

module.exports = {
    category: 'Privados',
    description: 'Reinicia el bot.',

    slash: true,
    ownerOnly: true,

    callback: ({ }) => {
        process.emit(!testing ? 'SIGTERM' : 'SIGINT');
        return '🔄 Comenzando reinicio, ¡adiós!';
    }
}
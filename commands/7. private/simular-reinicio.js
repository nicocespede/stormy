const { testing } = require("../../app/constants");

module.exports = {
    category: 'Privados',
    description: 'Simula el reinicio del bot.',
    aliases: ['sim-reinicio', 'simrestart'],

    maxArgs: 0,
    slash: false,
    testOnly: true,
    ownerOnly: true,

    callback: ({ }) => {
        if (testing) {
            process.emit('SIGINT');
            return 'Reinicio simulado, ¡adiós!';
        }
        return 'Este comando sólo puede utilizarse en un entorno de prueba.'
    }
}
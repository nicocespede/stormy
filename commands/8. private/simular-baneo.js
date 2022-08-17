module.exports = {
    category: 'Privados',
    description: 'Simula el baneo de un usuario del servidor.',
    aliases: ['sim-baneo', 'simban'],

    maxArgs: 0,
    slash: false,
    testOnly: true,
    ownerOnly: true,

    callback: ({ user, client }) => {
        client.emit('guildBanAdd', { user: user, reason: 'Razón de prueba.' });
        return '¡Baneo simulado!';
    }
}
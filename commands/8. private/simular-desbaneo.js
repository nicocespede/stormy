module.exports = {
    category: 'Privados',
    description: 'Simula el desbaneo de un usuario del servidor.',
    aliases: ['sim-desbaneo', 'simunban'],

    maxArgs: 0,
    slash: false,
    testOnly: true,
    ownerOnly: true,

    callback: ({ user, client }) => {
        client.emit('guildBanRemove', { user: user });
        return '¡Desbaneo simulado!';
    }
}
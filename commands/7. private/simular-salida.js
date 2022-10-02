module.exports = {
    category: 'Privados',
    description: 'Simula la salida de un usuario del servidor.',
    aliases: ['sim-salida', 'simleave'],

    maxArgs: 0,
    slash: false,
    testOnly: true,
    ownerOnly: true,

    callback: ({ member, client }) => {
        client.emit('guildMemberRemove', member);
        return '¡Salida simulada!';
    }
}
module.exports = {
    category: 'Privados',
    description: 'Simula la entrada de un usuario al servidor.',
    aliases: ['sim-entrada', 'simjoin'],

    maxArgs: 0,
    slash: false,
    permissions: ['ADMINISTRATOR'],
    testOnly: true,

    callback: ({ member, client }) => {
        client.emit('guildMemberAdd', member);
        return '¡Entrada simulada!';
    }
}
const { addBanResponsible } = require("../../app/cache");

module.exports = {
    category: 'Privados',
    description: 'Simula el baneo de un usuario del servidor.',
    aliases: ['sim-baneo', 'simban'],

    slash: false,
    testOnly: true,
    ownerOnly: true,

    callback: ({ user, client, guild, args }) => {
        client.emit('guildBanAdd', { user: user, reason: args.join(' '), guild: guild });
        addBanResponsible(user.id, user.id);
        return '¡Baneo simulado!';
    }
}
const { ids } = require("../../app/constants");

module.exports = {
    category: 'Privados',
    description: 'Elimina todos los mensajes del canal de mensajes directos.',

    expectedArgs: '<id>',
    minArgs: 1,
    maxArgs: 1,
    slash: false,
    ownerOnly: true,

    callback: async ({ client, args }) => {
        const targetId = args[0];
        const reply = { custom: true };
        var deleted = 0;
        await client.users.fetch(targetId).then(async user => {
            await user.createDM();
            await user.dmChannel.messages.fetch().then(messages => {
                messages.forEach(async m => {
                    if (m.author.id === ids.users.bot) {
                        await m.delete().then(async _ => {
                            deleted++;
                            await new Promise(res => setTimeout(res, 1000 * 3));
                        });
                    }
                });
                reply.content = deleted > 0 ? `Se borraron **${deleted} mensajes**.` : 'Este usuario no tiene ningún mensaje directo.';
            }).catch(console.error);
        }).catch(console.error);
        return reply;
    }
}
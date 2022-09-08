const { ids } = require("../../app/constants");

module.exports = {
    category: 'Privados',
    description: 'Elimina todos los mensajes del canal de mensajes directos de quien se desee.',

    expectedArgs: '<id>',
    minArgs: 1,
    maxArgs: 1,
    slash: false,
    ownerOnly: true,

    callback: async ({ client, args }) => {
        const targetId = args[0];
        const reply = { custom: true };
        var deleted = 0;
        const user = await client.users.fetch(targetId).catch(console.error);
        const dmChannel = await user.createDM().catch(console.error);
        const messages = await dmChannel.messages.fetch().catch(console.error);
        for (const [_, m] of messages)
            if (m.author.id === ids.users.bot) {
                await m.delete().catch(console.error);
                deleted++;
                await new Promise(res => setTimeout(res, 1000 * 2));
            }
        reply.content = deleted > 0 ? `Se borraron **${deleted} mensajes**.` : 'Este usuario no tiene ningún mensaje directo.';
        return reply;
    }
}
const { ids } = require("../../app/constants");

module.exports = {
    category: 'Privados',
    description: 'Elimina todos los mensajes del canal de mensajes directos.',

    maxArgs: 0,
    slash: false,
    ownerOnly: true,

    callback: ({ channel }) => {
        if (channel.type === 'DM') {
            channel.messages.fetch().then(messages => {
                messages.forEach(m => {
                    if (m.author.id === ids.users.bot)
                        m.delete();
                });
            }).catch(console.error);
        }
        return;
    }
}
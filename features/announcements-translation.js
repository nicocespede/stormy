const translate = require("translate");
const { getIds, updateIds } = require("../app/cache");
const { needsTranslation, getNextMessage, splitMessage } = require("../app/general");

module.exports = async client => {
    const ids = !getIds() ? await updateIds() : getIds();

    client.on('messageCreate', async message => {
        if (message.channel.id === ids.channels.anuncios && message.author.id != ids.users.bot && !message.author.bot)
            if (needsTranslation(message.content)) {
                var text = await translate(message.content.replace(/[&]/g, 'and'), "es");
                const messages = splitMessage(`**Mensaje de <@${message.author.id}> traducido al español:**\n\n${text}`);
                messages.forEach(m => message.channel.send({ content: m }));
            }
    });

    client.on('messageUpdate', (oldMessage, newMessage) => {
        if (oldMessage.channel.id === ids.channels.anuncios && !oldMessage.author.bot)
            if (needsTranslation(oldMessage.content))
                oldMessage.channel.messages.fetch().then(async msgs => {
                    var msgToEdit = getNextMessage(newMessage.id, msgs);
                    var text = await translate(newMessage.content.replace(/[&]/g, 'and'), "es");
                    msgToEdit.edit(`**Mensaje de <@${newMessage.author.id}> traducido al español:**\n\n${text}`);
                }).catch(console.error);
    });
};

module.exports.config = {
    displayName: 'Traducción de anuncios',
    dbName: 'ANNOUNCEMENTS_TRANSLATION'
}
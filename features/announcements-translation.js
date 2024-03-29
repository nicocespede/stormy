const translate = require("translate");
const { getIds } = require("../src/cache");
const { needsTranslation } = require("../src/common");
const { splitMessage } = require("../src/util");

const getNextMessage = (id, collection) => {
    let previousMessage = collection.first();
    let ret = null;
    collection.forEach(element => {
        if (element.id === id) {
            ret = previousMessage;
            return;
        }
        previousMessage = element;
    });
    return ret;
};

module.exports = async client => {
    const ids = await getIds();

    client.on('messageCreate', async message => {
        if (message.channel.id === ids.channels.anuncios && !message.author.bot)
            if (needsTranslation(message.content)) {
                const text = await translate(message.content.replace(/[&]/g, 'and'), "es");
                const messages = splitMessage(`**Mensaje de <@${message.author.id}> traducido al español:**\n\n${text}`);
                messages.forEach(m => message.channel.send({ content: m }));
            }
    });

    client.on('messageUpdate', (oldMessage, newMessage) => {
        if (oldMessage.channel.id === ids.channels.anuncios && !oldMessage.author.bot)
            if (needsTranslation(oldMessage.content))
                oldMessage.channel.messages.fetch().then(async msgs => {
                    const msgToEdit = getNextMessage(newMessage.id, msgs);
                    const text = await translate(newMessage.content.replace(/[&]/g, 'and'), "es");
                    msgToEdit.edit(`**Mensaje de <@${newMessage.author.id}> traducido al español:**\n\n${text}`);
                }).catch(console.error);
    });
};

module.exports.config = {
    displayName: 'Traducción de anuncios',
    dbName: 'ANNOUNCEMENTS_TRANSLATION'
}
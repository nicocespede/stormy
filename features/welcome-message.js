const { ids } = require("../app/constants");
const { generateWelcomeImage, countMembers } = require("../app/general");

module.exports = (client, instance) => {
    client.on('guildMemberAdd', member => {
        client.channels.fetch(ids.channels.welcome).then(channel => {
            generateWelcomeImage(member.user).then(attachment => {
                const { guild } = member;
                const welcomeMessages = instance.messageHandler.getEmbed(guild, 'GREETINGS', 'WELCOME');
                var random = Math.floor(Math.random() * (welcomeMessages.length));
                channel.send({ content: `${welcomeMessages[random].replace('{ID}', member.user.id)}`, files: [attachment] }).then(_ => {
                    channel.send({
                        content: instance.messageHandler.get(guild, 'AUTOROLE_ADVICE', {
                            USER_ID: member.user.id,
                            CHANNEL_ID: ids.channels.autorol
                        })
                    }).then(m => {
                        new Promise(res => setTimeout(res, 5 * 60 * 1000)).then(() => {
                            m.delete();
                        });
                    });
                });
                countMembers(client);
            }).catch(console.error);
        }).catch(console.error);
    });
};

module.exports.config = {
    displayName: 'Mensaje de bienvenida',
    dbName: 'WELCOME_MESSAGE'
}
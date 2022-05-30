const { ids, welcome } = require("../app/constants");
const { generateWelcomeImage, countMembers } = require("../app/general");

module.exports = client => {
    client.on('guildMemberAdd', member => {
        client.channels.fetch(ids.channels.welcome).then(channel => {
            generateWelcomeImage(member.user).then(attachment => {
                var random = Math.floor(Math.random() * (welcome.length));
                channel.send({ content: `${welcome[random].replace(/%USER_ID%/g, member.user.id)}`, files: [attachment] });
                countMembers(client);
            }).catch(console.error);
        }).catch(console.error);
    });
};

module.exports.config = {
    displayName: 'Mensaje de bienvenida',
    dbName: 'WELCOME_MESSAGE'
}
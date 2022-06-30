const { ids, welcome } = require("../app/constants");
const { generateWelcomeImage, countMembers } = require("../app/general");
const rolesText = `**¡Hola <@%USER_ID%>!** Te invito a **seleccionar los roles que desees** en el canal <#%CHANNEL_ID%>.\n\n_Este mensaje se eliminará en 5 minutos..._`;

module.exports = client => {
    client.on('guildMemberAdd', member => {
        client.channels.fetch(ids.channels.welcome).then(channel => {
            generateWelcomeImage(member.user).then(attachment => {
                var random = Math.floor(Math.random() * (welcome.length));
                channel.send({ content: `${welcome[random].replace(/%USER_ID%/g, member.user.id)}`, files: [attachment] }).then(_ => {
                    channel.send({
                        content: `${rolesText
                            .replace(/%USER_ID%/g, member.user.id)
                            .replace(/%CHANNEL_ID%/g, ids.channels.autorol)}`
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
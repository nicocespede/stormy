const { ids, prefix } = require('../../app/cache');
const { isAMention } = require('../../app/general');
const fs = require('fs');

async function getRandomMoscardon() {
    var fileName;
    return new Promise(function (resolve, reject) {
        //passsing directoryPath and callback function
        fs.readdir('./assets/moscas', function (err, files) {
            //handling error
            if (err)
                return console.log('Unable to scan directory: ' + err);
            var random = Math.floor(Math.random() * 4);
            fileName = files[random];
        });
        setTimeout(function () { resolve(); }, 1000);
    }).then(function () {
        return fileName;
    });
}

module.exports = {
    category: 'General',
    description: 'Envía un moscardón por mensaje directo a un amigo.',
    options: [
        {
            name: 'amigo',
            description: 'La mención de quien recibe el moscardón.',
            required: true,
            type: 'MENTIONABLE'
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<@amigo>',
    minArgs: 1,
    maxArgs: 1,

    callback: async ({ guild, user, message, args, interaction }) => {
        var mention;
        if (message) {
            var messageOrInteraction = message;
            mention = message.mentions.members.first();
        } else if (interaction) {
            var messageOrInteraction = interaction;
            await guild.members.fetch(args[0]).then(member => mention = member).catch(console.error);
        }
        if (message && !isAMention(args[0]))
            message.reply({ content: `¡Uso incorrecto! Debe haber una mención luego del comando. Usá **"${prefix}moscardon <@amigo>"**.`, ephemeral: true });
        else if (mention.user.id === user.id)
            messageOrInteraction.reply({ content: `¡Lo siento <@${user.id}>, no podés enviarte un moscardón a vos mismo!`, ephemeral: true });
        else if (mention.user.id === ids.users.bot)
            messageOrInteraction.reply({ content: `¡Lo siento <@${user.id}>, no podés enviarme un moscardón a mí!`, ephemeral: true });
        else {
            var msg = { content: `¡Moscardón enviado!` };
            getRandomMoscardon().then(fileName => {
                mention.send({
                    files: [{ attachment: `./assets/moscas/${fileName}` }]
                }).catch(() => {
                    msg = { content: `Lo siento, no pude enviarle el mensaje a este usuario.`, ephemeral: true };
                });
            }).catch(console.error);
            messageOrInteraction.reply(msg);
        }
        return;
    }
}
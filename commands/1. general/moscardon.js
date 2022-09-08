const fs = require('fs');
const { Constants } = require('discord.js');
const { prefix, ids } = require('../../app/constants');

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
    aliases: ['moscardón'],
    options: [
        {
            name: 'amigo',
            description: 'La mención de quien recibe el moscardón.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.USER
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<@amigo>',
    minArgs: 1,
    maxArgs: 1,

    callback: async ({ user, message, interaction, instance, guild }) => {
        const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
        var reply = { custom: true, ephemeral: true };
        if (!target)
            reply.content = instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                REASON: "Debe haber una mención luego del comando.",
                PREFIX: prefix,
                COMMAND: "moscardon",
                ARGUMENTS: "`<@amigo>`"
            });
        else if (target.user.id === user.id)
            reply.content = `¡Lo siento <@${user.id}>, no podés enviarte un moscardón a vos mismo!`;
        else if (target.user.id === ids.users.bot)
            reply.content = `¡Lo siento <@${user.id}>, no podés enviarme un moscardón a mí!`;
        else {
            reply.content = `¡Moscardón enviado!`;
            reply.ephemeral = false;
            getRandomMoscardon().then(async fileName => {
                await target.send({ files: [{ attachment: `./assets/moscas/${fileName}` }] }).catch(() => {
                    reply.content = `Lo siento, no pude enviarle el mensaje a este usuario.`
                    reply.ephemeral = true;
                });
            }).catch(console.error);
        }
        return reply;
    }
}
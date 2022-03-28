const { getBirthdays, prefix, updateBirthdays } = require('../../app/cache');
const { addBday } = require('../../app/postgres');
const { isAMention, sendBdayAlert } = require('../../app/general');
var validDate = /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))$/g;

module.exports = {
    category: 'General',
    description: 'Guarda el cumpleaños de un amigo.',
    aliases: ['agregar-cumpleaños'],

    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '<@amigo> <DD/MM>',
    slash: 'both',
    options: [
        {
            name: 'amigo',
            description: 'La mención del cumpleañero.',
            required: true,
            type: 'MENTIONABLE'
        },
        {
            name: 'fecha',
            description: 'La fecha (DD/MM) del cumpleaños.',
            required: false,
            type: 'STRING'
        }
    ],
    guildOnly: true,

    callback: async ({ guild, message, args, interaction, client }) => {
        var mention;
        var bdays = [];
        if (message) {
            var messageOrInteraction = message;
            mention = message.mentions.members.first();
        } else if (interaction) {
            var messageOrInteraction = interaction;
            await guild.members.fetch(args[0]).then(member => mention = member).catch(console.error);
        }
        getBirthdays().forEach(bday => (bdays.push(bday['bdays_id'])));
        if (message && !isAMention(args[0]))
            messageOrInteraction.reply({ content: `¡Uso incorrecto! Debe haber una mención luego del comando. Usá **"${prefix}agregar-cumple <@amigo> <DD/MM>"**.`, ephemeral: true });
        else if (validDate.exec(args[1]) == null)
            messageOrInteraction.reply({ content: `La fecha debe estar en el formato DD/MM.`, ephemeral: true });
        else if (bdays.includes(mention.user.id))
            messageOrInteraction.reply({ content: `Este usuario ya tiene registrado su cumpleaños.`, ephemeral: true });
        else {
            var newArray = [mention.user.id, mention.user.username, args[1], false];
            addBday(newArray).then(() => {
                messageOrInteraction.reply({ content: `Se agregó el cumpleaños de ${args[0]} en la fecha ${args[1]}.` }).then(async () => {
                    await updateBirthdays();
                    sendBdayAlert(client);
                });
            }).catch(console.error);
        }
        return;
    }
}
const { getBirthdays, prefix, updateBirthdays } = require('../../app/cache');
const { deleteBday } = require('../../app/postgres');
const { isAMention } = require('../../app/general');

module.exports = {
    category: 'General',
    description: 'Borra el cumpleaños de un amigo.',
    aliases: ['borrar-cumpleaños', 'eliminar-cumple', 'eliminar-cumpleaños'],

    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '<@amigo>',
    slash: 'both',
    options: [
        {
            name: 'amigo',
            description: 'La mención del cumpleañero.',
            required: true,
            type: 'MENTIONABLE'
        }
    ],
    guildOnly: true,

    callback: async ({ guild, message, args, interaction }) => {
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
            messageOrInteraction.reply({ content: `¡Uso incorrecto! Debe haber una mención luego del comando. Usá **"${prefix}borrar-cumple <@amigo>"**.`, ephemeral: true });
        else if (!bdays.includes(mention.user.id))
            messageOrInteraction.reply({ content: `El cumpleaños que intentás borrar no existe.`, ephemeral: true });
        else
            deleteBday(mention.user.id).then(async () => {
                await updateBirthdays();
                messageOrInteraction.reply({ content: `El cumpleaños fue borrado de manera exitosa.` });
            }).catch(console.error);
        return;
    }
}
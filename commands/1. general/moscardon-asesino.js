const { ids, prefix } = require('../../app/cache');
const { isAMention } = require('../../app/general');

module.exports = {
    aliases: 'moscardondelamuerte',
    category: 'General',
    description: `Envía un moscardón asesino por mensaje directo a un amigo.`,
    options: [
        {
            name: 'amigo',
            description: `La mención de quien recibe el moscardón asesino.`,
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
        var cmd = 'moscardon-asesino';
        var type = 'asesino';
        if (message) {
            var messageOrInteraction = message;
            cmd = message.content.split(' ')[0].substring(1);
            mention = message.mentions.members.first();
        } else if (interaction) {
            var messageOrInteraction = interaction;
            await guild.members.fetch(args[0]).then(member => mention = member).catch(console.error);
        }
        if (cmd === 'moscardondelamuerte') type = 'de la muerte';
        if (message && !isAMention(args[0]))
            message.reply({ content: `¡Uso incorrecto! Debe haber una mención luego del comando. Usá **"${prefix}${cmd} <@amigo>"**.`, ephemeral: true });
        else if (mention.user.id === user.id)
            messageOrInteraction.reply({ content: `¡Lo siento <@${user.id}>, no podés enviarte un moscardón ${type} a vos mismo!`, ephemeral: true });
        else if (mention.user.id === ids.users.bot)
            messageOrInteraction.reply({ content: `¡Lo siento <@${user.id}>, no podés enviarme un moscardón ${type} a mí!`, ephemeral: true });
        else {
            var msg = { content: `¡Moscardón ${type} enviado!` };
            mention.send({
                files: [{ attachment: `./assets/moscas/moscardon.png` }]
            }).catch(() => {
                msg = { content: `Lo siento, no pude enviarle el mensaje a este usuario.`, ephemeral: true };
            });
            messageOrInteraction.reply(msg);
        }
        return;
    }
}
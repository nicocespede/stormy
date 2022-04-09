const { Constants } = require('discord.js');
const { ids, prefix } = require('../../app/cache');
const { isAMention } = require('../../app/general');

module.exports = {
    category: 'General',
    description: 'Cambia el apodo a un amigo (sólo para usuarios autorizados).',
    options: [
        {
            name: 'amigo',
            description: 'La mención de quien recibe el nuevo apodo.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.USER
        },
        {
            name: 'apodo',
            description: 'El apodo nuevo (si no se ingresa nada, el apodo se resetea).',
            required: false,
            type: Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<@amigo> [apodo]',
    minArgs: 1,

    callback: async ({ guild, user, message, args, interaction }) => {
        var mention;
        if (message) {
            var messageOrInteraction = message;
            mention = message.mentions.members.first();
        } else if (interaction) {
            var messageOrInteraction = interaction;
            await guild.members.fetch(args[0]).then(member => mention = member).catch(console.error);
        }
        guild.roles.fetch(ids.roles.banear).then(role => {
            var newNickname = args.slice(1).join(' ');
            if (!role.members.has(user.id))
                messageOrInteraction.reply({ content: `Lo siento <@${user.id}>, no tenés autorización para cambiar apodos.`, ephemeral: true });
            else if (message && !isAMention(args[0]))
                messageOrInteraction.reply({ content: `¡Uso incorrecto! Debe haber una mención y (opcionalmente) el nuevo apodo luego del comando. Usá **"${prefix}apodo <@amigo> [apodo]"**.`, ephemeral: true });
            else if (mention.user.id === ids.users.bot)
                messageOrInteraction.reply({ content: `¡No podés cambiarme el apodo a mí!`, ephemeral: true });
            else if (newNickname.length > 32)
                messageOrInteraction.reply({ content: `El apodo no puede contener más de 32 caracteres.`, ephemeral: true });
            else {
                mention.setNickname(newNickname).then(() => {
                    if (newNickname.length > 0)
                        messageOrInteraction.reply({ content: `Apodo de **${mention.user.tag}** cambiado correctamente.` });
                    else
                        messageOrInteraction.reply({ content: `Apodo de **${mention.user.tag}** reseteado correctamente.` });
                }).catch(() => {
                    messageOrInteraction.reply({ content: 'Lo siento, no se pudo cambiar el apodo.', ephemeral: true });
                })
            }
        }).catch(console.error);
        return;
    }
}
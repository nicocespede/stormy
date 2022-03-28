const { ids, prefix, updateBanned } = require('../../app/cache');
const { isAMention } = require('../../app/general');
const { addBan } = require('../../app/postgres');

module.exports = {
    category: 'Moderación',
    description: 'Banea a un usuario (sólo para usuarios autorizados).',
    aliases: 'ban',
    options: [
        {
            name: 'amigo',
            description: 'La mención de quien recibe el ban.',
            required: true,
            type: 'MENTIONABLE'
        },
        {
            name: 'razón',
            description: 'La razón del baneo.',
            required: false,
            type: 'STRING'
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<@amigo> [razón]',
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
            if (!role.members.has(user.id))
                messageOrInteraction.reply({ content: `Lo siento <@${user.id}>, no tenés autorización para banear usuarios.`, epehemeral: true });
            else if (message && !isAMention(args[0]))
                message.reply({ content: `¡Uso incorrecto! Debe haber una mención y (opcionalmente) la razón del baneo luego del comando. Usá **"${prefix}apodo <@amigo> [razón]"**.`, ephemeral: true });
            else {
                if (mention.user.id === user.id)
                    messageOrInteraction.reply({ content: `Lo siento <@${user.id}>, ¡no podés banearte a vos mismo!`, ephemeral: true });
                else if (mention.user.id === ids.users.stormer || mention.user.id === ids.users.darkness)
                    messageOrInteraction.reply({ content: `Lo siento <@${user.id}>, los dueños de casa no pueden ser baneados.`, ephemeral: true });
                else {
                    args = args.splice(1);
                    if (args.length != 0) var banReason = args.join(" ");
                    else var banReason = null;
                    guild.members.fetch(mention.user.id).then(async member => {
                        await member.ban({ days: 0, reason: banReason }).then(async () => {
                            const array = [member.user.id, member.user.tag, banReason, user.id];
                            await addBan(array).then(async () => {
                                await updateBanned();
                                messageOrInteraction.reply({ content: `Hola <@${user.id}>, el usuario fue baneado correctamente.` });
                            }).catch(console.error);
                        }).catch(console.error);
                    }).catch(console.error);
                }
            }
        }).catch(console.error);
        return;
    }
}
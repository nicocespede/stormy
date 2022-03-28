const { ids, prefix, updateBanned, getBanned } = require('../../app/cache');
const { deleteBan } = require('../../app/postgres');

module.exports = {
    category: 'Moderación',
    description: 'Quita el baneo a un usuario (sólo para usuarios autorizados).',
    aliases: 'unban',
    options: [
        {
            name: 'indice',
            description: `El índice otorgado por el comando \`${prefix}baneados\`).`,
            required: true,
            type: 'NUMBER'
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<índice>',
    minArgs: 1,
    maxArgs: 1,

    callback: async ({ guild, user, message, args, interaction }) => {
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;
        guild.roles.fetch(ids.roles.banear).then(async role => {
            const index = parseInt(args[0]) - 1;
            var bans = getBanned();
            if (!role.members.has(user.id))
                messageOrInteraction.reply({ content: `Lo siento <@${user.id}>, no tenés autorización para desbanear usuarios.`, ephemeral: true });
            else if (index < 0 || index >= bans.length || isNaN(index))
                messageOrInteraction.reply({ content: `El índice ingresado es inválido.`, ephemeral: true });
            else {
                var ban = bans[index];
                if (user.id != ban['bans_responsible'] && ban['bans_responsible'] != "Desconocido")
                    messageOrInteraction.reply({ content: `Hola <@${user.id}>, no tenés permitido desbanear a este usuario ya que fue baneado por otra persona.`, ephemeral: true });
                else {
                    await guild.members.unban(ban['bans_id']).then(async () => {
                        messageOrInteraction.reply({ content: `Hola <@${user.id}>, el usuario fue desbaneado correctamente.` });
                    }).catch(console.error);
                }
            }
        }).catch(console.error);
        return;
    }
}
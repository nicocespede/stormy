const { Constants } = require('discord.js');
const { prefix, ids } = require('../../app/constants');

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
        const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
        var reply = { custom: true, ephemeral: true };
        await guild.roles.fetch(ids.roles.banear).then(async role => {
            var newNickname = args.slice(1).join(' ');
            if (!role.members.has(user.id))
                reply.content = `Lo siento <@${user.id}>, no tenés autorización para cambiar apodos.`;
            else if (!target)
                reply.content = `¡Uso incorrecto! Debe haber una mención y (opcionalmente) el nuevo apodo luego del comando. Usá **"${prefix}apodo <@amigo> [apodo]"**.`;
            else if (target.user.id === ids.users.bot)
                reply.content = `¡No podés cambiarme el apodo a mí!`;
            else if (newNickname.length > 32)
                reply.content = `El apodo no puede contener más de 32 caracteres.`;
            else {
                await target.setNickname(newNickname).then(() => {
                    reply.content = `Apodo de **${target.user.tag}** ${newNickname.length > 0 ? 'cambiado' : 'reseteado'} correctamente.`;
                    reply.ephemeral = false;
                }).catch(() => {
                    reply.content = 'Lo siento, no se pudo cambiar el apodo.';
                })
            }
        }).catch(console.error);
        return reply;
    }
}
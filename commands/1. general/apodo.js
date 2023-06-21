const { ApplicationCommandOptionType } = require('discord.js');
const { PREFIX } = require('../../src/constants');
const { getIds } = require('../../src/cache');
const { isOwner } = require('../../src/common');
const { getUserTag } = require('../../src/util');

module.exports = {
    category: 'General',
    description: 'Cambia el apodo a un amigo (sólo para usuarios autorizados).',
    options: [
        {
            name: 'amigo',
            description: 'La mención de quien recibe el nuevo apodo.',
            required: true,
            type: ApplicationCommandOptionType.User
        },
        {
            name: 'apodo',
            description: 'El apodo nuevo (si no se ingresa nada, el apodo se resetea).',
            required: false,
            type: ApplicationCommandOptionType.String
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<@amigo> [apodo]',
    minArgs: 1,

    callback: async ({ guild, user, message, args, interaction, instance }) => {
        const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
        const reply = { custom: true, ephemeral: true };
        const ids = await getIds();
        const role = await guild.roles.fetch(ids.roles.mod).catch(console.error);
        const isAuthorized = await isOwner(user.id) || role.members.has(user.id);
        const newNickname = args.slice(1).join(' ');
        if (!isAuthorized)
            reply.content = `⚠ Lo siento <@${user.id}>, no tenés autorización para cambiar apodos.`;
        else if (!target)
            reply.content = instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                REASON: "Debe haber una mención y (opcionalmente) el nuevo apodo luego del comando.",
                PREFIX: PREFIX,
                COMMAND: "apodo",
                ARGUMENTS: "`<@amigo>` `[apodo]`"
            });
        else if (target.user.id === ids.users.bot)
            reply.content = `⚠ ¡No podés cambiarme el apodo a mí!`;
        else if (newNickname.length > 32)
            reply.content = `⚠ El apodo no puede contener más de 32 caracteres.`;
        else {
            await target.setNickname(newNickname).then(() => {
                reply.content = `Apodo de **${getUserTag(target.user)}** ${newNickname.length > 0 ? 'cambiado' : 'reseteado'} correctamente.`;
                reply.ephemeral = false;
            }).catch(() => {
                reply.content = `❌ Lo siento, no se pudo cambiar el apodo.${target.id === ids.users.stormer ? ' Discord no me permite cambiarle el apodo al dueño del servidor. ☹' : ''}`;
            });
        }
        return reply;
    }
}
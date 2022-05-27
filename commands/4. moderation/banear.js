const { MessageButton, MessageActionRow, Constants } = require('discord.js');
const { addBanResponsible } = require('../../app/cache');
const { prefix, ids } = require('../../app/constants');

module.exports = {
    category: 'Moderación',
    description: 'Banea a un usuario (sólo para usuarios autorizados).',
    aliases: 'ban',
    options: [
        {
            name: 'amigo',
            description: 'La mención de quien recibe el ban.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.USER
        },
        {
            name: 'razón',
            description: 'La razón del baneo.',
            required: false,
            type: Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<@amigo> [razón]',
    minArgs: 1,

    callback: async ({ guild, user, message, args, interaction, channel }) => {
        const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
        const aux = args.splice(1).join(' ');
        const banReason = message ? (aux === '' ? null : aux) : interaction.options.getString('razón');
        var reply = { custom: true, ephemeral: true };
        const banRole = await guild.roles.fetch(ids.roles.banear).catch(console.error);
        if (!banRole.members.has(user.id)) {
            reply.content = `Lo siento <@${user.id}>, no tenés autorización para banear usuarios.`;
            return reply;
        } else if (!target) {
            reply.content = `¡Uso incorrecto! Debe haber una mención y (opcionalmente) la razón del baneo luego del comando. Usá **"${prefix}banear <@amigo> [razón]"**.`;
            return reply;
        } else if (target.user.id === user.id) {
            reply.content = `Lo siento <@${user.id}>, ¡no podés banearte a vos mismo!`;
            return reply;
        } else if (target.user.id === ids.users.stormer || target.user.id === ids.users.darkness) {
            reply.content = `Lo siento <@${user.id}>, los dueños de casa no pueden ser baneados.`;
            return reply;
        } else {
            const row = new MessageActionRow()
                .addComponents(new MessageButton().setCustomId('ban_yes')
                    .setEmoji('✔️')
                    .setLabel('Confirmar')
                    .setStyle('SUCCESS'))
                .addComponents(new MessageButton().setCustomId('ban_no')
                    .setEmoji('❌')
                    .setLabel('Cancelar')
                    .setStyle('DANGER'));
            const messageOrInteraction = message ? message : interaction;
            const replyMessage = await messageOrInteraction.reply({
                components: [row],
                content: `¿Estás seguro de querer banear a **${target.user.tag}**?`,
                ephemeral: true
            });

            const filter = (btnInt) => {
                return user.id === btnInt.user.id;
            }

            const collector = channel.createMessageComponentCollector({ filter, max: 1, time: 1000 * 15 });

            collector.on('end', async collection => {
                var edit = { components: [] };
                if (!collection.first())
                    edit.content = 'La acción expiró.';
                else if (collection.first().customId === 'ban_yes')
                    await target.ban({ days: 0, reason: banReason }).then(async () => {
                        addBanResponsible(target.user.id, user.id);
                        edit.content = 'La acción fue completada.';
                        channel.send({ content: `Hola <@${user.id}>, el usuario fue baneado correctamente.` });
                    }).catch(console.error);
                else
                    edit.content = 'La acción fue cancelada.';
                message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
            });
        }
        return;
    }
}
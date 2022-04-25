const { MessageButton, MessageActionRow, Constants } = require('discord.js');
const { getBanned, updateBanned } = require('../../app/cache');
const { prefix, ids } = require('../../app/constants');

module.exports = {
    category: 'Moderación',
    description: 'Quita el baneo a un usuario (sólo para usuarios autorizados).',
    aliases: 'unban',
    options: [
        {
            name: 'indice',
            description: `El índice otorgado por el comando \`${prefix}baneados\`).`,
            required: true,
            type: Constants.ApplicationCommandOptionTypes.INTEGER
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<índice>',
    minArgs: 1,
    maxArgs: 1,

    callback: async ({ guild, user, message, args, interaction, channel }) => {
        const number = message ? args[0] : interaction.options.getInteger('indice');
        var reply = { custom: true, ephemeral: true };
        const banRole = await guild.roles.fetch(ids.roles.banear).catch(console.error);
        const index = parseInt(number) - 1;
        const bans = !getBanned() ? await updateBanned() : getBanned();
        if (!banRole.members.has(user.id)) {
            reply.content = `Lo siento <@${user.id}>, no tenés autorización para desbanear usuarios.`;
            return reply;
        } else if (index < 0 || index >= bans.length || isNaN(index)) {
            reply.content = `El índice ingresado es inválido.`;
            return reply;
        } else {
            const ban = bans[index];
            if (user.id != ban['bans_responsible'] && ban['bans_responsible'] != "Desconocido") {
                reply.content = `Hola <@${user.id}>, no tenés permitido desbanear a este usuario ya que fue baneado por otra persona.`;
                return reply;
            } else {
                const row = new MessageActionRow()
                    .addComponents(new MessageButton().setCustomId('unban_yes')
                        .setEmoji('✔️')
                        .setLabel('Confirmar')
                        .setStyle('SUCCESS'))
                    .addComponents(new MessageButton().setCustomId('unban_no')
                        .setEmoji('❌')
                        .setLabel('Cancelar')
                        .setStyle('DANGER'));

                const messageOrInteraction = message ? message : interaction;
                const replyMessage = await messageOrInteraction.reply({
                    components: [row],
                    content: `¿Estás seguro de querer desbanear a **${ban['bans_user']}**?`,
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
                    else if (collection.first().customId === 'unban_yes')
                        await guild.members.unban(ban['bans_id']).then(async () => {
                            edit.content = 'La acción fue completada.';
                            channel.send({ content: `Hola <@${user.id}>, el usuario fue desbaneado correctamente.` });
                        }).catch(console.error);
                    else
                        edit.content = 'La acción fue cancelada.';
                    message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
                });
            }
        }
        return;
    }
}
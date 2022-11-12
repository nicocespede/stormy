const { ButtonBuilder, ActionRowBuilder, ApplicationCommandOptionType, ButtonStyle } = require('discord.js');
const { getBanned, updateBanned, getIds, updateIds } = require('../../src/cache');
const { prefix } = require('../../src/constants');
const { isOwner } = require('../../src/general');

module.exports = {
    category: 'Moderación',
    description: 'Quita el baneo a un usuario (sólo para usuarios autorizados).',
    aliases: 'unban',
    options: [
        {
            name: 'indice',
            description: `El índice otorgado por el comando \`${prefix}baneados\`.`,
            required: true,
            type: ApplicationCommandOptionType.Integer
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<índice>',
    minArgs: 1,
    maxArgs: 1,

    callback: async ({ guild, user, message, args, interaction, channel }) => {
        const number = message ? args[0] : interaction.options.getInteger('indice');
        const reply = { custom: true, ephemeral: true };
        const ids = getIds() || await updateIds();
        const banRole = await guild.roles.fetch(ids.roles.mod).catch(console.error);
        const isAuthorized = await isOwner(user.id) || banRole.members.has(user.id);
        const index = parseInt(number) - 1;
        const bans = getBanned() || await updateBanned();
        if (!isAuthorized) {
            reply.content = `⚠ Lo siento <@${user.id}>, no tenés autorización para desbanear usuarios.`;
            return reply;
        } else if (index < 0 || index >= Object.keys(bans).length || isNaN(index)) {
            reply.content = `⚠ El índice ingresado es inválido.`;
            return reply;
        } else {
            const id = Object.keys(bans)[index];
            const ban = bans[id];
            if (user.id != ban.responsible && ban.responsible != "Desconocido") {
                reply.content = `⚠ Hola <@${user.id}>, no tenés permitido desbanear a este usuario ya que fue baneado por otra persona.`;
                return reply;
            } else {
                const row = new ActionRowBuilder()
                    .addComponents(new ButtonBuilder().setCustomId('unban_yes')
                        .setEmoji('✔️')
                        .setLabel('Confirmar')
                        .setStyle(ButtonStyle.Success))
                    .addComponents(new ButtonBuilder().setCustomId('unban_no')
                        .setEmoji('❌')
                        .setLabel('Cancelar')
                        .setStyle(ButtonStyle.Danger));

                const messageOrInteraction = message ? message : interaction;
                const replyMessage = await messageOrInteraction.reply({
                    components: [row],
                    content: `⚠ ¿Estás seguro de querer desbanear a **${ban.user}**?`,
                    ephemeral: true
                });

                const filter = (btnInt) => {
                    return user.id === btnInt.user.id;
                }

                const collector = channel.createMessageComponentCollector({ filter, max: 1, time: 1000 * 15 });

                collector.on('end', async collection => {
                    const edit = { components: [] };
                    if (!collection.first())
                        edit.content = '⌛ La acción expiró.';
                    else if (collection.first().customId === 'unban_yes')
                        await guild.members.unban(id).then(async () => {
                            edit.content = '✅ La acción fue completada.';
                            channel.send({ content: `Hola <@${user.id}>, el usuario fue desbaneado correctamente.` });
                        }).catch(console.error);
                    else
                        edit.content = '❌ La acción fue cancelada.';
                    message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
                });
            }
        }
        return;
    }
}
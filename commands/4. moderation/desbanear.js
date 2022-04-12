const { MessageButton, MessageActionRow, Constants } = require('discord.js');
const { ids, prefix, getBanned, updateBanned } = require('../../app/cache');

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
        var messageOrInteraction = message ? message : interaction;
        guild.roles.fetch(ids.roles.banear).then(async role => {
            const index = parseInt(args[0]) - 1;
            var bans = !getBanned() ? await updateBanned() : getBanned();
            if (!role.members.has(user.id))
                messageOrInteraction.reply({ content: `Lo siento <@${user.id}>, no tenés autorización para desbanear usuarios.`, ephemeral: true });
            else if (index < 0 || index >= bans.length || isNaN(index))
                messageOrInteraction.reply({ content: `El índice ingresado es inválido.`, ephemeral: true });
            else {
                var ban = bans[index];
                if (user.id != ban['bans_responsible'] && ban['bans_responsible'] != "Desconocido")
                    messageOrInteraction.reply({ content: `Hola <@${user.id}>, no tenés permitido desbanear a este usuario ya que fue baneado por otra persona.`, ephemeral: true });
                else {
                    const row = new MessageActionRow()
                        .addComponents(new MessageButton().setCustomId('unban_yes')
                            .setEmoji('✔️')
                            .setLabel('Confirmar')
                            .setStyle('SUCCESS'))
                        .addComponents(new MessageButton().setCustomId('unban_no')
                            .setEmoji('❌')
                            .setLabel('Cancelar')
                            .setStyle('DANGER'));
                    var reply = await messageOrInteraction.reply({
                        content: `¿Estás seguro de querer desbanear a **${ban['bans_user']}**?`,
                        components: [row],
                        ephemeral: true
                    });

                    const filter = (btnInt) => {
                        return user.id === btnInt.user.id;
                    }

                    const collector = channel.createMessageComponentCollector({ filter, max: 1, time: 1000 * 15 });

                    collector.on('end', async collection => {
                        if (!collection.first()) {
                            if (message)
                                await reply.edit({ content: 'La acción expiró.', components: [], ephemeral: true });
                            else if (interaction)
                                await interaction.editReply({ content: 'La acción expiró.', components: [], ephemeral: true });
                        } else if (collection.first().customId === 'unban_yes')
                            await guild.members.unban(ban['bans_id']).then(async () => {
                                if (message)
                                    await reply.edit({ content: 'La acción fue completada.', components: [], ephemeral: true });
                                else if (interaction)
                                    await interaction.editReply({ content: 'La acción fue completada.', components: [], ephemeral: true });
                                await channel.send({ content: `Hola <@${user.id}>, el usuario fue desbaneado correctamente.`, components: [] });
                            }).catch(console.error);
                        else
                            if (message)
                                await reply.edit({ content: 'La acción fue cancelada.', components: [], ephemeral: true });
                            else if (interaction)
                                await interaction.editReply({ content: 'La acción fue cancelada.', components: [], ephemeral: true });
                    });
                }
            }
        }).catch(console.error);
        return;
    }
}
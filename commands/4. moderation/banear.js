const { MessageButton, MessageActionRow } = require('discord.js');
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

    callback: async ({ guild, user, message, args, interaction, channel }) => {
        var mention;
        if (message) {
            var messageOrInteraction = message;
            mention = message.mentions.members.first();
        } else if (interaction) {
            var messageOrInteraction = interaction;
            await guild.members.fetch(args[0]).then(member => mention = member).catch(console.error);
        }
        guild.roles.fetch(ids.roles.banear).then(async role => {
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
                    const row = new MessageActionRow()
                        .addComponents(new MessageButton().setCustomId('ban_yes')
                            .setEmoji('✔️')
                            .setLabel('Confirmar')
                            .setStyle('SUCCESS'))
                        .addComponents(new MessageButton().setCustomId('ban_no')
                            .setEmoji('❌')
                            .setLabel('Cancelar')
                            .setStyle('DANGER'));
                    var reply = await messageOrInteraction.reply({
                        content: `¿Estás seguro de querer banear a **${mention.user.tag}**?`,
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
                        } else if (collection.first().customId === 'ban_yes') {
                            args = args.splice(1);
                            if (args.length != 0) var banReason = args.join(" ");
                            else var banReason = null;
                            await mention.ban({ days: 0, reason: banReason }).then(async () => {
                                const array = [mention.user.id, mention.user.tag, banReason, user.id];
                                await addBan(array).then(async () => {
                                    if (message)
                                        await reply.edit({ content: 'La acción fue completada.', components: [], ephemeral: true });
                                    else if (interaction)
                                        await interaction.editReply({ content: 'La acción fue completada.', components: [], ephemeral: true });
                                    await channel.send({ content: `Hola <@${user.id}>, el usuario fue baneado correctamente.`, components: [] });
                                    await updateBanned();
                                }).catch(console.error);
                            }).catch(console.error);
                        } else
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
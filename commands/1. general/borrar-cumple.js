const { getBirthdays, prefix, updateBirthdays } = require('../../app/cache');
const { deleteBday } = require('../../app/postgres');
const { isAMention } = require('../../app/general');
const { MessageButton, MessageActionRow } = require('discord.js');

module.exports = {
    category: 'General',
    description: 'Borra el cumpleaños de un amigo.',
    aliases: ['borrar-cumpleaños', 'eliminar-cumple', 'eliminar-cumpleaños'],

    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '<@amigo>',
    slash: 'both',
    options: [
        {
            name: 'amigo',
            description: 'La mención del cumpleañero.',
            required: true,
            type: 'MENTIONABLE'
        }
    ],
    guildOnly: true,

    callback: async ({ guild, message, args, interaction, channel, user }) => {
        var mention;
        var bdays = [];
        if (message) {
            var messageOrInteraction = message;
            mention = message.mentions.members.first();
        } else if (interaction) {
            var messageOrInteraction = interaction;
            await guild.members.fetch(args[0]).then(member => mention = member).catch(console.error);
        }
        getBirthdays().forEach(bday => (bdays.push(bday['bdays_id'])));
        if (message && !isAMention(args[0]))
            messageOrInteraction.reply({ content: `¡Uso incorrecto! Debe haber una mención luego del comando. Usá **"${prefix}borrar-cumple <@amigo>"**.`, ephemeral: true });
        else if (!bdays.includes(mention.user.id))
            messageOrInteraction.reply({ content: `El cumpleaños que intentás borrar no existe.`, ephemeral: true });
        else {
            const row = new MessageActionRow()
                .addComponents(new MessageButton().setCustomId('delete_yes')
                    .setEmoji('✔️')
                    .setLabel('Confirmar')
                    .setStyle('SUCCESS'))
                .addComponents(new MessageButton().setCustomId('delete_no')
                    .setEmoji('❌')
                    .setLabel('Cancelar')
                    .setStyle('DANGER'));
            var reply = await messageOrInteraction.reply({
                content: `¿Estás seguro de querer borrar el cumpleaños de **${mention.user.tag}**?`,
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
                } else if (collection.first().customId === 'delete_yes') {
                    deleteBday(mention.user.id).then(async () => {
                        if (message)
                            await reply.edit({ content: 'La acción fue completada.', components: [], ephemeral: true });
                        else if (interaction)
                            await interaction.editReply({ content: 'La acción fue completada.', components: [], ephemeral: true });
                        await channel.send({ content: `El cumpleaños fue borrado de manera exitosa.`, components: [] });
                        await updateBirthdays();
                    }).catch(console.error);
                } else
                    if (message)
                        await reply.edit({ content: 'La acción fue cancelada.', components: [], ephemeral: true });
                    else if (interaction)
                        await interaction.editReply({ content: 'La acción fue cancelada.', components: [], ephemeral: true });

            });
        }
        return;
    }
}
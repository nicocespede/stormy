const { getBirthdays, updateBirthdays } = require('../../app/cache');
const { deleteBday } = require('../../app/postgres');
const { MessageButton, MessageActionRow, Constants } = require('discord.js');
const { prefix } = require('../../app/constants');
const { isListed } = require('../../app/general');

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
            type: Constants.ApplicationCommandOptionTypes.USER
        }
    ],
    guildOnly: true,

    callback: async ({ message, interaction, channel, user }) => {
        const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
        var birthdays = !getBirthdays() ? await updateBirthdays() : getBirthdays();
        if (!target)
            return { content: `¡Uso incorrecto! Debe haber una mención luego del comando. Usá **"${prefix}borrar-cumple <@amigo>"**.`, custom: true, ephemeral: true };
        else if (!isListed(target.user.id, birthdays, 'bdays_id'))
            return { content: `El cumpleaños que intentás borrar no existe.`, custom: true, ephemeral: true };
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

            const messageOrInteraction = message ? message : interaction;
            const reply = await messageOrInteraction.reply({
                components: [row],
                content: `¿Estás seguro de querer borrar el cumpleaños de **${target.user.tag}**?`,
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
                else if (collection.first().customId === 'delete_yes')
                    await deleteBday(target.user.id).then(async () => {
                        edit.content = 'La acción fue completada.';
                        channel.send({ content: `El cumpleaños fue borrado de manera exitosa.` });
                        updateBirthdays();
                    }).catch(console.error);
                else
                    edit.content = 'La acción fue cancelada.';
                message ? await reply.edit(edit) : await interaction.editReply(edit);
            });
        }
        return;
    }
}
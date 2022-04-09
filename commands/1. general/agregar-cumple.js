const { getBirthdays, prefix, updateBirthdays } = require('../../app/cache');
const { addBday } = require('../../app/postgres');
const { isAMention, sendBdayAlert } = require('../../app/general');
const { MessageActionRow, MessageButton, Constants } = require('discord.js');
var validDate = /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))$/g;

module.exports = {
    category: 'General',
    description: 'Guarda el cumpleaños de un amigo.',
    aliases: ['agregar-cumpleaños'],

    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '<@amigo> <DD/MM>',
    slash: 'both',
    options: [
        {
            name: 'amigo',
            description: 'La mención del cumpleañero.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.USER
        },
        {
            name: 'fecha',
            description: 'La fecha (DD/MM) del cumpleaños.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    guildOnly: true,

    callback: async ({ guild, message, args, interaction, client, channel, user }) => {
        var mention;
        var bdays = [];
        if (message) {
            var messageOrInteraction = message;
            mention = message.mentions.members.first();
        } else if (interaction) {
            var messageOrInteraction = interaction;
            await guild.members.fetch(args[0]).then(member => mention = member).catch(console.error);
        }
        var birthdays = !getBirthdays() ? await updateBirthdays() : getBirthdays();
        birthdays.forEach(bday => (bdays.push(bday['bdays_id'])));
        if (message && !isAMention(args[0]))
            messageOrInteraction.reply({ content: `¡Uso incorrecto! Debe haber una mención luego del comando. Usá **"${prefix}agregar-cumple <@amigo> <DD/MM>"**.`, ephemeral: true });
        else if (validDate.exec(args[1]) == null)
            messageOrInteraction.reply({ content: `La fecha debe estar en el formato DD/MM.`, ephemeral: true });
        else if (bdays.includes(mention.user.id))
            messageOrInteraction.reply({ content: `Este usuario ya tiene registrado su cumpleaños.`, ephemeral: true });
        else {
            const row = new MessageActionRow()
                .addComponents(new MessageButton().setCustomId('add_yes')
                    .setEmoji('✔️')
                    .setLabel('Confirmar')
                    .setStyle('SUCCESS'))
                .addComponents(new MessageButton().setCustomId('add_no')
                    .setEmoji('❌')
                    .setLabel('Cancelar')
                    .setStyle('DANGER'));
            var reply = await messageOrInteraction.reply({
                content: `¿Estás seguro de querer agregar el cumpleaños de **${mention.user.tag}** en la fecha **${args[1]}**?`,
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
                } else if (collection.first().customId === 'add_yes') {
                    var newArray = [mention.user.id, mention.user.username, args[1], false];
                    addBday(newArray).then(async () => {
                        if (message)
                            await reply.edit({ content: 'La acción fue completada.', components: [], ephemeral: true });
                        else if (interaction)
                            await interaction.editReply({ content: 'La acción fue completada.', components: [], ephemeral: true });
                        await channel.send({ content: `Se agregó el cumpleaños de **${mention.user.tag}** en la fecha ${args[1]}.`, components: [] });
                        await updateBirthdays();
                        sendBdayAlert(client);
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
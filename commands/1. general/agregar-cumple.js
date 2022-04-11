const { getBirthdays, prefix, updateBirthdays } = require('../../app/cache');
const { addBday } = require('../../app/postgres');
const { isAMention, sendBdayAlert } = require('../../app/general');
const { MessageActionRow, MessageButton, Constants } = require('discord.js');

const validateDate = (date) => {
    var ret = { valid: false, reason: 'La fecha debe estar en el formato DD/MM.' };
    if (date.length < 5) return ret;
    if (date.substring(2, 3) != '/') return ret;
    const split = date.split('/');
    const day = parseInt(split[0]);
    const month = parseInt(split[1]);
    if (isNaN(day) || isNaN(month)) return ret;
    ret.reason = 'La fecha es inválida.';
    if (day < 1 || day > 31 || month < 1 || month > 12) return ret;
    const thirtyDaysMonths = [4, 6, 9, 11];
    if (month === 2 && day > 29) return ret;
    else if (thirtyDaysMonths.includes(month) && day > 30) return ret;
    ret.valid = true;
    return ret;
}

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
        else if (!validateDate(args[1]).valid)
            messageOrInteraction.reply({ content: validateDate(args[1]).reason, ephemeral: true });
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
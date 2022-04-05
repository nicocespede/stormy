const { MessageEmbed } = require('discord.js');
const { getBirthdays, updateBirthdays } = require('../../app/cache');
const { deleteBday } = require('../../app/postgres');

module.exports = {
    category: 'General',
    description: 'Responde con la lista de cumpleaños almacenados.',
    aliases: ['cumpleaños'],

    maxArgs: 0,
    slash: 'both',
    guildOnly: true,

    callback: async ({ guild, user, message, channel, interaction }) => {
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;
        var birthdays = getBirthdays();
        var months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        var usersField = { name: 'Usuario', value: '', inline: true };
        var datesField = { name: 'Fecha', value: '', inline: true };
        var previousMonth = -1;
        for (var i = 0; i < birthdays.length; i++) {
            const actualBday = birthdays[i];
            await guild.members.fetch(actualBday['bdays_id']).then(member => {
                var month = parseInt(actualBday['bdays_date'].substring(3, 5)) - 1;
                if (previousMonth != month) {
                    usersField.value += `\n**${months[month]}**\n`;
                    datesField.value += `\n\u200b\n`;
                }
                usersField.value += `${member.user.username}\n`;
                datesField.value += `${actualBday['bdays_date']}\n`;
                previousMonth = month;
            }).catch(() => deleteBday(actualBday['bdays_id']).then(async () => {
                await updateBirthdays();
                channel.send(`Se eliminó el cumpleaños de **${actualBday['bdays_user']}** (el **${actualBday['bdays_date']}**) ya que el usuario no está más en el servidor.`);
            }).catch(console.error));
        }
        messageOrInteraction.reply({
            embeds: [new MessageEmbed()
                .setTitle(`**Cumpleaños**`)
                .setDescription(`Hola <@${user.id}>, los cumpleaños registrados son:\n\n`)
                .setColor([237, 0, 0])
                .addFields([usersField, datesField])
                .setThumbnail(`attachment://bday.png`)],
            files: [`./assets/thumbs/bday.png`],
            ephemeral: true
        });
        return;
    }
}
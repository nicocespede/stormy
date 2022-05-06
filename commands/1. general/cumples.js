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

    callback: async ({ guild, user, channel }) => {
        const birthdays = !getBirthdays() ? await updateBirthdays() : getBirthdays();
        var months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        var usersField = { name: 'Usuario', value: '', inline: true };
        var datesField = { name: 'Fecha', value: '', inline: true };
        var previousMonth = -1;
        for (const key in birthdays)
            if (Object.hasOwnProperty.call(birthdays, key)) {
                const bday = birthdays[key];
                await guild.members.fetch(key).then(member => {
                    const month = parseInt(bday.date.substring(3, 5)) - 1;
                    if (previousMonth != month) {
                        usersField.value += `\n**${months[month]}**\n`;
                        datesField.value += `\n\u200b\n`;
                    }
                    usersField.value += `${member.user.username}\n`;
                    datesField.value += `${bday.date}\n`;
                    previousMonth = month;
                }).catch(() => deleteBday(key).then(async () => {
                    await updateBirthdays();
                    channel.send(`Se eliminó el cumpleaños de **${bday.user}** (el **${bday.date}**) ya que el usuario no está más en el servidor.`);
                }).catch(console.error));
            }

        return {
            custom: true,
            embeds: [new MessageEmbed()
                .setTitle(`**Cumpleaños**`)
                .setDescription(`Hola <@${user.id}>, los cumpleaños registrados son:\n\n`)
                .setColor([237, 0, 0])
                .addFields([usersField, datesField])
                .setThumbnail(`attachment://bday.png`)],
            ephemeral: true,
            files: [`./assets/thumbs/bday.png`]
        };
    }
}
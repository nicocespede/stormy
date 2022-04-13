const { MessageEmbed } = require('discord.js');
const { getStats, updateStats, addTimestamp, getTimestamps } = require('../../app/cache');
const { pushDifference } = require('../../app/general');

const timeToString = (seconds, minutes, hours, days) => {
    var ret = '';
    if (days != 0) {
        if (days == 1)
            ret += days + ' día';
        else
            ret += days + ' días';
    }
    if (hours != 0) {
        if (ret != '')
            ret += ', ';
        if (hours == 1)
            ret += hours + ' hora';
        else
            ret += hours + ' horas';
    }
    if (minutes != 0) {
        if (ret != '')
            ret += ', ';
        if (minutes == 1)
            ret += minutes + ' minuto';
        else
            ret += minutes + ' minutos';
    }
    if (seconds != 0) {
        if (ret != '')
            ret += ', ';
        if (seconds == 1)
            ret += seconds + ' segundo';
        else
            ret += seconds + ' segundos';
    }
    return ret;
}

module.exports = {
    category: 'General',
    description: 'Responde con las estadísticas de los usuarios del servidor.',

    maxArgs: 0,
    slash: 'both',
    guildOnly: true,

    callback: async ({ guild, message, interaction, user }) => {
        if (message) var deferringMessage = await message.reply({ content: 'Obteniendo estadísticas, por favor aguardá unos segundos...' });
        else if (interaction) await interaction.deferReply({ ephemeral: true });
        var timestamps = getTimestamps();
        for (const key in timestamps)
            if (Object.hasOwnProperty.call(timestamps, key)) {
                await pushDifference(key);
                addTimestamp(key, new Date());
            }
        var stats = !getStats() ? await updateStats() : getStats();
        var usersField = { name: 'Usuario', value: '', inline: true };
        var timeField = { name: 'Tiempo', value: ``, inline: true };
        for (var i = 0; i < stats.length; i++) {
            const actualStat = stats[i];
            await guild.members.fetch(actualStat['stats_id']).then(member => {
                usersField.value += `**${i + 1}. **${member.user.tag}\n\n`;
            }).catch(() => console.log(`> El usuario con ID ${actualStat['stats_id']} ya no está en el servidor.`));
            timeField.value += `${timeToString(actualStat['stats_seconds'], actualStat['stats_minutes'], actualStat['stats_hours'], actualStat['stats_days'])}\n\n`;
        }
        const embed = new MessageEmbed()
            .setTitle(`**Estadísticas**`)
            .setDescription(`Hola <@${user.id}>, el tiempo de conexión en chats de voz de los usuarios es:\n\n${usersField.value.length === 0 ? '_No hay estadísticas actualmente._' : ''}`)
            .addFields(usersField.value.length != 0 ? [usersField, timeField] : [])
            .setColor([255, 205, 52])
            .setThumbnail(`attachment://stats.jpg`);
        if (message) deferringMessage.edit({ content: ``, embeds: [embed], files: ['./assets/thumbs/stats.jpg'] });
        else if (interaction) interaction.editReply({ embeds: [embed], files: ['./assets/thumbs/stats.jpg'] });
        return;
    }
}
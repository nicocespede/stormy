const { MessageEmbed } = require('discord.js');
const { getStats, updateStats, addTimestamp, getTimestamps } = require('../../app/cache');
const { pushDifference } = require('../../app/general');

const timeToString = (seconds, minutes, hours, days) => {
    var ret = '';
    if (days != 0)
        ret += days + ` día${days > 1 ? 's' : ''}`;
    if (hours != 0)
        ret += (ret != '' ? ', ' : '') + hours + ` hora${hours > 1 ? 's' : ''}`;
    if (minutes != 0)
        ret += (ret != '' ? ', ' : '') + minutes + ` minuto${minutes > 1 ? 's' : ''}`;
    if (seconds != 0)
        ret += (ret != '' ? ', ' : '') + seconds + ` segundo${seconds > 1 ? 's' : ''}`;
    return ret;
}

module.exports = {
    category: 'General',
    description: 'Responde con las estadísticas de los usuarios del servidor.',
    aliases: ['estadísticas'],

    maxArgs: 0,
    slash: 'both',
    guildOnly: true,

    callback: async ({ guild, message, interaction, user }) => {
        const deferringMessage = message ? await message.reply({ content: 'Obteniendo estadísticas, por favor aguardá unos segundos...' })
            : await interaction.deferReply({ ephemeral: true });
        var timestamps = getTimestamps();
        for (const key in timestamps)
            if (Object.hasOwnProperty.call(timestamps, key)) {
                await pushDifference(key);
                addTimestamp(key, new Date());
            }
        var stats = !getStats() ? await updateStats() : getStats();
        var usersField = { name: 'Usuario', value: '', inline: true };
        var timeField = { name: 'Tiempo', value: ``, inline: true };
        var aux1 = '';
        var aux2 = '';
        var needsFooter = false;
        var counter = 0;
        for (var i = 0; i < stats.length; i++) {
            const actualStat = stats[i];
            await guild.members.fetch(actualStat['stats_id']).then(member => {
                counter++;
                aux1 = usersField.value + `**${counter}. **${member.user.tag}\n\n`;
                aux2 = timeField.value + `${timeToString(actualStat['stats_seconds'], actualStat['stats_minutes'], actualStat['stats_hours'], actualStat['stats_days'])}\n\n`;
            }).catch(() => console.log(`> El usuario con ID ${actualStat['stats_id']} ya no está en el servidor.`));
            if (aux1.length <= 1024 || aux2.length <= 1024) {
                usersField.value = aux1;
                timeField.value = aux2;
            } else {
                needsFooter = true;
                break;
            }
        }
        const embed = new MessageEmbed()
            .setTitle(`**Estadísticas**`)
            .setDescription(`Hola <@${user.id}>, el tiempo de conexión en chats de voz de los usuarios es:\n\n${usersField.value.length === 0 ? '_No hay estadísticas actualmente._' : ''}`)
            .addFields(usersField.value.length != 0 ? [usersField, timeField] : [])
            .setColor([255, 205, 52])
            .setThumbnail(`attachment://stats.jpg`)
            .setFooter({ text: needsFooter ? 'Si no aparecés en la lista significa que estás muy abajo como para aparecer, ¡conectáte más seguido!' : '' });

        const reply = { content: null, embeds: [embed], files: ['./assets/thumbs/stats.jpg'] };
        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
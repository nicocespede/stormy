const { EmbedBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const { getStats, updateStats, addTimestamp, getTimestamps } = require('../../app/cache');
const { pushDifference } = require('../../app/general');
const { ids } = require('../../app/constants');
const Versions = {
    full: ['día', 'hora', 'minuto', 'segundo'],
    short: ['día', 'hora', 'min.', 'seg.']
};

const timeToString = (version, seconds, minutes, hours, days) => {
    const strings = Versions[version];
    var ret = '';
    if (days != 0)
        ret += days + ` ${strings[0]}${days > 1 ? 's' : ''}`;
    if (hours != 0)
        ret += (ret != '' ? ', ' : '') + hours + ` ${strings[1]}${hours > 1 ? 's' : ''}`;
    if (minutes != 0)
        ret += (ret != '' ? ', ' : '') + minutes + ` ${strings[2]}${version === 'full' && minutes > 1 ? 's' : ''}`;
    if (seconds != 0)
        ret += (ret != '' ? ', ' : '') + Math.trunc(seconds) + ` ${strings[3]}${version === 'full' && seconds > 1 ? 's' : ''}`;
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
        const timestamps = getTimestamps();
        for (const key in timestamps)
            if (Object.hasOwnProperty.call(timestamps, key)) {
                await pushDifference(key);
                addTimestamp(key, new Date());
            }
        const stats = !getStats() ? await updateStats() : getStats();
        var usersField = { name: 'Usuario', value: '', inline: true };
        var timeField = { name: 'Tiempo', value: ``, inline: true };
        var aux1 = '';
        var aux2 = '';
        var needsFooter = false;
        const canvas = createCanvas(200, 200);
        const ctx = canvas.getContext('2d');
        var counter = 1;
        for (const key in stats) {
            if (Object.hasOwnProperty.call(stats, key)) {
                const stat = stats[key];
                await guild.members.fetch(key).then(member => {
                    aux1 = usersField.value + `**${key === ids.users.bot ? '🤖' : `${counter++}.`} **${member.user.tag}\n\n`;
                    aux2 = timeField.value + `${timeToString('full', stat.seconds, stat.minutes, stat.hours, stat.days)}\n\n`;
                    if (ctx.measureText(aux2).width >= 182)
                        aux2 = timeField.value + `${timeToString('short', stat.seconds, stat.minutes, stat.hours, stat.days)}\n\n`;
                }).catch(() => console.log(`> El usuario con ID ${key} ya no está en el servidor.`));
                if (aux1.length <= 1024 && aux2.length <= 1024) {
                    usersField.value = aux1;
                    timeField.value = aux2;
                } else {
                    needsFooter = true;
                    break;
                }
            }
        }
        const embed = new EmbedBuilder()
            .setTitle(`**Estadísticas**`)
            .setDescription(`Hola <@${user.id}>, el tiempo de conexión en chats de voz de los usuarios es:\n\n${usersField.value.length === 0 ? '_No hay estadísticas actualmente._' : ''}`)
            .addFields(usersField.value.length != 0 ? [usersField, timeField] : [])
            .setColor([255, 205, 52])
            .setThumbnail(`attachment://stats.jpg`)

        if (needsFooter)
            embed.setFooter({ text: 'Si no aparecés en la lista significa que estás muy abajo como para aparecer, ¡conectáte más seguido!' });

        const reply = { content: null, embeds: [embed], files: ['./assets/thumbs/stats.jpg'] };
        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
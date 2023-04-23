const { EmbedBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const { getStats, updateStats, addTimestamp, getTimestamps } = require('../../src/cache');
const { pushDifference } = require('../../src/common');
const { log } = require('../../src/util');
const { GITHUB_RAW_URL, CONSOLE_YELLOW } = require('../../src/constants');
const Versions = {
    full: ['día', 'hora', 'minuto', 'segundo'],
    short: ['día', 'hora', 'min.', 'seg.']
};

const timeToString = (version, seconds, minutes, hours, days) => {
    const strings = Versions[version];
    let ret = '';
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

    callback: async ({ guild, message, interaction, user, instance }) => {
        const deferringMessage = message ? await message.reply({ content: 'Obteniendo estadísticas, por favor aguardá unos segundos...' })
            : await interaction.deferReply({ ephemeral: true });
        const timestamps = getTimestamps();
        for (const key in timestamps)
            if (Object.hasOwnProperty.call(timestamps, key)) {
                await pushDifference(key);
                addTimestamp(key, new Date());
            }
        const stats = getStats() || await updateStats();
        let description = `Hola <@${user.id}>, el tiempo de conexión en chats de voz de los usuarios es:\n\n`;
        let fields = [];
        let needsFooter = false;

        if (Object.keys(stats).length === 0)
            description += '_No hay estadísticas actualmente._';
        else {
            const canvas = createCanvas(200, 200);
            const ctx = canvas.getContext('2d');
            const members = await guild.members.fetch(Object.keys(stats)).catch(console.error);
            const usersField = { name: 'Usuario', value: '', inline: true };
            const timeField = { name: 'Tiempo', value: ``, inline: true };

            let counter = 1;
            for (const key in stats) if (Object.hasOwnProperty.call(stats, key)) {
                const member = members.get(key);

                if (!member) {
                    log(`> El usuario con ID ${key} ya no está en el servidor.`, CONSOLE_YELLOW);
                    continue;
                }

                const { seconds, minutes, hours, days } = stats[key];
                const aux1 = usersField.value + `**${member.user.bot ? '🤖' : `${counter++}.`} **${member.user.tag.replace(/_/g, '\\_')}\n\n`;
                let aux2 = timeField.value + `${timeToString('full', seconds, minutes, hours, days)}\n\n`;
                if (ctx.measureText(aux2).width >= 182)
                    aux2 = timeField.value + `${timeToString('short', seconds, minutes, hours, days)}\n\n`;
                if (aux1.length <= 1024 && aux2.length <= 1024) {
                    usersField.value = aux1;
                    timeField.value = aux2;
                } else {
                    needsFooter = true;
                    break;
                }
            }

            fields = [usersField, timeField];
        }
        const embed = new EmbedBuilder()
            .setTitle(`**Estadísticas**`)
            .setDescription(description)
            .addFields(fields)
            .setColor(instance.color)
            .setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/bar-chart.png`)

        if (needsFooter)
            embed.setFooter({ text: 'Si no aparecés en la lista significa que estás muy abajo como para aparecer, ¡conectáte más seguido!' });

        const reply = { content: null, embeds: [embed] };
        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
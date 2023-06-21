const { ICommand } = require('wokcommands');
const { EmbedBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const { getStats, getTimestamps, getGithubRawUrl } = require('../../src/cache');
const { pushDifferences } = require('../../src/common');
const { consoleLog, logToFile, logToFileCommandUsage, getUserTag } = require('../../src/util');
const { CONSOLE_YELLOW, EMBED_FIELD_VALUE_MAX_LENGTH } = require('../../src/constants');
const Versions = {
    full: ['día', 'hora', 'minuto', 'segundo'],
    short: ['día', 'hora', 'min.', 'seg.']
};

const COMMAND_NAME = 'estadisticas';
const MODULE_NAME = `commands.general.${COMMAND_NAME}`;

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

/**@type {ICommand}*/
module.exports = {
    category: 'General',
    description: 'Responde con las estadísticas de los usuarios del servidor.',
    aliases: ['estadísticas'],

    maxArgs: 0,
    slash: 'both',
    guildOnly: true,

    callback: async ({ guild, instance, interaction, message, user }) => {
        logToFileCommandUsage(COMMAND_NAME, null, interaction, user);

        const deferringMessage = message ? await message.reply({ content: 'Obteniendo estadísticas, por favor aguardá unos segundos...' })
            : await interaction.deferReply({ ephemeral: true });

        const timestamps = getTimestamps();
        if (Object.keys(timestamps).length > 0) {
            logToFile(`${MODULE_NAME}.callback`, `Pushing all stats and restarting all timestamps`);

            await pushDifferences(true);
        }

        const stats = await getStats();
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
                    consoleLog(`> El usuario con ID ${key} ya no está en el servidor.`, CONSOLE_YELLOW);
                    continue;
                }

                const { seconds, minutes, hours, days } = stats[key];
                const aux1 = usersField.value + `**${member.user.bot ? '🤖' : `${counter++}.`} **${getUserTag(member.user).replace(/_/g, '\\_')}\n\n`;
                let aux2 = timeField.value + `${timeToString('full', seconds, minutes, hours, days)}\n\n`;
                if (ctx.measureText(aux2).width >= 182)
                    aux2 = timeField.value + `${timeToString('short', seconds, minutes, hours, days)}\n\n`;
                if (aux1.length <= EMBED_FIELD_VALUE_MAX_LENGTH && aux2.length <= EMBED_FIELD_VALUE_MAX_LENGTH) {
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
            .setThumbnail(await getGithubRawUrl('assets/thumbs/bar-chart.png'));

        if (needsFooter)
            embed.setFooter({ text: 'Si no aparecés en la lista significa que estás muy abajo como para aparecer, ¡conectáte más seguido!' });

        const reply = { content: null, embeds: [embed] };
        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
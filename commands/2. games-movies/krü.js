const { EmbedBuilder } = require('discord.js');
const { updateKruMatches, getGithubRawUrl } = require('../../src/cache');
const { ARGENTINA_LOCALE_STRING } = require('../../src/constants');
const { convertTZ } = require('../../src/util');

module.exports = {
    category: 'Juegos/Películas',
    description: 'Ver los próximos partidos agendados de KRÜ.',
    aliases: ['kru'],

    maxArgs: 0,
    slash: 'both',

    callback: async ({ message, interaction, instance }) => {
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });

        const reply = { ephemeral: true };
        const duelsField = { name: 'Enfrentamiento', value: '', inline: true };
        const datesField = { name: 'Fecha', value: '', inline: true };
        const urlsField = { name: 'Detalles', value: '', inline: true };

        const matches = await updateKruMatches();
        for (const m in matches) if (Object.hasOwnProperty.call(matches, m)) {
            const { date, remaining, team1Tag, team2Tag, url } = matches[m];
            duelsField.value += `**${team1Tag}** vs **${team2Tag}**\n\n`;
            const convertedDate = convertTZ(date);
            const dateInt = convertedDate.getDate();
            const month = convertedDate.getMonth() + 1;
            datesField.value += `${dateInt < 10 ? `0${dateInt}` : dateInt}/${month < 10 ? `0${month}` : month} ${convertedDate.toLocaleTimeString(ARGENTINA_LOCALE_STRING, { timeStyle: 'short' })} **(${remaining})**\n\n`;
            urlsField.value += `**[🔗](${url})**\n\n`;
        }

        if (message) reply.content = null;
        reply.embeds = [new EmbedBuilder()
            .setTitle(`**Próximos partidos de KRÜ Esports**`)
            .setColor(instance.color)
            .setThumbnail(await getGithubRawUrl('assets/thumbs/kru.png'))];

        if (duelsField.value !== ``) {
            reply.embeds[0].setFields([duelsField, datesField, urlsField]);
            reply.embeds[0].setFooter({ text: 'Información extraída de vlr.gg' });
        } else
            reply.embeds[0].setDescription('_No hay partidos programados por el momento._');

        try {
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        } catch {
            reply.content = '❌ Lo siento, ocurrió un error al obtener la información de los partidos.'
            reply.embeds = [];
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        }
        return;
    }
}
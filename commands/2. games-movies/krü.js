const { EmbedBuilder } = require('discord.js');
const { getUpcomingMatches, convertTime } = require('../../app/general');

module.exports = {
    category: 'Juegos/Películas',
    description: 'Ver los próximos partidos agendados de KRÜ.',
    aliases: ['kru'],

    maxArgs: 0,
    slash: 'both',

    callback: async ({ message, interaction }) => {
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });

        var reply = { ephemeral: true };
        const duelsField = { name: 'Enfrentamiento', value: '', inline: true };
        const datesField = { name: 'Fecha', value: '', inline: true };
        const urlsField = { name: 'Detalles', value: '', inline: true };

        const matches = await getUpcomingMatches();
        for (const m in matches)
            if (Object.hasOwnProperty.call(matches, m)) {
                const match = matches[m];
                duelsField.value += `**${match.team1Tag}** vs **${match.team2Tag}**\n\n`;
                const date = match.date.split('/').slice(1).reverse().join('/');
                datesField.value += `${date} ${convertTime(match.time)} **(${match.remaining})**\n\n`;
                urlsField.value += `**[🌐](${match.url})**\n\n`;
            }

        if (message) reply.content = null;
        reply.embeds = [new EmbedBuilder()
            .setTitle(`**Próximos partidos de KRÜ Esports**`)
            .setColor([255, 18, 147])
            .setThumbnail(`attachment://kru.png`)];
        if (duelsField.value != ``) {
            reply.embeds[0].setFields([duelsField, datesField, urlsField]);
            reply.embeds[0].setFooter({ text: 'Información extraída de vlr.gg' });
        }
        else
            reply.embeds[0].setDescription('_No hay partidos programados por el momento._');
        reply.files = ['./assets/thumbs/kru.png'];
        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
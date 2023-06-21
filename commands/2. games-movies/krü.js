const { ICommand } = require('wokcommands');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { updateKruMatches, getGithubRawUrl } = require('../../src/cache');
const { ARGENTINA_LOCALE_STRING, EMBED_FIELD_VALUE_MAX_LENGTH } = require('../../src/constants');
const { convertTZ, logToFileSubCommandUsage } = require('../../src/util');

/**@type {ICommand}*/
module.exports = {
    category: 'Juegos/Películas',
    description: 'Ver los próximos partidos agendados de KRÜ.',
    aliases: ['kru'],

    options: [{
        name: 'completados',
        description: 'Responde con la lista de partidos completados de KRÜ.',
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: 'proximos',
        description: 'Responde con la lista de próximos partidos de KRÜ.',
        type: ApplicationCommandOptionType.Subcommand
    }],

    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '<subcomando>',
    slash: 'both',

    callback: async ({ args, instance, interaction, message, text, user }) => {
        const subCommand = message ? args.shift() : interaction.options.getSubcommand();
        logToFileSubCommandUsage('krü', text, subCommand, interaction, user);

        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });

        const reply = { ephemeral: true };

        const duelsField = { name: 'Enfrentamiento', value: '', inline: true };
        const datesField = { name: 'Fecha', value: '', inline: true };
        const urlsField = { name: 'Detalles', value: '', inline: true };

        const embed = new EmbedBuilder().setColor(instance.color).setThumbnail(await getGithubRawUrl('assets/thumbs/kru.png'));
        let title;
        let description;

        if (subCommand === 'proximos') {
            const matches = await updateKruMatches('upcoming');
            for (const { date, remaining, team1Tag, team2Tag, url } of matches) {
                duelsField.value += `**${team1Tag}** vs **${team2Tag}**\n\n`;
                const convertedDate = convertTZ(date);
                const dateInt = convertedDate.getDate();
                const month = convertedDate.getMonth() + 1;
                datesField.value += `${`${dateInt}`.padStart(2, '0')}/${`${month}`.padStart(2, '0')} ${convertedDate.toLocaleTimeString(ARGENTINA_LOCALE_STRING, { timeStyle: 'short' })} **(${remaining})**\n\n`;
                urlsField.value += `**[🔗](${url})**\n\n`;
            }

            title = `Próximos partidos de KRÜ Esports`;
            description = '_No hay próximos partidos por el momento._';
        } else {
            const matches = await updateKruMatches('completed');
            for (const { date, score, team1Tag, team2Name, url } of matches) {
                const convertedDate = convertTZ(date);
                const dateInt = convertedDate.getDate();
                const month = convertedDate.getMonth() + 1;

                const newDuel = `**${team1Tag}** ${score} **${team2Name}**\n\n`;
                const newDate = `${`${dateInt}`.padStart(2, '0')}/${`${month}`.padStart(2, '0')} ${convertedDate.toLocaleTimeString(ARGENTINA_LOCALE_STRING, { timeStyle: 'short' })}\n\n`;
                const newUrl = `**[🔗](${url})**\n\n`;

                const duelAux = duelsField.value + newDuel;
                const datesAux = datesField.value + newDate;
                const urlsAux = urlsField.value + newUrl;

                if (duelAux.length > EMBED_FIELD_VALUE_MAX_LENGTH
                    || datesAux.length > EMBED_FIELD_VALUE_MAX_LENGTH
                    || urlsAux.length > EMBED_FIELD_VALUE_MAX_LENGTH)
                    break;

                duelsField.value += newDuel;
                datesField.value += newDate;
                urlsField.value += newUrl;
            }

            title = `Partidos completados de KRÜ Esports`;
            description = '_No hay partidos completados por el momento._';
        }

        if (duelsField.value !== ``) {
            embed.setFields([duelsField, datesField, urlsField]);
            embed.setFooter({ text: 'Información extraída de vlr.gg' });
        } else
            embed.setDescription(description);

        if (message) reply.content = null;
        reply.embeds = [embed.setTitle(title)];

        try {
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        } catch {
            reply.content = '❌ Lo siento, ocurrió un error al obtener la información de los partidos.'
            reply.embeds = [];
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        }
    }
}
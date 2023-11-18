const { ICommand } = require("wokcommands");
const { EmbedBuilder, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Genius = require("genius-lyrics");
const Client = new Genius.Client();
const { getIds, getGithubRawUrl } = require('../../src/cache');
const { splitLyrics, handleErrorEphemeral } = require('../../src/music');
const { consoleLogError, logToFileError, logToFileCommandUsage, getWarningEmbed, getSimpleEmbed } = require('../../src/util');
const { getErrorEmbed } = require("../../src/common");

const COMMAND_NAME = 'letra';
const MODULE_NAME = 'commands.music.' + COMMAND_NAME;

/**@type {ICommand}*/
module.exports = {
    category: 'Música',
    description: 'Muestra la letra de la canción ingresada.',
    aliases: ['lyrics'],
    options: [
        {
            name: 'canción',
            description: 'El nombre de la canción de la que se quiere la letra.',
            required: true,
            type: ApplicationCommandOptionType.String
        }
    ],
    slash: 'both',

    minArgs: 1,
    expectedArgs: '[canción]',
    guildOnly: true,

    callback: async ({ channel, instance, interaction, message, text, user }) => {
        logToFileCommandUsage(COMMAND_NAME, text, interaction, user);

        const song = message ? text : interaction.options.getString('canción');
        const reply = { ephemeral: true, fetchReply: true };

        const ids = await getIds();
        if (!ids.channels.musica.includes(channel.id)) {
            handleErrorEphemeral(reply, new EmbedBuilder().setColor(instance.color), `🛑 Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, message, interaction, channel);
            return;
        }

        if (interaction)
            await interaction.deferReply(reply);

        try {
            const searches = await Client.songs.search(song);

            const firstSong = searches[0];

            if (!firstSong) {
                reply.embeds = [getWarningEmbed('¡No se encontraron resultados de letras para la canción ingresada!')
                    .setColor(instance.color)
                    .setThumbnail(await getGithubRawUrl(`assets/thumbs/music/no-entry.png`))];
                message ? await message.reply(reply) : await interaction.editReply(reply);
                return;
            }

            let lyrics = await firstSong.lyrics();
            lyrics = lyrics.replace(/[[]/g, '**[').replace(/[\]]/g, ']**');

            const embeds = [];

            const chunks = splitLyrics(lyrics);
            for (const chunk of chunks)
                embeds.push(getSimpleEmbed(chunk)
                    .setThumbnail(await getGithubRawUrl(`assets/thumbs/genius.png`)));
            embeds[embeds.length - 1].setFooter({ text: 'Letra obtenida de genius.com' });

            const getRow = () => {
                const row = new ActionRowBuilder();

                row.addComponents(new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⬅')
                    .setLabel('Anterior')
                    .setDisabled(page === 0));

                row.addComponents(new ButtonBuilder()
                    .setCustomId('next_page')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('➡')
                    .setLabel('Siguiente')
                    .setDisabled(page === embeds.length - 1));

                return row;
            };

            let page = 0;

            reply.components = embeds.length > 1 ? [getRow()] : [];
            reply.embeds = [embeds[page]];

            const targetMessage = message ? await message.reply(reply) : await interaction.editReply(reply);

            if (embeds.length > 1) {
                const filter = btnInt => user.id === btnInt.user.id;
                const collector = targetMessage.createMessageComponentCollector({ filter, idle: 1000 * 60 * 10 });

                collector.on('collect', async btnInt => {
                    if (!btnInt.isButton()) return;

                    if (btnInt.customId === 'prev_page' && page > 0) --page;
                    else if (btnInt.customId === 'next_page' && page < embeds.length - 1) ++page;

                    reply.components = [getRow()];
                    reply.embeds = [embeds[page]];

                    btnInt.update(reply);
                });

                collector.on('end', async _ => {
                    if (message) {
                        targetMessage.delete();
                        message.delete();
                    } else
                        interaction.editReply({
                            components: [], embeds: [getSimpleEmbed('⌛ Esta acción expiró...')
                                .setThumbnail(await getGithubRawUrl(`assets/thumbs/music/hourglass-sand-top.png`))]
                        });
                });
            }
        } catch (error) {
            consoleLogError('> Error al enviar mensaje de letra de canción');
            logToFileError(MODULE_NAME, error);

            const errorReply = { embeds: [await getErrorEmbed('¡Lo siento, ocurrió un error!')] };
            try {
                message ? await message.reply(reply) : await interaction.editReply(reply);
            } catch (error) {
                await channel.send(errorReply);
            }
        }
    }
}
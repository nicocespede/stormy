const { EmbedBuilder, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { githubRawURL } = require('../../app/constants');
const Genius = require("genius-lyrics");
const Client = new Genius.Client();
const { getIds, updateIds } = require('../../app/cache');
const { splitLyrics } = require('../../app/music');

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

    callback: async ({ user, message, channel, interaction, text, instance }) => {
        const messageOrInteraction = message ? message : interaction;
        const song = message ? text : interaction.options.getString('canción');
        const reply = { custom: true, ephemeral: true };

        const ids = getIds() || await updateIds();
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `🛑 Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            return reply;
        }

        try {
            const searches = await Client.songs.search(song);

            const firstSong = searches[0];
            let lyrics = await firstSong.lyrics();
            lyrics = lyrics.replace(/[[]/g, '**[').replace(/[\]]/g, ']**');

            const embeds = [];

            const chunks = splitLyrics(lyrics);
            for (const chunk of chunks)
                embeds.push(new EmbedBuilder()
                    .setDescription(chunk)
                    .setThumbnail(`${githubRawURL}/assets/thumbs/genius.png`)
                    .setColor(instance.color));
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

            const targetMessage = await messageOrInteraction.reply(reply);

            if (embeds.length > 1) {
                const filter = btnInt => user.id === btnInt.user.id;
                const collector = targetMessage.createMessageComponentCollector({ filter, idle: 1000 * 60 * 10 });

                collector.on('collect', async btnInt => {
                    if (!btnInt) return;

                    if (btnInt.customId === 'prev_page' && page > 0) --page;
                    else if (btnInt.customId === 'next_page' && page < embeds.length - 1) ++page;

                    reply.components = [getRow()];
                    reply.embeds = [embeds[page]];

                    btnInt.update(reply);
                });

                collector.on('end', _ => {
                    if (message) {
                        targetMessage.delete();
                        message.delete();
                    } else
                        interaction.editReply({
                            components: [], embeds: [new EmbedBuilder()
                                .setDescription('⌛ Esta acción expiró...')
                                .setColor(instance.color)
                                .setThumbnail(`${githubRawURL}/assets/thumbs/music/hourglass-sand-top.png`)]
                        });
                });
            }
        } catch (error) {
            const embed = new EmbedBuilder().setColor(instance.color);
            const notFoundErrors = ['No result was found', "Cannot read properties of undefined (reading 'lyrics')"];
            const notFound = notFoundErrors.includes(error.message);
            if (notFound)
                reply.embeds = [embed.setDescription(`🛑 ¡No se encontraron resultados de letras para la canción ingresada!`)
                    .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            else {
                console.log(error);
                reply.embeds = [embed.setDescription(`🛑 ¡Lo siento, ocurrió un error!`)
                    .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            }
            await messageOrInteraction.reply(reply);
        }

        return;
    }
}
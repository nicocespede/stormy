const { EmbedBuilder, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createCanvas } = require('canvas');
const { getGames, updateGames, getIds, updateIds } = require('../../src/cache');
const { prefix, githubRawURL } = require('../../src/constants');
const { lastUpdateToString, addAnnouncementsRole } = require('../../src/general');
const { splitEmbedDescription } = require('../../src/util');

module.exports = {
    category: 'Juegos/Películas',
    description: 'Responde con los links de descarga de algunos juegos crackeados.',

    options: [
        {
            name: 'numero',
            description: 'El número del juego que se quiere ver.',
            required: false,
            type: ApplicationCommandOptionType.Integer
        }
    ],
    maxArgs: 1,
    expectedArgs: '[numero]',
    slash: 'both',

    callback: async ({ message, args, channel, interaction, user, instance, guild, member }) => {
        const replyMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });
        const number = message ? args[0] : interaction.options.getInteger('numero');

        const ids = getIds() || await updateIds();
        await addAnnouncementsRole(ids.roles.anunciosJuegos, guild, member);

        const games = getGames() || await updateGames();
        const reply = { custom: true, ephemeral: true };

        if (!number) {
            const canvas = createCanvas(200, 200);
            const ctx = canvas.getContext('2d');
            const gamesField = { name: 'Juego', value: '', inline: true };
            const updatesField = { name: 'Última actualización', value: ``, inline: true };
            for (let i = 0; i < games.length; i++) {
                const name = `${games[i].name} (${games[i].year})`;
                const date = games[i].lastUpdate;
                const newGame = `** ${i + 1}.** ${name}\n\n`;
                gamesField.value += newGame;
                updatesField.value += `*${lastUpdateToString(date, true)}*\n\n`;
                if (ctx.measureText(newGame).width >= 254)
                    updatesField.value += `\n`;
            }
            reply.embeds = [new EmbedBuilder()
                .setTitle(`**Juegos crackeados**`)
                .setDescription(instance.messageHandler.getEmbed(guild, 'GAMES', 'DESCRIPTION', { ID: user.id, PREFIX: prefix }))
                .setColor(instance.color)
                .addFields([gamesField, updatesField])
                .setFooter({ text: instance.messageHandler.getEmbed(guild, 'GAMES', 'FOOTER') })
                .setThumbnail(`${githubRawURL}/assets/thumbs/games/games-folder.png`)];

            reply.content = null;
            message ? replyMessage.edit(reply) : interaction.editReply(reply);
            return;
        }

        const index = parseInt(number) - 1;
        if (index < 0 || index >= games.length || isNaN(index)) {
            reply.content = `⚠ El número ingresado es inválido.`;
            message ? replyMessage.edit(reply) : interaction.editReply(reply);
            return;
        }

        const { embedData, imageURL, instructions, lastUpdate, links, name, version, year } = games[index];

        let versionsMessage;
        let finalCollector;
        const data = {
            instructions: { emoji: '📄', label: 'Instrucciones', style: ButtonStyle.Secondary },
            game: { emoji: '🎮', label: 'Juego base' },
            update: { emoji: '⬇', label: 'Update' },
            crack: { emoji: '🏴‍☠️', label: 'Crack online' },
            extras: { emoji: '🔰' }
        };

        const sendSelectionMenu = async () => {
            let nowShowing = '';
            let buttonsTypes = instructions ? ['instructions'] : [];
            buttonsTypes = buttonsTypes.concat(Object.keys(links).filter(k => k !== 'password'));

            const getRows = () => {
                const rows = [];
                let row = new ActionRowBuilder();
                for (const type of buttonsTypes) {
                    const prefix = type.split('-')[0];
                    const { emoji, label, style } = data[prefix];
                    if (row.components.length >= 5) {
                        rows.push(row);
                        row = new ActionRowBuilder();
                    }
                    row.addComponents(new ButtonBuilder().setCustomId(type)
                        .setEmoji(emoji)
                        .setLabel(`${label || ''} ${type.replace(prefix, '').replace('-', '')}`)
                        .setStyle(style || ButtonStyle.Primary)
                        .setDisabled(type === nowShowing));
                }
                rows.push(row);
                return rows;
            };

            reply.content = `**${name} (${year}) ${version}**\n\n⚠ Por favor seleccioná lo que querés ver, esta acción expirará luego de 5 minutos de inactividad.\n\u200b`;
            reply.components = getRows();
            reply.files = [imageURL];

            message ? await replyMessage.edit(reply) : await interaction.editReply(reply);

            const collectorFilter = btnInt => {
                const btnIntId = !btnInt.message.interaction ? btnInt.message.id : btnInt.message.interaction.id;
                const isTheSameMessage = message ? btnIntId === replyMessage.id : btnIntId === interaction.id;
                return member.user.id === btnInt.user.id && isTheSameMessage;
            };

            const collector = channel.createMessageComponentCollector({ filter: collectorFilter, idle: 1000 * 60 * 5 });

            collector.on('collect', async i => {
                nowShowing = i.customId;
                await i.update({ components: getRows() });
                await sendElement(i.customId)
            });

            collector.on('end', async _ => {
                if (versionsMessage) versionsMessage.delete();
                const edit = {
                    components: [],
                    content: `**${name} (${year}) ${version}**\n\n⌛ Esta acción expiró, para volver a ver los links de este elemento usá **${prefix}juegos ${index + 1}**.\n\u200b`,
                    embeds: [],
                    files: reply.files
                };
                message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
            });
        };

        const sendElement = async customId => {
            const embeds = [];
            const pages = {};
            const element = customId !== 'instructions' ? links[customId] : instructions;
            const { color, thumb } = embedData;
            for (const server in element) if (Object.hasOwnProperty.call(element, server) && server !== 'files' && server !== 'password') {
                const dataString = customId !== 'instructions' ? `**Cantidad de archivos:** ${element.files}` : '';
                const passwordString = customId !== 'instructions' && element.password ? `**Contraseña:** ${element.password}` : '';
                const description = `${dataString}\n**Actualizado por última vez:** ${lastUpdateToString(lastUpdate, false)}.\n\n${element[server].join('\n')}\n\n${passwordString}`;
                const chunks = splitEmbedDescription(description);
                let counter = 1;
                const prefix = customId.split('-')[0];
                const { label } = data[prefix];
                const title = `${name} (${year}) ${version} -${label ? ` ${label}` : ''} ${customId.replace(prefix, '').replace('-', '')} (${server}${chunks.length > 1 ? ` ${counter++}` : ''})`;
                for (const c of chunks)
                    embeds.push(new EmbedBuilder()
                        .setTitle(title)
                        .setColor(color)
                        .setDescription(c)
                        .setThumbnail(thumb));
            }

            for (let i = 0; i < embeds.length; i++)
                embeds[i].setFooter({ text: `${customId !== 'instructions' ? 'Servidor' : 'Página'} ${i + 1} | ${embeds.length}` });

            const getRow = id => {
                const row = new ActionRowBuilder();

                row.addComponents(new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⬅')
                    .setLabel('Anterior')
                    .setDisabled(pages[id] === 0));

                row.addComponents(new ButtonBuilder()
                    .setCustomId('next_page')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('➡')
                    .setLabel('Siguiente')
                    .setDisabled(pages[id] === embeds.length - 1));

                return row;
            };

            const id = member.user.id;
            pages[id] = pages[id] || 0;

            const msg = {
                components: [getRow(id)],
                embeds: [embeds[pages[id]]],
                files: []
            };

            versionsMessage = !versionsMessage ? await channel.send(msg) : await versionsMessage.edit(msg);
            if (finalCollector)
                finalCollector.stop();

            const secondFilter = btnInt => member.user.id === btnInt.user.id;

            finalCollector = versionsMessage.createMessageComponentCollector({ filter: secondFilter, idle: 1000 * 60 * 5 });

            finalCollector.on('collect', async btnInt => {
                if (!btnInt) return;

                btnInt.deferUpdate();

                if (btnInt.customId !== 'prev_page' && btnInt.customId !== 'next_page')
                    return;
                else {
                    if (btnInt.customId === 'prev_page' && pages[id] > 0) --pages[id];
                    else if (btnInt.customId === 'next_page' && pages[id] < embeds.length - 1) ++pages[id];

                    msg.components = [getRow(id)];
                    msg.embeds = [embeds[pages[id]]];
                    await versionsMessage.edit(msg);
                }
            });
        };

        await sendSelectionMenu();
    }
}
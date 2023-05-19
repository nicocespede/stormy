const { EmbedBuilder, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createCanvas } = require('canvas');
const { getGames, updateGames, getIds, getGithubRawUrl } = require('../../src/cache');
const { color, PREFIX } = require('../../src/constants');
const { lastUpdateToString, addAnnouncementsRole } = require('../../src/common');
const { splitEmbedDescription } = require('../../src/util');

const buttonsPrefix = 'games-';
const maxIdlingTime = 10;
const thumbnailsData = {
    steam: await getGithubRawUrl('assets/thumbs/games/steam.png'),
    others: await getGithubRawUrl('assets/thumbs/games/control.png')
};
const data = {
    instructions: { emoji: '📄', label: 'Instrucciones', style: ButtonStyle.Secondary },
    game: { emoji: '🎮', label: 'Juego base' },
    update: { emoji: '⬇', label: 'Update' },
    crack: { emoji: '🏴‍☠️', label: 'Crack online' },
    extras: { emoji: '🔰' }
};

const getSelectionMenu = (game, nowShowing) => {
    const getRows = () => {
        const { id, instructions, links, platform } = game;
        let buttonsTypes = instructions ? ['instructions'] : [];
        buttonsTypes = buttonsTypes.concat(Object.keys(links).filter(k => k !== 'password'));
        const rows = [];
        let row = new ActionRowBuilder();
        for (const type of buttonsTypes) {
            const prefix = type.split('-')[0];
            const { emoji, label, style } = data[prefix];
            if (row.components.length >= 5) {
                rows.push(row);
                row = new ActionRowBuilder();
            }
            const customId = `${buttonsPrefix}${platform}-${id}-${type}`;
            row.addComponents(new ButtonBuilder().setCustomId(customId)
                .setEmoji(emoji)
                .setLabel(`${label || ''} ${type.replace(prefix, '').replace('-', '')}`)
                .setStyle(style || ButtonStyle.Primary)
                .setDisabled(customId === nowShowing));
        }
        rows.push(row);
        return rows;
    };

    const { imageURL, name, version, year } = game;
    return {
        components: getRows(game),
        content: `**${name} (${year}) ${version}**\n\n⚠ Por favor seleccioná lo que querés ver.\n\u200b`,
        ephemeral: true,
        files: [imageURL]
    };
};

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

    init: client => {
        const usersData = {};

        const initUserData = userId => {
            if (!usersData[userId])
                usersData[userId] = { collectors: {}, versionsMessages: {} };
        };

        const deleteGameData = (userId, gameId) => delete (usersData[userId])[gameId];

        const updateCollector = (userId, gameId, collector) => usersData[userId].collectors[gameId] = collector;
        const updateVersionsMessage = (userId, gameId, versionsMessage) => usersData[userId].versionsMessages[gameId] = versionsMessage;

        client.on('interactionCreate', async interaction => {
            if (!interaction.isButton()) return;

            const { customId } = interaction;
            if (!customId.startsWith(buttonsPrefix)) return;

            let guild;
            let channel;

            const isInteraction = interaction.message.interaction !== null;
            let ownerId;
            if (isInteraction) {
                const { channelId, guildId } = interaction;
                ownerId = interaction.message.interaction.user.id;
                guild = await client.guilds.fetch(guildId).catch(console.error);
                channel = await guild.channels.fetch(channelId).catch(console.error);
            } else {
                const { channelId, guildId, messageId } = interaction.message.reference;
                guild = await client.guilds.fetch(guildId).catch(console.error);
                channel = await guild.channels.fetch(channelId).catch(console.error);
                const message = await channel.messages.fetch(messageId).catch(console.error);
                ownerId = message.author.id;
            }

            if (ownerId !== interaction.user.id) {
                interaction.reply({ content: `¡Estos botones no son para vos! 😡`, ephemeral: true });
                return;
            }

            await interaction.deferUpdate();

            let split = customId.replace(buttonsPrefix, '').split('-');
            const platform = split.shift();
            const id = split.shift();

            const games = getGames() || await updateGames();
            const game = games.find(g => g.platform === platform && g.id === id);

            if (!game) {
                await interaction.editReply({ components: [], content: '❌ Lo siento, este contenido ya no está disponible.\n\u200b' });
                return;
            }

            await interaction.editReply(getSelectionMenu(game, customId));

            const element = split.join('-');
            if (element === 'instructions' ? !game[element] : !game.links[element])
                return;

            const sendElement = async (customId, game) => {
                const { instructions, lastUpdate, links, name, platform, version, year } = game;
                const embeds = [];
                const pages = {};
                const element = customId !== 'instructions' ? links[customId] : instructions;
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
                            .setThumbnail(thumbnailsData[platform]));
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

                const id = interaction.user.id;
                pages[id] = pages[id] || 0;

                const msg = {
                    components: [getRow(id)],
                    embeds: [embeds[pages[id]]],
                    files: []
                };

                initUserData(interaction.user.id);
                let { collectors, versionsMessages } = usersData[interaction.user.id];

                let versionsMessage = versionsMessages[`${platform}-${id}`];
                versionsMessage = !versionsMessage ? await channel.send(msg) : await versionsMessage.edit(msg);
                updateVersionsMessage(interaction.user.id, `${platform}-${id}`, versionsMessage);

                let collector = collectors[`${platform}-${id}`];
                if (collector)
                    collector.stop();

                collector = versionsMessage.createMessageComponentCollector({ idle: 1000 * 60 * maxIdlingTime });
                updateCollector(interaction.user.id, `${platform}-${id}`, collector);

                collector.on('collect', async btnInt => {
                    if (!btnInt) return;

                    if (interaction.user.id !== btnInt.user.id) {
                        btnInt.reply({ content: `¡Estos botones no son para vos! 😡`, ephemeral: true });
                        return;
                    }

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

                collector.on('end', (_, reason) => {
                    if (reason === 'idle') {
                        versionsMessage.delete();
                        deleteGameData(interaction.user.id, `${platform}-${id}`);
                        interaction.editReply(getSelectionMenu(game, ''));
                    }
                });
            };

            await sendElement(element, game);
        });
    },

    callback: async ({ message, args, interaction, user, instance, guild, member }) => {
        const replyMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });
        const number = message ? args[0] : interaction.options.getInteger('numero');

        const ids = await getIds();
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
                if (ctx.measureText(newGame).width >= 229)
                    updatesField.value += `\n`;
            }
            reply.embeds = [new EmbedBuilder()
                .setTitle(`**Juegos crackeados**`)
                .setDescription(instance.messageHandler.getEmbed(guild, 'GAMES', 'DESCRIPTION', { ID: user.id, PREFIX: PREFIX }))
                .setColor(instance.color)
                .addFields([gamesField, updatesField])
                .setFooter({ text: instance.messageHandler.getEmbed(guild, 'GAMES', 'FOOTER') })
                .setThumbnail(await getGithubRawUrl('assets/thumbs/games/games-folder.png'))];

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

        const selectionMenu = getSelectionMenu(games[index], '');
        message ? await replyMessage.edit(selectionMenu) : await interaction.editReply(selectionMenu);
    }
}
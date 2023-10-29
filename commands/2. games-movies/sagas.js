const { ICommand } = require('wokcommands');
const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Canvas = require('canvas');
Canvas.registerFont('./assets/fonts/TitilliumWeb-Regular.ttf', { family: 'Titillium Web' });
Canvas.registerFont('./assets/fonts/TitilliumWeb-Bold.ttf', { family: 'Titillium Web bold' });
const { getIds, getMovies, updateMovies, getFilters, updateFilters: updateFiltersCache, getChronology, updateChronology, getDownloadsData, updateDownloadsData, getGithubRawUrl } = require('../../src/cache');
const { PREFIX, EMBED_FIELD_VALUE_MAX_LENGTH } = require('../../src/constants');
const { updateFilters, updateChoices } = require('../../src/mongodb');
const { splitEmbedDescription, getWarningMessage, getSuccessMessage, logToFileCommandUsage, getWarningEmbed } = require('../../src/util');
const { addAnnouncementsRole, lastUpdateToString } = require('../../src/common');

const sagasData = [
    { collectionId: 'db', name: 'Dragon Ball', roleId: 'anunciosDb', value: 'db' },
    { collectionId: 'mcu', name: 'Universo Cinematográfico de Marvel', roleId: 'anunciosUcm', value: 'ucm' },
    { collectionId: 'the-boys', name: 'The Boys', roleId: 'anunciosBoys', value: 'the-boys' }//,
    //tfs: 'Transformers'
];

const getValidFilters = async collectionId => {
    const db = getChronology(collectionId) || await updateChronology(collectionId);
    const choices = db.filter(({ choices }) => choices).map(({ choices }) => choices).flat().map(({ data }) => data).flat();
    const filters = db.filter(({ choices }) => !choices).concat(choices).map(({ type }) => type);
    return [...new Set(filters)];
};

const sendChronologySettingMessage = async (channel, collectionId, guild, instance, interaction, member, message) => {
    const collectionsData = {
        db: { emoji: 'dragon_ball', thumb: 'dragon-ball', title: 'Universo de Dragon Ball' },
        mcu: { cmd: 'ucm', emoji: 'mcuCharacters', thumb: 'mcu-logo', title: 'Universo Cinematográfico de Marvel' },
        'the-boys': { emoji: 'the_boys', thumb: 'the-boys', title: 'The Boys' }
    };
    const collection = collectionsData[collectionId];

    const reply = { ephemeral: true };
    const selectedChoices = [];
    let filtersCache;
    let replyMessage;
    let movies;

    const chronology = getChronology(collectionId) || await updateChronology(collectionId);
    const breakpoints = chronology.filter(({ choices }) => choices).map(({ choices }) => choices);

    const getNewEmoji = async () => {
        const ids = await getIds();
        const obj = ids.emojis[collection.emoji];
        if (typeof obj === 'string')
            return `<:${collection.emoji}:${obj}>`;

        const keys = Object.keys(obj);
        const emojiName = keys[Math.floor(Math.random() * keys.length)];
        return `<:${emojiName}:${obj[emojiName]}>`;
    };

    let emoji = await getNewEmoji();
    const title = `__**${collection.title}**__\n`;

    const collectorFilter = btnInt => {
        const btnIntId = !btnInt.message.interaction ? btnInt.message.id : btnInt.message.interaction.id;
        const isTheSameMessage = message ? btnIntId === replyMessage.id : btnIntId === interaction.id;
        return member.user.id === btnInt.user.id && isTheSameMessage;
    };

    const sendChoicesMessages = async breakpoints => {
        if (breakpoints.length === 0) {
            await sendFiltersMessage();
            return;
        }

        const emojis = ['1️⃣', '2️⃣', '3️⃣'];
        const getChoicesRow = breakpoint => {
            const row = new ActionRowBuilder();
            for (let i = 0; i < breakpoint.length; i++)
                row.addComponents(new ButtonBuilder()
                    .setCustomId(`${i}`)
                    .setEmoji(emojis[i])
                    .setLabel(`Opción ${i + 1}`)
                    .setStyle(ButtonStyle.Secondary));
            return row;
        };

        const breakpoint = breakpoints.shift();

        emoji = await getNewEmoji();
        reply.content = `${emoji} ${title}\n${getWarningMessage('Seleccioná la **rama cronológica** deseada, esta acción expirará luego de 5 minutos.')}\n`;

        let i = 0;
        for (const choice of breakpoint) {
            const { description, name } = choice;
            reply.content += `\n• ${emojis[i++]} **${name}:** ${description}\n`;
        }

        reply.content += `\u200b`;
        reply.components = [getChoicesRow(breakpoint)];

        if (!replyMessage)
            replyMessage = message ? await message.reply(reply) : await interaction.editReply(reply);
        else
            message ? await replyMessage.edit(reply) : await interaction.editReply(reply);

        const collector = channel.createMessageComponentCollector({ filter: collectorFilter, time: 1000 * 60 * 5, max: 1 });

        collector.on('collect', i => {
            i.deferUpdate();
            selectedChoices.push(parseInt(i.customId));
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                emoji = await getNewEmoji();
                reply.content = `${emoji} ${title}\n⌛ Esta acción **expiró**, para volver a elegir ramas y filtros usá **${PREFIX}${collectionId}**.`;
                reply.components = [];
                message ? await replyMessage.edit(reply) : await interaction.editReply(reply);
                return;
            }

            if (breakpoints.length > 0)
                await sendChoicesMessages(breakpoints);
            else
                await sendFiltersMessage();
        })
    };

    const sendFiltersMessage = async () => {
        const validFilters = await getValidFilters(collectionId);

        const getFiltersRows = array => {
            const rows = [];
            let row = new ActionRowBuilder();
            row.addComponents(new ButtonBuilder()
                .setCustomId('all')
                .setEmoji(!array.includes('all') ? '🔳' : '✅')
                .setLabel('Todo')
                .setStyle(ButtonStyle.Secondary));
            validFilters.forEach(f => {
                if (row.components.length >= 5) {
                    rows.push(row);
                    row = new ActionRowBuilder();
                }
                row.addComponents(new ButtonBuilder()
                    .setCustomId(f)
                    .setEmoji(!array.includes(f) ? '🔳' : '✅')
                    .setLabel(f + (f.endsWith('l') ? 'es' : 's'))
                    .setStyle(ButtonStyle.Secondary));
            });
            rows.push(row);
            return rows;
        };

        const secondaryRow = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
                .setCustomId('confirm')
                .setEmoji('✔')
                .setLabel('Confirmar')
                .setStyle(ButtonStyle.Success))
            .addComponents(new ButtonBuilder()
                .setCustomId('cancel')
                .setEmoji('❌')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Danger));

        filtersCache = getFilters(collectionId) || await updateFiltersCache(collectionId);
        const filters = filtersCache.filters;

        emoji = await getNewEmoji();
        reply.content = `${emoji} ${title}\n${getWarningMessage('Por favor **seleccioná los filtros** que querés aplicar y luego **confirmá** para aplicarlos, esta acción expirará luego de 5 minutos.')}\n\u200b`;
        reply.components = getFiltersRows(filters).concat([secondaryRow]);
        reply.files = [await getGithubRawUrl(`assets/${collectionId}/poster.jpg`)];

        if (!replyMessage)
            replyMessage = message ? await message.reply(reply) : await interaction.editReply(reply);
        else
            message ? await replyMessage.edit(reply) : await interaction.editReply(reply);

        const collector = channel.createMessageComponentCollector({ filter: collectorFilter, time: 1000 * 60 * 5 });

        let selectedFilters = filters.slice(0);
        let status = '';
        const extraMessages = [];

        collector.on('collect', async i => {
            const update = {};

            if (i.customId === 'all') {
                selectedFilters = !selectedFilters.includes('all') ? [i.customId] : [];
                update.components = getFiltersRows(selectedFilters).concat([secondaryRow]);
                await i.update(update);
                return;
            }

            if (i.customId === 'confirm') {
                i.deferUpdate();
                if (selectedFilters.length === 0) {
                    extraMessages.push(await channel.send('⛔ ¡Debes seleccionar algún filtro para confirmar!'));
                    return;
                }

                status = 'CONFIRMED';
                collector.stop();
                return;
            }

            if (i.customId === 'cancel') {
                status = 'CANCELLED';
                i.deferUpdate();
                collector.stop();
                return;
            }

            if (selectedFilters.includes('all'))
                selectedFilters = [];
            if (selectedFilters.includes(i.customId))
                selectedFilters.splice(selectedFilters.indexOf(i.customId), 1);
            else {
                selectedFilters.push(i.customId);
                if (selectedFilters.length === validFilters.length)
                    selectedFilters = ['all'];
            }
            update.components = getFiltersRows(selectedFilters).concat([secondaryRow]);
            await i.update(update);
        });

        collector.on('end', async _ => {
            extraMessages.forEach(m => m.delete());

            if (status !== 'CONFIRMED') {
                emoji = await getNewEmoji();
                const edit = { content: `${emoji} ${title}\n${status === 'CANCELLED' ? '❌ Esta acción **fue cancelada**' : '⌛ Esta acción **expiró**'}, para volver a elegir filtros usá **${PREFIX}db**.\n\u200b` };
                message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
                return;
            }

            const filtersAreEqual = (oldElements, newElements) => {
                if (oldElements.length === newElements.length)
                    return oldElements.every(element => newElements.includes(element));
                return false;
            };

            const choicesAreEqual = (oldChoices, newChoices) => {
                if (!newChoices || newChoices.length === 0)
                    return true;
                else if (!oldChoices)
                    return false;

                if (oldChoices.length === newChoices.length) {
                    for (let i = 0; i < oldChoices.length; i++)
                        if (oldChoices[i] !== newChoices[i])
                            return false;
                    return true;
                }
                return false;
            };

            if (!filtersAreEqual(filters, selectedFilters) || !choicesAreEqual(filtersCache.choices, selectedChoices)) {
                if (!filtersAreEqual(filters, selectedFilters))
                    await updateFilters(collectionId, selectedFilters);
                if (!choicesAreEqual(filtersCache.choices, selectedChoices))
                    await updateChoices(collectionId, selectedChoices);
                await updateFiltersCache(collectionId);
                movies = await updateMovies(collectionId, selectedFilters, selectedChoices);
            }

            sendList();
        });
    };

    const sendList = async () => {
        const canvas = Canvas.createCanvas(200, 200);
        const ctx = canvas.getContext('2d');
        const embeds = [];
        const pages = {};

        let moviesField = { name: 'Nombre', value: '', inline: true };
        let typesField = { name: 'Tipo', value: ``, inline: true };

        movies = getMovies(collectionId) || await updateMovies(collectionId, filtersCache.filters, selectedChoices);

        for (var i = 0; i < movies.length; i++) {
            const { name, type } = movies[i];
            const newName = `**${i + 1}.** ${name}`;
            const aux = moviesField.value + `${newName}\n\n`;

            if (aux.length <= EMBED_FIELD_VALUE_MAX_LENGTH) {
                moviesField.value += `${newName}\n\n`;
                typesField.value += `*${type}*\n\n`;
                if (ctx.measureText(newName).width >= 292)
                    typesField.value += `\n`;
                continue;
            }

            embeds.push(new EmbedBuilder()
                .setColor(instance.color)
                .addFields([moviesField, typesField])
                .setThumbnail(await getGithubRawUrl(`assets/thumbs/${collection.thumb}.png`)));

            moviesField = { name: 'Nombre', value: `${newName}\n\n`, inline: true };
            typesField = { name: 'Tipo', value: `*${type}*\n\n`, inline: true };

            if (ctx.measureText(newName).width >= 292)
                typesField.value += `\n`;
        }

        embeds.push(new EmbedBuilder()
            .setColor(instance.color)
            .addFields([moviesField, typesField])
            .setThumbnail(await getGithubRawUrl(`assets/thumbs/${collection.thumb}.png`)));

        for (let i = 0; i < embeds.length; i++) {
            const msg = embeds[i];
            msg.setFooter({ text: `Página ${i + 1} | ${embeds.length}` });
            if (i === 0)
                msg.setDescription(instance.messageHandler.get(guild, 'MOVIES', {
                    CMD: collection.cmd || collectionId,
                    ID: member.user.id,
                    PREFIX: PREFIX
                }));
        }

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

            row.addComponents(new ButtonBuilder()
                .setCustomId('quit')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🚪')
                .setLabel('Salir'));

            return row;
        };

        const id = member.user.id;
        pages[id] = pages[id] || 0;

        reply.components = [getRow(id)];
        emoji = await getNewEmoji();
        reply.content = `${emoji} ${title}\n${getWarningMessage('Podés navegar libremente por las páginas, luego de 5 minutos de inactividad esta acción expirará.')}\n\u200b`;
        reply.embeds = [embeds[pages[id]]];
        reply.files = [];

        message ? await replyMessage.edit(reply) : await interaction.editReply(reply);

        const finalCollector = channel.createMessageComponentCollector({ filter: collectorFilter, idle: 1000 * 60 * 5 });

        finalCollector.on('collect', async btnInt => {
            if (!btnInt) return;

            btnInt.deferUpdate();

            if (btnInt.customId !== 'prev_page' && btnInt.customId !== 'next_page') {
                finalCollector.stop();
            } else {
                if (btnInt.customId === 'prev_page' && pages[id] > 0) --pages[id];
                else if (btnInt.customId === 'next_page' && pages[id] < embeds.length - 1) ++pages[id];

                reply.components = [getRow(id)];
                reply.embeds = [embeds[pages[id]]];
            }

            message ? await replyMessage.edit(reply) : await interaction.editReply(reply);
        });

        finalCollector.on('end', async _ => {
            reply.components = [];
            emoji = await getNewEmoji();
            reply.content = `${emoji} ${title}\n${getSuccessMessage(`Esta acción **se completó**, para volver a elegir filtros usá **${PREFIX}${collectionId}**.`)}\n\u200b`;
            message ? await replyMessage.edit(reply) : await interaction.editReply(reply);
        });
    };

    sendChoicesMessages(breakpoints);
};

const sendChronologyElement = async (channel, collectionId, instance, interaction, member, message, number) => {
    const { choices, filters } = getFilters(collectionId) || await updateFiltersCache(collectionId);
    const movies = getMovies(collectionId) || await updateMovies(collectionId, filters, choices);
    const data = getDownloadsData(collectionId) || await updateDownloadsData(collectionId);
    const index = parseInt(number) - 1;
    const reply = { ephemeral: true };

    if (isNaN(index) || index < 0 || index >= movies.length) {
        reply.content = getWarningMessage(`El número ingresado es inválido.`);
        message ? await message.reply(reply) : await interaction.editReply(reply);
        return;
    }

    const { name: elementName, reference, thumb: elementThumb, type, year: elementYear } = movies[index];

    if (!reference) {
        const filteredName = elementName.replace(/[:|?]/g, '').replace(/ /g, '%20');

        reply.content = `**${elementName} (${elementYear})**\n\n${getWarningMessage('Este elemento no cuenta con contenido descargable.')}\n\u200b`;
        reply.files = [await getGithubRawUrl(`assets/${collectionId}/${filteredName}.jpg`)];

        message ? await message.reply(reply) : await interaction.editReply(reply);
        return;
    }

    const { color: packageColor, episodes, name: packageName, thumb: packageThumb, versions, year: packageYear } = data[reference];
    const color = packageColor || instance.color;

    let versionsMessage;
    let finalCollector;
    let filteredName;

    const sendSelectionMenu = async () => {
        let nowShowing = '';
        const emojis = {
            "Cortometraje": '📹',
            "Especial": '📺',
            "Miniserie": '🎥',
            "One-Shot": '🎬',
            "OVA": '📼',
            "Película": '📽',
            "Serie": '🎞'
        };
        const getVersionsRow = () => {
            const row = new ActionRowBuilder();
            for (const ver in versions) if (Object.hasOwnProperty.call(versions, ver)) {
                row.addComponents(new ButtonBuilder().setCustomId(ver)
                    .setEmoji(emojis[type])
                    .setLabel(ver)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(ver === nowShowing));
            }
            return row;
        };

        filteredName = !elementYear ? packageName.replace(/[:|?]/g, '').replace(/ /g, '%20')
            : elementName.replace(/[:|?]/g, '').replace(/ /g, '%20');

        reply.content = `**${!elementYear ? packageName : elementName} (${elementYear || packageYear})**\n\n${getWarningMessage('Por favor seleccioná la versión que querés ver, esta acción expirará luego de 5 minutos de inactividad.')}\n\u200b`;
        reply.components = [getVersionsRow()];
        reply.files = [await getGithubRawUrl(`assets/${collectionId}/${filteredName}.jpg`)];

        const replyMessage = message ? await message.reply(reply) : await interaction.editReply(reply);

        const collectorFilter = btnInt => {
            const btnIntId = !btnInt.message.interaction ? btnInt.message.id : btnInt.message.interaction.id;
            const isTheSameMessage = message ? btnIntId === replyMessage.id : btnIntId === interaction.id;
            return member.user.id === btnInt.user.id && isTheSameMessage;
        };

        const collector = channel.createMessageComponentCollector({ filter: collectorFilter, idle: 1000 * 60 * 5 });

        collector.on('collect', async i => {
            nowShowing = i.customId;
            await i.update({ components: [getVersionsRow()] });
            sendElement(i.customId);
        });

        collector.on('end', async _ => {
            if (versionsMessage) versionsMessage.delete();
            const edit = {
                components: [],
                content: `**${packageName} (${packageYear})**\n\n⌛ Esta acción expiró, para volver a ver los links de este elemento usá **${PREFIX}ucm ${index + 1}**.\n\u200b`,
                embeds: [],
                files: reply.files
            };
            message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
        });
    };

    const sendElement = async customId => {
        const embeds = [];
        const pages = {};
        const { files, lastUpdate, links, password } = versions[customId];
        const dataString = `${episodes ? `**Episodios:** ${episodes}\n` : ''}**Cantidad de archivos:** ${files}`;
        const passwordString = password ? `**Contraseña:** ${password}` : '';
        const thumb = elementThumb || packageThumb || filteredName;
        for (const server in links) if (Object.hasOwnProperty.call(links, server)) {
            const description = `${dataString}\n**Actualizado por última vez:** ${lastUpdateToString(lastUpdate, false)}.\n\n${links[server].join('\n')}\n\n${passwordString}`;
            const chunks = splitEmbedDescription(description);
            let counter = 1;
            for (const c of chunks)
                embeds.push(new EmbedBuilder()
                    .setTitle(`${packageName} (${packageYear}) - ${customId} (${server}${chunks.length > 1 ? ` ${counter++}` : ''})`)
                    .setColor(color)
                    .setDescription(c)
                    .setThumbnail(await getGithubRawUrl(`assets/thumbs/${collectionId}/${thumb}.png`)));
        }

        for (let i = 0; i < embeds.length; i++)
            embeds[i].setFooter({ text: `Servidor ${i + 1} | ${embeds.length}` });

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

    sendSelectionMenu();
};

/**@type {ICommand}*/
module.exports = {
    category: 'Juegos/Películas',
    description: 'Responde con los links de descarga de la saga seleccionada.',

    options: [
        {
            name: 'coleccion',
            description: 'La colección que se quiere ver.',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: sagasData
        },
        {
            name: 'numero',
            description: 'El número del elemento que se quiere ver.',
            required: false,
            type: ApplicationCommandOptionType.Integer
        }
    ],
    minArgs: 1,
    maxArgs: 2,
    expectedArgs: '<coleccion> [numero]',
    slash: 'both',

    callback: async ({ args, channel, guild, instance, interaction, member, message, text, user }) => {
        logToFileCommandUsage('sagas', text, interaction, user);

        if (interaction) await interaction.deferReply({ ephemeral: true });

        const sagaId = message ? args[0] : interaction.options.getString('coleccion');

        const saga = sagasData.find(s => s.value === sagaId);
        if (!saga) {
            const reply = { embeds: [getWarningEmbed(`Lo siento, el **ID ingresado no existe**. Intentá con:\n\n${sagasData.map(s => s.value).join(', ')}`)] }
            message ? await message.reply(reply) : await interaction.editReply(reply);
            return;
        }

        const { collectionId, roleId } = saga;
        const { roles } = await getIds();
        await addAnnouncementsRole(roles[roleId], guild, member);

        const number = message ? args[1] : interaction.options.getInteger('numero');

        if (!number)
            sendChronologySettingMessage(channel, collectionId, guild, instance, interaction, member, message);
        else
            sendChronologyElement(channel, collectionId, instance, interaction, member, message, number);
    }
}
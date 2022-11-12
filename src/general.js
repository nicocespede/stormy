const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();
const Canvas = require('canvas');
const { getStats, updateStats, getTimestamps, getIds, updateIds, getBanned, updateBanned, addTimestamp, getIcon, updateIcon,
    getMovies, updateMovies, getFilters, updateFilters: updateFiltersCache, getChronology, updateChronology,
    getDownloadsData, updateDownloadsData, getMode, updateMode } = require('./cache');
const { relativeSpecialDays, githubRawURL, prefix } = require('./constants');
const { updateIconString, deleteBan, addStat, updateStat, updateFilters, updateChoices } = require('./mongodb');
const { convertTZ, log, splitEmbedDescription } = require('./util');
Canvas.registerFont('./assets/fonts/TitilliumWeb-Regular.ttf', { family: 'Titillium Web' });
Canvas.registerFont('./assets/fonts/TitilliumWeb-Bold.ttf', { family: 'Titillium Web bold' });

const getImageType = async () => {
    const mode = getMode() || await updateMode();
    if (mode === 'afa')
        return '-afa'

    const today = convertTZ(new Date());
    const date = today.getDate();
    const month = today.getMonth() + 1;
    switch (month) {
        case 1:
            return `-newyear`;
        case 2:
            return `-love`;
        case 4:
            return date <= relativeSpecialDays.easter ? `-easter` : '';
        case 12:
            return date >= 26 ? `-newyear` : `-xmas`;
        default:
            return ``;
    }
};

const fullToSeconds = (days, hours, minutes, seconds) => {
    return seconds + (minutes * 60) + (hours * 3600) + (days * 86400);
};

const secondsToFull = (seconds) => {
    // calculate (and subtract) whole days
    var days = Math.floor(seconds / 86400);
    seconds -= days * 86400;
    // calculate (and subtract) whole hours
    var hours = Math.floor(seconds / 3600) % 24;
    seconds -= hours * 3600;
    // calculate (and subtract) whole minutes
    var minutes = Math.floor(seconds / 60) % 60;
    seconds -= minutes * 60;
    seconds = seconds % 60;
    return { days, hours, minutes, seconds };
};

const getMembersStatus = async channel => {
    let membersSize = channel.members.size;
    const valid = [];
    const invalid = [];
    channel.members.each(member => {
        if (member.user.bot) {
            membersSize--;
            valid.push(member);
        } else if (member.voice.deaf && !member.voice.streaming) {
            membersSize--;
            invalid.push(member);
        }
        else
            valid.push(member);
    });
    return { size: membersSize, valid: valid, invalid: invalid };
};

const convertTime = time => {
    let split = time.split(' ');
    const indicator = split.pop();
    split = split[0].split(':');
    switch (indicator) {
        case 'am':
            return `${split[0] === '12' ? '00' : split[0]}:${split[1]}`;
        case 'pm':
            const parsedMinutes = parseInt(split[0]);
            const finalMinutes = parsedMinutes + 12;
            return `${finalMinutes === 24 ? '12' : `${finalMinutes}`}:${split[1]}`;
    }
};

const lastUpdateToString = (lastUpdate, upperCase) => {
    const date = new Date(`${lastUpdate.substring(6, 10)}/${lastUpdate.substring(3, 5)}/${lastUpdate.substring(0, 2)}`);
    const today = new Date();
    if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear())
        if (date.getDate() === today.getDate())
            return !upperCase ? 'hoy' : 'Hoy';
        else if (date.getDate() === today.getDate() - 1)
            return !upperCase ? 'ayer' : 'Ayer';
    return `${(!upperCase ? 'el ' : '')}` + lastUpdate;
};

const addAnnouncementsRole = async (id, guild, member) => {
    try {
        const role = await guild.roles.fetch(id);
        if (!role.members.has(member.user.id)) {
            await member.roles.add(id);
            log(`> Rol '${role.name}' agregado a ${member.user.tag}`, 'green');
        }
    } catch (error) {
        log(`> No se pudo agregar el rol '${role.name}' a ${member.user.tag}:\n${error.stack}`, 'red');
    }
};

const getValidFilters = async collectionId => {
    const db = getChronology(collectionId) || await updateChronology(collectionId);
    const choices = db.filter(({ choices }) => choices).map(({ choices }) => choices).flat().map(({ data }) => data).flat();
    const filters = db.filter(({ choices }) => !choices).concat(choices).map(({ type }) => type);
    return [...new Set(filters)];
};

module.exports = {
    needsTranslation: (string) => {
        var probabilities = lngDetector.detect(string);
        if (probabilities[0][0] !== 'spanish') {
            if (probabilities[1][0] === 'spanish') {
                if (probabilities[1][1] < 0.2)
                    return true;
                return false;
            }
            return true;
        }
    },

    pushDifference: async (id, username) => {
        let stats = getStats() || await updateStats();
        if (!Object.keys(stats).includes(id)) {
            await addStat(id);
            await new Promise(res => setTimeout(res, 1000 * 2));
            stats = await updateStats();
        }
        const timestamps = getTimestamps();
        const stat = stats[id];
        const now = new Date();
        const totalTime = (Math.abs(now - timestamps[id]) / 1000) + (fullToSeconds(stat.days, stat.hours, stat.minutes, stat.seconds));
        if (!isNaN(totalTime)) {
            const { days, hours, minutes, seconds } = secondsToFull(totalTime);
            await updateStat(id, days, hours, minutes, seconds, username);
        }
        await updateStats();
    },

    fullToSeconds,

    secondsToFull,

    getMembersStatus,

    checkBansCorrelativity: async client => {
        const ids = getIds() || await updateIds();
        const guild = await client.guilds.fetch(ids.guilds.default).catch(console.error);
        const bans = await guild.bans.fetch().catch(console.error);
        const banned = getBanned() || await updateBanned();
        let needUpdate = false;
        for (const key in banned)
            if (!bans.has(key)) {
                needUpdate = true;
                log(`> El ban de ${banned[key].user} no corresponde a este servidor`, 'yellow');
                await deleteBan(key);
            }
        if (needUpdate)
            await updateBanned();
    },

    startStatsCounters: async client => {
        const ids = getIds() || await updateIds();
        client.guilds.fetch(ids.guilds.default).then(guild => {
            guild.channels.cache.each(async channel => {
                if (channel.type === ChannelType.GuildVoice && channel.id != ids.channels.afk) {
                    const membersInChannel = await getMembersStatus(channel);
                    if (membersInChannel.size >= 2)
                        membersInChannel.valid.forEach(member => addTimestamp(member.id, new Date()));
                }
            });
        }).catch(console.error);
    },

    countMembers: async client => {
        const ids = getIds() || await updateIds();
        const guild = await client.guilds.fetch(ids.guilds.default).catch(console.error);
        const members = await guild.members.fetch();
        const membersCounter = members.filter(m => !m.user.bot).size;
        const totalMembersName = `👥 Totales: ${membersCounter}`;
        const channel = await guild.channels.fetch(ids.channels.members).catch(console.error);
        if (channel.name !== totalMembersName) {
            await channel.setName(totalMembersName).catch(console.error);
            log('> Contador de miembros actualizado', 'blue');
        }
    },

    updateIcon: async guild => {
        const actualIcon = getIcon() || await updateIcon();
        const newIcon = `kgprime${await getImageType()}`;
        if (actualIcon !== newIcon) {
            await guild.setIcon(`${githubRawURL}/assets/icons/${newIcon}.png`).catch(console.error);
            await updateIconString(newIcon).catch(console.error);
            await updateIcon();
        }
    },

    updateUsername: async client => {
        const today = convertTZ(new Date());
        const date = today.getDate();
        const month = today.getMonth() + 1;
        let newUsername = 'StormY';
        switch (month) {
            case 1:
                newUsername += ' 🥂';
                break;
            case 2:
                newUsername += ' 💘';
                break;
            case 4:
                newUsername += date <= relativeSpecialDays.easter ? ' 🐇' : '';
                break;
            case 12:
                newUsername += date >= 26 ? ' 🥂' : ' 🎅🏻';
                break;
        }
        if (client.user.username !== newUsername) {
            await client.user.setUsername(newUsername).catch(console.error);
            log('> Nombre de usuario actualizado', 'green');
        }
    },

    convertTime,

    lastUpdateToString,

    applyText: (canvas, text) => {
        const context = canvas.getContext('2d');
        // Declare a base size of the font
        let fontSize = 100;
        do {
            // Assign the font to the context and decrement it so it can be measured again
            context.font = `${fontSize -= 10}px Titillium Web bold`;
            // Compare pixel width of the text to the canvas minus the approximate avatar size
        } while (context.measureText(text).width > canvas.width - 765);
        // Return the result to use in the actual canvas
        return context.font;
    },

    getImageType,

    addAnnouncementsRole,

    sendChronologySettingMessage: async (channel, collectionId, guild, instance, interaction, member, message) => {
        const collectionsData = {
            db: { emoji: 'dragon_ball', thumb: 'dragon-ball', title: 'Universo de Dragon Ball' },
            mcu: { cmd: 'ucm', emoji: 'mcuCharacters', thumb: 'mcu-logo', title: 'Universo Cinematográfico de Marvel' }
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
            const ids = getIds() || await updateIds();
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
            reply.content = `${emoji} ${title}\n⚠ Seleccioná la **rama cronológica** deseada, esta acción expirará luego de 5 minutos.\n`;

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
                    reply.content = `${emoji} ${title}\n⌛ Esta acción **expiró**, para volver a elegir ramas y filtros usá **${prefix}db**.`;
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
            reply.content = `${emoji} ${title}\n⚠ Por favor **seleccioná los filtros** que querés aplicar y luego **confirmá** para aplicarlos, esta acción expirará luego de 5 minutos.\n\u200b`;
            reply.components = getFiltersRows(filters).concat([secondaryRow]);
            reply.files = [`${githubRawURL}/assets/${collectionId}/poster.jpg`];

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
                    const edit = { content: `${emoji} ${title}\n${status === 'CANCELLED' ? '❌ Esta acción **fue cancelada**' : '⌛ Esta acción **expiró**'}, para volver a elegir filtros usá **${prefix}db**.\n\u200b` };
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

                if (aux.length <= 1024) {
                    moviesField.value += `${newName}\n\n`;
                    typesField.value += `*${type}*\n\n`;
                    if (ctx.measureText(newName).width >= 292)
                        typesField.value += `\n`;
                    continue;
                }

                embeds.push(new EmbedBuilder()
                    .setColor(instance.color)
                    .addFields([moviesField, typesField])
                    .setThumbnail(`${githubRawURL}/assets/thumbs/${collection.thumb}.png`));

                moviesField = { name: 'Nombre', value: `${newName}\n\n`, inline: true };
                typesField = { name: 'Tipo', value: `*${type}*\n\n`, inline: true };

                if (ctx.measureText(newName).width >= 292)
                    typesField.value += `\n`;
            }

            embeds.push(new EmbedBuilder()
                .setColor(instance.color)
                .addFields([moviesField, typesField])
                .setThumbnail(`${githubRawURL}/assets/thumbs/${collection.thumb}.png`));

            for (let i = 0; i < embeds.length; i++) {
                const msg = embeds[i];
                msg.setFooter({ text: `Página ${i + 1} | ${embeds.length}` });
                if (i === 0)
                    msg.setDescription(instance.messageHandler.get(guild, 'MOVIES', {
                        CMD: collection.cmd || collectionId,
                        ID: member.user.id,
                        PREFIX: prefix
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
            reply.content = `${emoji} ${title}\n⚠ Podés navegar libremente por las páginas, luego de 5 minutos de inactividad esta acción expirará.\n\u200b`;
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
                reply.content = `${emoji} ${title}\n✅ Esta acción **se completó**, para volver a elegir filtros usá **${prefix}db**.\n\u200b`;
                message ? await replyMessage.edit(reply) : await interaction.editReply(reply);
            });
        };

        sendChoicesMessages(breakpoints);
    },

    sendChronologyElement: async (channel, collectionId, instance, interaction, member, message, number) => {
        const { choices, filters } = getFilters(collectionId) || await updateFiltersCache(collectionId);
        const movies = getMovies(collectionId) || await updateMovies(collectionId, filters, choices);
        const data = getDownloadsData(collectionId) || await updateDownloadsData(collectionId);
        const index = parseInt(number) - 1;
        const reply = { ephemeral: true };

        if (isNaN(index) || index < 0 || index >= movies.length) {
            reply.content = `⚠ El número ingresado es inválido.`;
            message ? await message.reply(reply) : await interaction.editReply(reply);
            return;
        }

        const { name: elementName, reference, thumb: elementThumb, type, year: elementYear } = movies[index];

        if (!reference) {
            const filteredName = elementName.replace(/[:|?]/g, '').replace(/ /g, '%20');

            reply.content = `**${elementName} (${elementYear})**\n\n⚠ Este elemento no cuenta con contenido descargable.\n\u200b`;
            reply.files = [`${githubRawURL}/assets/${collectionId}/${filteredName}.jpg`];

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

            reply.content = `**${!elementYear ? packageName : elementName} (${elementYear || packageYear})**\n\n⚠ Por favor seleccioná la versión que querés ver, esta acción expirará luego de 5 minutos de inactividad.\n\u200b`;
            reply.components = [getVersionsRow()];
            reply.files = [`${githubRawURL}/assets/${collectionId}/${filteredName}.jpg`];

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
                    content: `**${packageName} (${packageYear})**\n\n⌛ Esta acción expiró, para volver a ver los links de este elemento usá **${prefix}ucm ${index + 1}**.\n\u200b`,
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
                        .setThumbnail(`${githubRawURL}/assets/thumbs/${collectionId}/${thumb}.png`));
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

            const secondFilter = btnInt => { return member.user.id === btnInt.user.id };

            finalCollector = versionsMessage.createMessageComponentCollector({ secondFilter, idle: 1000 * 60 * 5 });

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
    },

    isOwner: async id => {
        const ids = getIds() || await updateIds();
        return id === ids.users.stormer || id === ids.users.darkness;
    }
}
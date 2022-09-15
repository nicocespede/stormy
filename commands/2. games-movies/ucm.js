const { createCanvas } = require('canvas');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ApplicationCommandOptionType, ButtonStyle } = require('discord.js');
const { getMcuMovies, updateMcuMovies, getFilters, updateFilters, getMcu, updateMcu } = require('../../app/cache');
const { prefix, githubRawURL } = require('../../app/constants');
const { updateMcuFilters } = require('../../app/mongodb');
const validFilters = ['Película', 'Serie', 'Miniserie', 'Cortometraje'];

function areEqual(oldFilters, newFilters) {
    if (oldFilters.length === newFilters.length) {
        return oldFilters.every(element => {
            if (newFilters.includes(element)) {
                return true;
            }
            return false;
        });
    }
    return false;
}

async function getMovieInfo(movieName) {
    const fetch = require('node-fetch');
    const info = {};
    const mcu = !getMcu() ? await updateMcu() : getMcu();
    const movie = mcu.filter(element => element.name === movieName)[0];
    const filteredName = movieName.replace(/[:]/g, '').replace(/[?]/g, '').replace(/ /g, '%20');
    for (const version in movie.lastUpdate)
        await fetch(`${githubRawURL}/mcu/${filteredName}/${version}.txt`)
            .then(res => res.text()).then(data => {
                info[version] = data;
            }).catch(err => console.log(`> Error al cargar ${version}.txt`, err));
    return info;
}

function lastUpdateToString(lastUpdate) {
    var date = new Date(`${lastUpdate.substring(6, 10)}/${lastUpdate.substring(3, 5)}/${lastUpdate.substring(0, 2)}`);
    var today = new Date();
    if (date.getMonth() == today.getMonth() && date.getFullYear() == today.getFullYear())
        if (date.getDate() == today.getDate())
            return 'hoy';
        else if (date.getDate() == today.getDate() - 1)
            return 'ayer';
    return 'el ' + lastUpdate;
}

module.exports = {
    category: 'Juegos/Películas',
    description: 'Responde con los links de descarga de las películas del Universo Cinematográfico de Marvel.',

    options: [
        {
            name: 'numero',
            description: 'El número del elemento que se quiere ver.',
            required: false,
            type: ApplicationCommandOptionType.Integer
        }
    ],
    maxArgs: 1,
    expectedArgs: '[numero]',
    slash: 'both',

    callback: async ({ user, message, args, interaction, channel, guild, instance }) => {
        if (interaction) await interaction.deferReply({ ephemeral: true });
        const number = message ? args[0] : interaction.options.getInteger('numero');
        var reply = { custom: true, ephemeral: true };
        if (number) {
            var filters = !getFilters() ? await updateFilters() : getFilters();
            const mcuMovies = !getMcuMovies() ? await updateMcuMovies(filters) : getMcuMovies();
            const index = parseInt(number) - 1;
            if (isNaN(index) || index < 0 || index >= mcuMovies.length) {
                reply.content = `⚠ El número ingresado es inválido.`;
                return reply;
            }
            const name = mcuMovies[index].name;
            await getMovieInfo(name).then(async info => {
                var nowShowing = '';
                const getVersionsRow = () => {
                    const row = new ActionRowBuilder();
                    for (const ver in info)
                        if (Object.hasOwnProperty.call(info, ver)) {
                            row.addComponents(new ButtonBuilder().setCustomId(ver)
                                .setEmoji('📽')
                                .setLabel(ver)
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(ver === nowShowing));
                        }
                    return row;
                };

                const moviePath = `${githubRawURL}/mcu/${name.replace(/[:]/g, '').replace(/[?]/g, '').replace(/ /g, '%20')}`;

                reply.content = `**${name}**\n\n⚠ Por favor seleccioná la versión que querés ver, esta acción expirará luego de 5 minutos.\n\u200b`;
                reply.components = [getVersionsRow()];
                reply.files = [`${moviePath}/image.jpg`];

                const replyMessage = message ? await message.reply(reply) : await interaction.editReply(reply);

                const filter = (btnInt) => {
                    const btnIntId = !btnInt.message.interaction ? btnInt.message.id : btnInt.message.interaction.id;
                    const isTheSameMessage = message ? btnIntId === replyMessage.id : btnIntId === interaction.id;
                    return user.id === btnInt.user.id && isTheSameMessage;
                }

                const collector = channel.createMessageComponentCollector({ filter, time: 1000 * 60 * 5 });

                var versionsMessage;
                var finalCollector;

                collector.on('collect', async i => {
                    const embeds = [];
                    const pages = {};
                    nowShowing = i.customId;
                    await i.update({ components: [getVersionsRow()] });
                    const serverOptions = info[i.customId].split('\n**');
                    const password = serverOptions.length > 1 ? '**' + serverOptions.pop() : '';
                    serverOptions.forEach(server => {
                        const lines = server.split('\n');
                        const serverName = lines.shift().split(':**')[0].replace(/[**]/g, '');
                        const title = mcuMovies[index].type === 'Cortometraje' ? `Marvel One-shot collection (2011-2018)` : name;
                        embeds.push(new EmbedBuilder()
                            .setTitle(`${title} - ${i.customId} (${serverName})`)
                            .setColor(mcuMovies[index].color)
                            .setDescription(`Actualizada por última vez ${lastUpdateToString(mcuMovies[index].lastUpdate[i.customId])}.\n` + lines.join('\n') + `\n${password}`)
                            .setThumbnail(`attachment://thumb.png`));
                    });

                    for (let i = 0; i < embeds.length; i++) {
                        const msg = embeds[i];
                        msg.setFooter({ text: `Opción ${i + 1} | ${embeds.length}` });
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

                        return row;
                    };

                    const id = user.id;
                    pages[id] = pages[id] || 0;

                    var msg = {
                        components: [getRow(id)],
                        embeds: [embeds[pages[id]]],
                        files: [`${moviePath}/thumb.png`]
                    };

                    versionsMessage = !versionsMessage ? await channel.send(msg) : await versionsMessage.edit(msg);
                    if (finalCollector)
                        finalCollector.stop();

                    const secondFilter = (btnInt) => { return user.id === btnInt.user.id };

                    finalCollector = versionsMessage.createMessageComponentCollector({ secondFilter, time: 1000 * 60 * 5 });

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
                });

                collector.on('end', async _ => {
                    if (versionsMessage) versionsMessage.delete();
                    var edit = {
                        components: [],
                        content: `**${name}**\n\n⌛ Esta acción expiró, para volver a ver los links de este elemento usá **${prefix}ucm ${index + 1}**.\n\u200b`,
                        embeds: [],
                        files: reply.files
                    };
                    message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
                });
            }).catch(console.error);
        } else {
            var filters = !getFilters() ? await updateFilters() : getFilters();
            var mcuMovies = !getMcuMovies() ? await updateMcuMovies(filters) : getMcuMovies();

            const getFiltersRow = (array) => {
                const row = new ActionRowBuilder();
                row.addComponents(new ButtonBuilder()
                    .setCustomId('all')
                    .setEmoji(!array.includes('all') ? '🔳' : '✅')
                    .setLabel('Todo')
                    .setStyle(ButtonStyle.Secondary));
                validFilters.forEach(f => {
                    row.addComponents(new ButtonBuilder()
                        .setCustomId(f)
                        .setEmoji(!array.includes(f) ? '🔳' : '✅')
                        .setLabel(f + 's')
                        .setStyle(ButtonStyle.Secondary));
                });
                return row;
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

            reply.content = `**Universo Cinematográfico de Marvel**\n\n⚠ Por favor **seleccioná los filtros** que querés aplicar y luego **confirmá** para aplicarlos, esta acción expirará luego de 5 minutos.\n\u200b`;
            reply.components = [getFiltersRow(filters), secondaryRow];
            reply.files = [`./assets/mcu.jpg`];

            const replyMessage = message ? await message.reply(reply) : await interaction.editReply(reply);

            const filter = (btnInt) => {
                const btnIntId = !btnInt.message.interaction ? btnInt.message.id : btnInt.message.interaction.id;
                const isTheSameMessage = message ? btnIntId === replyMessage.id : btnIntId === interaction.id;
                return user.id === btnInt.user.id && isTheSameMessage;
            }

            const collector = channel.createMessageComponentCollector({ filter, time: 1000 * 60 * 5 });

            var selected = filters.slice(0);
            var status = '';
            var extraMessages = [];

            collector.on('collect', async i => {
                var update = {};
                if (i.customId === 'all') {
                    selected = !selected.includes('all') ? [i.customId] : [];
                    update.components = [getFiltersRow(selected), secondaryRow];
                    await i.update(update);
                } else if (i.customId === 'confirm') {
                    if (selected.length === 0)
                        extraMessages.push(await channel.send('⛔ ¡Debes seleccionar algún filtro para confirmar!'));
                    else {
                        if (!areEqual(filters, selected)) {
                            await updateMcuFilters(selected);
                            filters = await updateFilters();
                            mcuMovies = await updateMcuMovies(filters);
                        }
                        status = 'CONFIRMED';
                        update.components = [];
                        await i.update(update);
                        collector.stop();
                    }
                } else if (i.customId === 'cancel') {
                    status = 'CANCELLED';
                    update.components = [];
                    await i.update(update);
                    collector.stop();
                } else {
                    if (selected.includes('all'))
                        selected = [];
                    if (!selected.includes(i.customId))
                        selected.push(i.customId);
                    else
                        selected.splice(selected.indexOf(i.customId), 1);
                    update.components = [getFiltersRow(selected), secondaryRow];
                    await i.update(update);
                }
            });

            collector.on('end', async _ => {
                extraMessages.forEach(m => m.delete());
                var edit = {};
                if (status === 'CONFIRMED') {
                    const canvas = createCanvas(200, 200);
                    const ctx = canvas.getContext('2d');
                    const color = [181, 2, 22];
                    const embeds = [];
                    const pages = {};
                    var moviesField = { name: 'Nombre', value: '', inline: true };
                    var typesField = { name: 'Tipo', value: ``, inline: true };
                    for (var i = 0; i < mcuMovies.length; i++) {
                        const name = mcuMovies[i].name;
                        const type = mcuMovies[i].type;
                        const newName = `**${i + 1}.** ${name}`;
                        const aux = moviesField.value + `${newName}\n\n`;
                        if (aux.length <= 1024) {
                            moviesField.value += `${newName}\n\n`;
                            typesField.value += `*${type}*\n\n`;
                            if (ctx.measureText(newName).width > 288)
                                typesField.value += `\n`;
                        } else {
                            embeds.push(new EmbedBuilder()
                                .setColor(color)
                                .addFields([moviesField, typesField])
                                .setThumbnail(`attachment://mcu-logo.png`));
                            moviesField = { name: 'Nombre', value: `${newName}\n\n`, inline: true };
                            typesField = { name: 'Tipo', value: `*${type}*\n\n`, inline: true };
                            if (ctx.measureText(newName).width > 288)
                                typesField.value += `\n`;
                        }
                    }
                    embeds.push(new EmbedBuilder()
                        .setColor(color)
                        .addFields([moviesField, typesField])
                        .setThumbnail(`attachment://mcu-logo.png`));
                    for (let i = 0; i < embeds.length; i++) {
                        const msg = embeds[i];
                        msg.setFooter({ text: `Página ${i + 1} | ${embeds.length}` });
                        if (i === 0)
                            msg.setDescription(instance.messageHandler.get(guild, 'MCU', {
                                ID: user.id,
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

                    const id = user.id;
                    pages[id] = pages[id] || 0;

                    edit.components = [getRow(id)];
                    edit.content = `**Universo Cinematográfico de Marvel**\n\n⚠ Podés navegar libremente por las páginas durante 5 minutos, luego esta acción expirará.\n\u200b`;
                    edit.embeds = [embeds[pages[id]]];
                    edit.files = [`./assets/thumbs/mcu-logo.png`];

                    const finalCollector = channel.createMessageComponentCollector({ filter, time: 1000 * 60 * 5 });

                    finalCollector.on('collect', async btnInt => {
                        if (!btnInt) return;

                        btnInt.deferUpdate();

                        if (btnInt.customId !== 'prev_page' && btnInt.customId !== 'next_page') {
                            finalCollector.stop();
                        } else {
                            if (btnInt.customId === 'prev_page' && pages[id] > 0) --pages[id];
                            else if (btnInt.customId === 'next_page' && pages[id] < embeds.length - 1) ++pages[id];

                            edit.components = [getRow(id)];
                            edit.embeds = [embeds[pages[id]]];
                        }

                        message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
                    });

                    finalCollector.on('end', async _ => {
                        edit.components = [];
                        edit.content = `**Universo Cinematográfico de Marvel**\n\n✅ Esta acción **se completó**, para volver a elegir filtros usá **${prefix}ucm**.\n\u200b`;
                        message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
                    });
                } else if (status === 'CANCELLED')
                    edit.content = `**Universo Cinematográfico de Marvel**\n\n❌ Esta acción **fue cancelada**, para volver a elegir filtros usá **${prefix}ucm**.\n\u200b`;
                else
                    edit.content = `**Universo Cinematográfico de Marvel**\n\n⌛ Esta acción **expiró**, para volver a elegir filtros usá **${prefix}ucm**.\n\u200b`;

                message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
            });
        }
        return;
    }
}
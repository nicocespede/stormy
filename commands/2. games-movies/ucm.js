const { createCanvas } = require('canvas');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ApplicationCommandOptionType, ButtonStyle } = require('discord.js');
const chalk = require('chalk');
chalk.level = 1;
const { getMcuMovies, updateMcuMovies, getFilters, updateFilters, getMcu, updateMcu, getIds, updateIds } = require('../../app/cache');
const { prefix, githubRawURL } = require('../../app/constants');
const { lastUpdateToString } = require('../../app/general');
const { updateMcuFilters } = require('../../app/mongodb');

const areEqual = (oldFilters, newFilters) => {
    if (oldFilters.length === newFilters.length) {
        return oldFilters.every(element => {
            if (newFilters.includes(element))
                return true;
            return false;
        });
    }
    return false;
};

const getValidFilters = async () => {
    const mcu = getMcu() || await updateMcu();
    return [...new Set(mcu.map(({ type }) => type))];
};

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

    callback: async ({ user, member, message, args, interaction, channel, guild, instance }) => {
        if (interaction) await interaction.deferReply({ ephemeral: true });

        const ids = getIds() || await updateIds();
        try {
            const role = await guild.roles.fetch(ids.roles.anunciosUcm);
            if (!role.members.has(user.id)) {
                await member.roles.add(ids.roles.anunciosUcm);
                console.log(chalk.green(`Rol 'MCU Fans' agregado a ${user.tag}`));
            }
        } catch (error) {
            console.log(chalk.red(`No se pudo agregar el rol 'MCU Fans' a ${user.tag}:\n${error.stack}`));
        }

        const number = message ? args[0] : interaction.options.getInteger('numero');
        const reply = { ephemeral: true };

        if (!number) {
            let filters = getFilters() || await updateFilters();
            let mcuMovies = getMcuMovies() || await updateMcuMovies(filters);
            const validFilters = await getValidFilters();

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

            const getNewEmoji = async () => {
                const mcuCharacters = Object.keys(ids.emojis.mcuCharacters);
                const emojiName = mcuCharacters[Math.floor(Math.random() * mcuCharacters.length)];
                return `<:${emojiName}:${ids.emojis.mcuCharacters[emojiName]}>`;
            };

            const title = `Universo Cinematográfico de Marvel`;
            let emoji = await getNewEmoji();

            reply.content = `${emoji} **${title}**\n\n⚠ Por favor **seleccioná los filtros** que querés aplicar y luego **confirmá** para aplicarlos, esta acción expirará luego de 5 minutos.\n\u200b`;
            reply.components = getFiltersRows(filters).concat([secondaryRow]);
            reply.files = [`./assets/mcu.jpg`];

            const replyMessage = message ? await message.reply(reply) : await interaction.editReply(reply);

            const filter = (btnInt) => {
                const btnIntId = !btnInt.message.interaction ? btnInt.message.id : btnInt.message.interaction.id;
                const isTheSameMessage = message ? btnIntId === replyMessage.id : btnIntId === interaction.id;
                return user.id === btnInt.user.id && isTheSameMessage;
            }

            const collector = channel.createMessageComponentCollector({ filter, time: 1000 * 60 * 5 });

            let selected = filters.slice(0);
            let status = '';
            const extraMessages = [];

            collector.on('collect', async i => {
                const update = {};
                if (i.customId === 'all') {
                    selected = !selected.includes('all') ? [i.customId] : [];
                    update.components = getFiltersRows(selected).concat([secondaryRow]);
                    await i.update(update);
                } else if (i.customId === 'confirm') {
                    if (selected.length === 0) {
                        extraMessages.push(await channel.send('⛔ ¡Debes seleccionar algún filtro para confirmar!'));
                        i.deferUpdate();
                    } else {
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
                    if (selected.includes(i.customId))
                        selected.splice(selected.indexOf(i.customId), 1);
                    else {
                        selected.push(i.customId);
                        if (selected.length === validFilters.length)
                            selected = ['all'];
                    }
                    update.components = getFiltersRows(selected).concat([secondaryRow]);
                    await i.update(update);
                }
            });

            collector.on('end', async _ => {
                extraMessages.forEach(m => m.delete());
                const edit = {};
                emoji = await getNewEmoji();

                if (status === 'CONFIRMED') {
                    const canvas = createCanvas(200, 200);
                    const ctx = canvas.getContext('2d');
                    const embeds = [];
                    const pages = {};
                    let moviesField = { name: 'Nombre', value: '', inline: true };
                    let typesField = { name: 'Tipo', value: ``, inline: true };
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
                                .setColor(instance.color)
                                .addFields([moviesField, typesField])
                                .setThumbnail(`${githubRawURL}/assets/thumbs/marvel.png`));
                            moviesField = { name: 'Nombre', value: `${newName}\n\n`, inline: true };
                            typesField = { name: 'Tipo', value: `*${type}*\n\n`, inline: true };
                            if (ctx.measureText(newName).width > 288)
                                typesField.value += `\n`;
                        }
                    }
                    embeds.push(new EmbedBuilder()
                        .setColor(instance.color)
                        .addFields([moviesField, typesField])
                        .setThumbnail(`${githubRawURL}/assets/thumbs/marvel.png`));
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
                    edit.content = `${emoji} **${title}**\n\n⚠ Podés navegar libremente por las páginas, luego de 5 minutos de inactividad esta acción expirará.\n\u200b`;
                    edit.embeds = [embeds[pages[id]]];
                    edit.files = [];

                    const finalCollector = channel.createMessageComponentCollector({ filter, idle: 1000 * 60 * 5 });

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
                        edit.content = `${emoji} **${title}**\n\n✅ Esta acción **se completó**, para volver a elegir filtros usá **${prefix}ucm**.\n\u200b`;
                        message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
                    });
                } else if (status === 'CANCELLED')
                    edit.content = `${emoji} **${title}**\n\n❌ Esta acción **fue cancelada**, para volver a elegir filtros usá **${prefix}ucm**.\n\u200b`;
                else
                    edit.content = `${emoji} **${title}**\n\n⌛ Esta acción **expiró**, para volver a elegir filtros usá **${prefix}ucm**.\n\u200b`;

                message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
            });
            return;
        }

        const filters = getFilters() || await updateFilters();
        const mcuMovies = getMcuMovies() || await updateMcuMovies(filters);
        const index = parseInt(number) - 1;

        if (isNaN(index) || index < 0 || index >= mcuMovies.length) {
            reply.content = `⚠ El número ingresado es inválido.`;
            message ? await message.reply(reply) : await interaction.editReply(reply);
            return;
        }

        const { color, episodes, name, type, versions } = mcuMovies[index];
        let nowShowing = '';
        const getVersionsRow = () => {
            const emojis = {
                "Cortometraje": '📹',
                "Especial": '📺',
                "Miniserie": '🎥',
                "One-Shot": '🎬',
                "Película": '📽',
                "Serie": '🎞'
            };
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

        const filteredName = name.replace(/[:]/g, '').replace(/[?]/g, '').replace(/ /g, '%20');

        reply.content = `**${name}**\n\n⚠ Por favor seleccioná la versión que querés ver, esta acción expirará luego de 5 minutos de inactividad.\n\u200b`;
        reply.components = [getVersionsRow()];
        reply.files = [`${githubRawURL}/assets/mcu/${filteredName}.jpg`];

        const replyMessage = message ? await message.reply(reply) : await interaction.editReply(reply);

        const filter = (btnInt) => {
            const btnIntId = !btnInt.message.interaction ? btnInt.message.id : btnInt.message.interaction.id;
            const isTheSameMessage = message ? btnIntId === replyMessage.id : btnIntId === interaction.id;
            return user.id === btnInt.user.id && isTheSameMessage;
        }

        const collector = channel.createMessageComponentCollector({ filter, idle: 1000 * 60 * 5 });

        let versionsMessage;
        let finalCollector;

        collector.on('collect', async i => {
            const embeds = [];
            const pages = {};
            nowShowing = i.customId;
            await i.update({ components: [getVersionsRow()] });
            const { files, lastUpdate, links, password } = versions[i.customId];
            const dataString = `${episodes ? `**Episodios:** ${episodes}\n` : ''}**Cantidad de archivos:** ${files}`;
            const passwordString = password ? `**Contraseña:** ${password}` : '';
            for (const server in links) if (Object.hasOwnProperty.call(links, server)) {
                const title = type === 'One-Shot' ? `Marvel One-Shots collection (2011-2018)` : name;
                embeds.push(new EmbedBuilder()
                    .setTitle(`${title} - ${i.customId} (${server})`)
                    .setColor(color)
                    .setDescription(`${dataString}\n**Actualizado por última vez:** ${lastUpdateToString(lastUpdate, false)}.\n\n${links[server].join('\n')}\n\n${passwordString}`)
                    .setThumbnail(`${githubRawURL}/assets/thumbs/mcu/${filteredName}.png`));
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

            const id = user.id;
            pages[id] = pages[id] || 0;

            const msg = {
                components: [getRow(id)],
                embeds: [embeds[pages[id]]],
                files: []
            };

            versionsMessage = !versionsMessage ? await channel.send(msg) : await versionsMessage.edit(msg);
            if (finalCollector)
                finalCollector.stop();

            const secondFilter = (btnInt) => { return user.id === btnInt.user.id };

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
        });

        collector.on('end', async _ => {
            if (versionsMessage) versionsMessage.delete();
            const edit = {
                components: [],
                content: `**${name}**\n\n⌛ Esta acción expiró, para volver a ver los links de este elemento usá **${prefix}ucm ${index + 1}**.\n\u200b`,
                embeds: [],
                files: reply.files
            };
            message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
        });
    }
}
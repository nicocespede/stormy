const { createCanvas } = require('canvas');
const { MessageEmbed, Constants, MessageActionRow, MessageButton } = require('discord.js');
const fs = require('fs');
const { getMcuMovies, updateMcuMovies, getFilters, updateFilters } = require('../../app/cache');
const { prefix, texts } = require('../../app/constants');
const { updateMcuFilters } = require('../../app/postgres');
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

async function getMovieInfo(path) {
    var info = {};
    return new Promise(function (resolve, reject) {
        //passsing directoryPath and callback function
        fs.readdir(path, function (err, files) {
            //handling error
            if (err)
                return console.log('Unable to scan directory: ' + err);
            //listing all files using forEach
            files.forEach(file => {
                // Do whatever you want to do with the file
                fs.readFile(`${path}/${file}`, 'utf8', function readFileCallback(err, data) {
                    if (err) console.log(err);
                    if (file != 'image.jpg')
                        info[file.substring(0, file.length - 4)] = data;
                });
            });
        });
        setTimeout(function () { resolve(); }, 1000);
    }).then(function () {
        return info;
    });
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

const getButton = (array, id) => {
    var ret;
    array.forEach(element => {
        if (element.customId === id) {
            ret = element;
            return;
        }
    });
    return ret;
};

module.exports = {
    category: 'Juegos/Películas',
    description: 'Responde con los links de descarga de las películas del Universo Cinematográfico de Marvel.',

    options: [
        {
            name: 'numero',
            description: 'El número del elemento que se quiere ver.',
            required: false,
            type: Constants.ApplicationCommandOptionTypes.INTEGER
        }
    ],
    maxArgs: 1,
    expectedArgs: '[numero]',
    slash: 'both',

    callback: async ({ user, message, args, interaction, channel }) => {
        const color = [181, 2, 22];
        const number = message ? args[0] : interaction.options.getInteger('numero');
        var reply = { custom: true, ephemeral: true };
        if (number) {
            var filters = !getFilters() ? await updateFilters() : getFilters();
            var mcuMovies = !getMcuMovies() ? updateMcuMovies(filters) : getMcuMovies();
            const index = parseInt(number) - 1;
            if (isNaN(index) || index < 0 || index >= mcuMovies.length) {
                reply.content = `¡Uso incorrecto! El número ingresado es inválido. Usá **"${prefix}ucm [numero]"**.`;
                return reply;
            }
            var name = mcuMovies[index].name;
            await getMovieInfo(`./assets/movies/${name.replace(/[:]/g, '').replace(/[?]/g, '')}`).then(async info => {
                const row = new MessageActionRow();
                for (const ver in info) {
                    if (Object.hasOwnProperty.call(info, ver)) {
                        row.addComponents(new MessageButton().setCustomId(ver)
                            .setEmoji('📽')
                            .setLabel(ver)
                            .setStyle('PRIMARY'));
                    }
                }
                reply.content = `**${name}**\n\nPor favor seleccioná la versión que querés ver, esta acción expirará luego de 5 minutos.\n\u200b`;
                reply.components = [row];
                reply.files = [`./assets/movies/${name.replace(/[:]/g, '').replace(/[?]/g, '')}/image.jpg`];

                const replyMessage = message ? await message.reply(reply) : interaction.reply(reply);

                const filter = (btnInt) => {
                    const btnIntId = !btnInt.message.interaction ? btnInt.message.id : btnInt.message.interaction.id;
                    const isTheSameMessage = message ? btnIntId === replyMessage.id : btnIntId === interaction.id;
                    return user.id === btnInt.user.id && isTheSameMessage;
                }

                const collector = channel.createMessageComponentCollector({ filter, time: 1000 * 60 * 5 });

                var nowShowing = '';

                collector.on('collect', async i => {
                    if (i.customId != nowShowing) {
                        var embeds = [];
                        if (nowShowing != '') getButton(row.components, nowShowing).setStyle('PRIMARY');
                        nowShowing = i.customId;
                        getButton(row.components, i.customId).setStyle('SECONDARY');
                        const serverOptions = info[i.customId].split('\r\n**');
                        const password = '**' + serverOptions.pop();
                        serverOptions.forEach(async server => {
                            const lines = server.split('\r\n');
                            const serverName = lines.shift().split(':**')[0].replace(/[**]/g, '');
                            const title = mcuMovies[index].type === 'Cortometraje' ? `Marvel One-shot collection (2011-2018)` : name;
                            embeds.push(new MessageEmbed()
                                .setTitle(`${title} - ${i.customId} (${serverName})`)
                                .setColor(color)
                                .setDescription(lines.join('\r\n') + `\n${password}`)
                                .setThumbnail(`attachment://${mcuMovies[index].thumbURL}`)
                                .setFooter({ text: `Actualizada por última vez ${lastUpdateToString(mcuMovies[index].lastUpdate)}.` }));
                        });
                        i.update({ components: [row], embeds: embeds, files: reply.files.concat([`./assets/thumbs/mcu/${mcuMovies[index].thumbURL}`]) });
                    } else
                        i.deferUpdate();
                });

                collector.on('end', async _ => {
                    var edit = {
                        components: [],
                        content: `**${name}**\n\nEsta acción expiró, para volver a ver los links de este elemento usá **${prefix}ucm ${index + 1}**.\n\u200b`,
                        embeds: [],
                        files: reply.files
                    };
                    message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
                });
            }).catch(console.error);
        } else {
            var filters = !getFilters() ? await updateFilters() : getFilters();
            var mcuMovies = !getMcuMovies() ? updateMcuMovies(filters) : getMcuMovies();

            const primaryRow = new MessageActionRow()
                .addComponents(new MessageButton()
                    .setCustomId('all')
                    .setEmoji(!filters.includes('all') ? '🔳' : '✅')
                    .setLabel('Todo')
                    .setStyle('SECONDARY'));
            validFilters.forEach(f => {
                primaryRow.addComponents(new MessageButton()
                    .setCustomId(f)
                    .setEmoji(!filters.includes(f) ? '🔳' : '✅')
                    .setLabel(f + 's')
                    .setStyle('SECONDARY'));
            });

            const secondaryRow = new MessageActionRow()
                .addComponents(new MessageButton()
                    .setCustomId('confirm')
                    .setEmoji('✔')
                    .setLabel('Confirmar')
                    .setStyle('SUCCESS'))
                .addComponents(new MessageButton()
                    .setCustomId('cancel')
                    .setEmoji('❌')
                    .setLabel('Cancelar')
                    .setStyle('DANGER'));

            reply.content = `**Universo Cinematográfico de Marvel**\n\n⚠ Por favor **seleccioná los filtros** que querés aplicar y luego **confirmá** para aplicarlos, esta acción expirará luego de 5 minutos.\n\u200b`;
            reply.components = [primaryRow, secondaryRow];
            reply.files = [`./assets/mcu.jpg`];

            const replyMessage = message ? await message.reply(reply) : interaction.reply(reply);

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
                    if (!selected.includes('all')) {
                        primaryRow.components.forEach(element => {
                            if (element.customId != i.customId)
                                element.setEmoji('🔳');
                        });
                        selected = [i.customId];
                        getButton(primaryRow.components, i.customId).setEmoji('✅');
                    } else {
                        selected = [];
                        getButton(primaryRow.components, i.customId).setEmoji('🔳');
                    }
                    update.components = [primaryRow, secondaryRow];
                    await i.update(update);
                } else if (i.customId === 'confirm') {
                    if (selected.length === 0)
                        extraMessages.push(await channel.send('⛔ ¡Debes seleccionar algún filtro para confirmar!'));
                    else {
                        if (!areEqual(filters, selected)) {
                            await updateMcuFilters(selected);
                            filters = await updateFilters();
                            mcuMovies = updateMcuMovies(filters);
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
                    if (selected.includes('all')) {
                        getButton(primaryRow.components, 'all').setEmoji('🔳');
                        selected = [];
                    }
                    if (!selected.includes(i.customId)) {
                        selected.push(i.customId);
                        getButton(primaryRow.components, i.customId).setEmoji('✅');
                    } else {
                        selected.splice(selected.indexOf(i.customId), 1);
                        getButton(primaryRow.components, i.customId).setEmoji('🔳');
                    }
                    update.components = [primaryRow, secondaryRow];
                    await i.update(update);
                }
            });

            collector.on('end', async _ => {
                extraMessages.forEach(m => m.delete());
                var edit = {};
                if (status === 'CONFIRMED') {
                    const canvas = createCanvas(200, 200);
                    const ctx = canvas.getContext('2d');
                    var embeds = [];
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
                            embeds.push(new MessageEmbed()
                                .setColor(color)
                                .addFields([moviesField, typesField])
                                .setThumbnail(`attachment://mcu-logo.png`));
                            moviesField = { name: 'Nombre', value: `${newName}\n\n`, inline: true };
                            typesField = { name: 'Tipo', value: `*${type}*\n\n`, inline: true };
                            if (ctx.measureText(newName).width > 288)
                                typesField.value += `\n`;
                        }
                    }
                    embeds.push(new MessageEmbed()
                        .setColor(color)
                        .addFields([moviesField, typesField])
                        .setThumbnail(`attachment://mcu-logo.png`));
                    for (let i = 0; i < embeds.length; i++) {
                        const msg = embeds[i];
                        if (i === 0)
                            msg.setDescription(texts.movies.description.replace(/%USER_ID%/g, user.id).replace(/%PREFIX%/g, prefix));
                        if (i === embeds.length - 1)
                            msg.setFooter({ text: texts.movies.footer });
                    }
                    edit.content = `**Universo Cinematográfico de Marvel**\n\n✅ Esta acción **se completó**, para volver a elegir filtros usá **${prefix}ucm**.\n\u200b`;
                    edit.embeds = embeds;
                    edit.files = [`./assets/thumbs/mcu-logo.png`];
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
const { createCanvas } = require('canvas');
const { MessageEmbed, Constants } = require('discord.js');
const fs = require('fs');
const { getMcuMovies, updateMcuMovies, getFilters, updateFilters } = require('../../app/cache');
const { prefix, texts } = require('../../app/constants');
const { updateMcuFilters } = require('../../app/postgres');
const validFilters = ['all', 'p', 'peliculas', 'pelis', 'películas', 'c', 'cortos', 'cortometrajes', 's', 'series'];

function filtersNeedUpdate(oldFilters, newFilters) {
    var ret = false;
    newFilters.forEach(filter => {
        if (!oldFilters.includes(filter)) {
            ret = true;
            return;
        }
    });
    if (!ret) ret = oldFilters.length != newFilters.length;
    return ret;
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

function getNewFilters(array) {
    var filters = [];
    if (array.includes('all'))
        filters.push('all');
    else
        array.forEach(arg => {
            arg = arg.toLowerCase();
            if (validFilters.slice(1, 5).includes(arg))
                filters.push('Película');
            if (validFilters.slice(5, 8).includes(arg))
                filters.push('Cortometraje');
            if (validFilters.slice(8).includes(arg)) {
                filters.push('Serie');
                filters.push('Miniserie');
            }
        });
    return filters;
}

function validateFilters(array) {
    var ret = true;
    array.forEach(filter => {
        if (!validFilters.includes(filter)) {
            ret = false;
            return;
        }
    });
    return ret;
}

module.exports = {
    category: 'Juegos/Películas',
    description: 'Responde con los links de descarga de las películas del Universo Cinematográfico de Marvel.',

    options: [
        {
            name: 'numero',
            description: 'El número del elemento que se quiere ver.',
            required: false,
            type: Constants.ApplicationCommandOptionTypes.INTEGER
        },
        {
            name: 'filtro1',
            description: 'El primer filtro para la lista.',
            required: false,
            type: Constants.ApplicationCommandOptionTypes.STRING
        },
        {
            name: 'filtro2',
            description: 'El segundo filtro para la lista.',
            required: false,
            type: Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    maxArgs: 2,
    expectedArgs: '[numero] ó [filtro1] [filtro2]',
    slash: 'both',

    callback: async ({ user, message, args, interaction }) => {
        const color = [181, 2, 22];
        var filters = !getFilters() ? await updateFilters() : getFilters();
        var mcuMovies = !getMcuMovies() ? updateMcuMovies(filters) : getMcuMovies();
        const number = message ? args[0] : interaction.options.getInteger('numero');
        var reply = { custom: true, ephemeral: true };
        if (number && !isNaN(parseInt(number))) {
            const index = parseInt(number) - 1;
            if (index < 0 || index >= mcuMovies.length)
                reply.content = `¡Uso incorrecto! El número ingresado es inválido. Usá **"${prefix}ucm [numero]"**.`;
            else {
                var name = mcuMovies[index].name;
                await getMovieInfo(`./movies/${name.replace(/[:]/g, '').replace(/[?]/g, '')}`).then(info => {
                    var messages = [];
                    for (const ver in info) {
                        if (Object.hasOwnProperty.call(info, ver) && ver != 'thumbURL' && ver != 'lastUpdate') {
                            const element = info[ver];
                            var fields = [];
                            var field = { name: '\u200b', value: '' };
                            var fullString = element.split('\n');
                            fullString.forEach(line => {
                                var aux = field.value + line + '\n';
                                if (aux.length < 1025)
                                    field.value += line + '\n';
                                else {
                                    fields.push(field);
                                    field = { name: '\u200b', value: line + '\n' };
                                }
                            });
                            fields.push(field);
                            var title = mcuMovies[index].type === 'Cortometraje' ? `Marvel One-shot collection (2011-2018)` : name;
                            messages.push(new MessageEmbed()
                                .setTitle(`${title} - versión ${ver}`)
                                .setColor(color)
                                .addFields(fields)
                                .setThumbnail(`attachment://${mcuMovies[index].thumbURL}`)
                                .setFooter({ text: `Actualizada por última vez ${lastUpdateToString(mcuMovies[index].lastUpdate)}.` }));
                        }
                    }
                    messages[messages.length - 1].setImage(`attachment://image.jpg`);
                    reply.embeds = messages;
                    reply.files = [`./assets/thumbs/mcu/${mcuMovies[index].thumbURL}`, `./movies/${name.replace(/[:]/g, '').replace(/[?]/g, '')}/image.jpg`];
                }).catch(console.error);
            }
        } else {
            const filter1 = message ? args[0] : interaction.options.getString('filtro1');
            const filter2 = message ? args[1] : interaction.options.getString('filtro2');
            var argsFilters = !filter1 && !filter2 ? ['all'] : [];
            if (filter1) argsFilters.push(filter1);
            if (filter2) argsFilters.push(filter2);
            if (!validateFilters(argsFilters))
                reply.content = `¡Uso incorrecto! Alguno de los filtros es inválido. Usá **"${prefix}ucm [filtro1] [filtro2]"**.\n\nLos filtros válidos son: _${validFilters.slice(1).join(', ')}_.`;
            else {
                var canvas = createCanvas(200, 200);
                var ctx = canvas.getContext('2d');
                var messages = [];
                var moviesField = { name: 'Nombre', value: '', inline: true };
                var typesField = { name: 'Tipo', value: ``, inline: true };
                if (filtersNeedUpdate(filters, getNewFilters(argsFilters))) {
                    await updateMcuFilters(getNewFilters(argsFilters));
                    filters = await updateFilters();
                    mcuMovies = updateMcuMovies(filters);
                }
                for (var i = 0; i < mcuMovies.length; i++) {
                    var name = mcuMovies[i].name;
                    var type = mcuMovies[i].type;
                    var newName = `**${i + 1}.** ${name}`;
                    var aux = moviesField.value + `${newName}\n\n`;
                    if (aux.length <= 1024) {
                        moviesField.value += `${newName}\n\n`;
                        typesField.value += `*${type}*\n\n`;
                        if (ctx.measureText(newName).width > 288)
                            typesField.value += `\n`;
                    } else {
                        messages.push(new MessageEmbed()
                            .setColor(color)
                            .addFields([moviesField, typesField])
                            .setThumbnail(`attachment://mcu-logo.png`));
                        moviesField = { name: 'Nombre', value: `${newName}\n\n`, inline: true };
                        typesField = { name: 'Tipo', value: `*${type}*\n\n`, inline: true };
                        if (ctx.measureText(newName).width > 288)
                            typesField.value += `\n`;
                    }
                }
                messages.push(new MessageEmbed()
                    .setColor(color)
                    .addFields([moviesField, typesField])
                    .setThumbnail(`attachment://mcu-logo.png`));
                for (let i = 0; i < messages.length; i++) {
                    var msg = messages[i];
                    msg.setTitle(`**Universo Cinematográfico de Marvel (${i + 1})**`);
                    if (i === 0)
                        msg.setDescription(texts.movies.description.replace(/%USER_ID%/g, user.id).replace(/%PREFIX%/g, prefix));
                    if (i === messages.length - 1)
                        msg.setFooter({ text: texts.movies.footer });
                }
                reply.embeds = messages;
                reply.files = [`assets/thumbs/mcu-logo.png`];
            }
        }
        return reply;
    }
}
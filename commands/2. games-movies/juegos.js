const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const { texts, prefix } = require('../../app/cache');

async function getAvailableFilesNames(path) {
    var names = [];
    return new Promise(function (resolve, reject) {
        //passsing directoryPath and callback function
        fs.readdir(path, function (err, files) {
            //handling error
            if (err)
                return console.log('Unable to scan directory: ' + err);
            //listing all files using forEach
            files.forEach(file => {
                // Do whatever you want to do with the file
                var args = file.split(' ');
                var name = args.slice(0, args.length - 1).join(' ');
                var date = args[args.length - 1];
                names.push({ name, date });
            });
        });
        setTimeout(function () { resolve(); }, 1000);
    }).then(function () {
        return names;
    });
}

async function getGameInfo(path) {
    var info = { title: '', links: '', imageURL: '' };
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
                    else
                        if (file == 'title.txt')
                            info.title = data;
                        else if (file == 'links.txt')
                            info.links = data;
                        else if (file == 'imageURL.txt')
                            info.imageURL = data;
                        else
                            info[file.substring(2, file.length - 4)] = data;
                });
            });
        });
        setTimeout(function () { resolve(); }, 1000);
    }).then(function () {
        return info;
    });
}

module.exports = {
    category: 'Juegos/Películas',
    description: 'Responde con los links de descarga de algunos juegos crackeados.',

    options: [
        {
            name: 'numero',
            description: 'El número del juego que se quiere ver.',
            required: false,
            type: 'NUMBER'
        }
    ],
    maxArgs: 1,
    expectedArgs: '[numero]',
    slash: 'both',

    callback: async ({ message, args, interaction, user }) => {
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;
        getAvailableFilesNames('./games').then(games => {
            var color = [234, 61, 78];
            if (args.length == 0) {
                var gamesField = { name: 'Juego', value: '', inline: true };
                var updatesField = { name: 'Última actualización', value: ``, inline: true };
                for (var i = 0; i < games.length; i++) {
                    var { name, date } = games[i];
                    gamesField.value += `** ${i + 1}.** ${name}\n\n`;
                    updatesField.value += `*${date.replace(/-/g, '/')}*\n\n`;
                }
                messageOrInteraction.reply({
                    embeds: [new MessageEmbed()
                        .setTitle(`**Juegos crackeados**`)
                        .setDescription(texts.games.description.replace(/%USER_ID%/g, user.id).replace(/%PREFIX%/g, prefix))
                        .setColor(color)
                        .addFields([gamesField, updatesField])
                        .setFooter({ text: texts.games.footer })
                        .setThumbnail(`attachment://games.png`)],
                    files: [`assets/thumbs/games.png`],
                    ephemeral: true
                });
            } else {
                const index = parseInt(args[0]) - 1;
                if (index < 0 || index >= games.length || isNaN(index))
                    messageOrInteraction.reply({ content: `¡Uso incorrecto! El número ingresado es inválido. Usá **"${prefix}juegos [numero]"**.`, ephemeral: true });
                else {
                    var { name, date } = games[index];
                    getGameInfo(`./games/${name} ${date}`).then(info => {
                        var fields = [];
                        for (const key in info)
                            if (Object.hasOwnProperty.call(info, key))
                                if (key === 'links') {
                                    const element = info[key];
                                    var field = { name: '\u200b', value: '' };
                                    var fullString = element.split('\n');
                                    fullString.forEach(line => {
                                        var aux = field.value + line + '\n';
                                        if (aux.length <= 1024)
                                            field.value += line + '\n';
                                        else {
                                            fields.push(field);
                                            field = { name: '\u200b', value: line + '\n' };
                                        }
                                    });
                                    fields.push(field);
                                } else if (key != 'title' && key != 'imageURL')
                                    fields.push({ name: key, value: info[key] });
                        messageOrInteraction.reply({
                            embeds: [new MessageEmbed()
                                .setTitle(info.title)
                                .setColor(color)
                                .addFields(fields)
                                .setThumbnail(`attachment://games.png`)
                                .setImage(info.imageURL)],
                            files: [attachment],
                            ephemeral: true
                        });
                    }).catch(console.error);
                }
            }
        }).catch(console.error);
        return;
    }
}
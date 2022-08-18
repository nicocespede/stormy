const { MessageEmbed, Constants } = require('discord.js');
const fs = require('fs');
const { getGames, updateGames } = require('../../app/cache');
const { prefix, texts } = require('../../app/constants');

async function getGameInfo(path) {
    var info = { links: '' };
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
                        if (file == 'links.txt')
                            info.links = data;
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
            type: Constants.ApplicationCommandOptionTypes.INTEGER
        }
    ],
    maxArgs: 1,
    expectedArgs: '[numero]',
    slash: 'both',

    callback: async ({ message, args, interaction, user }) => {
        const number = message ? args[0] : interaction.options.getInteger('numero');
        const games = !getGames() ? await updateGames() : getGames();
        var reply = { custom: true, ephemeral: true };
        var color = [234, 61, 78];
        if (!number) {
            var gamesField = { name: 'Juego', value: '', inline: true };
            var updatesField = { name: 'Última actualización', value: ``, inline: true };
            for (var i = 0; i < games.length; i++) {
                const name = games[i].name;
                const date = games[i].lastUpdate;
                gamesField.value += `** ${i + 1}.** ${name}\n\n`;
                updatesField.value += `*${date}*\n\n`;
            }
            reply.embeds = [new MessageEmbed()
                .setTitle(`**Juegos crackeados**`)
                .setDescription(texts.games.description.replace(/%USER_ID%/g, user.id).replace(/%PREFIX%/g, prefix))
                .setColor(color)
                .addFields([gamesField, updatesField])
                .setFooter({ text: texts.games.footer })
                .setThumbnail(`attachment://games.png`)];
            reply.files = [`assets/thumbs/games.png`];
        } else {
            const index = parseInt(number) - 1;
            if (index < 0 || index >= games.length || isNaN(index))
                reply.content = `¡Uso incorrecto! El número ingresado es inválido. Usá **"${prefix}juegos [numero]"**.`;
            else {
                const game = games[index];
                await getGameInfo(`./assets/games/${game.name.replace(/:/g, '')}`).then(info => {
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
                            } else
                                fields.push({ name: key, value: info[key] });
                    reply.embeds = [new MessageEmbed()
                        .setTitle(`${game.name} ${game.version}`)
                        .setColor(color)
                        .addFields(fields)
                        .setThumbnail(`attachment://games.png`)
                        .setImage(game.imageURL)];
                    reply.files = [`assets/thumbs/games.png`];
                }).catch(console.error);
            }
        }
        return reply;
    }
}
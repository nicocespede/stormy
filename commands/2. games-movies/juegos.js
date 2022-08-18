const { MessageEmbed, Constants } = require('discord.js');
const { getGames, updateGames } = require('../../app/cache');
const { prefix, texts, githubRawURL } = require('../../app/constants');

async function getGameInfo(gameName) {
    const fetch = require('node-fetch');
    const info = {};
    const games = !getGames() ? await updateGames() : getGames();
    const game = games.filter(element => element.name === gameName)[0];
    const files = game.instructions ? game.instructions.concat('links') : ['links'];
    const filteredName = gameName.replace(/[:]/g, '').replace(/[?]/g, '').replace(/ /g, '%20');
    for (const file of files)
        await fetch(`${githubRawURL}/games/${filteredName}/${file}.txt`)
            .then(res => res.text()).then(data => {
                info[file] = data;
            }).catch(err => console.log(`> Error al cargar ${file}.txt`, err));
    return info;
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
                await getGameInfo(game.name).then(info => {
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
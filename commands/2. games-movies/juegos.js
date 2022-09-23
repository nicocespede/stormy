const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { createCanvas } = require('canvas');
const chalk = require('chalk');
const { getGames, updateGames } = require('../../app/cache');
const { prefix, githubRawURL } = require('../../app/constants');
const { lastUpdateToString } = require('../../app/general');

async function getGameInfo(gameId) {
    const fetch = require('node-fetch');
    const info = {};
    const games = !getGames() ? await updateGames() : getGames();
    const game = games.filter(element => element.id === gameId)[0];
    const files = game.instructions ? game.instructions.concat('links') : ['links'];
    for (const file of files)
        await fetch(`${githubRawURL}/games/${gameId}/${file}.txt`)
            .then(res => res.text()).then(data => {
                info[file] = data;
            }).catch(err => console.log(chalk.red(`> Error al cargar ${file}.txt\n${err}`)));
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
            type: ApplicationCommandOptionType.Integer
        }
    ],
    maxArgs: 1,
    expectedArgs: '[numero]',
    slash: 'both',

    callback: async ({ message, args, interaction, user, instance, guild }) => {
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: false });
        const number = message ? args[0] : interaction.options.getInteger('numero');
        const games = !getGames() ? await updateGames() : getGames();
        const reply = { custom: true, ephemeral: true };
        const color = [234, 61, 78];
        if (!number) {
            const canvas = createCanvas(200, 200);
            const ctx = canvas.getContext('2d');
            const gamesField = { name: 'Juego', value: '', inline: true };
            const updatesField = { name: 'Última actualización', value: ``, inline: true };
            for (var i = 0; i < games.length; i++) {
                const name = games[i].name;
                const date = games[i].lastUpdate;
                const newGame = `** ${i + 1}.** ${name}\n\n`;
                gamesField.value += newGame;
                updatesField.value += `*${lastUpdateToString(date, true)}*\n\n`;
                if (ctx.measureText(newGame).width >= 254)
                    updatesField.value += `\n`;
            }
            reply.embeds = [new EmbedBuilder()
                .setTitle(`**Juegos crackeados**`)
                .setDescription(instance.messageHandler.getEmbed(guild, 'GAMES', 'DESCRIPTION', { ID: user.id, PREFIX: prefix }))
                .setColor(color)
                .addFields([gamesField, updatesField])
                .setFooter({ text: instance.messageHandler.getEmbed(guild, 'GAMES', 'FOOTER') })
                .setThumbnail(`attachment://games.png`)];
            reply.files = [`assets/thumbs/games.png`];
        } else {
            const index = parseInt(number) - 1;
            if (index < 0 || index >= games.length || isNaN(index))
                reply.content = `⚠ El número ingresado es inválido.`;
            else {
                const game = games[index];
                await getGameInfo(game.id).then(info => {
                    const fields = [];
                    for (const key in info)
                        if (Object.hasOwnProperty.call(info, key))
                            if (key === 'links') {
                                const element = info[key];
                                var field = { name: '\u200b', value: '' };
                                const fullString = element.split('\n');
                                fullString.forEach(line => {
                                    const aux = field.value + line + '\n';
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
                    reply.embeds = [new EmbedBuilder()
                        .setTitle(`${game.name} ${game.version}`)
                        .setColor(color)
                        .addFields(fields)
                        .setThumbnail(`attachment://games.png`)
                        .setImage(game.imageURL)];
                    reply.files = [`assets/thumbs/games.png`];
                }).catch(console.error);
            }
        }
        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
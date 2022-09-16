const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { getGames, updateGames } = require('../../app/cache');
const { prefix, githubRawURL } = require('../../app/constants');

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
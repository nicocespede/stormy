const { EmbedBuilder, ApplicationCommandOptionType, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const chalk = require('chalk');
chalk.level = 1;
const { getGames, updateGames, getIds, updateIds } = require('../../app/cache');
const { prefix, githubRawURL } = require('../../app/constants');
const { lastUpdateToString } = require('../../app/general');

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

    callback: async ({ message, args, interaction, user, instance, guild, member }) => {
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: false });

        try {
            const ids = getIds() || await updateIds();
            const role = await guild.roles.fetch(ids.roles.anunciosJuegos);
            if (!role.members.has(user.id)) {
                await member.roles.add(ids.roles.anunciosJuegos);
                console.log(chalk.green(`Rol 'Gamers' agregado a ${user.tag}`));
            }
        } catch (error) {
            console.log(chalk.red(`No se pudo agregar el rol 'Gamers' a ${user.tag}:\n${error.stack}`));
        }

        const number = message ? args[0] : interaction.options.getInteger('numero');
        const games = getGames() || await updateGames();
        const reply = { custom: true, ephemeral: true };
        if (!number) {
            const canvas = createCanvas(200, 200);
            const ctx = canvas.getContext('2d');
            const gamesField = { name: 'Juego', value: '', inline: true };
            const updatesField = { name: 'Última actualización', value: ``, inline: true };
            for (var i = 0; i < games.length; i++) {
                const name = `${games[i].name} (${games[i].year})`;
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
                .setColor(instance.color)
                .addFields([gamesField, updatesField])
                .setFooter({ text: instance.messageHandler.getEmbed(guild, 'GAMES', 'FOOTER') })
                .setThumbnail(`${githubRawURL}/assets/thumbs/games/games-folder.png`)];
        } else {
            const index = parseInt(number) - 1;
            if (index < 0 || index >= games.length || isNaN(index))
                reply.content = `⚠ El número ingresado es inválido.`;
            else {
                const { embedData, files, imageURL, instructions, links, name, version, year } = games[index];
                const fields = [];

                if (instructions)
                    for (const key in instructions) if (Object.hasOwnProperty.call(instructions, key))
                        fields.push({ name: `${key}:`, value: instructions[key].join('\n') });

                for (const key in links) if (Object.hasOwnProperty.call(links, key) && key !== 'password') {
                    const variant = links[key];
                    let field = { name: `${key.toUpperCase()}:`, value: '' };
                    for (const server in variant) if (Object.hasOwnProperty.call(variant, server)) {
                        const aux = field.value + `\n${server}:\n\n`;
                        if (aux.length <= 1024)
                            field.value = aux;
                        else {
                            fields.push(field);
                            field = { name: '\u200b', value: `\n${server}:\n\n` };
                        }

                        const lines = variant[server];
                        lines.forEach(line => {
                            const aux = field.value + line + '\n';
                            if (aux.length <= 1024)
                                field.value = aux;
                            else {
                                fields.push(field);
                                field = { name: '\u200b', value: line + '\n' };
                            }
                        });
                    }
                    fields.push(field);
                }

                if (links.password) {
                    const aux = fields[fields.length - 1].value + `\n**Contraseña:** ${links.password}`;
                    if (aux.length <= 1024)
                        fields[fields.length - 1].value += `\n**Contraseña:** ${links.password}`;
                    else
                        fields.push({ name: '\u200b', value: `**Contraseña:** ${links.password}` });
                }

                reply.content = null;
                reply.embeds = [new EmbedBuilder()
                    .setTitle(`${name} (${year}) ${version}`)
                    .setColor(embedData.color)
                    .setDescription(`**Cantidad de archivos: **${files}`)
                    .addFields(fields)
                    .setThumbnail(`attachment://thumb.png`)
                    .setImage(imageURL)];
                reply.files = [new AttachmentBuilder(embedData.thumb, { name: 'thumb.png' })];
            }
        }
        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
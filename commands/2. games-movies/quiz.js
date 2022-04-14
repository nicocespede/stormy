const { MessageActionRow, MessageButton, Constants } = require("discord.js");
const { quiz } = require("../../app/quiz");
const { prefix } = require('../../app/cache');

function until(conditionFunction) {
    const poll = resolve => {
        if (conditionFunction()) resolve();
        else setTimeout(_ => poll(resolve), 400);
    }
    return new Promise(poll);
};

const getMaxPoints = points => {
    var max = 0;
    for (const id in points)
        if (Object.hasOwnProperty.call(points, id)) {
            const element = points[id];
            if (element > max)
                max = element;
        }
    return max;
};

const checkDraw = points => {
    var max = getMaxPoints(points);
    var appearances = 0;
    for (const id in points)
        if (Object.hasOwnProperty.call(points, id)) {
            const element = points[id];
            if (element === max)
                appearances++;
        }
    return appearances > 1;
};

const getWinner = async (guild, points) => {
    var max = getMaxPoints(points);
    var winner;
    for (const id in points)
        if (Object.hasOwnProperty.call(points, id)) {
            const element = points[id];
            if (element === max) {
                await guild.members.fetch(id).then(member => winner = member.user.tag).catch(console.error);
                break;
            }
        }
    return winner;
};

module.exports = {
    category: 'Juegos/Películas',
    description: 'Arranca el quiz del UCM.',

    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '<cantidad>',
    options: [
        {
            name: 'cantidad',
            description: 'El número de preguntas que se quieren para el quiz.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.INTEGER
        }
    ],
    slash: 'both',
    guildOnly: true,

    callback: async ({ guild, user, message, args, interaction, channel }) => {
        var messageOrInteraction = message ? message : interaction;
        const maxTime = 10;
        var extraMessages = [];
        const number = parseInt(args[0]);
        if (number <= 0 || number > quiz.length - 1 || isNaN(number))
            messageOrInteraction.reply({ content: `¡Uso incorrecto! El número debe estar entre 1 y ${quiz.length - 1}. Usá **"${prefix}quiz <cantidad>"**.`, ephemeral: true });
        else {
            var participants = [user.id];
            var readyToStart = false;
            const row = new MessageActionRow()
                .addComponents(new MessageButton().setCustomId('join')
                    .setEmoji('✋🏼')
                    .setLabel('Participo')
                    .setStyle('PRIMARY'))
                .addComponents(new MessageButton().setCustomId('ready')
                    .setEmoji('✔️')
                    .setLabel('Comenzar')
                    .setStyle('SUCCESS'))
                .addComponents(new MessageButton().setCustomId('cancel')
                    .setEmoji('❌')
                    .setLabel('Cancelar')
                    .setStyle('DANGER'));
            var msg = {
                content: `• Todos los que quieran participar en el quiz deben clickear en el botón **"✋🏼 Participo"**.\n • Una vez que estén todos los participantes listos, pulsar **"✔️ Comenzar"**.\n • Si el quiz no comienza en 2 minutos, se cancelará.\n• Cada pregunta tiene ${maxTime} segundos máximo para ser respondida.\n\n**Participantes:**\n- 👑 ${user.tag}`,
                components: [row]
            };
            if (message)
                var reply = await message.reply(msg);
            else if (interaction) {
                await interaction.reply({ content: `Inicializando quiz...`, ephemeral: true });
                var reply = await channel.send(msg);
            }

            const interactionsCollector = channel.createMessageComponentCollector({ time: 1000 * 60 * 2 });

            interactionsCollector.on('collect', async i => {
                i.deferUpdate();
                if (i.customId === 'join') {
                    if (!participants.includes(i.user.id)) {
                        participants.push(i.user.id);
                        var msg = { content: reply.content + `\n- ${i.user.tag}`, components: [row] };
                        reply = await reply.edit(msg);
                    }
                } else if (i.customId === 'ready')
                    if (i.user.id === participants[0])
                        if (participants.length === 1)
                            extraMessages.push(await channel.send('⛔ No se puede iniciar un quiz de 1 solo participante.'));
                        else {
                            readyToStart = true;
                            interactionsCollector.stop();
                        }
                    else
                        extraMessages.push(await channel.send('⛔ ¡Sólo el que inició el quiz puede comenzarlo!'));
                else
                    i.user.id === participants[0] ? interactionsCollector.stop() : extraMessages.push(await channel.send('⛔ ¡Sólo el que inició el quiz puede cancelarlo!'));
            });

            interactionsCollector.on('end', async collection => {
                if (!readyToStart) {
                    var msg = { content: '❌ **Quiz cancelado.**', components: [] };
                    await reply.edit(msg);
                } else {
                    extraMessages.forEach(m => m.delete());
                    var msg = { content: '🏁 **¡Comienza el quiz!** Prepárense...', components: [] };
                    var allQuestions = quiz.slice(0);
                    var selectedQuestions = [];
                    for (let i = 0; i < number + 1; i++) {
                        var random = Math.floor(Math.random() * (allQuestions.length));
                        const element = allQuestions.splice(random, 1);
                        selectedQuestions.push(element[0]);
                    }
                    await reply.edit(msg);

                    const filter = m => {
                        return participants.includes(m.author.id);
                    };

                    var points = {};
                    for (let i = 0; i < participants.length; i++) {
                        const element = participants[i];
                        points[element] = 0;
                    }

                    for (let i = 0; i < selectedQuestions.length - 1; i++) {
                        const actualQuestion = selectedQuestions[i];
                        var answered = false;

                        await new Promise(res => setTimeout(res, 1000 * 2));
                        channel.send(`❓ **Pregunta ${i + 1}:** ${actualQuestion.question}`);

                        const messagesCollector = channel.createMessageCollector({ filter, time: 1000 * maxTime });

                        messagesCollector.on('collect', msg => {
                            if (actualQuestion.answers.includes(msg.content.trim().toLowerCase()))
                                msg.react('✅').then(_ => {
                                    answered = true;
                                    points[msg.author.id] += 5;
                                    channel.send(`✅ **¡Correcto <@${msg.author.id}>!**${i != selectedQuestions.length - 2 ? ' Siguiente pregunta...' : ''}`);
                                    messagesCollector.stop();
                                }).catch(console.error);
                        });

                        messagesCollector.on('end', collected => {
                            if (!answered) {
                                channel.send(`⏳ **¡Tiempo!**${i != selectedQuestions.length - 2 ? ' Siguiente pregunta...' : ''}`);
                                answered = true;
                            }
                        });
                        await until(_ => answered === true);
                    }

                    if (checkDraw(points)) {
                        var actualQuestion = selectedQuestions[selectedQuestions.length - 1];
                        var answered = false;
                        channel.send(`🤔 **¡Hay empate!** Última pregunta de desempate...`);
                        await new Promise(res => setTimeout(res, 1000 * 3));
                        channel.send(`⁉ **Pregunta de desempate:** ${actualQuestion.question}`);

                        const messagesCollector = channel.createMessageCollector({ filter, time: 1000 * maxTime });

                        messagesCollector.on('collect', msg => {
                            if (actualQuestion.answers.includes(msg.content.trim().toLowerCase()))
                                msg.react('✅').then(_ => {
                                    answered = true;
                                    points[msg.author.id] += 5;
                                    channel.send(`✅ **¡Correcto <@${msg.author.id}>!**`);
                                    messagesCollector.stop();
                                }).catch(console.error);
                        });

                        messagesCollector.on('end', collected => {
                            if (!answered) {
                                channel.send(`⏳ **¡Tiempo!**`);
                                answered = true;
                            }
                        });
                        await until(_ => answered === true);
                    }

                    var msg = checkDraw(points) ? `⚖ **¡Quiz terminado en empate!**\n\n**Puntuaciones:**\n`
                        : `🏆 **¡${await getWinner(guild, points)} ganó el quiz!**\n\n**Puntuaciones:**\n`;
                    for (const id in points)
                        if (Object.hasOwnProperty.call(points, id)) {
                            const element = points[id];
                            await guild.members.fetch(id).then(member => msg += `- ${member.user.tag}: ${element} puntos\n`).catch(console.error);
                        }
                    channel.send(msg);
                }
            });
        }
        return;
    }
}
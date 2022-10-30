const { ActionRowBuilder, ButtonBuilder, AttachmentBuilder, ApplicationCommandOptionType, ButtonStyle, ChannelType } = require("discord.js");
const { quiz } = require('../../src/constants');

function until(conditionFunction) {
    const poll = resolve => {
        if (conditionFunction()) resolve();
        else setTimeout(_ => poll(resolve), 400);
    }
    return new Promise(poll);
};

const getMaxPoints = points => Object.entries(points).map(([_, p]) => p).reduce((a, b) => Math.max(a, b), -Infinity);

const checkDraw = points => {
    const max = getMaxPoints(points);
    return Object.entries(points).filter(([_, p]) => p === max).length > 1;
};

const getWinner = async (guild, points) => {
    const max = getMaxPoints(points);
    const id = Object.entries(points).filter(([_, p]) => p === max).pop()[0];
    const member = await guild.members.fetch(id).catch(console.error);
    return member.user.tag;
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
            type: ApplicationCommandOptionType.Integer
        }
    ],
    slash: 'both',
    guildOnly: true,

    callback: async ({ guild, user, message, args, interaction, channel, client }) => {
        const maxTime = 15;
        var extraMessages = [];
        const number = message ? args[0] : interaction.options.getInteger('cantidad');
        const parsedNumber = parseInt(number);
        if (parsedNumber <= 0 || parsedNumber > quiz.length - 1 || isNaN(parsedNumber))
            return { content: `⚠ El número debe estar entre 1 y ${quiz.length - 1}.`, custom: true, ephemeral: true };
        else {
            const participants = [user.id];
            let readyToStart = false;
            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder().setCustomId('join')
                    .setEmoji('✋🏼')
                    .setLabel('Participo')
                    .setStyle(ButtonStyle.Primary))
                .addComponents(new ButtonBuilder().setCustomId('ready')
                    .setEmoji('✔️')
                    .setLabel('Comenzar')
                    .setStyle(ButtonStyle.Success))
                .addComponents(new ButtonBuilder().setCustomId('cancel')
                    .setEmoji('❌')
                    .setLabel('Cancelar')
                    .setStyle(ButtonStyle.Danger));

            const newChannel = await guild.channels.create({ name: '❓┃QUIZ', type: ChannelType.GuildText });
            newChannel.permissionOverwrites.edit(client.user.id, { 'ViewChannel': true, SEND_MESSAGES: true });
            newChannel.permissionOverwrites.edit(user.id, { 'ViewChannel': true, SEND_MESSAGES: true });
            newChannel.permissionOverwrites.edit(guild.roles.everyone.id, { 'ViewChannel': false });

            var msg = {
                components: [row],
                content: `• Todos los que quieran participar en el quiz deben clickear en el botón **"✋🏼 Participo"**.\n • Una vez que estén todos los participantes listos, pulsar **"✔️ Comenzar"**.\n • Si el quiz no comienza en 2 minutos, se cancelará.\n• Cada pregunta tiene ${maxTime} segundos máximo para ser respondida.\n• Cada pregunta acertada suma 5 puntos.\n\n**Participantes:**\n- 👑 ${user.tag}`
            };

            if (interaction)
                await interaction.reply({ content: `Inicializando quiz...`, ephemeral: true });
            var reply = message ? await message.reply(msg) : await channel.send(msg);

            const interactionsCollector = channel.createMessageComponentCollector({ time: 1000 * 60 * 2 });

            interactionsCollector.on('collect', async i => {
                i.deferUpdate();
                if (i.customId === 'join') {
                    if (!participants.includes(i.user.id)) {
                        participants.push(i.user.id);
                        reply = await reply.edit({ components: [row], content: reply.content + `\n- ${i.user.tag}` });
                        newChannel.permissionOverwrites.edit(i.user.id, { VIEW_CHANNEL: true, SEND_MESSAGES: true });
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

            interactionsCollector.on('end', async _ => {
                extraMessages.forEach(m => m.delete());
                if (!readyToStart) {
                    await reply.edit({ components: [], content: '❌ **Quiz cancelado.**' });
                    newChannel.delete();
                } else {
                    var allQuestions = quiz.slice(0);
                    var selectedQuestions = [];
                    for (let i = 0; i < parsedNumber + 1; i++) {
                        var random = Math.floor(Math.random() * (allQuestions.length));
                        const element = allQuestions.splice(random, 1);
                        selectedQuestions.push(element[0]);
                    }
                    await reply.edit({
                        components: [new ActionRowBuilder()
                            .addComponents(new ButtonBuilder()
                                .setLabel('IR AL QUIZ')
                                .setStyle(ButtonStyle.Link)
                                .setURL(`https://discord.com/channels/${guild.id}/${newChannel.id}`))],
                        content: '🏁 **¡Comienza el quiz!** Prepárense...\n\u200b'
                    });

                    const filter = m => {
                        return participants.includes(m.author.id);
                    };

                    const score = {};
                    for (const id of participants)
                        score[id] = 0;

                    await new Promise(res => setTimeout(res, 1000 * 1));

                    for (let i = 0; i < selectedQuestions.length - 1; i++) {
                        var answered = false;
                        const actualQuestion = selectedQuestions[i];

                        await new Promise(res => setTimeout(res, 1000 * 2));
                        newChannel.send({
                            content: `❓ **Pregunta ${i + 1}:** ${actualQuestion.question}\n\u200b`,
                            files: [new AttachmentBuilder(actualQuestion.file)]
                        });

                        const messagesCollector = newChannel.createMessageCollector({ filter, time: 1000 * maxTime });

                        messagesCollector.on('collect', async msg => {
                            if (actualQuestion.answers.includes(msg.content.trim().toLowerCase()))
                                await msg.react('✅').then(_ => {
                                    answered = true;
                                    messagesCollector.stop();
                                    newChannel.send(`✅ **¡Correcto <@${msg.author.id}>!**${i != selectedQuestions.length - 2 ? ' Siguiente pregunta...' : ''}`);
                                    score[msg.author.id] += 5;
                                }).catch(console.error);
                        });

                        messagesCollector.on('end', _ => {
                            if (!answered) {
                                newChannel.send(`⏳ **¡Tiempo!**${i != selectedQuestions.length - 2 ? ' Siguiente pregunta...' : ''}`);
                                answered = true;
                            }
                        });
                        await until(_ => answered === true);
                    }

                    if (checkDraw(score)) {
                        var answered = false;
                        var actualQuestion = selectedQuestions[selectedQuestions.length - 1];
                        newChannel.send(`🤔 **¡Hay empate!** Última pregunta de desempate...`);
                        await new Promise(res => setTimeout(res, 1000 * 3));
                        newChannel.send({
                            content: `⁉ **Pregunta de desempate:** ${actualQuestion.question}\n\u200b`,
                            files: [new AttachmentBuilder(actualQuestion.file)]
                        });

                        const messagesCollector = newChannel.createMessageCollector({ filter, time: 1000 * maxTime });

                        messagesCollector.on('collect', async msg => {
                            if (actualQuestion.answers.includes(msg.content.trim().toLowerCase()))
                                await msg.react('✅').then(_ => {
                                    answered = true;
                                    messagesCollector.stop();
                                    newChannel.send(`✅ **¡Correcto <@${msg.author.id}>!**`);
                                    score[msg.author.id] += 5;
                                }).catch(console.error);
                        });

                        messagesCollector.on('end', _ => {
                            if (!answered) {
                                newChannel.send(`⏳ **¡Tiempo!**`);
                                answered = true;
                            }
                        });
                        await until(_ => answered === true);
                    }

                    await newChannel.send({
                        content: '📊 Quiz finalizado...\n\u200b',
                        components: [new ActionRowBuilder()
                            .addComponents(new ButtonBuilder()
                                .setLabel('VER RESULTADOS')
                                .setStyle(ButtonStyle.Link)
                                .setURL(`https://discord.com/channels/${guild.id}/${channel.id}/${reply.id}`))]
                    });

                    let msg = checkDraw(score) ? `⚖ **¡Quiz terminado en empate!**\n\n**Puntuaciones:**\n`
                        : `🏆 **¡${await getWinner(guild, score)} ganó el quiz!**\n\n**Puntuaciones:**\n`;

                    const members = await guild.members.fetch(Object.keys(score)).catch(console.error);
                    for (const id in score) if (Object.hasOwnProperty.call(score, id)) {
                        const points = score[id];
                        const member = members.get(id);
                        msg += `- ${member ? member.user.tag : `Miembro desconocido`}: ${points} puntos\n`;
                    }
                    await reply.edit({ components: [], content: msg });
                    await new Promise(res => setTimeout(res, 1000 * 6));
                    newChannel.delete();
                }
            });
        }
        return;
    }
}
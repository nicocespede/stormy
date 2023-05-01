const { Queue } = require("@discord-player/utils");
const { QueryType, useMasterPlayer, Track } = require("discord-player");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client } = require("discord.js");
const Genius = require("genius-lyrics");
const GeniusClient = new Genius.Client();
const { updateLastAction, getTracksNameExtras, updateTracksNameExtras, getMusicPlayerData, setMusicPlayerData, clearMusicPlayerData, getSongsInQueue, removeSongInQueue, getLastAction, updatePage, addSongInQueue } = require("./cache");
const { MusicActions, GITHUB_RAW_URL, color, CONSOLE_YELLOW, CONSOLE_RED } = require("./constants");
const { addQueue } = require("./mongodb");
const { consoleLog, fileLogFunctionTriggered, fileLogError, fileLog } = require("./util");

const MODULE_NAME = 'src.music';

const containsAuthor = track => {
    const author = track.author.split(' ');
    var ret = false;
    for (let i = 0; i < author.length; i++) {
        const element = author[i].toLowerCase();
        if (track.title.toLowerCase().includes(element)) {
            ret = true;
            break;
        }
    }
    if (!ret) {
        const title = track.title.split(' ');
        for (let i = 0; i < title.length; i++) {
            const element = title[i].toLowerCase();
            if (track.author.toLowerCase().includes(element)) {
                ret = true;
                break;
            }
        }
    }
    return ret;
};

const cleanTitle = async title => {
    let newTitle = title;
    const tracksNameExtras = getTracksNameExtras() || await updateTracksNameExtras();
    for (const extra of tracksNameExtras)
        if (newTitle.includes(extra))
            newTitle = newTitle.replace(extra, '');
    return newTitle;
};

const splitLyrics = lyrics => {
    const split = lyrics.split('\n');
    const ret = [];
    let chunk = '';
    for (let i = 0; i < split.length; i++) {
        const line = split[i];
        const aux = chunk + line + '\n';
        if (aux.length > 4096) {
            ret.push(chunk);
            chunk = '';
        }
        chunk += line + '\n';
        if (i === split.length - 1) ret.push(chunk)
    }
    return ret;
};

const setMusicPlayerMessage = async (queue, track, lastAction) => {

    const getControlsRows = type => {
        const rows = [];
        const upperRowButtons = [
            { customId: 'clear', emoji: `❌` },
            { customId: 'lyrics', emoji: '🎤' },
            { customId: 'queue', emoji: `📄` },
            { customId: 'help', emoji: `❓` }
        ];
        let row = new ActionRowBuilder();
        for (const { customId, emoji } of upperRowButtons)
            row.addComponents(new ButtonBuilder()
                .setCustomId(customId)
                .setEmoji(emoji)
                .setStyle(ButtonStyle.Secondary));
        rows.push(row);

        const lowerRowButtons = [
            { customId: 'previous', emoji: `⏮` },
            { customId: type === 'paused' ? 'play' : 'pause', emoji: type === 'paused' ? '▶' : '⏸' },
            { customId: 'skip', emoji: `⏭` },
            { customId: 'stop', emoji: `⏹` },
            { customId: 'shuffle', emoji: `🔀` }
        ];
        row = new ActionRowBuilder();
        for (const { customId, emoji } of lowerRowButtons)
            row.addComponents(new ButtonBuilder()
                .setCustomId(customId)
                .setEmoji(emoji)
                .setStyle(ButtonStyle.Secondary));
        rows.push(row);
        return rows;
    };

    const getEmbed = async (event, queue, lastAction) => {
        await updateExtraMessages(queue);

        const embed = new EmbedBuilder().setColor(color);
        let description;
        let thumbnail = "no-entry";

        switch (event) {
            default:
                const track = queue.currentTrack;
                const { author, playlist, requestedBy, thumbnail: thumb, title, url } = track;

                const filteredTitle = await cleanTitle(title);
                embed.setTitle(filteredTitle + (!url.includes('youtube') || !containsAuthor(track) ? ` | ${author}` : ''));
                embed.setURL(url);

                const progressBar = queue.node.createProgressBar();
                const timestamp = queue.node.getTimestamp(true);
                const splittedDescription = [
                    `${progressBar}\n`,
                    `**Progreso:** ${timestamp.progress}%`,
                    `**Volumen:** ${queue.node.volume}%`,
                    `**Agregada por:** ${requestedBy.tag}`
                ];
                if (playlist)
                    splittedDescription.push(`**Lista de reproducción:** [${playlist.title}](${playlist.url})`);
                if (lastAction)
                    splittedDescription.push(`\n**Última acción:**\n\n${lastAction}`);
                description = splittedDescription.join('\n');

                const thumbs = {
                    cleared: 'empty',
                    moving_song: 'sorting-arrows',
                    paused: 'pause',
                    removing: 'delete',
                    resumed: 'resume-button',
                    shuffled: 'shuffle',
                    trackStart: 'play'
                };
                thumbnail = thumbs[event];
                embed.setImage(thumb);
                const tracksAmount = queue.getSize();
                if (tracksAmount !== 0)
                    embed.setFooter({ text: `${tracksAmount} ${tracksAmount === 1 ? 'canción' : 'canciones'} restante${tracksAmount > 1 ? 's' : ''} en la cola` });
                break;

            case 'help':
                embed.setTitle('❓ Ayuda: Reproductor de música');
                embed.setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/help.png`);
                const controlsInfo = [
                    '**[ ❌ ]** Limpiar cola de reproducción',
                    '**[ 🎤 ]** Mostrar/ocultar letra de la canción actual',
                    '**[ 📄 ]** Mostrar/ocultar cola de reproducción',
                    '**[ ⏮ ]** Canción anterior',
                    '**[ ▶ ]** / **[ ⏸ ]** Reanudar/Pausar reproducción',
                    '**[ ⏭ ]** Canción siguiente',
                    '**[ ⏹ ]** Parar reproducción',
                    '**[ 🔀 ]** Mezclar cola de reproducción'
                ];
                embed.setDescription(`**Controles:**\n\n${controlsInfo.join('\n\n')}`);
                return embed;

            case 'stopped':
                description = "⏹️ Música parada, 👋 ¡adiós!";
                thumbnail = `stop`;
                break;

            case 'queueEnd':
                description = "⛔ Fin de la cola, 👋 ¡adiós!";
                thumbnail = `so-so`;
                break;

            case 'channelEmpty':
                description = "🔇 Ya no queda nadie escuchando música, 👋 ¡adiós!";
                thumbnail = `so-so`;
                break;

            case 'kicked':
                description = "⚠️ Fui desconectado del canal de voz, 👋 ¡adiós!";
                thumbnail = `disconnected`;
                break;

            case 'restarting':
                description = `⚠ Lo siento, tengo que reiniciarme 👋 ¡ya vuelvo!`;
                thumbnail = `restart`;
                break;

            case 'notInVoiceChannel':
                description = "🛑 ¡Debes estar en el mismo canal de voz que yo para realizar esta acción!";
                break;

            case 'noPreviousTrack':
                description = "🛑 ¡No había otra canción antes!";
                break;

            case 'cantShuffle':
                description = "🛑 ¡No hay suficientes canciones en la cola para barajar!";
                break;

            case 'cantClear':
                description = "🛑 ¡No hay más canciones luego de la actual!";
                break;

            case 'noLyrics':
                description = `🛑 ¡No se encontraron resultados de letras para la canción actual!`;
                break;

            case 'queueEmpty':
                description = "🛑 ¡No hay más canciones en la cola!";
                break;

            case 'error':
                description = "🛑 Lo siento, ocurrió un error.";
                break;
        }

        embed.setDescription(description)
            .setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/music/${thumbnail}.png`);
        return embed;
    };

    const getEmbeds = async (type, data) => {
        const embeds = [];
        switch (type) {
            case 'lyrics':
                const chunks = splitLyrics(data);
                for (const chunk of chunks)
                    embeds.push(new EmbedBuilder()
                        .setDescription(chunk)
                        .setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/genius.png`)
                        .setColor(color));
                embeds[embeds.length - 1].setFooter({ text: 'Letra obtenida de genius.com' });
                break;

            case 'queue':
                if (data) {
                    const splitQueue = async tracks => {
                        const ret = [];
                        let chunk = '';
                        for (let i = 0; i < tracks.length; i++) {
                            const track = tracks[i];
                            const filteredTitle = await cleanTitle(track);
                            const aux = chunk + filteredTitle + '\n';
                            if (aux.length > 4096) {
                                ret.push(chunk);
                                chunk = '';
                            }
                            chunk += filteredTitle + '\n';
                            if (i === tracks.length - 1) ret.push(chunk)
                        }
                        return ret;
                    };
                    const tracks = data.tracks.map((track, i) => {
                        try {
                            return `**${i + 1}**. ${track.title}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ''} - ** ${track.duration} ** `
                        } catch (e) {
                            consoleLog(`${i} - ${track}: ${e}`, CONSOLE_RED);
                        }
                    });
                    const chunks = await splitQueue(tracks);
                    for (const chunk of chunks)
                        embeds.push(new EmbedBuilder()
                            .setTitle(`📄 Cola de reproducción - ${tracks.length} canciones`)
                            .setDescription(chunk)
                            .setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/music/numbered-list.png`)
                            .setColor(color));
                }
                break;
        }
        return embeds;
    };

    const deleteMessage = key => {
        const messageData = getMusicPlayerData(key);
        if (messageData) {
            const { collector, message } = messageData;
            if (collector) collector.stop();
            message.delete();
            clearMusicPlayerData(key);
        }
    };

    const getRow = (page, embeds) => {
        const row = new ActionRowBuilder();

        row.addComponents(new ButtonBuilder()
            .setCustomId('prev_page')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅')
            .setLabel('Anterior')
            .setDisabled(page === 0));

        row.addComponents(new ButtonBuilder()
            .setCustomId('next_page')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('➡')
            .setLabel('Siguiente')
            .setDisabled(page === embeds.length - 1));

        return row;
    };

    const updateExtraMessages = async queue => {
        const queueMessageData = getMusicPlayerData('queue');
        if (queueMessageData) {
            let { message, page } = queueMessageData;
            const embeds = await getEmbeds('queue', queue);
            if (embeds.length === 0)
                deleteMessage('queue');
            else {
                if (!embeds[page]) page--;
                message.edit({ components: embeds.length > 1 ? [getRow(page, embeds)] : [], embeds: [embeds[page]] });
                updatePage('queue', page);
            }
        }
        if (getLastAction().action === MusicActions.STARTING_TRACK)
            deleteMessage('lyrics');
    };

    let musicPlayerMessage;

    if (getMusicPlayerData('player')) {
        const songInQueue = (getSongsInQueue())[track.url];

        if (songInQueue) {
            const { interaction: referenceInteraction, message: referenceMessage } = songInQueue;
            const originalMessage = referenceMessage
                ? await queue.metadata.messages.fetch(referenceMessage.reference.messageId)
                : null;

            setTimeout(async () => {
                if (originalMessage) originalMessage.delete();
                referenceMessage ? await referenceMessage.delete() : await referenceInteraction.deleteReply();
            }, 1000 * 30);

            removeSongInQueue(track.url);
        }

        musicPlayerMessage = getMusicPlayerData('player').message;
        const specialActions = [MusicActions.MOVING_SONG, MusicActions.REMOVING];
        const { action } = getLastAction();
        const event = specialActions.includes(action) ? action.toLowerCase() : 'trackStart';
        musicPlayerMessage.edit({
            components: getControlsRows(event),
            embeds: [await getEmbed(event, queue, lastAction)]
        });
        return;
    }

    const { interaction: referenceInteraction, message: referenceMessage } = (getSongsInQueue())[track.url];
    removeSongInQueue(track.url);

    const reply = {
        components: getControlsRows('trackStart'),
        embeds: [await getEmbed('trackStart', queue)]
    };
    musicPlayerMessage = referenceMessage ? await referenceMessage.edit(reply) : await referenceInteraction.editReply(reply);

    const collector = musicPlayerMessage.createMessageComponentCollector();
    let lastEvent;

    collector.on('collect', async i => {
        if (!queue.channel.members.has(i.user.id)) {
            i.reply({ embeds: [await getEmbed('notInVoiceChannel')], ephemeral: true });
            return;
        }

        let action;
        switch (i.customId) {
            case 'pause':
                if (!queue.node.pause()) {
                    i.reply({ embeds: [await getEmbed('error')], ephemeral: true });
                    return;
                }
                lastEvent = 'paused';
                action = `⏸ ${i.user.tag} pausó la reproducción.`;
                break;

            case 'play':
                if (!queue.node.resume()) {
                    i.reply({ embeds: [await getEmbed('error')], ephemeral: true });
                    return;
                }
                lastEvent = 'resumed';
                action = `▶ ${i.user.tag} reanudó la reproducción.`;
                break;

            case 'stop':
                updateLastAction(MusicActions.STOPPING);
                lastEvent = 'stopped';
                collector.stop();
                return;

            case 'previous':
                if (!queue.history.previousTrack) {
                    i.reply({ embeds: [await getEmbed('noPreviousTrack')], ephemeral: true });
                    return;
                }
                updateLastAction(MusicActions.GOING_BACK, i.user.tag);
                i.deferUpdate();
                await queue.history.back();
                return;

            case 'skip':
                updateLastAction(MusicActions.SKIPPING, i.user.tag);
                queue.node.skip();
                i.deferUpdate();
                return;

            case 'shuffle':
                if (queue.getSize() <= 1) {
                    i.reply({ embeds: [await getEmbed('cantShuffle')], ephemeral: true });
                    return;
                }
                queue.tracks.shuffle()
                lastEvent = 'shuffled';
                action = `🔀 ${i.user.tag} mezcló la cola de reproducción.`;
                break;

            case 'clear':
                if (queue.isEmpty()) {
                    i.reply({ embeds: [await getEmbed('cantClear')], ephemeral: true });
                    return;
                }
                await queue.tracks.clear();
                lastEvent = 'cleared';
                action = `❌ ${i.user.tag} limpió la cola de reproducción.`;
                break;

            case 'lyrics':
                const lyricsMessageData = getMusicPlayerData('lyrics');
                if (lyricsMessageData) {
                    i.deferUpdate();
                    deleteMessage('lyrics');
                } else
                    try {
                        const { author, title, url } = queue.currentTrack;
                        const filteredTitle = await cleanTitle(title);
                        const searches = await GeniusClient.songs.search(filteredTitle + (!url.includes('youtube') || !containsAuthor(track) ? ` - ${author}` : ``));

                        let lyrics = await searches[0].lyrics();
                        lyrics = lyrics.replace(/[[]/g, '**[').replace(/[\]]/g, ']**');

                        i.deferUpdate();

                        let embeds = await getEmbeds('lyrics', lyrics);
                        let page = 0;

                        const ret = { components: embeds.length > 1 ? [getRow(page, embeds)] : [], embeds: [embeds[page]], fetchReply: true };
                        const message = await queue.metadata.send(ret).catch(console.error);
                        let collector;

                        if (embeds.length > 1) {
                            const pagesCollector = message.createMessageComponentCollector();

                            pagesCollector.on('collect', async btnInt => {
                                if (!btnInt) return;

                                if (btnInt.customId === 'prev_page' && page > 0) --page;
                                else if (btnInt.customId === 'next_page' && page < embeds.length - 1) ++page;

                                ret.components = [getRow(page, embeds)];
                                ret.embeds = [embeds[page]];
                                updatePage('lyrics', page);

                                btnInt.update(ret);
                            });

                            collector = pagesCollector;
                        }

                        setMusicPlayerData('lyrics', message, collector, page);
                    } catch (error) {
                        const notFoundErrors = ['No result was found', "Cannot read properties of undefined (reading 'lyrics')"];
                        const notFound = notFoundErrors.includes(error.message)
                        if (!notFound) consoleLog(error, CONSOLE_RED);
                        const event = notFound ? 'noLyrics' : 'error';
                        i.reply({ embeds: [await getEmbed(event)], ephemeral: true });
                    }
                return;

            case 'queue':
                const queueMessageData = getMusicPlayerData('queue');
                if (queueMessageData) {
                    i.deferUpdate();
                    deleteMessage('queue');
                } else {
                    if (queue.isEmpty()) {
                        i.reply({ embeds: [await getEmbed('queueEmpty')], ephemeral: true });
                        return;
                    }

                    i.deferUpdate();

                    let embeds = await getEmbeds('queue', queue);
                    let page = 0;

                    const ret = { components: embeds.length > 1 ? [getRow(page, embeds)] : [], embeds: [embeds[page]], fetchReply: true };
                    const message = await queue.metadata.send(ret).catch(console.error);
                    let collector;

                    const pagesCollector = message.createMessageComponentCollector();

                    pagesCollector.on('collect', async btnInt => {
                        if (!btnInt) return;

                        if (btnInt.customId === 'prev_page' && page > 0) --page;
                        else if (btnInt.customId === 'next_page' && page < embeds.length - 1) ++page;

                        embeds = await getEmbeds('queue', queue);
                        ret.components = embeds.length > 1 ? [getRow(page, embeds)] : [];
                        ret.embeds = [embeds[page]];
                        updatePage('queue', page);

                        btnInt.update(ret);
                    });

                    collector = pagesCollector;

                    setMusicPlayerData('queue', message, collector, page);
                }
                return;

            case 'help':
                i.reply({ embeds: [await getEmbed(i.customId)], ephemeral: true });
                return;
        }

        i.update({ components: getControlsRows(lastEvent), embeds: [await getEmbed(lastEvent, queue, action)] });
    });

    collector.on('end', async _ => {
        const { action: lastAction } = getLastAction();
        let event;
        switch (lastAction) {
            case MusicActions.STOPPING:
                event = 'stopped';
                if (!queue.deleted)
                    queue.delete();
                break;
            case MusicActions.ENDING:
                event = 'queueEnd';
                break;
            case MusicActions.LEAVING_EMPTY_CHANNEL:
                event = 'channelEmpty';
                break;
            case MusicActions.BEING_KICKED:
                event = 'kicked';
                if (!queue.deleted)
                    queue.delete();
                break;
            case MusicActions.RESTARTING:
                event = 'restarting';
                break;
        }

        musicPlayerMessage.edit({ components: [], embeds: [await getEmbed(event)] });
        deleteMessage('lyrics');
        deleteMessage('queue');
        clearMusicPlayerData('player');
    });

    setMusicPlayerData('player', musicPlayerMessage, collector);
};

const handleErrorInMusicChannel = async (message, interaction, reply, channel) => {
    if (message) {
        const temp = await message.reply(reply);
        setTimeout(async () => {
            const musicPlayerMessage = getMusicPlayerData('player');
            if (musicPlayerMessage) {
                temp.delete();
                const originalMessage = await channel.fetch(temp.reference.messageId);
                if (originalMessage) originalMessage.delete();
            }
        }, 1000 * 30);
    } else
        await interaction.editReply(reply);
};

const handleError = (reply, embed, description, message, interaction, channel) => {
    reply.embeds = [embed.setDescription(description).setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/music/no-entry.png`)];
    handleErrorInMusicChannel(message, interaction, reply, channel);
};

const createQueue = (player, guild, metadata) => {
    const queue = player.nodes.create(guild, {
        metadata,
        leaveOnEnd: true,
        leaveOnStop: true,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 60000,
        selfDeaf: true
    });
    return queue;
};

const connectToVoiceChannel = async (queue, member, player, reply, embed, message, interaction, voiceChannel, metadata, schema) => {
    try {
        if (!queue.connection)
            await queue.connect(voiceChannel || member.voice.channel);
        return true;
    } catch {
        player.nodes.delete(queue);
        embed.setDescription(`🛑 ${member ? `${member.user}, n` : 'N'}o me puedo unir al canal de voz.`)
            .setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/music/no-entry.png`);

        if (metadata) {
            metadata.send({ embeds: [embed] });
        } else {
            reply.embeds = [embed];
            message ? await message.reply(reply) : await interaction.editReply(reply);
        }
        return false;
    }
};

const generateTracksArray = (rawTracksArray, player, membersCollection) => {
    const ret = [];
    rawTracksArray.forEach(({ author, description, duration, thumbnail, title, url, views, playlist, requestedBy }) => {
        const track = new Track(player, { author, description, duration, thumbnail, title, url, views, playlist, requestedBy: membersCollection.get(requestedBy).user });
        ret.push(track);
    });
    return ret;
};

module.exports = {
    setNewVoiceChannel: (guild, channel) => {
        updateLastAction(MusicActions.CHANGING_CHANNEL);
        const player = useMasterPlayer();
        const queue = player.nodes.get(guild.id);
        if (queue)
            setMusicPlayerMessage(queue, queue.currentTrack, `🔃 Bot movido al canal de voz **${channel.name}**.`);
    },

    setKicked: () => {
        updateLastAction(MusicActions.BEING_KICKED);
        const { collector } = getMusicPlayerData('player');
        collector.stop();
    },

    containsAuthor,

    leaveEmptyChannel: guild => {
        updateLastAction(MusicActions.LEAVING_EMPTY_CHANNEL);
        const player = useMasterPlayer();
        const queue = player.nodes.get(guild.id);
        if (queue) {
            if (!queue.deleted)
                queue.delete();
            const { collector } = getMusicPlayerData('player');
            collector.stop();
        }
    },

    emergencyShutdown: async guildId => {
        updateLastAction(MusicActions.RESTARTING);
        const player = useMasterPlayer();
        const queue = player.nodes.get(guildId);
        if (queue) {
            consoleLog('> Guardando cola de reproducción actual', CONSOLE_YELLOW);
            const { collector } = getMusicPlayerData('player');
            collector.stop();

            const previousTracks = { tracks: JSON.stringify(queue.history.tracks.data), strategy: queue.history.tracks.strategy };
            const currenTrack = queue.history.currentTrack;
            const current = { url: currenTrack.url, requestedBy: currenTrack.requestedBy };
            const tracks = { tracks: JSON.stringify(queue.tracks.data), strategy: queue.tracks.strategy };

            await addQueue(current, queue.guild.id, queue.metadata.id, previousTracks, tracks, queue.channel.id);
            if (!queue.deleted)
                queue.delete();
        }
    },

    /**
     * Checks if there's an interrupted music queue, and if so, plays it.
     * 
     * @param {Client} client The Discord client instance.
     */
    playInterruptedQueue: async client => {
        fileLogFunctionTriggered(MODULE_NAME, 'playInterruptedQueue');

        const previousQueueSchema = require('../models/previousQueue-schema');
        const results = await previousQueueSchema.find({});

        if (results.length > 0) {
            try {
                const previousQueue = results[0];
                const current = previousQueue.current;
                const guild = await client.guilds.fetch(previousQueue.guildId);
                const metadata = await guild.channels.fetch(previousQueue.metadataId);
                let { tracks: previousTracks, strategy: previousStrategy } = previousQueue.previousTracks;
                previousTracks = JSON.parse(previousTracks);
                let { tracks, strategy } = previousQueue.tracks;
                tracks = JSON.parse(tracks);
                const voiceChannel = await guild.channels.fetch(previousQueue.voiceChannelId);
                const embed = new EmbedBuilder().setColor(color);

                if (voiceChannel.members.size === 0) {
                    await metadata.send({
                        embeds: [embed.setDescription(`🤷🏼‍♂️ Se fueron todos, ¡así que yo también!`)
                            .setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/music/so-so.png`)]
                    });
                } else {
                    consoleLog('> Reanudando reproducción interrumpida por el reinicio', CONSOLE_YELLOW);

                    const membersIds = [...new Set([current.requestedBy]
                        .concat(previousTracks.map(({ requestedBy }) => requestedBy))
                        .concat(tracks.map(({ requestedBy }) => requestedBy)))];
                    const members = await guild.members.fetch(membersIds);

                    const player = useMasterPlayer();
                    var res = await player.search(current.url, {
                        requestedBy: members.get(current.requestedBy),
                        searchEngine: QueryType.AUTO
                    });

                    const queue = createQueue(player, guild, metadata);

                    if (await connectToVoiceChannel(queue, null, player, null, embed, null, null, voiceChannel, metadata, previousQueueSchema)) {
                        const message = await metadata.send({
                            embeds: [embed.setDescription(`⌛ Cargando cola de canciones interrumpida...`)
                                .setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/music/hourglass-sand-top.png`)]
                        });

                        updateLastAction(MusicActions.RESTARTING);
                        addSongInQueue(res.tracks[0].url, 'message', message);

                        queue.addTrack(res.tracks[0]);

                        if (!queue.node.isPlaying())
                            await queue.node.play();

                        queue.history.tracks = Queue.from(generateTracksArray(previousTracks, player, members), previousStrategy);
                        queue.tracks = Queue.from(generateTracksArray(tracks, player, members), strategy);

                        fileLog(`${MODULE_NAME}.playInterruptedQueue`, 'Playing interrupted music queue');
                    }

                }

                await previousQueueSchema.deleteMany({});
            } catch (error) {
                fileLogError(`${MODULE_NAME}.playInterruptedQueue`, error);
            }
        }

        fileLog(`${MODULE_NAME}.playInterruptedQueue`, `Interrupted music queue checked successfully`);
    },

    cleanTitle,

    setMusicPlayerMessage,

    splitLyrics,

    handleError,

    handleErrorEphemeral: async (reply, embed, description, message, interaction, channel) => {
        if (interaction) await interaction.deferReply({ ephemeral: true });
        handleError(reply, embed, description, message, interaction, channel);
    },

    createQueue,

    connectToVoiceChannel
}
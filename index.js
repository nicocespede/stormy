const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActivityType } = require('discord.js');
const WOKCommands = require('wokcommands');
const path = require('path');
require('dotenv').config();
const { Player } = require('discord-player');
const { timeouts, getIds, getLastAction, updateLastAction, getSongsInQueue, getTimestamps, getMusicPlayerData, getCurrentBranchName, getGithubRawUrl } = require('./src/cache');
const { pushDifferences, checkBansCorrelativity, startStatsCounters, countMembers } = require('./src/common');
const { consoleLog, logToFile, logToFileListenerTriggered } = require('./src/util');
const { containsAuthor, emergencyShutdown, playInterruptedQueue, cleanTitle, setMusicPlayerMessage } = require('./src/music');
const { PREFIX, MusicActions, categorySettings, DEV_ENV, color, ENVIRONMENT, CONSOLE_GREEN, CONSOLE_YELLOW, CONSOLE_RED } = require('./src/constants');

const MODULE_NAME = 'index';

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

client.on('ready', async () => {
    const moduleName = `${MODULE_NAME}.readyListener`;
    logToFile(null, `-`.repeat(40) + '[ NEW START ]' + `-`.repeat(40));

    client.user.setPresence({ activities: [{ name: `${PREFIX}ayuda`, type: ActivityType.Listening }] });
    logToFile(moduleName, `Setting bot presence succesfully`);

    const ids = await getIds();

    startStatsCounters(client);

    countMembers(client);

    new WOKCommands(client, {
        botOwners: ids.users.stormer,
        commandDir: path.join(__dirname, 'commands'),
        featuresDir: path.join(__dirname, 'features'),
        messagesPath: path.join(__dirname, 'messages.json'),
        defaultLanguage: 'spanish',
        disabledDefaultCommands: ['channelonly', 'command', 'help', 'language', 'prefix', 'requiredrole'],
        ephemeral: true,
        ignoreBots: true,
        testServers: [ids.guilds.testing],
        mongoUri: process.env.MONGO_URI,
        dbOptions: { keepAlive: true }
    }).setDefaultPrefix(PREFIX)
        .setCategorySettings(categorySettings)
        .setColor(color);
    logToFile(moduleName, `WOKCommands client initialized succesfully`);

    await checkBansCorrelativity(client);

    const musicEmbed = new EmbedBuilder().setColor(color);

    const player = new Player(client, {
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }
    });

    player.events.on('playerStart', async (queue, track) => {
        const { action: lastAction, user } = getLastAction();
        if (lastAction === MusicActions.CHANGING_CHANNEL)
            updateLastAction(MusicActions.STARTING_TRACK);
        else {
            let action;
            if (lastAction === MusicActions.SKIPPING)
                action = `⏭ ${user} saltó una canción.`;
            else if (lastAction === MusicActions.SKIPPING_MANY)
                action = `⏭ ${user} saltó varias canciones.`;
            else if ((lastAction === MusicActions.GOING_BACK))
                action = `⏮ ${user} volvió a la canción anterior.`;
            updateLastAction(MusicActions.STARTING_TRACK);
            setMusicPlayerMessage(queue, track, action);
        }
    }).on('audioTrackAdd', async (queue, track) => {
        const { action: lastAction } = getLastAction();
        if (queue.node.isPlaying() && lastAction !== MusicActions.MOVING_SONG && lastAction !== MusicActions.ADDING_NEXT) {
            const { interaction, message } = (getSongsInQueue())[track.url];
            const filteredTitle = await cleanTitle(track.title);
            const temporalReply = {
                embeds: [musicEmbed
                    .setDescription(`☑️ Agregado a la cola:\n\n[${filteredTitle}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**`)
                    .setThumbnail(await getGithubRawUrl('assets/thumbs/music/add-song.png'))]
            };
            message ? await message.edit(temporalReply) : await interaction.editReply(temporalReply);

            const action = `☑️ ${message ? message.mentions.repliedUser.tag : interaction.user.tag} agregó [${filteredTitle}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) a la cola.`;
            setMusicPlayerMessage(queue, track, action);

        }
    }).on('audioTracksAdd', async (queue, tracks) => {
        const { action: lastAction } = getLastAction();
        if (queue.node.isPlaying() && lastAction !== MusicActions.ADDING_NEXT) {
            const { interaction, message } = (getSongsInQueue())[tracks[0].url];
            const playlist = tracks[0].playlist;
            const temporalReply = {
                embeds: [musicEmbed
                    .setDescription(`☑️ **${tracks.length} canciones**${playlist ? ` de la lista de reproducción **[${playlist.title}](${playlist.url})**` : ''} agregadas a la cola.`)
                    .setThumbnail(await getGithubRawUrl('assets/thumbs/music/add-song.png'))
                ]
            };
            message ? await message.edit(temporalReply) : await interaction.editReply(temporalReply);

            const action = `☑️ ${message ? message.mentions.repliedUser.tag : interaction.user.tag} agregó a la cola **${tracks.length} canciones**${playlist ? ` de la lista de reproducción **[${playlist.title}](${playlist.url})**` : ''}.`;
            setMusicPlayerMessage(queue, tracks[0], action);
        }
    }).on('emptyChannel', _ => {
        updateLastAction(MusicActions.LEAVING_EMPTY_CHANNEL);
        const { collector } = getMusicPlayerData('player');
        collector.stop();
    }).on('emptyQueue', async queue => {
        const { action: lastAction } = getLastAction();
        const queueEnded = queue.channel.members.size > 1
            && lastAction !== MusicActions.LEAVING_EMPTY_CHANNEL && lastAction !== MusicActions.STOPPING
            && lastAction !== MusicActions.BEING_KICKED && lastAction !== MusicActions.RESTARTING;
        if (queueEnded) {
            updateLastAction(MusicActions.ENDING);
            const { collector } = getMusicPlayerData('player');
            collector.stop();
        }
    }).on('playerError', async (queue, error) => {
        consoleLog(`Error in Player.on('playerError'):\n${error.stack}`, CONSOLE_RED);
        queue.metadata.send({
            content: `<@${ids.users.stormer}>`,
            embeds: [musicEmbed.setDescription(`❌ **${error.name}**:\n\n${error.message}`)
                .setThumbnail(await getGithubRawUrl('assets/thumbs/broken-robot.png'))]
        });
        if (!queue.deleted)
            queue.delete();
    }).on('error', async (queue, error) => {
        consoleLog(`Error in Player.on('error'):\n${error.stack}`, CONSOLE_RED);
        if (error.message !== 'write EPIPE')
            queue.metadata.send({
                content: `<@${ids.users.stormer}>`,
                embeds: [musicEmbed.setDescription(`❌ **${error.name}**:\n\n${error.message}`)
                    .setThumbnail(await getGithubRawUrl('assets/thumbs/broken-robot.png'))]
            });
        if (!queue.deleted)
            queue.delete();
    });
    logToFile(moduleName, `Discord-player instance initialized successfully`);

    playInterruptedQueue(client);

    const branch = await getCurrentBranchName();
    consoleLog(`> Loggeado como ${client.user.tag} - Entorno: ${ENVIRONMENT} | Rama: ${branch}`, CONSOLE_GREEN);
    logToFile(moduleName, `LOGGED IN SUCCESFULLY - ENV: ${ENVIRONMENT} | BRANCH: ${branch}`);
});

client.rest.on('rateLimited', data => consoleLog(`> Se recibió un límite de tarifa:\n${JSON.stringify(data)}`, CONSOLE_YELLOW));

const shutdownEvent = !DEV_ENV ? 'SIGTERM' : 'SIGINT';
process.on(shutdownEvent, async () => {
    logToFileListenerTriggered(MODULE_NAME, shutdownEvent);

    consoleLog('> Reinicio inminente...', CONSOLE_YELLOW);
    // disconnects music bot
    const ids = await getIds();
    await emergencyShutdown(ids.guilds.default);

    // send stats
    const timestamps = getTimestamps();
    if (Object.keys(timestamps).length > 0) {
        consoleLog('> Enviando estadísticas a la base de datos', CONSOLE_YELLOW);
        logToFile(`${MODULE_NAME}.${shutdownEvent}Listener`, `Pushing all stats before shutdown`);

        await pushDifferences(false);
    }

    //clears timeouts
    consoleLog(`> Terminando ${Object.keys(timeouts).length} loops`, CONSOLE_YELLOW);
    for (const key in timeouts)
        if (Object.hasOwnProperty.call(timeouts, key))
            clearTimeout(timeouts[key]);

    //ends discord client
    consoleLog('> Desconectando bot', CONSOLE_YELLOW);
    client.destroy();

    //exits process
    consoleLog('> Terminando proceso', CONSOLE_YELLOW);
    process.exit();
});

client.login(process.env.TOKEN);
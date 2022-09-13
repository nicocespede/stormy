const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const WOKCommands = require('wokcommands');
const path = require('path');
require('dotenv').config();
const { Player } = require('discord-player');
const cache = require('./app/cache');
const { convertTZ, initiateReactionCollector, periodicFunction, pushDifference, checkBansCorrelativity, startStatsCounters, countMembers,
    countConnectedMembers, checkKruUpcomingMatches } = require('./app/general');
const { containsAuthor, emergencyShutdown, playInterruptedQueue, cleanTitle } = require('./app/music');
const { prefix, ids, musicActions, categorySettings, testing } = require('./app/constants');
var interval;

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
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
    client.user.setPresence({ activities: [{ name: `${prefix}ayuda`, type: 'LISTENING' }] });

    startStatsCounters(client);

    countMembers(client);
    countConnectedMembers(client);

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
    }).setDefaultPrefix(prefix)
        .setCategorySettings(categorySettings)
        .setColor([142, 89, 170]);

    await checkBansCorrelativity(client);

    cache.updateLastDateChecked(convertTZ(new Date(), 'America/Argentina/Buenos_Aires'));
    periodicFunction(client);
    checkKruUpcomingMatches(client);
    const reactionCollectorInfo = !cache.getReactionCollectorInfo() ? await cache.updateReactionCollectorInfo() : cache.getReactionCollectorInfo();
    if (reactionCollectorInfo.isActive)
        initiateReactionCollector(client);

    var musicEmbed = new EmbedBuilder().setColor([195, 36, 255]);
    client.player = new Player(client, {
        leaveOnEnd: false,
        leaveOnStop: true,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 60000,
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }
    }).on('trackStart', async (queue, track) => {
        if (cache.getLastAction() === musicActions.CHANGING_CHANNEL)
            cache.updateLastAction(musicActions.STARTING_TRACK);
        else {
            const filteredTitle = await cleanTitle(track.title);
            queue.metadata.send({
                embeds: [new EmbedBuilder().setColor([195, 36, 255])
                    .setDescription(`▶️ Comenzando a reproducir:\n\n[${filteredTitle}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**`)
                    .setImage(track.thumbnail)
                    .setThumbnail(`attachment://icons8-circled-play-64.png`)
                    .setFooter({ text: `Agregada por ${track.requestedBy.tag}${queue.tracks.length != 0 ? ` - ${queue.tracks.length} ${queue.tracks.length === 1 ? 'canción' : 'canciones'} restante${queue.tracks.length > 1 ? 's' : ''} en la cola` : ''}` })],
                files: [`./assets/thumbs/music/icons8-circled-play-64.png`]
            });
        }
    }).on('trackAdd', async (queue, track) => {
        var lastAction = cache.getLastAction();
        if (queue.playing && lastAction != musicActions.MOVING_SONG && lastAction != musicActions.ADDING_NEXT) {
            const filteredTitle = await cleanTitle(track.title);
            queue.metadata.send({
                embeds: [musicEmbed.setDescription(`☑️ Agregado a la cola:\n\n[${filteredTitle}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**`)
                    .setThumbnail(`attachment://icons8-add-song-64.png`)],
                files: [`./assets/thumbs/music/icons8-add-song-64.png`]
            });
        }
    }).on('tracksAdd', async (queue, tracks) => {
        if (cache.getLastAction() != musicActions.ADDING_NEXT)
            queue.metadata.send({
                embeds: [musicEmbed.setDescription(`☑️ **${tracks.length} canciones** agregadas a la cola.`)
                    .setThumbnail(`attachment://icons8-add-song-64.png`)],
                files: [`./assets/thumbs/music/icons8-add-song-64.png`]
            });
    }).on('channelEmpty', (queue) => {
        cache.updateLastAction(musicActions.LEAVING_EMPTY_CHANNEL);
        queue.metadata.send({
            embeds: [musicEmbed.setDescription("🔇 Ya no queda nadie escuchando música, 👋 ¡adiós!")
                .setThumbnail(`attachment://icons8-no-audio-64.png`)],
            files: [`./assets/thumbs/music/icons8-no-audio-64.png`]
        });
    }).on('queueEnd', (queue) => {
        if (cache.getLastAction() != musicActions.LEAVING_EMPTY_CHANNEL
            && cache.getLastAction() != musicActions.STOPPING
            && cache.getLastAction() != musicActions.BEING_KICKED
            && cache.getLastAction() != musicActions.RESTARTING) {
            cache.updateLastAction(musicActions.ENDING);
            queue.metadata.send({
                embeds: [musicEmbed.setDescription("⛔ Fin de la cola, 👋 ¡adiós!")
                    .setThumbnail(`attachment://icons8-so-so-64.png`)],
                files: [`./assets/thumbs/music/icons8-so-so-64.png`]
            });
        }
    }).on('connectionError', (queue, error) => {
        console.log(error);
        queue.metadata.send({
            content: `<@${ids.users.stormer}>`,
            embeds: [musicEmbed.setDescription(`❌ **${error.name}**:\n\n${error.message}`)
                .setThumbnail(`attachment://icons8-delete-64.png`)],
            files: [`./assets/thumbs/music/icons8-delete-64.png`]
        });
        if (!queue.destroyed)
            queue.destroy();
    }).on('error', (queue, error) => {
        console.log(error);
        queue.metadata.send({
            content: `<@${ids.users.stormer}>`,
            embeds: [musicEmbed.setDescription(`❌ **${error.name}**:\n\n${error.message}`)
                .setThumbnail(`attachment://icons8-delete-64.png`)],
            files: [`./assets/thumbs/music/icons8-delete-64.png`]
        });
        if (!queue.destroyed)
            queue.destroy();
    })/*.on('debug', (queue, message) => {
        console.log(message)
    })*/;

    playInterruptedQueue(client);

    console.log(`¡Loggeado como ${client.user.tag}!`);

    interval = setInterval(async function () {
        cache.addMinuteUp();
        const newDate = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
        if (cache.getLastDateChecked().getDate() != newDate.getDate()) {
            periodicFunction(client);
            cache.updateLastDateChecked(newDate);
        }
        const minutesUp = cache.getMinutesUp();
        if (minutesUp % 60 === 0) {
            const timestamps = cache.getTimestamps();
            if (Object.keys(timestamps).length > 0) {
                console.log(`> Se cumplió el ciclo de 1 hora, enviando estadísticas a la base de datos`);
                for (const key in timestamps)
                    if (Object.hasOwnProperty.call(timestamps, key)) {
                        await pushDifference(key);
                        cache.addTimestamp(key, new Date());
                    }
            }
        }
        if (minutesUp % 5 === 0)
            countConnectedMembers(client);
        checkKruUpcomingMatches(client);
    }, 60 * 1000);
});

client.rest.on('rateLimited', data => console.log('> Se recibió un límite de tarifa:\n', data));

process.on(!testing ? 'SIGTERM' : 'SIGINT', async () => {
    console.log('> Reinicio inminente...');
    // disconnects music bot
    await emergencyShutdown(client, ids.guilds.default);

    // send stats
    const timestamps = cache.getTimestamps();
    if (Object.keys(timestamps).length > 0) {
        console.log('> Enviando estadísticas a la base de datos');
        for (const key in timestamps)
            if (Object.hasOwnProperty.call(timestamps, key))
                await pushDifference(key);
    }

    //clears 1 minute interval
    if (interval) {
        console.log('> Terminando intervalo de 1 minuto');
        clearInterval(interval);
    }

    //ends discord client
    console.log('> Desconectando bot');
    client.destroy();
});

client.login(process.env.TOKEN);
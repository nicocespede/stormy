const { Client, Intents, MessageEmbed } = require('discord.js');
const WOKCommands = require('wokcommands');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const { Player } = require('discord-player');
const cache = require('./app/cache');
const { convertTZ, initiateReactionCollector, periodicFunction, pushDifference, checkBansCorrelativity, startStatsCounters, checkMoviesAndGamesUpdates, countMembers, countConnectedMembers } = require('./app/general');
const { containsAuthor, emergencyShutdown, playInterruptedQueue } = require('./app/music');
const { testing, prefix, ids, musicActions, categorySettings } = require('./app/constants');
const { dbClient } = require('./app/postgres');
var interval;

const client = new Client({
    intents: [
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_VOICE_STATES
    ],
    partials: ["CHANNEL"]
});

client.on('ready', async () => {
    client.user.setPresence({ activities: [{ name: `${prefix}ayuda`, type: 'LISTENING' }] });

    startStatsCounters(client);

    countMembers(client);
    countConnectedMembers(client);

    await checkBansCorrelativity(client);

    cache.updateLastDateChecked(convertTZ(new Date(), 'America/Argentina/Buenos_Aires'));
    periodicFunction(client);
    var reactionCollectorInfo = !cache.getReactionCollectorInfo() ? await cache.updateReactionCollectorInfo() : cache.getReactionCollectorInfo();
    reactionCollectorInfo = reactionCollectorInfo[0];
    if (reactionCollectorInfo['activeCollector'])
        initiateReactionCollector(client);

    var musicEmbed = new MessageEmbed().setColor([195, 36, 255]);
    client.player = new Player(client, {
        leaveOnEnd: false,
        leaveOnStop: true,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 60000,
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }
    }).on('trackStart', (queue, track) => {
        if (cache.getLastAction() === musicActions.CHANGING_CHANNEL)
            cache.updateLastAction(musicActions.STARTING_TRACK);
        else
            queue.metadata.send({
                embeds: [new MessageEmbed().setColor([195, 36, 255])
                    .setDescription(`▶️ Comenzando a reproducir:\n\n[${track.title}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**`)
                    .setImage(track.thumbnail)
                    .setThumbnail(`attachment://icons8-circled-play-64.png`)
                    .setFooter({ text: `Agregada por ${track.requestedBy.tag}${queue.tracks.length != 0 ? ` - ${queue.tracks.length} ${queue.tracks.length === 1 ? 'canción' : 'canciones'} restante${queue.tracks.length > 1 ? 's' : ''} en la cola` : ''}` })],
                files: [`./assets/thumbs/music/icons8-circled-play-64.png`]
            });
    }).on('trackAdd', async (queue, track) => {
        var lastAction = cache.getLastAction();
        if (queue.playing && lastAction != musicActions.MOVING_SONG && lastAction != musicActions.ADDING_NEXT)
            queue.metadata.send({
                embeds: [musicEmbed.setDescription(`☑️ Agregado a la cola:\n\n[${track.title}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**`)
                    .setThumbnail(`attachment://icons8-add-song-64.png`)],
                files: [`./assets/thumbs/music/icons8-add-song-64.png`]
            });
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
    }).on('error', (queue, error) => console.log(error));

    playInterruptedQueue(client);

    await checkMoviesAndGamesUpdates(client);

    console.log(`¡Loggeado como ${client.user.tag}!`);

    new WOKCommands(client, {
        botOwners: ids.users.stormer,
        commandDir: path.join(__dirname, 'commands'),
        featuresDir: path.join(__dirname, 'features'),
        defaultLanguage: 'spanish',
        disabledDefaultCommands: ['channelonly', 'command', 'help', 'language', 'prefix', 'requiredrole'],
        ephemeral: true,
        ignoreBots: true,
        testServers: [ids.guilds.testing]
    }).setDefaultPrefix(prefix)
        .setCategorySettings(categorySettings)
        .setColor([142, 89, 170]);

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
                for (const key in timestamps) {
                    if (Object.hasOwnProperty.call(timestamps, key)) {
                        await pushDifference(key);
                        cache.addTimestamp(key, new Date());
                    }
                }
            }
        }
        if (minutesUp % 5 === 0)
            countConnectedMembers(client);
    }, 60 * 1000);
});

client.on('rateLimit', data => console.log('> Se recibió un límite de tarifa:\n', data));

client.login(!testing ? process.env.TOKEN : process.env.TESTING_TOKEN);

process.on(process.env.DATABASE_URL ? 'SIGTERM' : 'SIGINT', async () => {
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

    //ends postgres client and discord client
    console.log('> Terminando cliente de postgres');
    await dbClient.end();
    console.log('> Desconectando bot');
    client.destroy();
});
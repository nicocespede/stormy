const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActivityType } = require('discord.js');
const WOKCommands = require('wokcommands');
const path = require('path');
require('dotenv').config();
const { Player } = require('discord-player');
const chalk = require('chalk');
chalk.level = 1;
const cache = require('./app/cache');
const { initiateReactionCollector, pushDifference, checkBansCorrelativity, startStatsCounters, countMembers } = require('./app/general');
const { containsAuthor, emergencyShutdown, playInterruptedQueue, cleanTitle } = require('./app/music');
const { prefix, MusicActions, categorySettings, testing, githubRawURL, color } = require('./app/constants');

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
    client.user.setPresence({ activities: [{ name: `${prefix}ayuda`, type: ActivityType.Listening }] });

    const ids = cache.getIds() || await cache.updateIds();

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
    }).setDefaultPrefix(prefix)
        .setCategorySettings(categorySettings)
        .setColor(color);

    await checkBansCorrelativity(client);

    const reactionCollectorInfo = cache.getReactionCollectorInfo() || await cache.updateReactionCollectorInfo();
    if (reactionCollectorInfo.isActive)
        initiateReactionCollector(client);

    const musicEmbed = new EmbedBuilder().setColor(color);
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
        if (cache.getLastAction() === MusicActions.CHANGING_CHANNEL)
            cache.updateLastAction(MusicActions.STARTING_TRACK);
        else {
            const songInQueue = (cache.getSongsInQueue())[track.url];
            const filteredTitle = await cleanTitle(track.title);
            const reply = {
                embeds: [new EmbedBuilder().setColor(color)
                    .setDescription(`▶️ Comenzando a reproducir:\n\n[${filteredTitle}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**`)
                    .setImage(track.thumbnail)
                    .setThumbnail(`${githubRawURL}/assets/thumbs/music/play.png`)
                    .setFooter({ text: `Agregada por ${track.requestedBy.tag}${queue.tracks.length !== 0 ? ` - ${queue.tracks.length} ${queue.tracks.length === 1 ? 'canción' : 'canciones'} restante${queue.tracks.length > 1 ? 's' : ''} en la cola` : ''}` })]
            };
            if (!songInQueue)
                queue.metadata.send(reply);
            else {
                const { interaction, message } = songInQueue;
                message ? await message.edit(reply) : await interaction.editReply(reply);
                cache.removeSongInQueue(track.url);
            }
        }
    }).on('trackAdd', async (queue, track) => {
        const lastAction = cache.getLastAction();
        if (queue.playing && lastAction !== MusicActions.MOVING_SONG && lastAction !== MusicActions.ADDING_NEXT) {
            const { interaction, message } = (cache.getSongsInQueue())[track.url];
            const filteredTitle = await cleanTitle(track.title);
            const reply = {
                embeds: [musicEmbed.setDescription(`☑️ Agregado a la cola:\n\n[${filteredTitle}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**`)
                    .setThumbnail(`${githubRawURL}/assets/thumbs/music/add-song.png`)]
            };
            message ? await message.edit(reply) : await interaction.editReply(reply);
            cache.removeSongInQueue(track.url);
        }
    }).on('tracksAdd', async (_, tracks) => {
        if (cache.getLastAction() !== MusicActions.ADDING_NEXT) {
            const { interaction, message } = (cache.getSongsInQueue())[tracks[0].url];
            const playlist = tracks[0].playlist;
            const reply = {
                embeds: [musicEmbed
                    .setDescription(`☑️ **${tracks.length} canciones**${playlist ? ` de la lista de reproducción **[${playlist.title}](${playlist.url})**` : ''} agregadas a la cola.`)
                    .setThumbnail(`${githubRawURL}/assets/thumbs/music/add-song.png`)
                ]
            };
            message ? await message.edit(reply) : await interaction.editReply(reply);
            cache.removeSongInQueue(tracks[0].url);
        }
    }).on('channelEmpty', queue => {
        cache.updateLastAction(MusicActions.LEAVING_EMPTY_CHANNEL);
        queue.metadata.send({
            embeds: [musicEmbed.setDescription("🔇 Ya no queda nadie escuchando música, 👋 ¡adiós!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/so-so.png`)]
        });
    }).on('queueEnd', queue => {
        const lastAction = cache.getLastAction();
        if (lastAction !== MusicActions.LEAVING_EMPTY_CHANNEL
            && lastAction !== MusicActions.STOPPING
            && lastAction !== MusicActions.BEING_KICKED
            && lastAction !== MusicActions.RESTARTING) {
            cache.updateLastAction(MusicActions.ENDING);
            queue.metadata.send({
                embeds: [musicEmbed.setDescription("⛔ Fin de la cola, 👋 ¡adiós!")
                    .setThumbnail(`${githubRawURL}/assets/thumbs/music/so-so.png`)]
            });
        }
    }).on('connectionError', (queue, error) => {
        console.log(chalk.red(`Error in Player.on('connectionError'):\n${error}`));
        queue.metadata.send({
            content: `<@${ids.users.stormer}>`,
            embeds: [musicEmbed.setDescription(`❌ **${error.name}**:\n\n${error.message}`)
                .setThumbnail(`${githubRawURL}/assets/thumbs/broken-robot.png`)]
        });
        if (!queue.destroyed)
            queue.destroy();
    }).on('error', (queue, error) => {
        console.log(chalk.red(`Error in Player.on('error'):\n${error}`));
        queue.metadata.send({
            content: `<@${ids.users.stormer}>`,
            embeds: [musicEmbed.setDescription(`❌ **${error.name}**:\n\n${error.message}`)
                .setThumbnail(`${githubRawURL}/assets/thumbs/broken-robot.png`)]
        });
        if (!queue.destroyed)
            queue.destroy();
    })/*.on('debug', (queue, message) => {
        console.log(message)
    })*/;

    playInterruptedQueue(client);

    console.log(chalk.green(`¡Loggeado como ${client.user.tag}!`));
});

client.rest.on('rateLimited', data => console.log(chalk.yellow(`> Se recibió un límite de tarifa:\n${JSON.stringify(data)}`)));

process.on(!testing ? 'SIGTERM' : 'SIGINT', async () => {
    console.log(chalk.yellow('> Reinicio inminente...'));
    // disconnects music bot
    const ids = cache.getIds() || await cache.updateIds();
    await emergencyShutdown(client, ids.guilds.default);

    // send stats
    const timestamps = cache.getTimestamps();
    if (Object.keys(timestamps).length > 0) {
        console.log(chalk.yellow('> Enviando estadísticas a la base de datos'));
        for (const key in timestamps)
            if (Object.hasOwnProperty.call(timestamps, key))
                await pushDifference(key);
    }

    //clears timeouts
    const { timeouts } = require('./app/cache');
    console.log(chalk.yellow(`> Terminando ${Object.keys(timeouts).length} loops`));
    for (const key in timeouts)
        if (Object.hasOwnProperty.call(timeouts, key))
            clearTimeout(timeouts[key]);

    //ends discord client
    console.log(chalk.yellow('> Desconectando bot'));
    client.destroy();

    //exits process
    console.log(chalk.yellow('> Terminando proceso'));
    process.exit();
});

client.login(process.env.TOKEN);
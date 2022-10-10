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
const { prefix, MusicActions, categorySettings, testing } = require('./app/constants');

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
        .setColor([0, 119, 145]);

    await checkBansCorrelativity(client);

    const reactionCollectorInfo = !cache.getReactionCollectorInfo() ? await cache.updateReactionCollectorInfo() : cache.getReactionCollectorInfo();
    if (reactionCollectorInfo.isActive)
        initiateReactionCollector(client);

    const musicEmbed = new EmbedBuilder().setColor([195, 36, 255]);
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
                embeds: [new EmbedBuilder().setColor([195, 36, 255])
                    .setDescription(`▶️ Comenzando a reproducir:\n\n[${filteredTitle}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**`)
                    .setImage(track.thumbnail)
                    .setThumbnail(`attachment://icons8-circled-play-64.png`)
                    .setFooter({ text: `Agregada por ${track.requestedBy.tag}${queue.tracks.length != 0 ? ` - ${queue.tracks.length} ${queue.tracks.length === 1 ? 'canción' : 'canciones'} restante${queue.tracks.length > 1 ? 's' : ''} en la cola` : ''}` })],
                files: [`./assets/thumbs/music/icons8-circled-play-64.png`]
            };
            if (songInQueue) {
                const { interaction, message } = songInQueue;
                message ? await message.edit(reply) : await interaction.editReply(reply);
                cache.removeSongInQueue(track.url);
            } else
                queue.metadata.send(reply);
        }
    }).on('trackAdd', async (queue, track) => {
        const lastAction = cache.getLastAction();
        if (queue.playing && lastAction != MusicActions.MOVING_SONG && lastAction != MusicActions.ADDING_NEXT) {
            const { interaction, message } = (cache.getSongsInQueue())[track.url];
            const filteredTitle = await cleanTitle(track.title);
            const reply = {
                embeds: [musicEmbed.setDescription(`☑️ Agregado a la cola:\n\n[${filteredTitle}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**`)
                    .setThumbnail(`attachment://icons8-add-song-64.png`)],
                files: [`./assets/thumbs/music/icons8-add-song-64.png`]
            };
            message ? await message.edit(reply) : await interaction.editReply(reply);
            cache.removeSongInQueue(track.url);
        }
    }).on('tracksAdd', async (_, tracks) => {
        if (cache.getLastAction() != MusicActions.ADDING_NEXT) {
            const { interaction, message } = (cache.getSongsInQueue())[tracks[0].url];
            const reply = {
                embeds: [musicEmbed.setDescription(`☑️ **${tracks.length} canciones** agregadas a la cola.`)
                    .setThumbnail(`attachment://icons8-add-song-64.png`)],
                files: [`./assets/thumbs/music/icons8-add-song-64.png`]
            };
            message ? await message.edit(reply) : await interaction.editReply(reply);
            cache.removeSongInQueue(tracks[0].url);
        }
    }).on('channelEmpty', (queue) => {
        cache.updateLastAction(MusicActions.LEAVING_EMPTY_CHANNEL);
        queue.metadata.send({
            embeds: [musicEmbed.setDescription("🔇 Ya no queda nadie escuchando música, 👋 ¡adiós!")
                .setThumbnail(`attachment://icons8-no-audio-64.png`)],
            files: [`./assets/thumbs/music/icons8-no-audio-64.png`]
        });
    }).on('queueEnd', (queue) => {
        if (cache.getLastAction() != MusicActions.LEAVING_EMPTY_CHANNEL
            && cache.getLastAction() != MusicActions.STOPPING
            && cache.getLastAction() != MusicActions.BEING_KICKED
            && cache.getLastAction() != MusicActions.RESTARTING) {
            cache.updateLastAction(MusicActions.ENDING);
            queue.metadata.send({
                embeds: [musicEmbed.setDescription("⛔ Fin de la cola, 👋 ¡adiós!")
                    .setThumbnail(`attachment://icons8-so-so-64.png`)],
                files: [`./assets/thumbs/music/icons8-so-so-64.png`]
            });
        }
    }).on('connectionError', (queue, error) => {
        console.log(chalk.red(`Error in Player.on('connectionError'):\n${error}`));
        queue.metadata.send({
            content: `<@${ids.users.stormer}>`,
            embeds: [musicEmbed.setDescription(`❌ **${error.name}**:\n\n${error.message}`)
                .setThumbnail(`attachment://icons8-delete-64.png`)],
            files: [`./assets/thumbs/music/icons8-delete-64.png`]
        });
        if (!queue.destroyed)
            queue.destroy();
    }).on('error', (queue, error) => {
        console.log(chalk.red(`Error in Player.on('error'):\n${error}`));
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
});

client.login(process.env.TOKEN);
const { Client, Intents, MessageEmbed } = require('discord.js');
const WOKCommands = require('wokcommands');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const { Player } = require('discord-player');
const cache = require('./app/cache');
const { convertTZ, initiateReactionCollector, periodicFunction, pushDifference } = require('./app/general');
const { containsAuthor } = require('./app/music');

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
    client.user.setPresence({ activities: [{ name: `${cache.prefix}ayuda`, type: 'LISTENING' }] });

    client.guilds.fetch(cache.ids.guilds.nckg).then(guild => {
        guild.channels.cache.each(channel => {
            if (channel.isVoice() && channel.id != cache.ids.channels.afk) {
                const membersInChannel = channel.members.has(cache.ids.users.bot) ? channel.members.size - 1 : channel.members.size;
                if (membersInChannel >= 2)
                    channel.members.each(member => cache.addTimestamp(member.id, new Date()));
                else if (channel.members.has(cache.ids.users.bot))
                    cache.addTimestamp(cache.ids.users.bot, new Date());
            }
        });
    }).catch(console.error);

    cache.updateLastDateChecked(convertTZ(new Date(), 'America/Argentina/Buenos_Aires'));
    periodicFunction(client);
    var reactionCollectorInfo = !cache.getReactionCollectorInfo() ? await cache.updateReactionCollectorInfo() : cache.getReactionCollectorInfo();
    reactionCollectorInfo = reactionCollectorInfo[0];
    if (reactionCollectorInfo['collectorMessage_active'])
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
        if (cache.getLastAction() === cache.musicActions.changingChannel)
            cache.updateLastAction(cache.musicActions.startingTrack);
        else
            queue.metadata.send({
                embeds: [new MessageEmbed().setColor([195, 36, 255])
                    .setDescription(`▶️ Comenzando a reproducir:\n\n[${track.title}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**`)
                    .setImage(track.thumbnail)
                    .setThumbnail(`attachment://icons8-circled-play-64.png`)
                    .setFooter({ text: `Agregada por ${track.requestedBy.tag}${queue.tracks.length != 0 ? ` - ${queue.tracks.length} canciones restantes en la cola` : ''}` })],
                files: [`./assets/thumbs/music/icons8-circled-play-64.png`]
            });
    }).on('trackAdd', async (queue, track) => {
        var lastAction = cache.getLastAction();
        if (queue.playing && lastAction != cache.musicActions.moving && lastAction != cache.musicActions.addingNext)
            queue.metadata.send({
                embeds: [musicEmbed.setDescription(`☑️ Agregado a la cola:\n\n[${track.title}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ``}](${track.url}) - **${track.duration}**`)
                    .setThumbnail(`attachment://icons8-add-song-64.png`)],
                files: [`./assets/thumbs/music/icons8-add-song-64.png`]
            });
    }).on('tracksAdd', async (queue, tracks) => {
        if (cache.getLastAction() != cache.musicActions.addingNext)
            queue.metadata.send({
                embeds: [musicEmbed.setDescription(`☑️ **${tracks.length} canciones** agregadas a la cola.`)
                    .setThumbnail(`attachment://icons8-add-song-64.png`)],
                files: [`./assets/thumbs/music/icons8-add-song-64.png`]
            });
    }).on('channelEmpty', (queue) => {
        cache.updateLastAction(cache.musicActions.leavingEmptyChannel);
        queue.metadata.send({
            embeds: [musicEmbed.setDescription("🔇 Ya no queda nadie escuchando música, 👋 ¡adiós!")
                .setThumbnail(`attachment://icons8-no-audio-64.png`)],
            files: [`./assets/thumbs/music/icons8-no-audio-64.png`]
        });
    }).on('queueEnd', (queue) => {
        if (cache.getLastAction() != cache.musicActions.leavingEmptyChannel
            && cache.getLastAction() != cache.musicActions.stopping
            && cache.getLastAction() != cache.musicActions.beingKicked) {
            cache.updateLastAction(cache.musicActions.ending);
            queue.metadata.send({
                embeds: [musicEmbed.setDescription("⛔ Fin de la cola, 👋 ¡adiós!")
                    .setThumbnail(`attachment://icons8-so-so-64.png`)],
                files: [`./assets/thumbs/music/icons8-so-so-64.png`]
            });
        }
    });

    console.log(`¡Loggeado como ${client.user.tag}!`);

    new WOKCommands(client, {
        botOwners: cache.ids.users.stormer,
        commandDir: path.join(__dirname, 'commands'),
        featuresDir: path.join(__dirname, 'features'),
        defaultLanguage: 'spanish',
        disabledDefaultCommands: ['channelonly', 'command', 'help', 'language', 'prefix', 'requiredrole'],
        ephemeral: true,
        ignoreBots: true,
        testServers: ['962233256433029180']
    }).setDefaultPrefix(cache.prefix)
        .setCategorySettings(cache.categorySettings)
        .setColor([142, 89, 170]);

    setInterval(async function () {
        cache.addMinuteUp();
        var newDate = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
        if (cache.getLastDateChecked().getDate() != newDate.getDate()) {
            periodicFunction(client);
            cache.updateLastDateChecked(newDate);
        }
        var minutesUp = cache.getMinutesUp();
        if (minutesUp === 1438 || minutesUp % 60 === 0) {
            var timestamps = cache.getTimestamps();
            if (Object.keys(timestamps).length > 0) {
                if (minutesUp % 60 === 0) console.log(`> Se cumplió el ciclo de 1 hora, enviando estadísticas a la base de datos`);
                if (minutesUp === 1438) console.log(`> Pasaron 23 hs y 55 min, enviando estadísticas a la base de datos`);
                for (const key in timestamps) {
                    if (Object.hasOwnProperty.call(timestamps, key)) {
                        await pushDifference(key);
                        cache.addTimestamp(key, new Date());
                    }
                }
            }
        }
    }, 60 * 1000);
});

client.login(process.env.TOKEN);
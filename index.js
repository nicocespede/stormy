const { Client, Intents, MessageEmbed, MessageAttachment, Util } = require('discord.js');
const WOKCommands = require('wokcommands');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const translate = require("translate");
const { Player } = require('discord-player');
const cache = require('./app/cache');
const { needsTranslation, getNextMessage, setUpCache, convertTZ, initiateReactionCollector, generateWelcomeImage,
    isListed, periodicFunction } = require('./app/general');
const { addBan, addSombraBan, deleteBan } = require('./app/postgres');
const { setNewVoiceChannel, setKicked } = require('./app/music');

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

    await setUpCache();
    periodicFunction(client)
    var reactionCollectorInfo = cache.getReactionCollectorInfo()[0];
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
        if (cache.getLastAction() != cache.musicActions.changingChannel){
            cache.updateLastAction(cache.musicActions.startingTrack);
            queue.metadata.send({
                embeds: [new MessageEmbed().setColor([195, 36, 255])
                    .setDescription(`▶️ Comenzando a reproducir:\n\n[${track.title}](${track.url}) - **${track.duration}**`)
                    .setImage(track.thumbnail)
                    .setThumbnail(`attachment://icons8-circled-play-64.png`)
                    .setFooter({ text: `Agregada por ${track.requestedBy.tag}` })],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-circled-play-64.png`)]
            });
        }
    }).on('trackAdd', async (queue, track) => {
        var lastAction = cache.getLastAction();
        if (queue.tracks.length - 1 > 0 && lastAction != cache.musicActions.moving && lastAction != cache.musicActions.addingNext)
            queue.metadata.send({
                embeds: [musicEmbed.setDescription(`☑️ Agregado a la cola:\n\n[${track.title}](${track.url}) - **${track.duration}**`)
                    .setThumbnail(`attachment://icons8-add-song-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-add-song-64.png`)]
            });
    }).on('tracksAdd', async (queue, tracks) => {
        if (cache.getLastAction() != cache.musicActions.addingNext)
            queue.metadata.send({
                embeds: [musicEmbed.setDescription(`☑️ **${tracks.length} canciones** agregadas a la cola.`)
                    .setThumbnail(`attachment://icons8-add-song-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-add-song-64.png`)]
            });
    }).on('channelEmpty', (queue) => {
        cache.updateLastAction(cache.musicActions.leavingEmptyChannel);
        queue.metadata.send({
            embeds: [musicEmbed.setDescription("🔇 Ya no queda nadie escuchando música, 👋 ¡adiós!")
                .setThumbnail(`attachment://icons8-no-audio-64.png`)],
            files: [new MessageAttachment(`./assets/thumbs/music/icons8-no-audio-64.png`)]
        });
    }).on('queueEnd', (queue) => {
        if (cache.getLastAction() != cache.musicActions.leavingEmptyChannel
            && cache.getLastAction() != cache.musicActions.stopping
            && cache.getLastAction() != cache.musicActions.beingKicked) {
            cache.updateLastAction(cache.musicActions.ending);
            queue.metadata.send({
                embeds: [musicEmbed.setDescription("⛔ Fin de la cola, 👋 ¡adiós!")
                    .setThumbnail(`attachment://icons8-so-so-64.png`)],
                files: [new MessageAttachment(`./assets/thumbs/music/icons8-so-so-64.png`)]
            });
        }
    });

    console.log(`¡Loggeado como ${client.user.tag}!`);

    new WOKCommands(client, {
        botOwners: cache.ids.users.stormer,
        commandDir: path.join(__dirname, 'commands'),
        defaultLanguage: 'spanish',
        disabledDefaultCommands: ['channelonly', 'command', 'help', 'language', 'prefix', 'requiredrole'],
        ephemeral: true,
        ignoreBots: true
    }).setDefaultPrefix(cache.prefix)
        .setCategorySettings(cache.categorySettings)
        .setColor([142, 89, 170]);

    setInterval(function () {
        var newDate = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
        if (cache.getLastDateChecked().getDate() != newDate.getDate()) {
            periodicFunction(client);
            cache.updateLastDateChecked(newDate);
        }
    }, 60 * 1000);
});

client.on('messageCreate', async message => {
    if (message.channel.id === cache.ids.channels.anuncios && message.author.id != cache.ids.users.bot && !message.author.bot)
        if (needsTranslation(message.content)) {
            var text = await translate(message.content.replace(/[&]/g, 'and'), "es");
            var messages = Util.splitMessage(`**Mensaje de <@${message.author.id}> traducido al español:**\n\n${text}`);
            messages.forEach(m => message.channel.send({ content: m }));
        }
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.channel.id === cache.ids.channels.anuncios && !oldMessage.author.bot)
        if (needsTranslation(oldMessage.content))
            oldMessage.channel.messages.fetch().then(async msgs => {
                var msgToEdit = getNextMessage(newMessage.id, msgs);
                var text = await translate(newMessage.content.replace(/[&]/g, 'and'), "es");
                msgToEdit.edit(`**Mensaje de <@${newMessage.author.id}> traducido al español:**\n\n${text}`);
            }).catch(console.error);
});

client.on('guildMemberAdd', member => {
    client.channels.fetch(cache.ids.channels.welcome).then(channel => {
        generateWelcomeImage(member.user).then(attachment => {
            var random = Math.floor(Math.random() * (cache.welcome.length));
            channel.send({ content: `${cache.welcome[random].replace(/%USER_ID%/g, member.user.id)}`, files: [attachment] });
        }).catch(console.error);
    }).catch(console.error);
});

client.on('guildMemberRemove', member => {
    member.guild.bans.fetch().then(bans => {
        if (bans.size == cache.getBanned().length)
            client.channels.fetch(cache.ids.channels.welcome).then(channel => {
                var random = Math.floor(Math.random() * (cache.goodbye.length));
                channel.send({ content: cache.goodbye[random].replace(/%USERNAME%/g, `${member.user.tag}`) });
            }).catch(console.error);
    }).catch(console.error);
});

client.on('guildBanAdd', async ban => {
    await new Promise(res => setTimeout(res, 3000));
    if (!isListed(ban.user.id, cache.getBanned()))
        await addBan([ban.user.id, ban.user.tag, ban.reason, "Desconocido"]).then(async () => {
            await cache.updateBanned();
        }).catch(console.error);
    client.channels.fetch(cache.ids.channels.welcome).then(channel => {
        if (ban.reason == null || ban.reason == "") {
            var random = Math.floor(Math.random() * (cache.bannedWithoutReason.length));
            channel.send(cache.bannedWithoutReason[random].replace(/%USERNAME%/g, `${ban.user.tag}`));
        } else {
            var random = Math.floor(Math.random() * (cache.bannedWithReason.length));
            channel.send(cache.bannedWithReason[random].replace(/%USERNAME%/g, `${ban.user.tag}`)
                .replace(/%REASON%/g, `${ban.reason}`));
        }
    }).catch(console.error);
    if (ban.user.id == cache.ids.users.sombra)
        addSombraBan(ban.reason).then(async () => await cache.updateSombraBans()).catch(console.error);
});

client.on('guildBanRemove', async ban => {
    if (isListed(ban.user.id, cache.getBanned()))
        await deleteBan(ban.user.id).then(async () => await cache.updateBanned()).catch(console.error);
    client.channels.fetch(cache.ids.channels.welcome).then(channel => {
        var random = Math.floor(Math.random() * (cache.unbanned.length));
        channel.send(cache.unbanned[random].replace(/%USERNAME%/g, `${ban.user.tag}`));
    }).catch(console.error);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    // ignore if someone connects
    if (oldState.channelId === null) return;
    // ignore if mute/deafen update
    if (oldState.channelId === newState.channelId) return;
    // ignore if a user disconnects
    if (newState.id !== client.user.id) return;
    // send message if the bot is moved to another channel
    if (oldState.channelId !== newState.channelId && newState.channelId != null) {
        client.channels.fetch(newState.channelId).then(channel => {
            setNewVoiceChannel(client, newState.guild, channel);
        }).catch(console.error);
        return;
    }
    // clear the queue if was kicked
    if (cache.getLastAction() != cache.musicActions.leavingEmptyChannel
        && cache.getLastAction() != cache.musicActions.stopping
        && cache.getLastAction() != cache.musicActions.ending)
        setKicked(client, oldState.guild);
    return;
});

client.login(process.env.TOKEN);

module.exports = { client };
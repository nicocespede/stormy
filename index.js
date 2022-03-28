const { Client, Intents, Util } = require('discord.js');
const WOKCommands = require('wokcommands');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const translate = require("translate");
const cache = require('./app/cache');
const { needsTranslation, getNextMessage, setUpCache, convertTZ, initiateReactionCollector, generateWelcomeImage,
    isListed, periodicFunction } = require('./app/general');
const { addBan, addSombraBan, deleteBan } = require('./app/postgres');

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

    console.log(`Logged in as ${client.user.tag}!`);

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
    await new Promise(res => setTimeout(res, 2500));
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

client.login(process.env.TOKEN);

module.exports = { client };
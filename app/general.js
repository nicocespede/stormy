const { ChannelType } = require('discord.js')
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();
const Canvas = require('canvas');
const chalk = require('chalk');
chalk.level = 1;
const cache = require('./cache');
const { relativeSpecialDays } = require('./constants');
const { updateAvatarString, deleteBan, updateBillboardCollectorMessage, addStat, updateStat } = require('./mongodb');
Canvas.registerFont('./assets/fonts/TitilliumWeb-Regular.ttf', { family: 'Titillium Web' });
Canvas.registerFont('./assets/fonts/TitilliumWeb-Bold.ttf', { family: 'Titillium Web bold' });

var reactionCollector = {};

const convertTZ = (date, tzString) => {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString }));
};

const getImageType = () => {
    const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
    const date = today.getDate();
    const month = today.getMonth() + 1;
    switch (month) {
        case 1:
            return `-newyear`;
        case 2:
            return `-love`;
        case 4:
            return date <= relativeSpecialDays.easter ? `-easter` : '';
        case 12:
            return date >= 26 ? `-newyear` : `-xmas`;
        default:
            return ``;
    }
};

const fullToSeconds = (days, hours, minutes, seconds) => {
    return seconds + (minutes * 60) + (hours * 3600) + (days * 86400);
};

const secondsToFull = (seconds) => {
    // calculate (and subtract) whole days
    var days = Math.floor(seconds / 86400);
    seconds -= days * 86400;
    // calculate (and subtract) whole hours
    var hours = Math.floor(seconds / 3600) % 24;
    seconds -= hours * 3600;
    // calculate (and subtract) whole minutes
    var minutes = Math.floor(seconds / 60) % 60;
    seconds -= minutes * 60;
    seconds = seconds % 60;
    return { days, hours, minutes, seconds };
};

const getMembersStatus = async channel => {
    let membersSize = channel.members.size;
    const valid = [];
    const invalid = [];
    channel.members.each(member => {
        if (member.user.bot) {
            membersSize--;
            valid.push(member);
        } else if (member.voice.deaf && !member.voice.streaming) {
            membersSize--;
            invalid.push(member);
        }
        else
            valid.push(member);
    });
    return { size: membersSize, valid: valid, invalid: invalid };
};

const convertTime = time => {
    let split = time.split(' ');
    const indicator = split.pop();
    split = split[0].split(':');
    switch (indicator) {
        case 'am':
            return `${split[0] === '12' ? '00' : split[0]}:${split[1]}`;
        case 'pm':
            const parsedMinutes = parseInt(split[0]);
            const finalMinutes = parsedMinutes + 12;
            return `${finalMinutes === 24 ? '12' : `${finalMinutes}`}:${split[1]}`;
    }
};

module.exports = {
    needsTranslation: (string) => {
        var probabilities = lngDetector.detect(string);
        if (probabilities[0][0] != 'spanish') {
            if (probabilities[1][0] == 'spanish') {
                if (probabilities[1][1] < 0.2)
                    return true;
                return false;
            }
            return true;
        }
    },

    convertTZ,

    initiateReactionCollector: async (client, message) => {
        const ids = !cache.getIds() ? await cache.updateIds() : cache.getIds();
        client.channels.fetch(ids.channels.cartelera).then(async channel => {
            if (message)
                await channel.send(message).then(async msg => {
                    await updateBillboardCollectorMessage(true, msg.id).catch(console.error);
                    await cache.updateReactionCollectorInfo();
                });
            const aux = !cache.getReactionCollectorInfo() ? await cache.updateReactionCollectorInfo() : cache.getReactionCollectorInfo();
            channel.messages.fetch({ message: aux.messageId }).then(m => {
                if (message)
                    m.react('✅');
                const filter = (reaction) => reaction.emoji.name === '✅';
                reactionCollector = m.createReactionCollector({ filter });
                client.guilds.fetch(ids.guilds.default).then(guild => {
                    guild.roles.fetch(ids.roles.funcion).then(role => {
                        reactionCollector.on('collect', (r, user) => {
                            guild.members.fetch(user.id).then(member => {
                                member.roles.add(role.id);
                                console.log(chalk.green(`> Rol 'función' asignado a ${member.user.tag}`));
                            }).catch(console.error);
                        });
                    }).catch(console.error);
                }).catch(console.error);
                console.log(chalk.green('> Recolector de reacciones activado'));
            }).catch(console.error);
        }).catch(console.error);
    },

    stopReactionCollector: () => {
        reactionCollector.stop();
        console.log(chalk.yellow('> Recolector de reacciones desactivado'));
    },

    pushDifference: async (id, username) => {
        var stats = !cache.getStats() ? await cache.updateStats() : cache.getStats();
        if (!Object.keys(stats).includes(id)) {
            await addStat(id);
            stats = await cache.updateStats();
        }
        const timestamps = cache.getTimestamps();
        const stat = stats[id];
        const now = new Date();
        var totalTime = (Math.abs(now - timestamps[id]) / 1000) + (fullToSeconds(stat.days, stat.hours, stat.minutes, stat.seconds));
        if (!isNaN(totalTime)) {
            var { days, hours, minutes, seconds } = secondsToFull(totalTime);
            await updateStat(id, days, hours, minutes, seconds, username);
        }
        await cache.updateStats();
    },

    fullToSeconds,

    secondsToFull,

    getMembersStatus,

    checkBansCorrelativity: async client => {
        const ids = cache.getIds() || await cache.updateIds();
        await client.guilds.fetch(ids.guilds.default).then(async guild => {
            await guild.bans.fetch().then(async bans => {
                const banned = cache.getBanned() || await cache.updateBanned();
                let needUpdate = false;
                for (const key in banned)
                    if (!bans.has(key)) {
                        needUpdate = true;
                        console.log(chalk.yellow(`> El ban de ${banned[key].user} no corresponde a este servidor`));
                        await deleteBan(key);
                    }
                if (needUpdate)
                    await cache.updateBanned();
            }).catch(console.error);
        }).catch(console.error);
    },

    startStatsCounters: async client => {
        const ids = !cache.getIds() ? await cache.updateIds() : cache.getIds();
        client.guilds.fetch(ids.guilds.default).then(guild => {
            guild.channels.cache.each(async channel => {
                if (channel.type === ChannelType.GuildVoice && channel.id != ids.channels.afk) {
                    const membersInChannel = await getMembersStatus(channel);
                    if (membersInChannel.size >= 2)
                        membersInChannel.valid.forEach(member => {
                            cache.addTimestamp(member.id, new Date());
                        });
                }
            });
        }).catch(console.error);
    },

    countMembers: async client => {
        const ids = !cache.getIds() ? await cache.updateIds() : cache.getIds();
        client.guilds.fetch(ids.guilds.default).then(async guild => {
            const members = await guild.members.fetch();
            const membersCounter = members.filter(m => !m.user.bot).size;
            const totalMembersName = `👥 Totales: ${membersCounter}`;
            guild.channels.fetch(ids.channels.members).then(channel => {
                if (channel.name !== totalMembersName)
                    channel.setName(totalMembersName).then(_ => console.log(chalk.blue('> Contador de miembros actualizado'))).catch(console.error);
            }).catch(console.error);
        }).catch(console.error);
    },

    updateAvatar: async client => {
        const actualAvatar = cache.getAvatar() || await cache.updateAvatar();
        const newAvatar = `./assets/kgprime${getImageType()}.png`;
        if (actualAvatar != newAvatar) {
            await client.user.setAvatar(newAvatar).catch(console.error);
            await updateAvatarString(newAvatar).catch(console.error);
            await cache.updateAvatar()
        }
    },

    updateUsername: async client => {
        const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
        const date = today.getDate();
        const month = today.getMonth() + 1;
        let newUsername = 'StormY';
        switch (month) {
            case 1:
                newUsername += ' 🥂';
                break;
            case 2:
                newUsername += ' 💘';
                break;
            case 4:
                newUsername += date <= relativeSpecialDays.easter ? ' 🐇' : '';
                break;
            case 12:
                newUsername += date >= 26 ? ' 🥂' : ' 🎅🏻';
                break;
        }
        if (client.user.username != newUsername) {
            await client.user.setUsername(newUsername).catch(console.error);
            console.log(chalk.green('> Nombre de usuario actualizado'));
        }
    },

    splitMessage: message => {
        const split = message.split(' ');
        const ret = [];
        let chunk = '';
        split.forEach(word => {
            const aux = chunk + word + ' ';
            if (aux.length <= 2000)
                chunk += word + ' ';
            else {
                ret.push(chunk);
                chunk = '';
            }
        });
        ret.push(chunk);
        return ret;
    },

    convertTime,

    lastUpdateToString: (lastUpdate, upperCase) => {
        const date = new Date(`${lastUpdate.substring(6, 10)}/${lastUpdate.substring(3, 5)}/${lastUpdate.substring(0, 2)}`);
        const today = new Date();
        if (date.getMonth() == today.getMonth() && date.getFullYear() == today.getFullYear())
            if (date.getDate() == today.getDate())
                return !upperCase ? 'hoy' : 'Hoy';
            else if (date.getDate() == today.getDate() - 1)
                return !upperCase ? 'ayer' : 'Ayer';
        return `${(!upperCase ? 'el ' : '')}` + lastUpdate;
    },

    applyText: (canvas, text) => {
        const context = canvas.getContext('2d');
        // Declare a base size of the font
        let fontSize = 100;
        do {
            // Assign the font to the context and decrement it so it can be measured again
            context.font = `${fontSize -= 10}px Titillium Web bold`;
            // Compare pixel width of the text to the canvas minus the approximate avatar size
        } while (context.measureText(text).width > canvas.width - 765);
        // Return the result to use in the actual canvas
        return context.font;
    },

    getImageType
}
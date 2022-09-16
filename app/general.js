const { AttachmentBuilder, ChannelType } = require('discord.js')
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();
const cache = require('./cache');
const Canvas = require('canvas');
const axios = require('axios');
const cheerio = require('cheerio');
const { ids, relativeSpecialDays, currencies } = require('./constants');
const { updateAnniversary, updateAvatarString, deleteBan, updateBirthday, deleteBirthday, updateBillboardCollectorMessage, updateSmurf,
    addStat, updateStat } = require('./mongodb');
Canvas.registerFont('./assets/fonts/TitilliumWeb-Regular.ttf', { family: 'Titillium Web' });
Canvas.registerFont('./assets/fonts/TitilliumWeb-Bold.ttf', { family: 'Titillium Web bold' });

var reactionCollector = {};

const convertTZ = (date, tzString) => {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString }));
}

function getToday() {
    var today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    return `${dd}/${mm}`;
};

async function generateBirthdayImage(user) {
    const canvas = Canvas.createCanvas(1170, 720);
    const context = canvas.getContext('2d');
    const background = await Canvas.loadImage('./assets/happy-bday.png');
    var avatarWidth = 300;
    var avatarHeight = avatarWidth;
    var avatarX = (background.width / 2) - (avatarWidth / 2);
    var avatarY = (background.height / 2) - (avatarHeight / 2);
    context.strokeStyle = '#151515';
    context.lineWidth = 2;
    context.drawImage(background, 0, 0, canvas.width, canvas.height);
    // Select the font size and type from one of the natively available fonts
    context.font = applyText(canvas, user.username);
    // Select the style that will be used to fill the text in
    context.fillStyle = '#ffffff';
    var usernameWidth = context.measureText(user.username).width;
    if (user.id == ids.users.stormer || user.id == ids.users.darkness) {
        var crownWidth = 60;
        var gapWidth = 5;
        const crown = await Canvas.loadImage('./assets/crown.png');
        // Actually fill the text with a solid color
        context.fillText(user.username, (background.width / 2) - ((usernameWidth - gapWidth - crownWidth) / 2), canvas.height / (6 / 5) - 10);
        context.strokeText(user.username, (background.width / 2) - ((usernameWidth - gapWidth - crownWidth) / 2), canvas.height / (6 / 5) - 10);
        context.drawImage(crown, (background.width / 2) - ((usernameWidth + crownWidth + gapWidth) / 2), canvas.height / (6 / 5) - 74, crownWidth, 64);
    } else {
        // Actually fill the text with a solid color
        context.fillText(user.username, (background.width / 2) - (usernameWidth / 2), canvas.height / (6 / 5) - 10);
        context.strokeText(user.username, (background.width / 2) - (usernameWidth / 2), canvas.height / (6 / 5) - 10);
    }
    // Pick up the pen
    context.beginPath();
    // Start the arc to form a circle
    context.arc(avatarX + (avatarWidth / 2), avatarY + (avatarHeight / 2), avatarWidth / 2, 0, Math.PI * 2, true);
    // Put the pen down
    context.closePath();
    // Clip off the region you drew on
    context.clip();
    const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: 'jpg' }));
    // Draw a shape onto the main canvas
    context.drawImage(avatar, avatarX, avatarY, avatarWidth, avatarHeight);
    return new AttachmentBuilder(canvas.toBuffer());
};

function applyText(canvas, text) {
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
};

function getImageType() {
    const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
    const date = today.getDate();
    const month = today.getMonth() + 1;
    if (month === 1)
        return `-newyear`;
    else if (month === 2)
        return `-love`;
    else if (month === 4 && date <= relativeSpecialDays.easter)
        return `-easter`;
    else if (month === 12) {
        if (date >= 26)
            return `-newyear`;
        return `-xmas`;
    }
    return ``;
};

function sendSpecialDayMessage(client) {
    const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
    const date = today.getDate();
    const month = today.getMonth() + 1;
    client.channels.fetch(ids.channels.anuncios).then(channel => {
        if (today.getHours() === 0 && today.getMinutes() === 0) {
            if (date === 1 && month === 1)
                channel.send(`@everyone\n\n¡Los dueños de **NCKG** les desean un muy felíz año nuevo a todos los miembros del servidor! 🥂🌠`)
                    .then(m => ['🥂', '🌠', '🎆'].forEach(emoji => m.react(emoji)));
            else if (date === 14 && month === 2)
                channel.send(`@everyone\n\n¡Los dueños de **NCKG** les desean un felíz día de los enamorados a todas las parejas del servidor! 💘😍`)
                    .then(m => ['💘', '😍', '💏'].forEach(emoji => m.react(emoji)));
            else if (date === relativeSpecialDays.easter && month === 4)
                channel.send(`@everyone\n\n¡Los dueños de **NCKG** les desean unas felices pascuas a todos los miembros del servidor! 🐇🥚`)
                    .then(m => ['🐰', '🥚'].forEach(emoji => m.react(emoji)));
            else if (date === 25 && month === 12)
                channel.send(`@everyone\n\n¡Los dueños de **NCKG** les desean una muy felíz navidad a todos los miembros del servidor! 🎅🏻🎄`)
                    .then(m => ['🎅🏻', '🎄', '🎁'].forEach(emoji => m.react(emoji)));
        }
    }).catch(console.error);
};

async function sendAnniversaryAlert(client) {
    var anniversaries = !cache.getAnniversaries() ? await cache.updateAnniversaries() : cache.getAnniversaries();
    anniversaries.forEach(anniversary => {
        if (anniversary.date.substring(0, 5) == getToday() && !anniversary.flag) {
            client.channels.fetch(ids.channels.anuncios).then(channel => {
                client.guilds.fetch(ids.guilds.default).then(guild => {
                    guild.members.fetch(anniversary.id1).then(member1 => {
                        guild.members.fetch(anniversary.id2).then(member2 => {
                            const years = (new Date().getFullYear()) - parseInt(anniversary.date.substring(6));
                            channel.send({ content: `@everyone\n\nHoy <@${member1.user.id}> y <@${member2.user.id}> cumplen ${years} años de novios, ¡feliz aniversario! 💑` }).then(m => {
                                ['🥰', '😍', '💏'].forEach(emoji => m.react(emoji));
                            }).catch(console.error);
                        }).catch(console.error);
                    }).catch(console.error);
                }).catch(console.error);
            }).catch(console.error);
            updateAnniversary(anniversary.id1, anniversary.id2, true).then(async () => {
                await cache.updateAnniversaries();
            }).catch(console.error);
        } else if (anniversary.date != getToday() && anniversary.flag)
            updateAnniversary(anniversary.id1, anniversary.id2, false).then(async () => {
                await cache.updateAnniversaries();
            }).catch(console.error);
    });
};

async function updateAvatar(client) {
    const actualAvatar = !cache.getAvatar() ? await cache.updateAvatar() : cache.getAvatar();
    const newAvatar = `./assets/kgprime${getImageType()}.png`;
    if (actualAvatar != newAvatar)
        await client.user.setAvatar(newAvatar).then(() => {
            updateAvatarString(newAvatar).then(async _ => await cache.updateAvatar()).catch(console.error);
        }).catch(console.error);
};

async function updateUsername(client) {
    const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
    const date = today.getDate();
    const month = today.getMonth() + 1;
    var newUsername = 'StormY';
    if (month === 1)
        newUsername += ' 🥂';
    else if (month === 2)
        newUsername += ' 💘';
    else if (month === 4 && date <= relativeSpecialDays.easter)
        newUsername += ' 🐇';
    else if (month === 12)
        if (date >= 26)
            newUsername += ' 🥂';
        else
            newUsername += ' 🎅🏻';
    if (client.user.username != newUsername)
        await client.user.setUsername(newUsername).catch(console.error);
};

const sendBdayAlert = async (client) => {
    const birthdays = !cache.getBirthdays() ? await cache.updateBirthdays() : cache.getBirthdays();
    for (const key in birthdays)
        if (Object.hasOwnProperty.call(birthdays, key)) {
            const bday = birthdays[key];
            const bdayDate = `${bday.day}/${bday.month}`;
            if (bdayDate === getToday() && !bday.flag) {
                client.channels.fetch(ids.channels.anuncios).then(channel => {
                    client.guilds.fetch(ids.guilds.default).then(async guild => {
                        await guild.members.fetch(key).then(member => {
                            generateBirthdayImage(member.user).then(attachment => {
                                const msg = key === ids.users.bot ? `@everyone\n\n¡Hoy es mi cumpleaños!`
                                    : `@everyone\n\nHoy es el cumpleaños de <@${key}>, ¡feliz cumpleaños!`;
                                channel.send({ content: msg, files: [attachment] }).then(m => {
                                    ['🎈', '🥳', '🎉', '🎂'].forEach(async emoji => await m.react(emoji));
                                }).catch(console.error);
                            }).catch(console.error);
                        }).catch(() => deleteBirthday(key).then(async () => {
                            await cache.updateBirthdays();
                            channel.send({ content: `Se eliminó el cumpleaños de **${bday.user}** (**Hoy**) ya que el usuario no está más en el servidor.` });
                        }));
                    }).catch(console.error);
                }).catch(console.error);
                updateBirthday(key, true).then(async () => await cache.updateBirthdays()).catch(console.error);
            } else if (bdayDate != getToday() && bday.flag)
                updateBirthday(key, false).then(async () => await cache.updateBirthdays()).catch(console.error);
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

const getMembersStatus = channel => {
    var membersSize = channel.members.size;
    const valid = [];
    const invalid = [];
    channel.members.each(member => {
        if (member.id === ids.users.bot) {
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

const checkValorantBansExpiration = async () => {
    const smurfs = !cache.getSmurfs() ? await cache.updateSmurfs() : cache.getSmurfs();
    const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
    var updated = false;
    for (const command in smurfs)
        if (Object.hasOwnProperty.call(smurfs, command)) {
            const account = smurfs[command];
            if (account.bannedUntil != '') {
                const splitDate = account.bannedUntil.split('/');
                if (today > convertTZ(`${splitDate[1]}/${splitDate[0]}/${splitDate[2]}`, 'America/Argentina/Buenos_Aires')) {
                    updated = true;
                    await updateSmurf(command, '').catch(console.log);
                }
            }
        }
    if (updated)
        await cache.updateSmurfs();
};

const getUpcomingMatches = async () => {
    const urlBase = 'https://www.vlr.gg';
    const url = urlBase + '/team/matches/2355/kr-esports/?group=upcoming';
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const a = $('.wf-card.fc-flex.m-item');
    const matches = [];
    a.each((_, el) => {
        const match = {
            team1Name: '', team1Tag: '',
            team2Name: '', team2Tag: '',
            remaining: '',
            date: '',
            time: '',
            url: urlBase + el.attribs['href']
        };
        const teams = $(el).children('.m-item-team.text-of');
        teams.each((i, team) => {
            const names = $(team).children().get();
            const name = $(names[0]).text().trim();
            match[`team${i + 1}Name`] = name != 'TBD' ? name : 'A determinar';
            match[`team${i + 1}Tag`] = name != 'TBD' ? $(names[1]).text().trim() : name;
        });
        match.remaining = $(el).children('.m-item-result.mod-tbd.fc-flex').children(':first').text();
        const date = $(el).children('.m-item-date').text().trim();
        const split = date.split(`\t`);
        match.date = split.shift();
        match.time = split.pop()
        matches.push(match);
    });
    return matches;
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

    getNextMessage: (id, collection) => {
        var previousMessage = collection.first();
        var ret = null;
        collection.forEach(element => {
            if (element.id == id) {
                ret = previousMessage;
                return;
            }
            previousMessage = element;
        });
        return ret;
    },

    periodicFunction: async client => {
        sendBdayAlert(client);
        sendSpecialDayMessage(client);
        sendAnniversaryAlert(client);
        checkValorantBansExpiration();
        const actualAvatar = !cache.getAvatar() ? await cache.updateAvatar() : cache.getAvatar();
        if (actualAvatar != `./assets/kgprime-kru.png` && client.user.username != 'KRÜ StormY 🤟🏼') {
            updateAvatar(client);
            updateUsername(client);
        }
    },

    sendBdayAlert,

    convertTZ,

    initiateReactionCollector: (client, message) => {
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
                                console.log(`> Rol 'función' asignado a ${member.user.tag}`);
                            }).catch(console.error);
                        });
                    }).catch(console.error);
                }).catch(console.error);
                console.log('> Recolector de reacciones activado');
            }).catch(console.error);
        }).catch(console.error);
    },

    stopReactionCollector: () => {
        reactionCollector.stop();
        console.log('> Recolector de reacciones desactivado');
    },

    generateWelcomeImage: async (user) => {
        const canvas = Canvas.createCanvas(1170, 720);
        const context = canvas.getContext('2d');
        var background = await Canvas.loadImage(`./assets/welcome${getImageType()}.png`);
        var avatarWidth = 250;
        var avatarHeight = avatarWidth
        var avatarX = 450;
        var avatarY = 275;
        context.strokeStyle = '#151515';
        context.lineWidth = 2;
        context.drawImage(background, 0, 0, canvas.width, canvas.height);
        // Select the font size and type from one of the natively available fonts
        context.font = applyText(canvas, user.username);
        // Select the style that will be used to fill the text in
        context.fillStyle = '#ffffff';
        // Actually fill the text with a solid color
        context.fillText(user.username, 725, canvas.height / 1.875);
        context.strokeText(user.username, 725, canvas.height / 1.875);
        // Slightly smaller text placed above the member's display name
        context.font = '75px Titillium Web';
        context.fillStyle = '#ffffff';
        context.fillText(`#${user.discriminator}`, 725, 460);
        context.strokeText(`#${user.discriminator}`, 725, 460);
        // Pick up the pen
        context.beginPath();
        // Start the arc to form a circle
        context.arc(avatarX + (avatarWidth / 2), avatarY + (avatarHeight / 2), avatarWidth / 2, 0, Math.PI * 2, true);
        // Put the pen down
        context.closePath();
        // Clip off the region you drew on
        context.clip();
        const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: 'jpg' }));
        // Draw a shape onto the main canvas
        context.drawImage(avatar, avatarX, avatarY, avatarWidth, avatarHeight);
        return new AttachmentBuilder(canvas.toBuffer());
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

    getAvailableCurrencies: () => {
        var ret = [];
        for (const currency in currencies)
            ret.push(currency);
        return ret;
    },

    getMembersStatus,

    checkBansCorrelativity: async client => {
        await client.guilds.fetch(ids.guilds.default).then(async guild => {
            await guild.bans.fetch().then(async bans => {
                const banned = !cache.getBanned().ids ? await cache.updateBanned() : cache.getBanned();
                let needUpdate = false;
                for (const key in banned.bans)
                    if (!bans.has(key)) {
                        needUpdate = true;
                        console.log(`> El ban de ${banned.bans[key].user} no corresponde a este servidor`);
                        await deleteBan(key);
                    }
                if (needUpdate)
                    await cache.updateBanned();
            }).catch(console.error);
        }).catch(console.error);
    },

    startStatsCounters: client => {
        client.guilds.fetch(ids.guilds.default).then(guild => {
            guild.channels.cache.each(channel => {
                if (channel.type === ChannelType.GuildVoice && channel.id != ids.channels.afk) {
                    const membersInChannel = getMembersStatus(channel);
                    if (membersInChannel.size >= 2)
                        membersInChannel.valid.forEach(member => {
                            cache.addTimestamp(member.id, new Date());
                        });
                }
            });
        }).catch(console.error);
    },

    countMembers: client => {
        client.guilds.fetch(ids.guilds.default).then(async guild => {
            const members = await guild.members.fetch();
            let membersCounter = members.filter(m => !m.user.bot).size;
            const totalMembersName = `👥 Totales: ${membersCounter}`;
            guild.channels.fetch(ids.channels.members).then(channel => {
                if (channel.name !== totalMembersName)
                    channel.setName(totalMembersName).then(_ => console.log('> Contador de miembros actualizado')).catch(console.error);
            }).catch(console.error);
        }).catch(console.error);
    },

    countConnectedMembers: client => {
        client.guilds.fetch(ids.guilds.default).then(async guild => {
            const members = await guild.members.fetch();
            let membersCounter = members.filter(m => !m.user.bot && m.presence && m.presence.status !== 'offline').size;
            const connectedMembersName = `🟢 Conectados: ${membersCounter}`;
            guild.channels.fetch(ids.channels.connectedMembers).then(channel => {
                if (channel.name !== connectedMembersName)
                    channel.setName(connectedMembersName).then(_ => console.log('> Contador de miembros conectados actualizado')).catch(console.error);
            }).catch(console.error);
        }).catch(console.error);
    },

    updateAvatar,

    updateUsername,

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

    getUpcomingMatches,

    checkKruUpcomingMatches: async client => {
        const oneDay = 1000 * 60 * 60 * 24;
        const oneMinute = 1000 * 60;
        const matches = await getUpcomingMatches();
        matches.forEach(element => {
            const date = convertTZ(`${element.date} ${element.time}`, 'America/Argentina/Buenos_Aires');
            const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
            const difference = date - today;
            const rivalTeam = element.team1Name.includes('KRÜ') ? element.team2Name : element.team1Name;
            if (difference <= oneDay && difference >= (oneDay - oneMinute)
                || difference <= (oneMinute * 10) && difference >= (oneMinute * 9))
                client.channels.fetch(ids.channels.anuncios).then(channel => {
                    channel.send(`<@&${ids.roles.kru}>\n\nMañana juega **KRÜ Esports** vs **${rivalTeam}** a las **${convertTime(element.time)}**. ¡Vamos KRÜ! 🤟🏼`).catch(console.error);
                }).catch(console.error);
        });
    },

    convertTime
}
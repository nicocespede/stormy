const { MessageAttachment } = require('discord.js')
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();
const cache = require('./cache');
const { updateBday, deleteBday, updateCollectorMessage, updateAnniversary, updateAvatarString, addStat, updateStat } = require('./postgres');
const Canvas = require('canvas');
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
    const background = await Canvas.loadImage('./assets/custom/happy-bday.png');
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
    if (user.id == cache.ids.users.stormer || user.id == cache.ids.users.darkness) {
        var crownWidth = 60;
        var gapWidth = 5;
        const crown = await Canvas.loadImage('./assets/custom/crown.png');
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
    return new MessageAttachment(canvas.toBuffer());
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
    else if (month === 4 && date <= cache.relativeSpecialDays.easter)
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
    client.channels.fetch(cache.ids.channels.general).then(channel => {
        if (today.getHours() === 0 && today.getMinutes() === 0) {
            if (date === 1 && month === 1)
                channel.send(`@everyone\n\n¡Los dueños de **NCKG** les desean un muy felíz año nuevo a todos los miembros del servidor! 🥂🌠`)
                    .then(m => ['🥂', '🌠', '🎆'].forEach(emoji => m.react(emoji)));
            else if (date === 14 && month === 2)
                channel.send(`@everyone\n\n¡Los dueños de **NCKG** les desean un felíz día de los enamorados a todas las parejas del servidor! 💘😍`)
                    .then(m => ['💘', '😍', '💏'].forEach(emoji => m.react(emoji)));
            else if (date === cache.relativeSpecialDays.easter && month === 4)
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
        if (anniversary['anniversaries_date'].substring(0, 5) == getToday() && !anniversary['anniversaries_flag']) {
            client.channels.fetch(cache.ids.channels.general).then(channel => {
                client.guilds.fetch(cache.ids.guilds.nckg).then(guild => {
                    guild.members.fetch(anniversary['anniversaries_id1']).then(member1 => {
                        guild.members.fetch(anniversary['anniversaries_id2']).then(member2 => {
                            const years = (new Date().getFullYear()) - parseInt(anniversary['anniversaries_date'].substring(6));
                            channel.send({ content: `@everyone\n\nHoy <@${member1.user.id}> y <@${member2.user.id}> cumplen ${years} años de novios, ¡feliz aniversario! 💑` }).then(m => {
                                m.react('🥰');
                                m.react('😍');
                                m.react('💏');
                            }).catch(console.error);
                        }).catch(console.error);
                    }).catch(console.error);
                }).catch(console.error);
            }).catch(console.error);
            updateAnniversary(anniversary['anniversaries_id1'], anniversary['anniversaries_id2'], true).then(async () => {
                await cache.updateAnniversaries();
            }).catch(console.error);
        } else if (anniversary['anniversaries_date'] != getToday() && anniversary['anniversaries_flag'])
            updateAnniversary(anniversary['anniversaries_id1'], anniversary['anniversaries_id2'], false).then(async () => {
                await cache.updateAnniversaries();
            }).catch(console.error);
    });
};

async function updateAvatar(client) {
    var actualAvatar = !cache.getAvatar() ? await cache.updateAvatar() : cache.getAvatar();
    actualAvatar = actualAvatar[0]
    var newAvatar = `./assets/custom/kgprime${getImageType()}.png`;
    if (actualAvatar['avatar_url'] != newAvatar) {
        client.user.setAvatar(newAvatar).then(() => {
            updateAvatarString(newAvatar).catch(console.error);
        }).catch(console.error);
    }
};

function updateUsername(client) {
    const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
    const date = today.getDate();
    const month = today.getMonth() + 1;
    var newUsername = 'StormY';
    if (month === 1)
        newUsername += ' 🥂';
    else if (month === 2)
        newUsername += ' 💘';
    else if (month === 4 && date <= cache.relativeSpecialDays.easter)
        newUsername += ' 🐇';
    else if (month === 12)
        if (date >= 26)
            newUsername += ' 🥂';
        else
            newUsername += ' 🎅🏻';
    if (client.user.username != newUsername)
        client.user.setUsername(newUsername).catch(console.error);
};

const sendBdayAlert = async (client) => {
    var birthdays = !cache.getBirthdays() ? await cache.updateBirthdays() : cache.getBirthdays();
    birthdays.forEach(bday => {
        if (bday['bdays_date'] == getToday() && !bday['bdays_flag']) {
            client.channels.fetch(cache.ids.channels.general).then(channel => {
                client.guilds.fetch(cache.ids.guilds.nckg).then(async guild => {
                    await guild.members.fetch(bday['bdays_id']).then(member => {
                        generateBirthdayImage(member.user).then(attachment => {
                            if (bday['bdays_id'] == `<@${cache.ids.users.bot}>`)
                                var msg = `@everyone\n\n¡Hoy es mi cumpleaños!`;
                            else
                                var msg = `@everyone\n\nHoy es el cumpleaños de <@${bday['bdays_id']}>, ¡feliz cumpleaños!`;
                            channel.send({ content: msg, files: [attachment] }).then(m => {
                                m.react('🎈');
                                m.react('🥳');
                                m.react('🎉');
                                m.react('🎂');
                            }).catch(console.error);
                        }).catch(console.error);
                    }).catch(() => deleteBday(bday['bdays_id']).then(async () => {
                        await cache.updateBirthdays();
                        channel.send({ content: `Se eliminó el cumpleaños de **${bday['bdays_user']}** (**Hoy**) ya que el usuario no está más en el servidor.` });
                    }));
                }).catch(console.error);
            }).catch(console.error);
            updateBday(bday['bdays_id'], true).then(async () => (await cache.updateBirthdays())).catch(console.error);
        } else if (bday['bdays_date'] != getToday() && bday['bdays_flag'])
            updateBday(bday['bdays_id'], false).then(async () => (await cache.updateBirthdays())).catch(console.error);
    });
};

const isListed = (id, json, string) => {
    var ret = false;
    json.forEach(element => {
        if (element[string] === id)
            ret = true;
    });
    return ret;
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

module.exports = {
    isAMention: (str) => {
        return str.substring(0, 1) == '<' && str.substring(1, 2) == '@' && str.substring(str.length - 1, str.length) == '>';
    },

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

    periodicFunction: (client) => {
        sendBdayAlert(client);
        sendSpecialDayMessage(client);
        sendAnniversaryAlert(client);
        updateAvatar(client);
        updateUsername(client);
    },

    sendBdayAlert,

    convertTZ,

    initiateReactionCollector: (client, message) => {
        client.channels.fetch(cache.ids.channels.cartelera).then(async channel => {
            if (message)
                await channel.send(message).then(async msg => {
                    await updateCollectorMessage(true, msg.id).catch(console.error);
                    await cache.updateReactionCollectorInfo();
                });
            var aux = !cache.getReactionCollectorInfo() ? await cache.updateReactionCollectorInfo() : cache.getReactionCollectorInfo();
            aux = aux[0];
            channel.messages.fetch(aux['collectorMessage_id']).then(m => {
                if (message)
                    m.react('✅');
                const filter = (reaction) => reaction.emoji.name === '✅';
                reactionCollector = m.createReactionCollector({ filter });
                client.guilds.fetch(cache.ids.guilds.nckg).then(guild => {
                    guild.roles.fetch(cache.ids.roles.funcion).then(role => {
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
        var background = await Canvas.loadImage(`./assets/custom/welcome${getImageType()}.png`);
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
        return new MessageAttachment(canvas.toBuffer());
    },

    isListed,

    pushDifference: async (id) => {
        var stats = !cache.getStats() ? await cache.updateStats() : cache.getStats();
        if (!isListed(id, stats, 'stats_id')) {
            await addStat(id);
            stats = await cache.updateStats();
        }
        const timestamps = cache.getTimestamps();
        stats.forEach(async stat => {
            if (stat['stats_id'] === id) {
                const now = new Date();
                var totalTime = (Math.abs(now - timestamps[id]) / 1000)
                    + (fullToSeconds(stat['stats_days'], stat['stats_hours'], stat['stats_minutes'], stat['stats_seconds']));
                if (!isNaN(totalTime)) {
                    var { days, hours, minutes, seconds } = secondsToFull(totalTime);
                    await updateStat(id, days, hours, minutes, seconds);
                }
                return;
            }
        });
        await cache.updateStats();
    },

    fullToSeconds,

    secondsToFull
}
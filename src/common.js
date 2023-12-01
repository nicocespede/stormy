const { ChannelType, Client, VoiceBasedChannel } = require('discord.js');
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();
const { Canvas } = require('canvas');
const { getStats, getTimestamps, getIds, getBanned, updateBanned, addTimestamp, getIcon, updateIcon, getMode, removeTimestamp, getGithubRawUrl } = require('./cache');
const { relativeSpecialDays, Mode, CONSOLE_YELLOW, CONSOLE_RED, CONSOLE_BLUE, CONSOLE_GREEN } = require('./constants');
const { updateIconString, deleteBan, addStat, updateStat, updateManyStats } = require('./mongodb');
const { convertTZ, consoleLog, logToFile, logToFileFunctionTriggered, logToFileError, getUserTag, getSimpleEmbed, getErrorMessage, getUTCDateFromArgentina, buildStyledUnixTimestamp } = require('./util');

const MODULE_NAME = 'src.common';

const getImageType = async () => {
    const mode = await getMode();
    if (mode === Mode.AFA)
        return '-afa';

    const today = convertTZ(new Date());
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

/**
 * Gets the information regarding voice status of the members connected to a voice channel.
 * 
 * @param {VoiceBasedChannel} channel The voice channel.
 * @returns The number of members in the channel, a list of the members who are farming stats and a list of the members who are not.
 */
const getMembersStatus = async channel => {
    const valid = [];
    const invalid = [];

    const { members } = channel;
    let { size } = members;

    for (const [_, member] of members) {
        const { user, voice } = member;
        if (user.bot) {
            size--;
            valid.push(member);
        } else if (voice.deaf && !voice.streaming) {
            size--;
            invalid.push(member);
        } else
            valid.push(member);
    }
    return { size, valid, invalid };
};

/**
 * Converts a date string to a colloquial string.
 * 
 * @param {String} lastUpdate The last update date string.
 * @param {Boolean} upperCase If the first letter has to be upper case or not.
 * @returns The last update formatted date.
 */
const lastUpdateToString = lastUpdate => {
    const splitted = lastUpdate.split('/');
    const date = getUTCDateFromArgentina(`${splitted[2]}-${splitted[1]}-${splitted[0]}`);
    return buildStyledUnixTimestamp(date);
};

const addAnnouncementsRole = async (id, guild, member) => {
    try {
        const role = await guild.roles.fetch(id);
        if (!role.members.has(member.user.id)) {
            await member.roles.add(id);
            consoleLog(`> Rol '${role.name}' agregado a ${getUserTag(member.user)}`, CONSOLE_GREEN);
        }
    } catch (error) {
        consoleLog(`> No se pudo agregar el rol '${role.name}' a ${getUserTag(member.user)}:\n${error.stack}`, CONSOLE_RED);
    }
};

module.exports = {
    needsTranslation: (string) => {
        var probabilities = lngDetector.detect(string);
        if (probabilities[0][0] !== 'spanish') {
            if (probabilities[1][0] === 'spanish') {
                if (probabilities[1][1] < 0.2)
                    return true;
                return false;
            }
            return true;
        }
    },

    /**
     * Calculates and pushes the time difference for the stats of a member.
     * 
     * @param {String} id The ID of the member.
     * @param {String} username The username of the member.
     */
    pushDifference: async (id, username) => {
        logToFileFunctionTriggered(MODULE_NAME, 'pushDifference');

        const timestamps = getTimestamps();
        const timestamp = timestamps[id];

        if (timestamp) {
            removeTimestamp(id);

            let stats = await getStats();

            if (!Object.keys(stats).includes(id))
                stats = await addStat(id, username);

            const stat = stats[id];
            const now = new Date();
            const totalTime = (Math.abs(now - timestamp) / 1000) + fullToSeconds(stat.days, stat.hours, stat.minutes, stat.seconds);

            if (!isNaN(totalTime)) {
                const { days, hours, minutes, seconds } = secondsToFull(totalTime);
                await updateStat(id, days, hours, minutes, seconds, username);
            }
        }
    },

    /**
     * Calculates and pushes the time difference for the stats of many/all members.
     * 
     * @param {Boolean} restart If re-adding the timestamps is needed or not.
     * @param {String} [ids] The IDs of the members.
     */
    pushDifferences: async (restart, ids) => {
        logToFileFunctionTriggered(MODULE_NAME, 'pushDifferences');

        const now = new Date();
        const updates = [];
        const stats = await getStats();
        const timestamps = getTimestamps();

        if (!ids)
            ids = Object.keys(timestamps);

        for (const id of ids) {
            const timestamp = timestamps[id];

            if (timestamp) {
                const stat = stats[id];

                let totalTime = Math.abs(now - timestamp) / 1000;

                if (restart)
                    addTimestamp(id, new Date());
                else
                    removeTimestamp(id);

                if (stat)
                    totalTime += fullToSeconds(stat.days, stat.hours, stat.minutes, stat.seconds);

                if (!isNaN(totalTime)) {
                    const { days, hours, minutes, seconds } = secondsToFull(totalTime);
                    updates.push({ filter: { _id: id }, update: { days, hours, minutes, seconds } });
                }
            }
        }

        if (updates.length > 0)
            await updateManyStats(updates);
    },

    fullToSeconds,

    secondsToFull,

    getMembersStatus,

    /**
     * Checks that the bans stored in database are correlated with the bans of the default guild.
     * 
     * @param {Client} client The Discord client instance.
     */
    checkBansCorrelativity: async client => {
        logToFileFunctionTriggered(MODULE_NAME, 'checkBansCorrelativity');

        try {
            const ids = await getIds();
            const guild = await client.guilds.fetch(ids.guilds.default);
            const bans = await guild.bans.fetch();
            const banned = getBanned() || await updateBanned();
            let needUpdate = false;
            for (const key in banned)
                if (!bans.has(key)) {
                    needUpdate = true;
                    consoleLog(`> El ban de ${banned[key].user} no corresponde a este servidor`, CONSOLE_YELLOW);
                    await deleteBan(key);
                }
            if (needUpdate)
                await updateBanned();

            logToFile(`${MODULE_NAME}.checkBansCorrelativity`, `Bans correlativity succesfully checked`);
        } catch (error) {
            consoleLog(`> Error al chequear correlatividad de baneos`, CONSOLE_RED);
            logToFileError(`${MODULE_NAME}.checkBansCorrelativity`, error);
        }
    },

    /**
     * Starts the stats counters for the members connected to voice channels.
     * 
     * @param {Client} client The Discord client instance.
     */
    startStatsCounters: async client => {
        logToFileFunctionTriggered(MODULE_NAME, 'startStatsCounters');

        try {
            const ids = await getIds();
            const guild = await client.guilds.fetch(ids.guilds.default);
            let counter = 0;
            for (const [id, channel] of guild.channels.cache)
                if (channel.type === ChannelType.GuildVoice && id !== ids.channels.afk) {
                    const { size, valid } = await getMembersStatus(channel);
                    if (size >= 2)
                        for (const member of valid) {
                            counter++;
                            addTimestamp(member.id, new Date());
                        }
                }

            logToFile(`${MODULE_NAME}.startStatsCounters`, `${counter} stats counters started`);
        } catch (error) {
            consoleLog(`> Error al iniciar contadores de estadísticas`, CONSOLE_RED);
            logToFileError(`${MODULE_NAME}.startStatsCounters`, error);
        }
    },

    /**
     * Counts the members in the default guild and updates the members counter.
     * 
     * @param {Client} client The Discord client instance.
     */
    countMembers: async client => {
        logToFileFunctionTriggered(MODULE_NAME, 'countMembers');

        try {
            const ids = await getIds();
            const guild = await client.guilds.fetch(ids.guilds.default);
            const members = await guild.members.fetch();
            const membersCounter = members.filter(m => !m.user.bot).size;
            const totalMembersName = `👥 Totales: ${membersCounter}`;
            const channel = await guild.channels.fetch(ids.channels.members);
            if (channel.name !== totalMembersName) {
                await channel.setName(totalMembersName);
                consoleLog('> Contador de miembros actualizado', CONSOLE_BLUE);

                logToFile(`${MODULE_NAME}.countMembers`, `Guild members counter updated`);
            } else
                logToFile(`${MODULE_NAME}.countMembers`, `No changes in guild members counter`);
        } catch (error) {
            consoleLog(`> Error al actualizar contador de miembros`, CONSOLE_RED);
            logToFileError(`${MODULE_NAME}.countMembers`, error);
        }
    },

    updateIcon: async guild => {
        const actualIcon = getIcon() || await updateIcon();
        const newIcon = `kgprime${await getImageType()}`;
        if (actualIcon !== newIcon) {
            await guild.setIcon(await getGithubRawUrl(`assets/icons/${newIcon}.png`)).catch(console.error);
            await updateIconString(newIcon).catch(console.error);
            await updateIcon();
        }
    },

    updateGuildName: async client => {
        const today = convertTZ(new Date());
        const date = today.getDate();
        const month = today.getMonth() + 1;
        let newGuildName = 'NCKG';
        switch (month) {
            case 1:
                newGuildName += ' 🥂';
                break;
            case 2:
                newGuildName += ' 💘';
                break;
            case 4:
                newGuildName += date <= relativeSpecialDays.easter ? ' 🐇' : '';
                break;
            case 12:
                newGuildName += date >= 26 ? ' 🥂' : ' 🎅🏻';
                break;
        }
        const ids = await getIds();
        const guild = await client.guilds.fetch(ids.guilds.default).catch(console.error);
        if (guild.name !== newGuildName) {
            await guild.setName(newGuildName).catch(console.error);
            consoleLog('> Nombre de servidor actualizado', CONSOLE_GREEN);
        }
    },

    lastUpdateToString,

    /**
     * Resizes a text to be applied to an image.
     * 
     * @param {Canvas} canvas The Canvas instance.
     * @param {String} text The text to be applied.
     * @param {String} font The name of the font wanted.
     * @returns The resized text.
     */
    applyText: (canvas, text, font) => {
        const context = canvas.getContext('2d');
        // Declare a base size of the font
        let fontSize = 100;
        do {
            // Assign the font to the context and decrement it so it can be measured again
            context.font = `${fontSize -= 10}px ${font}`;
            // Compare pixel width of the text to the canvas minus the approximate avatar size
        } while (context.measureText(text).width > canvas.width - 765);
        // Return the result to use in the actual canvas
        return context.font;
    },

    getImageType,

    addAnnouncementsRole,

    isOwner: async id => {
        const ids = await getIds();
        return id === ids.users.stormer || id === ids.users.darkness;
    },

    /**
     * Generates an embed with an error message as description.
     * 
     * @param {String} description The description.
     * @returns An embed with an error message.
     */
    getErrorEmbed: async description => getSimpleEmbed(getErrorMessage(description)).setImage(await getGithubRawUrl(`assets/system-down.jpeg`)).setColor([221, 46, 68])
}
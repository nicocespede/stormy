const { BlacklistedSongsData, RawCurrenciesData, IDsData, StatsData, TimestampsData, CrosshairsData, ValorantMatchesData } = require("./typedefs");
const { DEV_ENV, LOCAL_ENV, CONSOLE_GREEN, CONSOLE_RED } = require('./constants');
const { convertTime, consoleLog, logToFile, logToFileError, consoleLogError } = require('./util');
const fetch = require('node-fetch');
const SteamAPI = require('steamapi');
const steam = new SteamAPI(process.env.STEAM_API_KEY);
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const collectorMessageSchema = require('../models/collectorMessage-schema');
const iconSchema = require('../models/icon-schema');

const MODULE_NAME = 'src.cache';
const GITHUB_RAW_PATH = 'https://raw.githubusercontent.com/nicocespede/stormy-data/';

let chronologies = {};
let downloadsData = {};
let movies = {};
let filters = {};
var games;
var birthdays;
let banned;
var sombraBans;
let billboardMessageInfo;
var rolesMessageInfo;
let icon;
let mode;
let lastAction;
let playlists;
var thermalPasteDates;
var bansResponsibles = {};
var smurfs;
var tracksNameExtras;
let reminders;
let characters;
let songsInQueue = {};
let musicPlayerData = {};
let fwcData;

/** @type {TimestampsData}*/
const timestamps = {};

/**@type {String} */
let codeBranchName;

/**
 * Gets the name of the tracked Github code branch.
 * 
 * @returns The name of the current code branch.
 */
const getCurrentCodeBranchName = () => {
    if (!codeBranchName) {
        const fs = require('fs');

        const gitData = fs.readFileSync(`.git/HEAD`, 'utf8');
        const splitted = gitData.split('/');

        codeBranchName = splitted.pop().replace('\n', '');
    }

    return codeBranchName;
};

/**@type {String} */
let contentBranchName;

/**@type {String} */
let githubRawURL;

/**
 * Gets the name of the tracked Github content branch.
 * 
 * @returns The name of the current content branch.
 */
const getCurrentContentBranchName = async () => {
    if (!contentBranchName) {
        const fetch = require('node-fetch');

        contentBranchName = getCurrentCodeBranchName();
        githubRawURL = GITHUB_RAW_PATH + contentBranchName;

        const res = await fetch(`${githubRawURL}/branchChecker.txt`);
        const content = await res.text();

        if (content.startsWith('404')) {
            contentBranchName = 'main';
            githubRawURL = GITHUB_RAW_PATH + contentBranchName;
        }
    }

    return contentBranchName;
};

/**
 * Gets the full URL to a Github raw element.
 * 
 * @param {String} string The string to append at the end of the raw URL.
 * @returns The complete Github URL.
 */
const getGithubRawUrl = async string => {
    if (!contentBranchName)
        await getCurrentContentBranchName();

    return `${githubRawURL}/${string}`;
};

const getChronology = id => chronologies[id];

const updateChronology = async id => {
    const data = await retrieveDataFromFile(`chronologies/${id}.json`);

    if (data)
        chronologies[id] = data;

    return chronologies[id];
};

const sortBirthdays = array => {
    let newArray = [];
    for (let i = 0; i < 12; i++) {
        const filtered = array.filter(({ date }) => date.getMonth() === i);
        newArray = newArray.concat(filtered.sort(({ date: date1 }, { date: date2 }) => date1.getDate() - date2.getDate()));
    }
    return newArray;
};

/** @type {IDsData}*/
let ids;

/**
 * Retrieves the IDs data from the ids.json file.
 * 
 * @returns All cached IDs data.
 */
const updateIds = async () => {
    const data = await retrieveDataFromFile(!DEV_ENV ? 'ids.json' : 'testingIds.json');

    if (data)
        ids = data;

    return ids;
};

/** @type {StatsData}*/
let stats;

/**
 * Retrieves the stats data from the database.
 * 
 * @returns All cached stats data.
 */
const updateStats = async () => {
    const statSchema = require('../models/stat-schema');
    const results = await statSchema.find({}).sort({ days: 'desc', hours: 'desc', minutes: 'desc', seconds: 'desc' });
    stats = {};
    results.forEach(element => {
        stats[element._id] = {
            days: element.days,
            hours: element.hours,
            minutes: element.minutes,
            seconds: element.seconds
        };
    });
    consoleLog('> Caché de estadísticas actualizado', CONSOLE_GREEN);
    return stats;
};

/**@type {RawCurrenciesData}*/
let currencies;

/**
 * Retrieves the currencies data from the currencies.json file.
 * 
 * @returns All cached currencies data.
 */
const updateCurrencies = async () => {
    const data = await retrieveDataFromFile('currencies.json');

    if (data)
        currencies = data;

    return currencies;
};

//TEMP SOLUTION
/** @type {BlacklistedSongsData}*/
let blacklistedSongs;

/**
 * Retrieves the blacklisted songs data from the blacklistedTracks.json file.
 * 
 * @returns All cached blacklisted songs data.
 */
const updateBlacklistedSongs = async () => {
    const data = await retrieveDataFromFile(`blacklistedTracks.json`);

    if (data)
        blacklistedSongs = data;

    return blacklistedSongs;
}//

/**@type {CrosshairsData}*/
let crosshairs;

/**
 * Retrieves the crosshairs data from the database.
 * 
 * @returns All cached crosshairs data.
 */
const updateCrosshairs = async () => {
    const crosshairSchema = require('../models/crosshair-schema');
    const results = await crosshairSchema.find({}).sort({ id: 'asc' });
    crosshairs = {};
    results.forEach(ch => crosshairs[`${ch.id}`] = {
        name: ch.name,
        code: ch.code,
        owner: ch.ownerId
    });

    consoleLog('> Caché de miras actualizado', CONSOLE_GREEN);
    return crosshairs;
}

/**@type {ValorantMatchesData}*/
const kruMatches = {};

/**
 * Scraps the Kru completed/upcoming matches data from vlr.gg.
 * 
 * @param {"completed" | "upcoming"} type The matches type wanted.
 * @returns All cached Kru completed/upcoming matches data.
 */
const updateKruMatches = async type => {
    const urlBase = 'https://www.vlr.gg';
    const url = urlBase + '/team/matches/2355/kr-esports/?group=' + type;
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const a = $('.wf-card.fc-flex.m-item');

        const matches = [];
        a.each((_, el) => {
            const split = $(el).children('.m-item-date').text().trim().split(`\t`);
            const date = new Date(`${split.shift().replace(/\//g, '-')}T${convertTime(split.pop())}Z`);
            date.setHours(date.getHours() - 2);

            const match = {
                date,
                url: urlBase + el.attribs['href']
            };

            let result = $(el).children('.m-item-result.fc-flex');

            if (type === 'upcoming') {
                result = result.children(':first').text().replace('w', 's').replace('mo', 'me');

                if (!result || result === '')
                    result = 'En vivo';

                match.remaining = result;
            } else
                match.score = result.find('span').map((_, element) => $(element).text()).get().join('-');

            const teams = $(el).children('.m-item-team.text-of');
            teams.each((i, team) => {
                const names = $(team).children().get();
                const name = $(names[0]).text().trim();
                match[`team${i + 1}Name`] = name !== 'TBD' ? name : 'A determinar';
                match[`team${i + 1}Tag`] = name !== 'TBD' ? $(names[1]).text().trim() : name;
            });

            matches.push(match);
        });

        kruMatches[type] = matches;
    } catch (e) {
        if (!kruMatches[type])
            kruMatches[type] = [];
        consoleLogError(`> Error al obtener información de ${type === 'upcoming' ? `próximos partidos` : `partidos completados`} de KRÜ`);
        logToFileError(`${MODULE_NAME}.updateKruMatches`, e);
    }

    return kruMatches[type];
}

/**
 * Retrieves the data from a file.
 * 
 * @param {String} path The path to the file to be read.
 * @returns The parsed data.
 */
const retrieveDataFromFile = async path => {
    let data;
    try {
        if (LOCAL_ENV)
            data = fs.readFileSync(`../stormy-data/${path}`, 'utf8');
        else {
            const res = await fetch(await getGithubRawUrl(path));
            data = await res.text();
        }

        consoleLog(`> ${path} cargado`, CONSOLE_GREEN);
        return JSON.parse(data);
    } catch (err) {
        consoleLogError(`> Error al cargar ${[path]}`);
        logToFileError(MODULE_NAME + '.retrieveDataFromFile', err);
        return null;
    }
};

module.exports = {
    timeouts: {},

    /** Loads the cache needed since the start. */
    loadMandatoryCache: async () => {
        logToFile(MODULE_NAME + '.loadMandatoryCache', 'Loading mandatory cache')
        await updateCurrencies();
    },

    getCurrentCodeBranchName,

    getCurrentContentBranchName,

    getGithubRawUrl,

    getChronology,
    updateChronology,

    getFilters: id => filters[id],
    updateFilters: async id => {
        const filtersSchema = require('../models/filters-schema');
        const result = await filtersSchema.findById(id, 'filters choices');
        if (result)
            filters[id] = result.choices ? { filters: result.filters, choices: result.choices } : { filters: result.filters };
        else {
            await new filtersSchema({ _id: id, filters: ['all'] }).save();
            consoleLog(`> Filtros de '${id}' agregados a la base de datos`, CONSOLE_GREEN);
            filters[id] = { filters: ['all'] };
        }
        consoleLog(`> Caché de filtros de '${id}' actualizado`, CONSOLE_GREEN);
        return filters[id];
    },

    getMovies: id => movies[id],
    updateMovies: async (id, selectedFilters, selectedChoices) => {
        const chronology = getChronology(id) || await updateChronology(id);

        if (!selectedChoices)
            movies[id] = selectedFilters.includes('all') ? chronology : chronology.filter(movie => selectedFilters.includes(movie.type));
        else {
            let array = [];
            let i = 0;
            for (const element of chronology) {
                const { choices, type } = element;
                if (!choices) {
                    if (selectedFilters.includes('all') || selectedFilters.includes(type))
                        array.push(element);
                    continue;
                }

                const choice = choices[selectedChoices[i++]] || choices[0];
                const { data } = choice;
                array = array.concat(selectedFilters.includes('all') ? data : data.filter(movie => selectedFilters.includes(movie.type)));
            }
            movies[id] = array;
        }

        consoleLog(`> Caché de '${id}' actualizado`, CONSOLE_GREEN);
        return movies[id];
    },

    getDownloadsData: id => downloadsData[id],

    updateDownloadsData: async id => {
        const data = await retrieveDataFromFile(`downloads/${id}.json`);

        if (data)
            downloadsData[id] = data;

        return downloadsData[id];
    },

    getGames: () => games,
    updateGames: async () => {
        games = [];
        const data = await retrieveDataFromFile(`downloads/games.json`);

        if (data)
            for (const key in data) if (Object.hasOwnProperty.call(data, key))
                for (const game of data[key]) {
                    if (key === 'steam') {
                        const gameData = await steam.getGameDetails(game.id).catch(console.error);
                        game.name = gameData.name;
                        game.year = gameData.release_date.date.split(',').pop().trim();
                        game.imageURL = gameData.header_image;
                    }
                    game.platform = key;
                    games.push(game);
                }

        return games.sort((a, b) => a.name.localeCompare(b.name));
    },

    getBirthdays: () => birthdays,
    updateBirthdays: async () => {
        const birthdaySchema = require('../models/birthday-schema');
        const results = await birthdaySchema.find({});
        birthdays = {};
        sortBirthdays(results).forEach(element => {
            birthdays[element._id] = {
                date: element.date,
                user: element.username
            };
        });
        consoleLog('> Caché de cumpleaños actualizado', CONSOLE_GREEN);
        return birthdays;
    },

    getBanned: () => banned,
    updateBanned: async () => {
        const banSchema = require('../models/ban-schema');
        const results = await banSchema.find({});
        banned = {};
        results.forEach(element => banned[element._id] = {
            reason: element.reason,
            responsible: element.responsibleId,
            user: element.tag,
            character: element.character
        });
        consoleLog('> Caché de baneados actualizado', CONSOLE_GREEN);
        return banned;
    },

    getSombraBans: () => sombraBans,
    updateSombraBans: async () => {
        const sombraBanSchema = require('../models/sombraBan-schema');
        const results = await sombraBanSchema.find({});
        sombraBans = [];
        results.forEach(element => {
            sombraBans.push(element.reason);
        });
        consoleLog('> Caché de baneos de Sombra actualizado', CONSOLE_GREEN);
        return sombraBans;
    },

    getBillboardMessageInfo: () => billboardMessageInfo,
    updateBillboardMessageInfo: async () => {
        const result = await collectorMessageSchema.findById('billboard_message');
        billboardMessageInfo = {
            isActive: result.isActive,
            messageId: result.messageId
        };
        consoleLog('> Caché de recolector de reacciones actualizado', CONSOLE_GREEN);
        return billboardMessageInfo;
    },

    getRolesMessageInfo: () => rolesMessageInfo,
    updateRolesMessageInfo: async () => {
        const result = await collectorMessageSchema.findById('roles_message');
        rolesMessageInfo = {
            messageId: result.messageId,
            channelId: result.channelId
        };
        consoleLog('> Caché de mensaje de roles actualizado', CONSOLE_GREEN);
        return rolesMessageInfo;
    },

    getIcon: () => icon,
    updateIcon: async () => {
        const result = await iconSchema.findById(1, 'name');
        icon = result.name;
        consoleLog('> Caché de ícono actualizado', CONSOLE_GREEN);
        return icon;
    },

    getMode: () => mode,
    updateMode: async () => {
        const result = await iconSchema.findById(1, 'mode');
        mode = result.mode;
        consoleLog('> Caché de modo actualizado', CONSOLE_GREEN);
        return mode;
    },

    getLastAction: () => lastAction,
    updateLastAction: (action, user) => lastAction = { action: action, user: user },

    getPlaylists: () => playlists,
    updatePlaylists: async () => {
        const playlistSchema = require('../models/playlist-schema');
        const results = await playlistSchema.find({}).sort({ _id: 'asc' });
        playlists = {};
        results.forEach(pl => playlists[pl._id] = { url: pl.url, ownerId: pl.ownerId });
        consoleLog('> Caché de playlists actualizado', CONSOLE_GREEN);
        return playlists;
    },

    /**
     *  Gets the stats data stored in cache.
     * 
     * @returns All cached stats data.
     */
    getStats: async () => stats || await updateStats(),
    updateStats,

    /**
     * Gets the timestamps stored in cache.
     * 
     * @returns All cached timestamps.
     */
    getTimestamps: () => timestamps,

    /**
     * Adds a timestamp of a user to the cache.
     * 
     * @param {String} id The ID of the user.
     * @param {Date} timestamp The timestamp to be added.
     */
    addTimestamp: (id, timestamp) => {
        logToFile(`${MODULE_NAME}.addTimestamp`, `${!timestamps[id] ? 'Adding' : 'Restarting'} timestamp of user with ID ${id}`);
        timestamps[id] = timestamp;
    },

    /**
     * Removes the last timestamp of a user from the cache.
     * 
     * @param {String} id The ID of the user.
     */
    removeTimestamp: id => {
        logToFile(`${MODULE_NAME}.removeTimestamp`, `Removing timestamp of user with ID ${id}`);
        delete timestamps[id];
    },

    getThermalPasteDates: () => thermalPasteDates,
    updateThermalPasteDates: async () => {
        const thermalPasteDateSchema = require('../models/thermalPasteDate-schema');
        const results = await thermalPasteDateSchema.find({});
        thermalPasteDates = {};
        results.forEach(element => thermalPasteDates[element._id] = element.date);
        consoleLog('> Caché de fechas de cambio de pasta térmica actualizado', CONSOLE_GREEN);
        return thermalPasteDates;
    },

    getBansResponsibles: () => bansResponsibles,
    addBanResponsible: (id, responsible) => (bansResponsibles[id] = responsible),
    removeBanResponsible: id => (delete bansResponsibles[id]),

    /**
     * Gets the crosshairs data stored in cache.
     * 
     * @returns All cached crosshairs data.
     */
    getCrosshairs: async () => crosshairs || await updateCrosshairs(),
    updateCrosshairs,

    getSmurfs: () => smurfs,
    updateSmurfs: async () => {
        const smurfSchema = require('../models/smurf-schema');
        const results = await smurfSchema.find({});
        smurfs = {};
        results.forEach(account => smurfs[account._id] = {
            name: account.name,
            user: account.user,
            password: account.password,
            vip: account.vip,
            bannedUntil: account.bannedUntil
        });
        consoleLog('> Caché de smurfs actualizado', CONSOLE_GREEN);
        return smurfs;
    },

    getTracksNameExtras: () => tracksNameExtras,
    updateTracksNameExtras: async () => {
        await fetch(await getGithubRawUrl(`tracksNameExtras.json`))
            .then(res => res.text()).then(data => {
                tracksNameExtras = JSON.parse(data);
                consoleLog('> tracksNameExtras.json cargado', CONSOLE_GREEN);
            }).catch(err => consoleLog(`> Error al cargar tracksNameExtras.json\n${err.stack}`, CONSOLE_RED));
        return tracksNameExtras;
    },

    //TEMP SOLUTION
    /**
     * Gets the blacklisted songs data stored in cache.
     * 
     * @returns All cached blacklisted songs data.
     */
    getBlacklistedSongs: async () => blacklistedSongs || await updateBlacklistedSongs(),
    updateBlacklistedSongs,
    //

    /**
     * Gets the IDs data stored in cache.
     * 
     * @returns All cached IDs data.
     */
    getIds: async () => ids || await updateIds(),
    updateIds,

    /**
     * Gets the Kru completed/upcoming matches data stored in cache.
     * 
     * @param {"completed" | "upcoming"} type The type of matches wanted.
     * @returns All cached Kru completed/upcoming matches data.
     */
    getKruMatches: async type => kruMatches[type] || await updateKruMatches(type),
    updateKruMatches,

    getReminders: () => reminders,
    updateReminders: async () => {
        const reminderSchema = require('../models/reminder-schema');
        reminders = await reminderSchema.find({});
        consoleLog('> Caché de recordatorios actualizado', CONSOLE_GREEN);
        return reminders;
    },

    getCharacters: () => characters,
    updateCharacters: async () => {
        const data = await retrieveDataFromFile(`characters.json`);

        if (data)
            characters = data;

        return characters;
    },

    getSongsInQueue: () => songsInQueue,
    addSongInQueue: (url, messageType, object) => {
        songsInQueue[url] = {};
        const newKey = songsInQueue[url];
        newKey[messageType] = object;
    },
    removeSongInQueue: url => delete songsInQueue[url],

    getMusicPlayerData: key => musicPlayerData[key],
    setMusicPlayerData: (key, message, collector, page) => musicPlayerData[key] = { collector: collector, message: message, page: page },
    clearMusicPlayerData: key => delete musicPlayerData[key],
    updatePage: (key, page) => musicPlayerData[key].page = page,

    getFWCData: () => fwcData,

    updateFWCData: async () => {
        const data = await retrieveDataFromFile(`fwc-2022.json`);

        if (data)
            fwcData = data;

        return fwcData;
    },

    /**
     * Gets the currencies data stored in cache.
     * 
     * @returns All cached currencies data.
     */
    getCurrencies: () => currencies
};
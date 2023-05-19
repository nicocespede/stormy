const { IDsData, StatsData, TimestampsData } = require("./typedefs");
const { GITHUB_RAW_URL, DEV_ENV, LOCAL_ENV, CONSOLE_GREEN, CONSOLE_RED } = require('./constants');
const { convertTime, consoleLog, logToFile, logToFileError } = require('./util');
const fetch = require('node-fetch');
const SteamAPI = require('steamapi');
const steam = new SteamAPI(process.env.STEAM_API_KEY);
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const collectorMessageSchema = require('../models/collectorMessage-schema');
const iconSchema = require('../models/icon-schema');

const MODULE_NAME = 'src.cache';

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
var crosshairs;
var smurfs;
var tracksNameExtras;
//TEMP SOLUTION
var blacklistedSongs;//
var kruMatches;
let reminders;
let characters;
let songsInQueue = {};
let musicPlayerData = {};
let fwcData;

/** @type {IDsData}*/
let ids;
/** @type {StatsData}*/
let stats;
/** @type {TimestampsData}*/
const timestamps = {};

const getChronology = id => chronologies[id];

const updateChronology = async id => {
    try {
        let data;
        if (LOCAL_ENV)
            data = fs.readFileSync(`../stormy-data/chronologies/${id}.json`, 'utf8');
        else {
            const res = await fetch(`${GITHUB_RAW_URL}/chronologies/${id}.json`);
            data = await res.text();
        }
        chronologies[id] = JSON.parse(data);
        consoleLog(`> chronologies/${id}.json cargado`, CONSOLE_GREEN);
    } catch (err) {
        consoleLog(`> Error al cargar chronologies/${id}.json\n${err.stack}`, CONSOLE_RED);
    }
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

/**
 * Retrieves the IDs data from the ids.json file.
 * 
 * @returns All cached IDs data.
 */
const updateIds = async () => {
    const fileName = !DEV_ENV ? 'ids.json' : 'testingIds.json';
    try {
        let data;
        if (LOCAL_ENV)
            data = fs.readFileSync(`../stormy-data/${fileName}`, 'utf8');
        else {
            const res = await fetch(`${GITHUB_RAW_URL}/${fileName}`);
            data = await res.text();
        }
        ids = JSON.parse(data);
        consoleLog(`> ${fileName} cargado`, CONSOLE_GREEN);
    } catch (err) {
        consoleLog(`> Error al cargar ${fileName}\n${err.stack}`, CONSOLE_RED);
    }
    return ids;
};

module.exports = {
    timeouts: {},

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
        try {
            let data;
            if (LOCAL_ENV)
                data = fs.readFileSync(`../stormy-data/downloads/${id}.json`, 'utf8');
            else {
                const res = await fetch(`${GITHUB_RAW_URL}/downloads/${id}.json`);
                data = await res.text();
            }
            downloadsData[id] = JSON.parse(data);
            consoleLog(`> downloads/${id}.json cargado`, CONSOLE_GREEN);
        } catch (err) {
            consoleLog(`> Error al cargar downloads/${id}.json\n${err.stack}`, CONSOLE_RED);
        }
        return downloadsData[id];
    },

    getGames: () => games,
    updateGames: async () => {
        try {
            let data;
            if (LOCAL_ENV)
                data = fs.readFileSync('../stormy-data/downloads/games.json', 'utf8');
            else {
                const res = await fetch(`${GITHUB_RAW_URL}/downloads/games.json`);
                data = await res.text();
            }
            consoleLog('> games.json cargado', CONSOLE_GREEN);
            games = [];
            const parsed = JSON.parse(data);
            for (const key in parsed) if (Object.hasOwnProperty.call(parsed, key))
                for (const game of parsed[key]) {
                    if (key === 'steam') {
                        const data = await steam.getGameDetails(game.id).catch(console.error);
                        game.name = data.name;
                        game.year = data.release_date.date.split(',').pop().trim();
                        game.imageURL = data.header_image;
                    }
                    game.platform = key;
                    games.push(game);
                }
        } catch (err) {
            consoleLog(`> Error al cargar games.json\n${err.stack}`, CONSOLE_RED);
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
    getStats: () => stats,

    /**
     * Retrieves the stats data from the database.
     * 
     * @returns All cached stats data.
     */
    updateStats: async () => {
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
    },

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

    getCrosshairs: () => crosshairs,
    updateCrosshairs: async () => {
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
    },

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
        await fetch(`${GITHUB_RAW_URL}/tracksNameExtras.json`)
            .then(res => res.text()).then(data => {
                tracksNameExtras = JSON.parse(data);
                consoleLog('> tracksNameExtras.json cargado', CONSOLE_GREEN);
            }).catch(err => consoleLog(`> Error al cargar tracksNameExtras.json\n${err.stack}`, CONSOLE_RED));
        return tracksNameExtras;
    },

    //TEMP SOLUTION
    getBlacklistedSongs: () => blacklistedSongs,
    updateBlacklistedSongs: async () => {
        await fetch(`${GITHUB_RAW_URL}/blacklistedTracks.json`)
            .then(res => res.text()).then(data => {
                blacklistedSongs = JSON.parse(data);
                consoleLog('> blacklistedTracks.json cargado', CONSOLE_GREEN);
            }).catch(err => consoleLog(`> Error al cargar blacklistedTracks.json\n${err.stack}`, CONSOLE_RED));
        return blacklistedSongs;
    },//

    /**
     * Gets the IDs data stored in cache.
     * 
     * @returns All cached IDs data.
     */
    getIds: async () => ids || await updateIds(),

    updateIds,

    getKruMatches: () => kruMatches,
    updateKruMatches: async () => {
        const urlBase = 'https://www.vlr.gg';
        const url = urlBase + '/team/matches/2355/kr-esports/?group=upcoming';
        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            const a = $('.wf-card.fc-flex.m-item');
            const matches = [];
            a.each((_, el) => {
                const split = $(el).children('.m-item-date').text().trim().split(`\t`);
                const date = new Date(`${split.shift().replace(/\//g, '-')}T${convertTime(split.pop())}Z`);
                date.setHours(date.getHours() - 2);
                let remaining = $(el).children('.m-item-result.mod-tbd.fc-flex').children(':first').text().replace('w', 's').replace('mo', 'me');
                if (!remaining || remaining === '')
                    remaining = 'En vivo';
                const match = {
                    date,
                    remaining,
                    url: urlBase + el.attribs['href']
                };
                const teams = $(el).children('.m-item-team.text-of');
                teams.each((i, team) => {
                    const names = $(team).children().get();
                    const name = $(names[0]).text().trim();
                    match[`team${i + 1}Name`] = name !== 'TBD' ? name : 'A determinar';
                    match[`team${i + 1}Tag`] = name !== 'TBD' ? $(names[1]).text().trim() : name;
                });
                matches.push(match);
            });
            kruMatches = matches;
        } catch (e) {
            if (!kruMatches)
                kruMatches = [];
            consoleLog(`> Error al obtener información de partidos programados de KRÜ`, CONSOLE_RED);
            logToFileError(`${MODULE_NAME}.updateKruMatches`, e);
        }
        return kruMatches;
    },

    getReminders: () => reminders,
    updateReminders: async () => {
        const reminderSchema = require('../models/reminder-schema');
        reminders = await reminderSchema.find({});
        consoleLog('> Caché de recordatorios actualizado', CONSOLE_GREEN);
        return reminders;
    },

    getCharacters: () => characters,
    updateCharacters: async () => {
        try {
            let data;
            if (LOCAL_ENV)
                data = fs.readFileSync('../stormy-data/characters.json', 'utf8');
            else {
                const res = await fetch(`${GITHUB_RAW_URL}/characters.json`);
                data = await res.text();
            }
            characters = JSON.parse(data);
            consoleLog('> characters.json cargado', CONSOLE_GREEN);
        } catch (err) {
            consoleLog(`> Error al cargar characters.json\n${err.stack}`, CONSOLE_RED);
        }
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
        try {
            let data;
            if (LOCAL_ENV)
                data = fs.readFileSync(`../stormy-data/fwc-2022.json`, 'utf8');
            else {
                const res = await fetch(`${GITHUB_RAW_URL}/fwc-2022.json`);
                data = await res.text();
            }
            fwcData = JSON.parse(data);
            consoleLog(`> fwc-2022.json cargado`, CONSOLE_GREEN);
        } catch (err) {
            consoleLog(`> Error al cargar fwc-2022.json\n${err.stack}`, CONSOLE_RED);
        }
        return fwcData;
    }
};
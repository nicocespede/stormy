const { GITHUB_RAW_URL, DEV_ENV, LOCAL_ENV } = require('./constants');
const { convertTime, log } = require('./util');
const fetch = require('node-fetch');
const SteamAPI = require('steamapi');
const steam = new SteamAPI(process.env.STEAM_API_KEY);
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const collectorMessageSchema = require('../models/collectorMessage-schema');
const iconSchema = require('../models/icon-schema');

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
var stats;
var timestamps = {};
var thermalPasteDates;
var bansResponsibles = {};
var crosshairs;
var smurfs;
var tracksNameExtras;
//TEMP SOLUTION
var blacklistedSongs;//
var ids;
var kruMatches;
let reminders;
let characters;
let songsInQueue = {};
let musicPlayerData = {};
let fwcData;

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
        log(`> chronologies/${id}.json cargado`, 'green');
    } catch (err) {
        log(`> Error al cargar chronologies/${id}.json\n${err.stack}`, 'red');
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
            log(`> Filtros de '${id}' agregados a la base de datos`, 'green');
            filters[id] = { filters: ['all'] };
        }
        log(`> Caché de filtros de '${id}' actualizado`, 'green');
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

        log(`> Caché de '${id}' actualizado`, 'green');
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
            log(`> downloads/${id}.json cargado`, 'green');
        } catch (err) {
            log(`> Error al cargar downloads/${id}.json\n${err.stack}`, 'red');
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
            log('> games.json cargado', 'green');
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
            log(`> Error al cargar games.json\n${err.stack}`, 'red');
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
        log('> Caché de cumpleaños actualizado', 'green');
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
        log('> Caché de baneados actualizado', 'green');
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
        log('> Caché de baneos de Sombra actualizado', 'green');
        return sombraBans;
    },

    getBillboardMessageInfo: () => billboardMessageInfo,
    updateBillboardMessageInfo: async () => {
        const result = await collectorMessageSchema.findById('billboard_message');
        billboardMessageInfo = {
            isActive: result.isActive,
            messageId: result.messageId
        };
        log('> Caché de recolector de reacciones actualizado', 'green');
        return billboardMessageInfo;
    },

    getRolesMessageInfo: () => rolesMessageInfo,
    updateRolesMessageInfo: async () => {
        const result = await collectorMessageSchema.findById('roles_message');
        rolesMessageInfo = {
            messageId: result.messageId,
            channelId: result.channelId
        };
        log('> Caché de mensaje de roles actualizado', 'green');
        return rolesMessageInfo;
    },

    getIcon: () => icon,
    updateIcon: async () => {
        const result = await iconSchema.findById(1, 'name');
        icon = result.name;
        log('> Caché de ícono actualizado', 'green');
        return icon;
    },

    getMode: () => mode,
    updateMode: async () => {
        const result = await iconSchema.findById(1, 'mode');
        mode = result.mode;
        log('> Caché de modo actualizado', 'green');
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
        log('> Caché de playlists actualizado', 'green');
        return playlists;
    },

    getStats: () => stats,
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
        log('> Caché de estadísticas actualizado', 'green');
        return stats;
    },
    getTimestamps: () => timestamps,
    addTimestamp: (id, timestamp) => (timestamps[id] = timestamp),
    removeTimestamp: id => (delete timestamps[id]),

    getThermalPasteDates: () => thermalPasteDates,
    updateThermalPasteDates: async () => {
        const thermalPasteDateSchema = require('../models/thermalPasteDate-schema');
        const results = await thermalPasteDateSchema.find({});
        thermalPasteDates = {};
        results.forEach(element => thermalPasteDates[element._id] = element.date);
        log('> Caché de fechas de cambio de pasta térmica actualizado', 'green');
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
        log('> Caché de miras actualizado', 'green');
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
        log('> Caché de smurfs actualizado', 'green');
        return smurfs;
    },

    getTracksNameExtras: () => tracksNameExtras,
    updateTracksNameExtras: async () => {
        await fetch(`${GITHUB_RAW_URL}/tracksNameExtras.json`)
            .then(res => res.text()).then(data => {
                tracksNameExtras = JSON.parse(data);
                log('> tracksNameExtras.json cargado', 'green');
            }).catch(err => log(`> Error al cargar tracksNameExtras.json\n${err.stack}`, 'red'));
        return tracksNameExtras;
    },

    //TEMP SOLUTION
    getBlacklistedSongs: () => blacklistedSongs,
    updateBlacklistedSongs: async () => {
        await fetch(`${GITHUB_RAW_URL}/blacklistedTracks.json`)
            .then(res => res.text()).then(data => {
                blacklistedSongs = JSON.parse(data);
                log('> blacklistedTracks.json cargado', 'green');
            }).catch(err => log(`> Error al cargar blacklistedTracks.json\n${err.stack}`, 'red'));
        return blacklistedSongs;
    },//

    getIds: () => ids,
    updateIds: async () => {
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
            log(`> ${fileName} cargado`, 'green');
        } catch (err) {
            log(`> Error al cargar ${fileName}\n${err.stack}`, 'red')
        }
        return ids;
    },

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
            log(`> Error al obtener información de partidos programados de KRÜ\n${e.stack}`, 'red');
        }
        return kruMatches;
    },

    getReminders: () => reminders,
    updateReminders: async () => {
        const reminderSchema = require('../models/reminder-schema');
        reminders = await reminderSchema.find({});
        log('> Caché de recordatorios actualizado', 'green');
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
            log('> characters.json cargado', 'green');
        } catch (err) {
            log(`> Error al cargar characters.json\n${err.stack}`, 'red');
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
            log(`> fwc-2022.json cargado`, 'green');
        } catch (err) {
            log(`> Error al cargar fwc-2022.json\n${err.stack}`, 'red');
        }
        return fwcData;
    }
};
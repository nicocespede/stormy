const { githubRawURL, testing, color } = require('./constants');
const fetch = require('node-fetch');
const SteamAPI = require('steamapi');
const steam = new SteamAPI(process.env.STEAM_API_KEY);
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const chalk = require('chalk');
chalk.level = 1;
const collectorMessageSchema = require('../models/collectorMessage-schema');

var mcu;
var mcuMovies;
var filters;
var games;
var birthdays;
let banned;
var sombraBans;
let billboardMessageInfo;
var rolesMessageInfo;
var anniversaries;
let icon;
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

const getMcu = () => mcu;

const updateMcu = async () => {
    try {
        let data;
        if (testing)
            data = fs.readFileSync('../stormy-data/mcu.json', 'utf8');
        else {
            const res = await fetch(`${githubRawURL}/mcu.json`);
            data = await res.text();
        }
        mcu = JSON.parse(data);
        console.log(chalk.green('> mcu.json cargado'));
    } catch (err) {
        console.log(chalk.red(`> Error al cargar mcu.json\n${err}`));
    }
    return mcu;
};

module.exports = {
    timeouts: {},

    getMcu,
    updateMcu,

    getFilters: () => filters,
    updateFilters: async () => {
        const mcuFiltersSchema = require('../models/mcuFilters-schema');
        const result = await mcuFiltersSchema.findById(1, 'filters');
        filters = result.filters;
        console.log(chalk.green('> Caché de filtros actualizado'));
        return filters;
    },

    getMcuMovies: () => mcuMovies,
    updateMcuMovies: async (filters) => {
        const mcu = getMcu() || await updateMcu();
        mcuMovies = filters.includes('all') ? mcu : mcu.filter(movie => filters.includes(movie.type));
        console.log(chalk.green('> Caché de UCM actualizado'));
        return mcuMovies;
    },

    getGames: () => games,
    updateGames: async () => {
        try {
            let data;
            if (testing)
                data = fs.readFileSync('../stormy-data/games.json', 'utf8');
            else {
                const res = await fetch(`${githubRawURL}/games.json`);
                data = await res.text();
            }
            console.log(chalk.green('> games.json cargado'));
            games = [];
            const parsed = JSON.parse(data);
            for (const key in parsed) if (Object.hasOwnProperty.call(parsed, key)) {
                const element = parsed[key];
                if (key === 'steam') {
                    const embedData = { color: color, thumb: `${githubRawURL}/assets/thumbs/games/steam.png` };
                    for (const game of element)
                        await steam.getGameDetails(game.id).then(data => {
                            games.push({
                                id: game.id,
                                name: data.name,
                                year: data.release_date.date.split(',').pop().trim(),
                                version: game.version,
                                lastUpdate: game.lastUpdate,
                                imageURL: data.header_image,
                                instructions: game.instructions,
                                links: game.links,
                                embedData: embedData
                            });
                        }).catch(console.error);
                } else {
                    const embedData = { color: color, thumb: `${githubRawURL}/assets/thumbs/games/control.png` };
                    element.embedData = embedData;
                    games.concat(element);
                }
            }
        } catch (err) {
            console.log(chalk.red(`> Error al cargar games.json\n${err}`));
        }
        return games.sort((a, b) => a.name.localeCompare(b.name));
    },

    getBirthdays: () => birthdays,
    updateBirthdays: async () => {
        const birthdaySchema = require('../models/birthday-schema');
        const results = await birthdaySchema.find({}).sort({ month: 'asc', day: 'asc' });
        birthdays = {};
        results.forEach(element => {
            birthdays[element._id] = {
                day: element.day,
                month: element.month,
                flag: element.flag,
                user: element.username
            };
        });
        console.log(chalk.green('> Caché de cumpleaños actualizado'));
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
        console.log(chalk.green('> Caché de baneados actualizado'));
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
        console.log(chalk.green('> Caché de baneos de Sombra actualizado'));
        return sombraBans;
    },

    getBillboardMessageInfo: () => billboardMessageInfo,
    updateBillboardMessageInfo: async () => {
        const result = await collectorMessageSchema.findById('billboard_message');
        billboardMessageInfo = {
            isActive: result.isActive,
            messageId: result.messageId
        };
        console.log(chalk.green('> Caché de recolector de reacciones actualizado'));
        return billboardMessageInfo;
    },

    getRolesMessageInfo: () => rolesMessageInfo,
    updateRolesMessageInfo: async () => {
        const result = await collectorMessageSchema.findById('roles_message');
        rolesMessageInfo = {
            messageId: result.messageId,
            channelId: result.channelId
        };
        console.log(chalk.green('> Caché de mensaje de roles actualizado'));
        return rolesMessageInfo;
    },

    getAnniversaries: () => anniversaries,
    updateAnniversaries: async () => {
        const anniversarySchema = require('../models/anniversary-schema');
        anniversaries = await anniversarySchema.find({});
        console.log(chalk.green('> Caché de aniversarios actualizado'));
        return anniversaries;
    },

    getIcon: () => icon,
    updateIcon: async () => {
        const iconSchema = require('../models/icon-schema');
        const result = await iconSchema.findById(1, 'name');
        icon = result.name;
        console.log(chalk.green('> Caché de ícono actualizado'));
        return icon;
    },

    getLastAction: () => lastAction,
    updateLastAction: (action, user) => lastAction = { action: action, user: user },

    getPlaylists: () => playlists,
    updatePlaylists: async () => {
        const playlistSchema = require('../models/playlist-schema');
        const results = await playlistSchema.find({}).sort({ _id: 'asc' });
        playlists = {};
        results.forEach(pl => playlists[pl._id] = { url: pl.url, ownerId: pl.ownerId });
        console.log(chalk.green('> Caché de playlists actualizado'));
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
        console.log(chalk.green('> Caché de estadísticas actualizado'));
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
        console.log(chalk.green('> Caché de fechas de cambio de pasta térmica actualizado'));
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
        console.log(chalk.green('> Caché de miras actualizado'));
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
        console.log(chalk.green('> Caché de smurfs actualizado'));
        return smurfs;
    },

    getTracksNameExtras: () => tracksNameExtras,
    updateTracksNameExtras: async () => {
        await fetch(`${githubRawURL}/tracksNameExtras.json`)
            .then(res => res.text()).then(data => {
                tracksNameExtras = JSON.parse(data);
                console.log(chalk.green('> tracksNameExtras.json cargado'));
            }).catch(err => console.log(chalk.red(`> Error al cargar tracksNameExtras.json\n${err}`)));
        return tracksNameExtras;
    },

    //TEMP SOLUTION
    getBlacklistedSongs: () => blacklistedSongs,
    updateBlacklistedSongs: async () => {
        await fetch(`${githubRawURL}/blacklistedTracks.json`)
            .then(res => res.text()).then(data => {
                blacklistedSongs = JSON.parse(data);
                console.log(chalk.green('> blacklistedTracks.json cargado'));
            }).catch(err => console.log(chalk.red(`> Error al cargar blacklistedTracks.json\n${err}`)));
        return blacklistedSongs;
    },//

    getIds: () => ids,
    updateIds: async () => {
        const fileName = !testing ? 'ids.json' : 'testingIds.json';
        try {
            let data;
            if (testing)
                data = fs.readFileSync(`../stormy-data/${fileName}`, 'utf8');
            else {
                const res = await fetch(`${githubRawURL}/${fileName}`);
                data = await res.text();
            }
            ids = JSON.parse(data);
            console.log(chalk.green(`> ${fileName} cargado`));
        } catch (err) {
            console.log(chalk.red(`> Error al cargar ${fileName}\n${err}`))
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
            kruMatches = matches;
            console.log(chalk.green("> Caché de partidos programados de KRÜ actualizado"));
        } catch (e) {
            if (!kruMatches)
                kruMatches = [];
            console.log(chalk.red(`> Error al obtener información de partidos programados de KRÜ\n${e}`));
        }
        return kruMatches;
    },

    getReminders: () => reminders,
    updateReminders: async () => {
        const reminderSchema = require('../models/reminder-schema');
        reminders = await reminderSchema.find({});
        console.log(chalk.green('> Caché de recordatorios actualizado'));
        return reminders;
    },

    getCharacters: () => characters,
    updateCharacters: async () => {
        try {
            let data;
            if (testing)
                data = fs.readFileSync('../stormy-data/characters.json', 'utf8');
            else {
                const res = await fetch(`${githubRawURL}/characters.json`);
                data = await res.text();
            }
            characters = JSON.parse(data);
            console.log(chalk.green('> characters.json cargado'));
        } catch (err) {
            console.log(chalk.red(`> Error al cargar characters.json\n${err}`));
        }
        return characters;
    },

    getSongsInQueue: () => songsInQueue,
    addSongInQueue: (url, messageType, object) => {
        songsInQueue[url] = {};
        const newKey = songsInQueue[url];
        newKey[messageType] = object;
    },
    removeSongInQueue: url => (delete songsInQueue[url]),

    getMusicPlayerData: key => musicPlayerData[key],
    setMusicPlayerData: (key, message, collector, page) => musicPlayerData[key] = { collector: collector, message: message, page: page },
    clearMusicPlayerData: key => delete musicPlayerData[key],
    updatePage: (key, page) => musicPlayerData[key].page = page
};
const { githubRawURL, testing } = require('./constants');
const fetch = require('node-fetch');
const SteamAPI = require('steamapi');
const steam = new SteamAPI(process.env.STEAM_API_KEY);
const axios = require('axios');
const cheerio = require('cheerio');
const chalk = require('chalk');
chalk.level = 1;
const collectorMessageSchema = require('../models/collectorMessage-schema');

var mcu;
var mcuMovies;
var filters;
var games;
var birthdays;
var banned = {};
var sombraBans;
var reactionCollectorInfo;
var rolesMessageInfo;
var anniversaries;
var avatar;
var lastAction;
var playlists = { names: [], urls: [] };
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

const getMcu = () => mcu;

const updateMcu = async () => {
    await fetch(`${githubRawURL}/mcu.json`)
        .then(res => res.text()).then(data => {
            mcu = JSON.parse(data);
            console.log(chalk.green('> mcu.json cargado'));
        }).catch(err => console.log(chalk.red(`> Error al cargar mcu.json\n${err}`)));
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
        const mcu = !getMcu() ? await updateMcu() : getMcu();
        if (filters.includes('all'))
            mcuMovies = mcu;
        else {
            var newArray = [];
            mcu.forEach(movie => {
                if (filters.includes(movie.type))
                    newArray.push(movie);
            });
            mcuMovies = newArray;
        }
        console.log(chalk.green('> Caché de UCM actualizado'));
        return mcuMovies;
    },

    getGames: () => games,
    updateGames: async () => {
        await fetch(`${githubRawURL}/games.json`).then(res => res.text()).then(async data => {
            games = [];
            const parsed = JSON.parse(data);
            for (const key in parsed)
                if (Object.hasOwnProperty.call(parsed, key)) {
                    const element = parsed[key];
                    if (key === 'steam') {
                        const embedData = { color: [18, 43, 94], thumb: `${githubRawURL}/assets/thumbs/games/steam.png` };
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
                                    embedData: embedData
                                });
                            }).catch(console.error);
                    } else {
                        const embedData = { color: [234, 61, 78], thumb: `${githubRawURL}/assets/thumbs/games/games.png` };
                        element.embedData = embedData;
                        games.concat(element);
                    }
                }
            console.log(chalk.green('> games.json cargado'));
        }).catch(err => console.log(chalk.red(`> Error al cargar games.json\n${err}`)));
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
        banned.bans = {};
        banned.ids = [];
        results.forEach(element => {
            banned.ids.push(element._id);
            banned.bans[element._id] = {
                reason: element.reason,
                responsible: element.responsibleId,
                user: element.tag
            };
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

    getReactionCollectorInfo: () => reactionCollectorInfo,
    updateReactionCollectorInfo: async () => {
        const result = await collectorMessageSchema.findById('billboard_message');
        reactionCollectorInfo = {
            isActive: result.isActive,
            messageId: result.messageId
        };
        console.log(chalk.green('> Caché de recolector de reacciones actualizado'));
        return reactionCollectorInfo;
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
        const results = await anniversarySchema.find({});
        anniversaries = results;
        console.log(chalk.green('> Caché de aniversarios actualizado'));
        return anniversaries;
    },

    getAvatar: () => avatar,
    updateAvatar: async () => {
        const avatarSchema = require('../models/avatar-schema');
        const result = await avatarSchema.findById(1, 'url');
        avatar = result.url;
        console.log(chalk.green('> Caché de avatar actualizado'));
        return avatar;
    },

    getLastAction: () => lastAction,
    updateLastAction: (action) => (lastAction = action),

    getPlaylists: () => playlists,
    updatePlaylists: async () => {
        const newNames = [];
        const newUrls = [];
        const playlistSchema = require('../models/playlist-schema');
        const results = await playlistSchema.find({});
        results.forEach(pl => {
            newNames.push(pl._id);
            newUrls.push(pl.url);
        });
        playlists.names = newNames;
        playlists.urls = newUrls;
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
        await fetch(`${githubRawURL}/${fileName}`)
            .then(res => res.text()).then(data => {
                ids = JSON.parse(data);
                console.log(chalk.green(`> ${fileName} cargado`));
            }).catch(err => console.log(chalk.red(`> Error al cargar ${fileName}\n${err}`)));
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
        await fetch(`${githubRawURL}/characters.json`).then(res => res.text()).then(data => {
            characters = JSON.parse(data);
            console.log(chalk.green('> characters.json cargado'));
        }).catch(err => console.log(chalk.red(`> Error al cargar characters.json\n${err}`)));
        return characters;
    }
};
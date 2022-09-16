const { githubRawURL } = require('./constants');
const fetch = require('node-fetch');
const collectorMessageSchema = require('../models/collectorMessage-schema');

var mcu;
var mcuMovies;
var filters;
var games;
var birthdays;
var banned = {};
var sombraBans;
var lastDateChecked;
var reactionCollectorInfo;
var rolesMessageInfo;
var anniversaries;
var avatar;
var lastAction;
var playlists = { names: [], urls: [] };
var stats;
var timestamps = {};
var minutesUp = 0;
var thermalPasteDates;
var bansResponsibles = {};
var crosshairs;
var smurfs;
var tracksNameExtras;
//TEMP SOLUTION
var blacklistedSongs;//

const getMcu = () => mcu;

const updateMcu = async () => {
    await fetch(`${githubRawURL}/mcu.json`)
        .then(res => res.text()).then(data => {
            mcu = JSON.parse(data);
            console.log('> mcu.json cargado');
        }).catch(err => console.log('> Error al cargar mcu.json', err));
    return mcu;
};

module.exports = {
    getMcu,
    updateMcu,

    getFilters: () => filters,
    updateFilters: async () => {
        const mcuFiltersSchema = require('../models/mcuFilters-schema');
        const result = await mcuFiltersSchema.findById(1, 'filters');
        filters = result.filters;
        console.log('> Caché de filtros actualizado');
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
        console.log('> Caché de UCM actualizado');
        return mcuMovies;
    },

    getGames: () => games,
    updateGames: async () => {
        await fetch(`${githubRawURL}/games.json`)
            .then(res => res.text()).then(async data => {
                const SteamAPI = require('steamapi');
                const steam = new SteamAPI(process.env.STEAM_API_KEY);
                games = [];
                const parsed = JSON.parse(data);
                for (const key in parsed)
                    if (Object.hasOwnProperty.call(parsed, key)) {
                        const element = parsed[key];
                        if (key === 'steam') {
                            for (const game of element)
                                await steam.getGameDetails(game.id).then(data => {
                                    games.push({
                                        id: game.id,
                                        name: `${data.name} (${data.release_date.date.split(',').pop().trim()})`,
                                        version: game.version,
                                        lastUpdate: game.lastUpdate,
                                        imageURL: data.header_image,
                                        instructions: game.instructions
                                    });
                                }).catch(console.error);
                        } else
                            games.concat(element);
                    }
                console.log('> games.json cargado');
            }).catch(err => console.log('> Error al cargar games.json', err));
        return games;
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
        console.log('> Caché de cumpleaños actualizado');
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
        console.log('> Caché de baneados actualizado');
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
        console.log('> Caché de baneos de Sombra actualizado');
        return sombraBans;
    },

    getLastDateChecked: () => lastDateChecked,
    updateLastDateChecked: (newDate) => (lastDateChecked = newDate),

    getReactionCollectorInfo: () => reactionCollectorInfo,
    updateReactionCollectorInfo: async () => {
        const result = await collectorMessageSchema.findById('billboard_message');
        reactionCollectorInfo = {
            isActive: result.isActive,
            messageId: result.messageId
        };
        console.log('> Caché de recolector de reacciones actualizado');
        return reactionCollectorInfo;
    },

    getRolesMessageInfo: () => rolesMessageInfo,
    updateRolesMessageInfo: async () => {
        const result = await collectorMessageSchema.findById('roles_message');
        rolesMessageInfo = {
            messageId: result.messageId,
            channelId: result.channelId
        };
        console.log('> Caché de mensaje de roles actualizado');
        return rolesMessageInfo;
    },

    getAnniversaries: () => anniversaries,
    updateAnniversaries: async () => {
        const anniversarySchema = require('../models/anniversary-schema');
        const results = await anniversarySchema.find({});
        anniversaries = results;
        console.log('> Caché de aniversarios actualizado');
        return anniversaries;
    },

    getAvatar: () => avatar,
    updateAvatar: async () => {
        const avatarSchema = require('../models/avatar-schema');
        const result = await avatarSchema.findById(1, 'url');
        avatar = result.url;
        console.log('> Caché de avatar actualizado');
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
        console.log('> Caché de playlists actualizado');
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
        console.log('> Caché de estadísticas actualizado');
        return stats;
    },
    getTimestamps: () => timestamps,
    addTimestamp: (id, timestamp) => (timestamps[id] = timestamp),
    removeTimestamp: id => (delete timestamps[id]),

    getMinutesUp: () => minutesUp,
    addMinuteUp: () => minutesUp++,

    getThermalPasteDates: () => thermalPasteDates,
    updateThermalPasteDates: async () => {
        const thermalPasteDateSchema = require('../models/thermalPasteDate-schema');
        const results = await thermalPasteDateSchema.find({});
        thermalPasteDates = {};
        results.forEach(element => thermalPasteDates[element._id] = element.date);
        console.log('> Caché de fechas de cambio de pasta térmica actualizado');
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
            owner: ch.ownerId,
            imageUrl: ch.imageUrl
        });
        console.log('> Caché de miras actualizado');
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
        console.log('> Caché de smurfs actualizado');
        return smurfs;
    },

    getTracksNameExtras: () => tracksNameExtras,
    updateTracksNameExtras: async () => {
        await fetch(`${githubRawURL}/tracksNameExtras.json`)
            .then(res => res.text()).then(data => {
                tracksNameExtras = JSON.parse(data);
                console.log('> tracksNameExtras.json cargado');
            }).catch(err => console.log('> Error al cargar tracksNameExtras.json', err));
        return tracksNameExtras;
    },

    //TEMP SOLUTION
    getBlacklistedSongs: () => blacklistedSongs,
    updateBlacklistedSongs: async () => {
        await fetch(`${githubRawURL}/blacklistedTracks.json`)
            .then(res => res.text()).then(data => {
                blacklistedSongs = JSON.parse(data);
                console.log('> blacklistedTracks.json cargado');
            }).catch(err => console.log('> Error al cargar blacklistedTracks.json', err));
        return blacklistedSongs;
    }//
};
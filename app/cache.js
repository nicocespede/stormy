const { mcu } = require('./constants');
const { executeQuery } = require('./postgres');

var mcuMovies;
var filters;
var birthdays;
var banned;
var sombraBans;
var lastDateChecked;
var reactionCollectorInfo;
var anniversaries;
var avatar;
var lastAction;
var playlists = { names: [], urls: [] };
var stats;
var timestamps = {};
var minutesUp = 0;
var thermalPasteDates = {};

module.exports = {
    getFilters: () => filters,
    updateFilters: async () => {
        await executeQuery('SELECT * FROM "mcuFilters";').then(async json => {
            var aux = json[0]
            filters = aux['mcuFilters_filters'];
            console.log('> Caché de filtros actualizado');
        }).catch(console.error);
        return filters;
    },

    getMcuMovies: () => mcuMovies,
    updateMcuMovies: (filters) => {
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

    getBirthdays: () => birthdays,
    updateBirthdays: async () => {
        await executeQuery('SELECT * FROM "bdays" ORDER BY substring("bdays_date", 4, 5), substring("bdays_date", 1, 2);').then(async json => {
            birthdays = json;
            console.log('> Caché de cumpleaños actualizado');
        }).catch(console.error);
        return birthdays;
    },

    getBanned: () => banned,
    updateBanned: async () => {
        await executeQuery('SELECT * FROM "bans";').then(async json => {
            banned = json;
            console.log('> Caché de baneados actualizado');
        }).catch(console.error);
        return banned;
    },

    getSombraBans: () => sombraBans,
    updateSombraBans: async () => {
        await executeQuery('SELECT * FROM "sombraBans";').then(async json => {
            sombraBans = json;
            console.log('> Caché de baneos de Sombra actualizado');
        }).catch(console.error);
        return sombraBans;
    },

    getLastDateChecked: () => lastDateChecked,
    updateLastDateChecked: (newDate) => (lastDateChecked = newDate),

    getReactionCollectorInfo: () => reactionCollectorInfo,
    updateReactionCollectorInfo: async () => {
        await executeQuery('SELECT * FROM "collectorMessage";').then(async json => {
            reactionCollectorInfo = json;
            console.log('> Caché de recolector de reacciones actualizado');
        }).catch(console.error);
        return reactionCollectorInfo;
    },

    getAnniversaries: () => anniversaries,
    updateAnniversaries: async () => {
        await executeQuery('SELECT * FROM "anniversaries";').then(async json => {
            anniversaries = json;
            console.log('> Caché de aniversarios actualizado');
        }).catch(console.error);
        return anniversaries;
    },

    getAvatar: () => avatar,
    updateAvatar: async () => {
        await executeQuery(`SELECT * FROM "avatar";`).then(async json => {
            avatar = json;
            console.log('> Caché de avatar actualizado');
        }).catch(console.error);
        return avatar;
    },

    getLastAction: () => lastAction,
    updateLastAction: (action) => (lastAction = action),

    getPlaylists: () => playlists,
    updatePlaylists: async () => {
        await executeQuery('SELECT * FROM "playlists" ORDER BY "playlists_name";').then(async json => {
            var newNames = [];
            var newUrls = [];
            json.forEach(pl => {
                newNames.push(pl['playlists_name']);
                newUrls.push(pl['playlists_url']);
            });
            playlists.names = newNames;
            playlists.urls = newUrls;
            console.log('> Caché de playlists actualizado');
        }).catch(console.error);
        return playlists;
    },

    getStats: () => stats,
    updateStats: async () => {
        await executeQuery('SELECT * FROM "stats" ORDER BY "stats_days" DESC, "stats_hours" DESC, "stats_minutes" DESC, "stats_seconds" DESC;').then(json => {
            stats = json;
            console.log('> Caché de estadísticas actualizado');
        }).catch(console.error);
        return stats;
    },
    getTimestamps: () => timestamps,
    addTimestamp: (id, timestamp) => (timestamps[id] = timestamp),
    removeTimestamp: id => (delete timestamps[id]),

    getMinutesUp: () => minutesUp,
    addMinuteUp: () => minutesUp++,

    getThermalPasteDates: () => thermalPasteDates,
    updateThermalPasteDates: async () => {
        await executeQuery('SELECT * FROM "thermalPasteDates";').then(json => {
            json.forEach(element => {
                const id = element['tpd_id'];
                const date = element['tpd_date'];
                thermalPasteDates[id] = date;
            });
            console.log('> Caché de fechas de cambio de pasta térmica actualizado');
        }).catch(console.error);
        return thermalPasteDates;
    }
};
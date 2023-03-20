const banSchema = require('../models/ban-schema');
const birthdaySchema = require('../models/birthday-schema');
const crosshairSchema = require('../models/crosshair-schema');
const collectorMessageSchema = require('../models/collectorMessage-schema');
const iconSchema = require('../models/icon-schema');
const moviesAndGamesSchema = require('../models/moviesAndGames-schema');
const playlistSchema = require('../models/playlist-schema');
const smurfSchema = require('../models/smurf-schema');
const statSchema = require('../models/stat-schema');
const thermalPasteDateSchema = require('../models/thermalPasteDate-schema');
const collectorSchema = require('../models/collector-schema');
const { log } = require('./util');

module.exports = {
    updateAnniversary: async (id1, id2, date) => {
        const anniversarySchema = require('../models/anniversary-schema');
        await anniversarySchema.updateOne({ id1, id2 }, { date });
        log('> Aniversario actualizado en la base de datos', 'green');
    },

    updateIconString: async name => {
        await iconSchema.updateOne({ _id: 1 }, { name: name });
        log('> Ícono actualizado en la base de datos', 'green');
    },

    updateMode: async mode => {
        await iconSchema.updateOne({ _id: 1 }, { mode });
        log('> Modo actualizado en la base de datos', 'green');
    },

    addBan: async (id, tag, responsible, character, reason) => {
        await new banSchema({ _id: id, tag: tag, responsibleId: responsible, reason: reason, character: character }).save();
        log('> Ban agregado a la base de datos', 'green');
    },
    deleteBan: async id => {
        await banSchema.deleteOne({ _id: id });
        log('> Ban eliminado de la base de datos', 'yellow');
    },

    addBirthday: async (id, username, date) => {
        await new birthdaySchema({ _id: id, username, date }).save();
        log('> Cumpleaños agregado a la base de datos', 'green');
    },
    updateBirthday: async (id, date) => {
        await birthdaySchema.updateOne({ _id: id }, { date });
        log('> Cumpleaños actualizado en la base de datos', 'green');
    },
    deleteBirthday: async id => {
        await birthdaySchema.deleteOne({ _id: id });
        log('> Cumpleaños eliminado de la base de datos', 'yellow');
    },

    addCrosshair: async (name, code, owner) => {
        await new crosshairSchema({ name: name, code: code, ownerId: owner }).save();
        log('> Mira agregada a la base de datos', 'green');
    },
    deleteCrosshair: async id => {
        await crosshairSchema.deleteOne({ id: id });
        log('> Mira eliminada de la base de datos', 'yellow');
    },

    updateFilters: async (id, filters) => {
        const filtersSchema = require('../models/filters-schema');
        await filtersSchema.updateOne({ _id: id }, { filters });
        log(`> Filtros de '${id}' actualizados en la base de datos`, 'green');
    },

    updateChoices: async (id, choices) => {
        const filtersSchema = require('../models/filters-schema');
        await filtersSchema.updateOne({ _id: id }, { choices });
        log(`> Opciones de '${id}' actualizados en la base de datos`, 'green');
    },

    updateBillboardMessage: async (flag, id) => {
        await collectorMessageSchema.updateOne({ _id: 'billboard_message' }, { isActive: flag, messageId: id });
        log('> Mensaje de recolector actualizado en la base de datos', 'green');
    },

    updateRolesMessage: async (channelId, messageId) => {
        await collectorMessageSchema.updateOne({ _id: 'roles_message' }, { channelId: channelId, messageId: messageId });
        log('> Mensaje de roles actualizado en la base de datos', 'green');
    },

    updateMovies: async (id, movies) => {
        await moviesAndGamesSchema.updateOne({ _id: id }, { data: movies });
        log(`> Stock de '${id}' actualizado en la base de datos`, 'green');
    },

    updateGames: async games => {
        await moviesAndGamesSchema.updateOne({ _id: 'games' }, { data: games });
        log(`> Juegos actualizados en la base de datos`, 'green');
    },

    addPlaylist: async (name, url, ownerId) => {
        await new playlistSchema({ _id: name, url: url, ownerId: ownerId }).save();
        log('> Lista de reproducción agregada a la base de datos', 'green');
    },
    deletePlaylist: async name => {
        await playlistSchema.deleteOne({ _id: name });
        log('> Lista de reproducción eliminada de la base de datos', 'yellow');
    },

    addQueue: async (current, guildId, metadataId, previousTracks, tracks, voiceChannelId) => {
        const previousQueueSchema = require('../models/previousQueue-schema');
        await new previousQueueSchema({
            current: current,
            guildId: guildId,
            metadataId: metadataId,
            previousTracks: previousTracks,
            tracks: tracks,
            voiceChannelId: voiceChannelId
        }).save();
        log('> Cola interrumpida agregada a la base de datos', 'green');
    },

    addSmurf: async (command, name, user, password, vip) => {
        await new smurfSchema({ _id: command, name: name, user: user, password: password, vip: vip }).save();
        log('> Cuenta smurf agregada a la base de datos', 'green');
    },
    deleteSmurf: async command => {
        await smurfSchema.deleteOne({ _id: command });
        log('> Cuenta smurf eliminada de la base de datos', 'yellow');
    },
    updateSmurf: async (command, update) => {
        await smurfSchema.updateOne({ _id: command }, update);
        log(`> Cuenta smurf actualizada en la base de datos`, 'green');
    },

    addSombraBan: async reason => {
        const sombraBanSchema = require('../models/sombraBan-schema');
        await new sombraBanSchema({ reason: reason }).save();
        log('> Ban de Sombra agregado a la base de datos', 'green');
    },

    addStat: async id => {
        await new statSchema({ _id: id, days: 0, hours: 0, minutes: 0, seconds: 0 }).save();
        log('> Estadística agregada a la base de datos', 'green');
    },
    updateStat: async (id, days, hours, minutes, seconds, username) => {
        await statSchema.updateOne({ _id: id }, { days: days, hours: hours, minutes: minutes, seconds: seconds });
        log(`> Estadística ${username ? `de ${username} ` : ''}actualizada en la base de datos`, 'green');
    },

    addThermalPasteDate: async (id, date) => {
        await new thermalPasteDateSchema({ _id: id, date: date }).save();
        log('> Fecha de cambio de pasta térmica agregada a la base de datos', 'green');
    },
    updateThermalPasteDate: async (id, date) => {
        await thermalPasteDateSchema.updateOne({ _id: id }, { date: date });
        log('> Fecha de cambio de pasta térmica actualizada en la base de datos', 'green');
    },

    addCollector: async id => {
        await new collectorSchema({ _id: id, achievements: [], exchanges: 0, lastOpened: {}, owned: [], repeated: [], timeout: null }).save();
        log('> Coleccionista agregado a la base de datos', 'green');
    },
    updateCollector: async ({ _id, achievements, exchanges, lastOpened, owned, repeated, timeout }) => {
        await collectorSchema.updateOne({ _id }, { achievements, exchanges, lastOpened, owned, repeated, timeout });
        log('> Coleccionista actualizado en la base de datos', 'green');
    }
};
const banSchema = require('../models/ban-schema');
const birthdaySchema = require('../models/birthday-schema');
const crosshairSchema = require('../models/crosshair-schema');
const collectorMessageSchema = require('../models/collectorMessage-schema');
const moviesAndGamesSchema = require('../models/moviesAndGames-schema');
const playlistSchema = require('../models/playlist-schema');
const smurfSchema = require('../models/smurf-schema');
const statSchema = require('../models/stat-schema');
const thermalPasteDateSchema = require('../models/thermalPasteDate-schema');

module.exports = {
    updateAnniversary: async (id1, id2, flag) => {
        const anniversarySchema = require('../models/anniversary-schema');
        await anniversarySchema.updateOne({ id1: id1, id2: id2 }, { flag: flag });
        console.log('> Aniversario actualizado en la base de datos');
    },

    updateAvatarString: async url => {
        const avatarSchema = require('../models/avatar-schema');
        await avatarSchema.updateOne({ _id: 1 }, { url: url });
        console.log('> Avatar actualizado en la base de datos');
    },

    addBan: async (id, tag, responsible, reason) => {
        await new banSchema({ _id: id, tag: tag, responsibleId: responsible, reason: reason }).save();
        console.log('> Ban agregado a la base de datos');
    },
    deleteBan: async id => {
        await banSchema.deleteOne({ _id: id });
        console.log('> Ban eliminado de la base de datos');
    },

    addBirthday: async (id, username, day, month) => {
        await new birthdaySchema({ _id: id, username: username, day: day, month: month, flag: false }).save();
        console.log('> Cumpleaños agregado a la base de datos');
    },
    updateBirthday: async (id, flag) => {
        await birthdaySchema.updateOne({ _id: id }, { flag: flag });
        console.log('> Cumpleaños actualizado en la base de datos');
    },
    deleteBirthday: async id => {
        await birthdaySchema.deleteOne({ _id: id });
        console.log('> Cumpleaños eliminado de la base de datos');
    },

    addCrosshair: async (name, code, owner, url) => {
        await new crosshairSchema({ name: name, code: code, ownerId: owner, imageUrl: url }).save();
        console.log('> Mira agregada a la base de datos');
    },
    deleteCrosshair: async id => {
        await crosshairSchema.deleteOne({ id: id });
        console.log('> Mira eliminada de la base de datos');
    },

    updateMcuFilters: async array => {
        const mcuFiltersSchema = require('../models/mcuFilters-schema');
        await mcuFiltersSchema.updateOne({ _id: 1 }, { filters: array });
        console.log('> Filtros del UCM actualizados en la base de datos');
    },

    updateBillboardCollectorMessage: async (flag, id) => {
        await collectorMessageSchema.updateOne({ _id: 'billboard_message' }, { isActive: flag, messageId: id });
        console.log('> Mensaje de recolector actualizado en la base de datos');
    },

    updateRolesMessage: async (channelId, messageId) => {
        await collectorMessageSchema.updateOne({ _id: 'roles_message' }, { channelId: channelId, messageId: messageId });
        console.log('> Mensaje de roles actualizado en la base de datos');
    },

    updateMovies: async movies => {
        await moviesAndGamesSchema.updateOne({ _id: 'movies' }, { data: movies });
        console.log(`> Películas actualizadas en la base de datos`);
    },

    updateGames: async games => {
        await moviesAndGamesSchema.updateOne({ _id: 'games' }, { data: games });
        console.log(`> Juegos actualizados en la base de datos`);
    },

    addPlaylist: async (name, url) => {
        await new playlistSchema({ _id: name, url: url }).save();
        console.log('> Lista de reproducción agregada a la base de datos');
    },
    deletePlaylist: async name => {
        await playlistSchema.deleteOne({ _id: name });
        console.log('> Lista de reproducción eliminada de la base de datos');
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
        console.log('> Cola agregada a la base de datos');
    },

    addSmurf: async (command, name, user, password, vip) => {
        await new smurfSchema({ _id: command, name: name, user: user, password: password, vip: vip }).save();
        console.log('> Cuenta smurf agregada a la base de datos');
    },
    deleteSmurf: async command => {
        await smurfSchema.deleteOne({ _id: command });
        console.log('> Cuenta smurf eliminada de la base de datos');
    },
    updateSmurf: async (command, ban) => {
        await smurfSchema.updateOne({ _id: command }, { ban: ban });
        console.log(`> Ban de cuenta smurf actualizada en la base de datos`);
    },

    addSombraBan: async reason => {
        const sombraBanSchema = require('../models/sombraBan-schema');
        await new sombraBanSchema({ reason: reason }).save();
        console.log('> Ban de Sombra agregado a la base de datos');
    },

    addStat: async id => {
        await new statSchema({ _id: id }).save();
        console.log('> Estadística agregada a la base de datos');
    },
    updateStat: async (id, days, hours, minutes, seconds, username) => {
        await statSchema.updateOne({ _id: id }, { days: days, hours: hours, minutes: minutes, seconds: seconds });
        console.log(`> Estadística ${username ? `de ${username} ` : ''}actualizada en la base de datos`);
    },

    addThermalPasteDate: async (id, date) => {
        await new thermalPasteDateSchema({ _id: id, date: date }).save();
        console.log('> Fecha de cambio de pasta térmica agregada a la base de datos');
    },
    updateThermalPasteDate: async (id, date) => {
        await thermalPasteDateSchema.updateOne({ _id: id }, { date: date });
        console.log('> Fecha de cambio de pasta térmica actualizada en la base de datos');
    },
};
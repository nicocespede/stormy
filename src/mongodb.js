const { CONSOLE_GREEN, CONSOLE_YELLOW } = require('../src/constants');
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
const { consoleLog, logToFile } = require('./util');
const { updateStats } = require('./cache');

const MODULE_NAME = 'src.mongodb';

module.exports = {
    updateAnniversary: async (id1, id2, date) => {
        const anniversarySchema = require('../models/anniversary-schema');
        await anniversarySchema.updateOne({ id1, id2 }, { date });
        consoleLog('> Aniversario actualizado en la base de datos', CONSOLE_GREEN);
    },

    updateIconString: async name => {
        await iconSchema.updateOne({ _id: 1 }, { name: name });
        consoleLog('> Ícono actualizado en la base de datos', CONSOLE_GREEN);
    },

    updateMode: async mode => {
        await iconSchema.updateOne({ _id: 1 }, { mode });
        consoleLog('> Modo actualizado en la base de datos', CONSOLE_GREEN);
    },

    addBan: async (id, tag, responsible, character, reason) => {
        await new banSchema({ _id: id, tag: tag, responsibleId: responsible, reason: reason, character: character }).save();
        consoleLog('> Ban agregado a la base de datos', CONSOLE_GREEN);
    },
    deleteBan: async id => {
        await banSchema.deleteOne({ _id: id });
        consoleLog('> Ban eliminado de la base de datos', CONSOLE_YELLOW);
    },

    addBirthday: async (id, username, date) => {
        await new birthdaySchema({ _id: id, username, date }).save();
        consoleLog('> Cumpleaños agregado a la base de datos', CONSOLE_GREEN);
    },
    updateBirthday: async (id, date) => {
        await birthdaySchema.updateOne({ _id: id }, { date });
        consoleLog('> Cumpleaños actualizado en la base de datos', CONSOLE_GREEN);
    },
    deleteBirthday: async id => {
        await birthdaySchema.deleteOne({ _id: id });
        consoleLog('> Cumpleaños eliminado de la base de datos', CONSOLE_YELLOW);
    },

    addCrosshair: async (name, code, owner) => {
        await new crosshairSchema({ name: name, code: code, ownerId: owner }).save();
        consoleLog('> Mira agregada a la base de datos', CONSOLE_GREEN);
    },
    deleteCrosshair: async id => {
        await crosshairSchema.deleteOne({ id: id });
        consoleLog('> Mira eliminada de la base de datos', CONSOLE_YELLOW);
    },

    updateFilters: async (id, filters) => {
        const filtersSchema = require('../models/filters-schema');
        await filtersSchema.updateOne({ _id: id }, { filters });
        consoleLog(`> Filtros de '${id}' actualizados en la base de datos`, CONSOLE_GREEN);
    },

    updateChoices: async (id, choices) => {
        const filtersSchema = require('../models/filters-schema');
        await filtersSchema.updateOne({ _id: id }, { choices });
        consoleLog(`> Opciones de '${id}' actualizados en la base de datos`, CONSOLE_GREEN);
    },

    updateBillboardMessage: async (flag, id) => {
        await collectorMessageSchema.updateOne({ _id: 'billboard_message' }, { isActive: flag, messageId: id });
        consoleLog('> Mensaje de recolector actualizado en la base de datos', CONSOLE_GREEN);
    },

    updateRolesMessage: async (channelId, messageId) => {
        await collectorMessageSchema.updateOne({ _id: 'roles_message' }, { channelId: channelId, messageId: messageId });
        consoleLog('> Mensaje de roles actualizado en la base de datos', CONSOLE_GREEN);
    },

    updateMovies: async (id, movies) => {
        await moviesAndGamesSchema.updateOne({ _id: id }, { data: movies });
        consoleLog(`> Stock de '${id}' actualizado en la base de datos`, CONSOLE_GREEN);
    },

    updateGames: async games => {
        await moviesAndGamesSchema.updateOne({ _id: 'games' }, { data: games });
        consoleLog(`> Juegos actualizados en la base de datos`, CONSOLE_GREEN);
    },

    addPlaylist: async (name, url, ownerId) => {
        await new playlistSchema({ _id: name, url: url, ownerId: ownerId }).save();
        consoleLog('> Lista de reproducción agregada a la base de datos', CONSOLE_GREEN);
    },
    deletePlaylist: async name => {
        await playlistSchema.deleteOne({ _id: name });
        consoleLog('> Lista de reproducción eliminada de la base de datos', CONSOLE_YELLOW);
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
        consoleLog('> Cola interrumpida agregada a la base de datos', CONSOLE_GREEN);
    },

    addSmurf: async (command, name, user, password, vip) => {
        await new smurfSchema({ _id: command, name: name, user: user, password: password, vip: vip }).save();
        consoleLog('> Cuenta smurf agregada a la base de datos', CONSOLE_GREEN);
    },
    deleteSmurf: async command => {
        await smurfSchema.deleteOne({ _id: command });
        consoleLog('> Cuenta smurf eliminada de la base de datos', CONSOLE_YELLOW);
    },
    updateSmurf: async (command, update) => {
        await smurfSchema.updateOne({ _id: command }, update);
        consoleLog(`> Cuenta smurf actualizada en la base de datos`, CONSOLE_GREEN);
    },

    addSombraBan: async reason => {
        const sombraBanSchema = require('../models/sombraBan-schema');
        await new sombraBanSchema({ reason: reason }).save();
        consoleLog('> Ban de Sombra agregado a la base de datos', CONSOLE_GREEN);
    },

    /**
     * Adds a new stats document to the database.
     * 
     * @param {String} id The ID of the user.
     * @param {String} username The username of the user.
     * @returns The updated cached stats.
     */
    addStat: async (id, username) => {
        await new statSchema({ _id: id, days: 0, hours: 0, minutes: 0, seconds: 0 }).save();
        consoleLog('> Estadística agregada a la base de datos', CONSOLE_GREEN);
        logToFile(`${MODULE_NAME}.addStat`, `Adding new stats record for user ${username}`);
        return await updateStats();
    },

    /**
     * Updates a single stats document in database.
     * 
     * @param {String} id The ID of the user.
     * @param {Number} days The new days value.
     * @param {Number} hours The new hours value.
     * @param {Number} minutes The new minutes value.
     * @param {Number} seconds The new seconds value.
     * @param {String} username The username of the user.
     */
    updateStat: async (id, days, hours, minutes, seconds, username) => {
        await statSchema.updateOne({ _id: id }, { days: days, hours: hours, minutes: minutes, seconds: seconds });

        consoleLog(`> Estadística ${username ? `de ${username} ` : ''}actualizada en la base de datos`, CONSOLE_GREEN);
        logToFile(`${MODULE_NAME}.updateStat`, `Updating stats for user ${username}`);
        await updateStats();
    },

    updateManyStats: async updates => {
        const operations = updates.map(({ filter, update }) => ({ updateOne: { filter, update, upsert: true } }));
        const result = await statSchema.bulkWrite(operations);

        const inserted = result.upsertedCount;
        if (inserted > 0) {
            consoleLog(`> ${inserted} estadística${inserted > 1 ? 's' : ''} agregada${inserted > 1 ? 's' : ''} a la base de datos`, CONSOLE_GREEN);
            logToFile(`${MODULE_NAME}.updateManyStats`, `Adding new stats record for ${inserted} user${inserted > 1 ? 's' : ''}`);
        }

        const updated = result.modifiedCount;
        if (updated > 0) {
            consoleLog(`> ${updated} estadística${updated > 1 ? 's' : ''} actualizada${updated > 1 ? 's' : ''} en la base de datos`, CONSOLE_GREEN);
            logToFile(`${MODULE_NAME}.updateManyStats`, `Updating stats for ${updated} user${updated > 1 ? 's' : ''}`);
        }

        await updateStats();
    },

    addThermalPasteDate: async (id, date) => {
        await new thermalPasteDateSchema({ _id: id, date: date }).save();
        consoleLog('> Fecha de cambio de pasta térmica agregada a la base de datos', CONSOLE_GREEN);
    },
    updateThermalPasteDate: async (id, date) => {
        await thermalPasteDateSchema.updateOne({ _id: id }, { date: date });
        consoleLog('> Fecha de cambio de pasta térmica actualizada en la base de datos', CONSOLE_GREEN);
    }
};
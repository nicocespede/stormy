const chalk = require('chalk');
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
        console.log(chalk.green('> Aniversario actualizado en la base de datos'));
    },

    updateIconString: async name => {
        const iconSchema = require('../models/icon-schema');
        await iconSchema.updateOne({ _id: 1 }, { name: name });
        console.log(chalk.green('> Ícono actualizado en la base de datos'));
    },

    addBan: async (id, tag, responsible, character, reason) => {
        await new banSchema({ _id: id, tag: tag, responsibleId: responsible, reason: reason, character: character }).save();
        console.log(chalk.green('> Ban agregado a la base de datos'));
    },
    deleteBan: async id => {
        await banSchema.deleteOne({ _id: id });
        console.log(chalk.yellow('> Ban eliminado de la base de datos'));
    },

    addBirthday: async (id, username, day, month) => {
        await new birthdaySchema({ _id: id, username: username, day: day, month: month, flag: false }).save();
        console.log(chalk.green('> Cumpleaños agregado a la base de datos'));
    },
    updateBirthday: async (id, flag) => {
        await birthdaySchema.updateOne({ _id: id }, { flag: flag });
        console.log(chalk.green('> Cumpleaños actualizado en la base de datos'));
    },
    deleteBirthday: async id => {
        await birthdaySchema.deleteOne({ _id: id });
        console.log(chalk.yellow('> Cumpleaños eliminado de la base de datos'));
    },

    addCrosshair: async (name, code, owner) => {
        await new crosshairSchema({ name: name, code: code, ownerId: owner }).save();
        console.log(chalk.green('> Mira agregada a la base de datos'));
    },
    deleteCrosshair: async id => {
        await crosshairSchema.deleteOne({ id: id });
        console.log(chalk.yellow('> Mira eliminada de la base de datos'));
    },

    updateMcuFilters: async array => {
        const mcuFiltersSchema = require('../models/mcuFilters-schema');
        await mcuFiltersSchema.updateOne({ _id: 1 }, { filters: array });
        console.log(chalk.green('> Filtros del UCM actualizados en la base de datos'));
    },

    updateBillboardMessage: async (flag, id) => {
        await collectorMessageSchema.updateOne({ _id: 'billboard_message' }, { isActive: flag, messageId: id });
        console.log(chalk.green('> Mensaje de recolector actualizado en la base de datos'));
    },

    updateRolesMessage: async (channelId, messageId) => {
        await collectorMessageSchema.updateOne({ _id: 'roles_message' }, { channelId: channelId, messageId: messageId });
        console.log(chalk.green('> Mensaje de roles actualizado en la base de datos'));
    },

    updateMovies: async (id, movies) => {
        const messages = { "ucm": "UCM actualizado" };
        await moviesAndGamesSchema.updateOne({ _id: id }, { data: movies });
        console.log(chalk.green(`> ${messages[id]} en la base de datos`));
    },

    updateGames: async games => {
        await moviesAndGamesSchema.updateOne({ _id: 'games' }, { data: games });
        console.log(chalk.green(`> Juegos actualizados en la base de datos`));
    },

    addPlaylist: async (name, url, ownerId) => {
        await new playlistSchema({ _id: name, url: url, ownerId: ownerId }).save();
        console.log(chalk.green('> Lista de reproducción agregada a la base de datos'));
    },
    deletePlaylist: async name => {
        await playlistSchema.deleteOne({ _id: name });
        console.log(chalk.yellow('> Lista de reproducción eliminada de la base de datos'));
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
        console.log(chalk.green('> Cola interrumpida agregada a la base de datos'));
    },

    addSmurf: async (command, name, user, password, vip) => {
        await new smurfSchema({ _id: command, name: name, user: user, password: password, vip: vip }).save();
        console.log(chalk.green('> Cuenta smurf agregada a la base de datos'));
    },
    deleteSmurf: async command => {
        await smurfSchema.deleteOne({ _id: command });
        console.log(chalk.yellow('> Cuenta smurf eliminada de la base de datos'));
    },
    updateSmurf: async (command, ban) => {
        await smurfSchema.updateOne({ _id: command }, { bannedUntil: ban });
        console.log(chalk.green(`> Ban de cuenta smurf actualizada en la base de datos`));
    },

    addSombraBan: async reason => {
        const sombraBanSchema = require('../models/sombraBan-schema');
        await new sombraBanSchema({ reason: reason }).save();
        console.log(chalk.green('> Ban de Sombra agregado a la base de datos'));
    },

    addStat: async id => {
        await new statSchema({ _id: id, days: 0, hours: 0, minutes: 0, seconds: 0 }).save();
        console.log(chalk.green('> Estadística agregada a la base de datos'));
    },
    updateStat: async (id, days, hours, minutes, seconds, username) => {
        await statSchema.updateOne({ _id: id }, { days: days, hours: hours, minutes: minutes, seconds: seconds });
        console.log(chalk.green(`> Estadística ${username ? `de ${username} ` : ''}actualizada en la base de datos`));
    },

    addThermalPasteDate: async (id, date) => {
        await new thermalPasteDateSchema({ _id: id, date: date }).save();
        console.log(chalk.green('> Fecha de cambio de pasta térmica agregada a la base de datos'));
    },
    updateThermalPasteDate: async (id, date) => {
        await thermalPasteDateSchema.updateOne({ _id: id }, { date: date });
        console.log(chalk.green('> Fecha de cambio de pasta térmica actualizada en la base de datos'));
    }
};
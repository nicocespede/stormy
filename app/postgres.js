const { Client } = require('pg');
const { testing } = require('./constants');

// if on heroku
if (process.env.DATABASE_URL)
    var dbClient = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
// if on local
else
    var dbClient = new Client({
        user: process.env.D_user,
        password: process.env.D_password,
        port: process.env.D_pport,
        host: process.env.D_host,
        database: !testing ? process.env.D_database : process.env.D_testing_database
    });

dbClient.connect();

dbClient.on('error', (err, client) => {
    console.log('Error de conexión de postgres: ' + err, '\nIntentando reconectar...');
    setTimeout(function () { dbClient.connect() }, 10 * 1000);
});

module.exports = {
    executeQuery: async (query) => {
        var ret = [];
        return new Promise(function (resolve, reject) {
            dbClient.query(query, (err, res) => {
                if (err) throw err;
                for (let row of res.rows) {
                    ret.push(row);
                }
                //dbClient.end();
            });
            setTimeout(function () { resolve(); }, 1000);
        }).then(function () {
            return ret;
        });
    },

    addBday: (array) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`INSERT INTO "bdays" VALUES('${array[0]}', '${array[1]}', '${array[2]}', ${array[3]});`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Cumpleaños agregado a la base de datos');
        });
    },
    updateBday: (id, value) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`UPDATE "bdays" SET "bdays_flag" = ${value} WHERE "bdays_id" = '${id}';`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Cumpleaños actualizado en la base de datos');
        });
    },
    deleteBday: (id) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`DELETE FROM "bdays" WHERE "bdays_id" = '${id}';`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Cumpleaños eliminado de la base de datos');
        });
    },

    addBan: (array) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`INSERT INTO "bans" VALUES('${array[0]}', '${array[1]}', '${array[2]}', '${array[3]}');`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Ban agregado a la base de datos');
        });
    },
    deleteBan: (id) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`DELETE FROM "bans" WHERE "bans_id" = '${id}';`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Ban eliminado de la base de datos');
        });
    },

    addSombraBan: (reason) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`INSERT INTO "sombraBans" VALUES('${reason}');`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Ban de Sombra agregado a la base de datos');
        });
    },

    updateCollectorMessage: (value, id) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`DELETE FROM "collectorMessage";`, (err, res) => {
                if (err) throw err;
                dbClient.query(`INSERT INTO "collectorMessage" VALUES(${value}, ${id});`, (err, res) => {
                    if (err) throw err;
                });
                setTimeout(function () { resolve(); }, 1000);
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Mensaje de recolector actualizado en la base de datos');
        });
    },

    updateAnniversary: (id1, id2, value) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`UPDATE "anniversaries" SET "anniversaries_flag" = ${value} WHERE "anniversaries_id1" = '${id1}' AND "anniversaries_id2" = '${id2}';`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Aniversario actualizado en la base de datos');
        });
    },

    updateAvatarString: (value) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`UPDATE "avatar" SET "avatar_url" = '${value}' WHERE "avatar_id" = 1;`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Avatar actualizado en la base de datos');
        });
    },

    addPlaylist: (array) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`INSERT INTO "playlists" VALUES('${array[0]}', '${array[1]}');`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Lista de reproducción agregada a la base de datos');
        });
    },
    deletePlaylist: (name) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`DELETE FROM "playlists" WHERE "playlists_name" = '${name}';`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Lista de reproducción eliminada de la base de datos');
        });
    },

    updateMcuFilters: (value) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`UPDATE "mcuFilters" SET "mcuFilters_filters" = '{"${value.join('","')}"}';`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Filtros del UCM actualizados en la base de datos');
        });
    },

    addStat: (id) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`INSERT INTO "stats" VALUES('${id}');`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Estadística agregada a la base de datos');
        });
    },
    updateStat: (id, days, hours, minutes, seconds) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`UPDATE "stats" SET "stats_days" = ${days}, "stats_hours" = ${hours}, "stats_minutes" = ${minutes}, "stats_seconds" = ${seconds} WHERE "stats_id" = '${id}';`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Estadística actualizada en la base de datos');
        });
    },

    addThermalPasteDate: (id, date) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`INSERT INTO "thermalPasteDates" VALUES('${id}', '${date}');`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Fecha de cambio de pasta térmica agregada a la base de datos');
        });
    },
    updateThermalPasteDate: (id, date) => {
        return new Promise(function (resolve, reject) {
            dbClient.query(`UPDATE "thermalPasteDates" SET "tpd_date" = '${date}' WHERE "tpd_id" = '${id}';`, (err, res) => {
                if (err) throw err;
            });
            setTimeout(function () { resolve(); }, 1000);
            console.log('> Fecha de cambio de pasta térmica actualizada en la base de datos');
        });
    }
};
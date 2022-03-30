const { Client } = require('pg');

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
        database: process.env.D_database
    });

dbClient.connect();

async function executeQuery(query) {
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
}

function addBday(array) {
    return new Promise(function (resolve, reject) {
        dbClient.query(`INSERT INTO "bdays" VALUES('${array[0]}', '${array[1]}', '${array[2]}', ${array[3]});`, (err, res) => {
            if (err) throw err;
        });
        setTimeout(function () { resolve(); }, 1000);
        console.log('> Cumpleaños agregado a la base de datos');
    });
}

function updateBday(id, value) {
    return new Promise(function (resolve, reject) {
        dbClient.query(`UPDATE "bdays" SET "bdays_flag" = ${value} WHERE "bdays_id" = '${id}';`, (err, res) => {
            if (err) throw err;
        });
        setTimeout(function () { resolve(); }, 1000);
        console.log('> Cumpleaños actualizado en la base de datos');
    });
}

function deleteBday(id) {
    return new Promise(function (resolve, reject) {
        dbClient.query(`DELETE FROM "bdays" WHERE "bdays_id" = '${id}';`, (err, res) => {
            if (err) throw err;
        });
        setTimeout(function () { resolve(); }, 1000);
        console.log('> Cumpleaños eliminado de la base de datos');
    });
}

function addBan(array) {
    return new Promise(function (resolve, reject) {
        dbClient.query(`INSERT INTO "bans" VALUES('${array[0]}', '${array[1]}', '${array[2]}', '${array[3]}');`, (err, res) => {
            if (err) throw err;
        });
        setTimeout(function () { resolve(); }, 1000);
        console.log('> Ban agregado a la base de datos');
    });
}

function updateBan(id) {
    return new Promise(function (resolve, reject) {
        dbClient.query(`UPDATE "bans" SET "bans_responsible" = 'Desconocido' WHERE "bans_id" = '${id}';`, (err, res) => {
            if (err) throw err;
        });
        setTimeout(function () { resolve(); }, 1000);
        console.log('> Ban actualizado en la base de datos');
    });
}

function deleteBan(id) {
    return new Promise(function (resolve, reject) {
        dbClient.query(`DELETE FROM "bans" WHERE "bans_id" = '${id}';`, (err, res) => {
            if (err) throw err;
        });
        setTimeout(function () { resolve(); }, 1000);
        console.log('> Ban eliminado de la base de datos');
    });
}

function updateCollectorMessage(value, id) {
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
}

function addSombraBan(reason) {
    return new Promise(function (resolve, reject) {
        dbClient.query(`INSERT INTO "sombraBans" VALUES('${reason}');`, (err, res) => {
            if (err) throw err;
        });
        setTimeout(function () { resolve(); }, 1000);
        console.log('> Ban de Sombra agregado a la base de datos');
    });
}

function updateAnniversary(id1, id2, value) {
    return new Promise(function (resolve, reject) {
        dbClient.query(`UPDATE "anniversaries" SET "anniversaries_flag" = ${value} WHERE "anniversaries_id1" = '${id1}' AND "anniversaries_id2" = '${id2}';`, (err, res) => {
            if (err) throw err;
        });
        setTimeout(function () { resolve(); }, 1000);
        console.log('> Aniversario actualizado en la base de datos');
    });
}

function updateAvatarString(value) {
    return new Promise(function (resolve, reject) {
        dbClient.query(`UPDATE "avatar" SET "avatar_url" = '${value}' WHERE "avatar_id" = 1;`, (err, res) => {
            if (err) throw err;
        });
        setTimeout(function () { resolve(); }, 1000);
        console.log('> Avatar actualizado en la base de datos');
    });
}

function addPlaylist(array) {
    return new Promise(function (resolve, reject) {
        dbClient.query(`INSERT INTO "playlists" VALUES('${array[0]}', '${array[1]}');`, (err, res) => {
            if (err) throw err;
        });
        setTimeout(function () { resolve(); }, 1000);
    });
}

function deletePlaylist(name) {
    return new Promise(function (resolve, reject) {
        dbClient.query(`DELETE FROM "playlists" WHERE "playlists_name" = '${name}';`, (err, res) => {
            if (err) throw err;
        });
        setTimeout(function () { resolve(); }, 1000);
    });
}

module.exports = {
    executeQuery,
    addBday, updateBday, deleteBday,
    addBan, updateBan, deleteBan,
    addSombraBan,
    updateCollectorMessage,
    updateAnniversary,
    updateAvatarString,
    addPlaylist, deletePlaylist
};
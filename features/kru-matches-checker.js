const chalk = require('chalk');
const { getKruMatches, updateKruMatches, getIds, updateIds, timeouts } = require('../src/cache');
const { convertTZ, convertTime } = require('../src/general');

module.exports = async client => {
    const check = async () => {
        const oneDay = 1000 * 60 * 60 * 24;
        const oneMinute = 1000 * 60;
        const matches = getKruMatches() || await updateKruMatches();
        const ids = getIds() || await updateIds();
        matches.forEach(element => {
            const splittedDate = element.date.split('/');
            const splittedTime = convertTime(element.time).split(':');
            const utcDate = Date.UTC(splittedDate[0], parseInt(splittedDate[1]) - 1, splittedDate[2], splittedTime[0], splittedTime[1]) + (1000 * 60 * 60 * 4);
            const date = convertTZ(new Date(utcDate), 'America/Argentina/Buenos_Aires');
            const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
            const difference = date - today;
            const rivalTeam = element.team1Name.includes('KRÜ') ? element.team2Name : element.team1Name;
            if (difference <= oneDay && difference >= (oneDay - oneMinute))
                client.channels.fetch(ids.channels.anuncios).then(channel => {
                    channel.send(`<@&${ids.roles.kru}>\n\n<:kru:${ids.emojis.kru}> Mañana juega **KRÜ Esports** vs **${rivalTeam}** a las **${convertTime(element.time)} hs**.`)
                        .catch(_ => console.log(chalk.red("> Error al enviar alerta de partido de KRÜ")));
                }).catch(console.error);
            if (difference <= (oneMinute * 10) && difference >= (oneMinute * 9))
                client.channels.fetch(ids.channels.anuncios).then(channel => {
                    channel.send(`<@&${ids.roles.kru}>\n\nEn 10 minutos juega **KRÜ Esports** vs **${rivalTeam}**. ¡Vamos KRÜ! <:kru:${ids.emojis.kru}>`)
                        .catch(_ => console.log(chalk.red("> Error al enviar alerta de partido de KRÜ")));
                }).catch(console.error);
        });

        timeouts['kru-matches-checker'] = setTimeout(check, 1000 * 60);
    };

    let exec = false;
    const update = async () => {
        if (exec)
            await updateKruMatches();
        else
            exec = true;

        timeouts['kru-matches-updater'] = setTimeout(update, 1000 * 60 * 60);
    };

    check();
    update();
};

module.exports.config = {
    displayName: 'Verificador de partidos de KRU',
    dbName: 'KRU_MATCHES_CHECKER'
};
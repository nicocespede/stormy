const { getKruMatches, updateKruMatches, getIds, timeouts } = require('../src/cache');
const { ARGENTINA_LOCALE_STRING, CONSOLE_RED } = require('../src/constants');
const { convertTZ, consoleLog } = require('../src/util');

module.exports = async client => {
    const check = async () => {
        const matches = await getKruMatches('upcoming');

        if (matches.length > 0) {
            const today = new Date();
            const ids = await getIds();
            const oneDay = 1000 * 60 * 60 * 24;
            const oneMinute = 1000 * 60;

            for (const element of matches) {
                const { date, team1Name, team2Name } = element;
                const rivalTeam = team1Name.includes('KRÜ') ? team2Name : team1Name;
                const difference = date - today;

                if (difference <= oneDay && difference >= (oneDay - oneMinute)) {
                    const channel = await client.channels.fetch(ids.channels.anuncios).catch(console.error);
                    channel.send(`<@&${ids.roles.kru}>\n\n<:kru:${ids.emojis.kru}> Mañana juega **KRÜ Esports** vs **${rivalTeam}** a las **${convertTZ(date).toLocaleTimeString(ARGENTINA_LOCALE_STRING, { timeStyle: 'short' })} hs**.`)
                        .catch(_ => consoleLog("> Error al enviar alerta de partido de KRÜ", CONSOLE_RED));
                }

                if (difference <= (oneMinute * 10) && difference >= (oneMinute * 9)) {
                    const channel = await client.channels.fetch(ids.channels.anuncios).catch(console.error);
                    channel.send(`<@&${ids.roles.kru}>\n\nEn 10 minutos juega **KRÜ Esports** vs **${rivalTeam}**. ¡Vamos KRÜ! <:kru:${ids.emojis.kru}>`)
                        .catch(_ => consoleLog("> Error al enviar alerta de partido de KRÜ", CONSOLE_RED));
                }
            }
        }

        timeouts['kru-matches-checker'] = setTimeout(check, 1000 * 60);
    };

    let exec = false;
    const update = async () => {
        if (exec)
            await updateKruMatches('upcoming');
        else
            exec = true;

        timeouts['kru-matches-updater'] = setTimeout(update, 1000 * 60 * 15);
    };

    check();
    update();
};

module.exports.config = {
    displayName: 'Verificador de partidos de KRU',
    dbName: 'KRU_MATCHES_CHECKER'
};
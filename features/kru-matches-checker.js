const { getKruMatches, updateKruMatches, getIds, updateIds, timeouts } = require('../src/cache');
const { convertTZ, log } = require('../src/util');

module.exports = async client => {
    const check = async () => {
        const matches = getKruMatches() || await updateKruMatches();

        if (matches.length > 0) {
            const today = new Date();
            const ids = getIds() || await updateIds();
            const oneDay = 1000 * 60 * 60 * 24;
            const oneMinute = 1000 * 60;

            for (const element of matches) {
                const { date, team1Name, team2Name } = element;
                const rivalTeam = team1Name.includes('KRÜ') ? team2Name : team1Name;
                const difference = date - today;

                if (difference <= oneDay && difference >= (oneDay - oneMinute)) {
                    const channel = await client.channels.fetch(ids.channels.anuncios).catch(console.error);
                    channel.send(`<@&${ids.roles.kru}>\n\n<:kru:${ids.emojis.kru}> Mañana juega **KRÜ Esports** vs **${rivalTeam}** a las **${convertTZ(date).toLocaleTimeString('es-AR', { timeStyle: 'short' })} hs**.`)
                        .catch(_ => log("> Error al enviar alerta de partido de KRÜ", 'red'));
                }

                if (difference <= (oneMinute * 10) && difference >= (oneMinute * 9)) {
                    const channel = await client.channels.fetch(ids.channels.anuncios).catch(console.error);
                    channel.send(`<@&${ids.roles.kru}>\n\nEn 10 minutos juega **KRÜ Esports** vs **${rivalTeam}**. ¡Vamos KRÜ! <:kru:${ids.emojis.kru}>`)
                        .catch(_ => log("> Error al enviar alerta de partido de KRÜ", 'red'));
                }
            }
        }

        timeouts['kru-matches-checker'] = setTimeout(check, 1000 * 60);
    };

    let exec = false;
    const update = async () => {
        if (exec)
            await updateKruMatches();
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
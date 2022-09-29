const { getSmurfs, updateSmurfs, timeouts } = require('../app/cache');
const { convertTZ } = require('../app/general');
const { updateSmurf } = require('../app/mongodb');

module.exports = _ => {
    let lastDateChecked = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
    lastDateChecked.setDate(lastDateChecked.getDate() - 1);

    const check = async () => {
        const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');

        if (lastDateChecked.getDate() != today.getDate()) {
            const smurfs = getSmurfs() || await updateSmurfs();
            const bannedAccounts = Object.entries(smurfs).filter(([_, value]) => value.bannedUntil != '');
            const expiredBans = bannedAccounts.filter(([_, value]) => {
                const splitDate = value.bannedUntil.split('/');
                return today > convertTZ(`${splitDate[1]}/${splitDate[0]}/${splitDate[2]}`, 'America/Argentina/Buenos_Aires');
            });

            for (const [command, _] of expiredBans)
                await updateSmurf(command, '').catch(console.error);

            if (expiredBans.length > 0)
                await updateSmurfs();

            lastDateChecked = today;
        }

        timeouts['valorant-bans-expiration-checker'] = setTimeout(check, 1000 * 60 * 60);
    };
    check();
};

module.exports.config = {
    displayName: 'Verificador de expiración de baneos de Valorant',
    dbName: 'VALORANT_BANS_EXPIRATION_CHECKER'
};
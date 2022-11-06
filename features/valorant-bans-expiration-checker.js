const { getSmurfs, updateSmurfs, timeouts } = require('../src/cache');
const { convertTZ } = require('../src/util');
const { updateSmurf } = require('../src/mongodb');

module.exports = _ => {
    const check = async () => {
        const today = convertTZ(new Date());

        const smurfs = getSmurfs() || await updateSmurfs();
        const bannedAccounts = Object.entries(smurfs).filter(([_, value]) => value.bannedUntil);
        const expiredBans = bannedAccounts.filter(([_, value]) => today > value.bannedUntil);

        for (const [command, _] of expiredBans)
            await updateSmurf(command, null).catch(console.error);

        if (expiredBans.length > 0)
            await updateSmurfs();

        timeouts['valorant-bans-expiration-checker'] = setTimeout(check, 1000 * 60);
    };
    check();
};

module.exports.config = {
    displayName: 'Verificador de expiración de baneos de Valorant',
    dbName: 'VALORANT_BANS_EXPIRATION_CHECKER'
};
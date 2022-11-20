const { updateSmurfs, timeouts } = require('../src/cache');
const smurfSchema = require('../models/smurf-schema');
const { updateSmurf } = require('../src/mongodb');

module.exports = _ => {
    const check = async () => {
        const today = new Date();
        const expiredBans = await smurfSchema.find({ bannedUntil: { $lt: today } });

        if (expiredBans.length > 0) {
            for (const { _id } of expiredBans)
                await updateSmurf(_id, { bannedUntil: null }).catch(console.error);
            await updateSmurfs();
        }

        timeouts['valorant-bans-expiration-checker'] = setTimeout(check, 1000 * 60);
    };
    check();
};

module.exports.config = {
    displayName: 'Verificador de expiración de baneos de Valorant',
    dbName: 'VALORANT_BANS_EXPIRATION_CHECKER'
};
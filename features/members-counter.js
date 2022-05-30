const { countMembers } = require("../app/general");

module.exports = client => {
    client.on('presenceUpdate', (oldPresence, newPresence) => {
        // Check if the user's status changed
        if (!oldPresence || !newPresence || (oldPresence.status !== newPresence.status
            // Check if the user's status changed from or to offline
            && (oldPresence.status === 'offline' || newPresence.status === 'offline')))
            countMembers(client);
    });
};

module.exports.config = {
    displayName: 'Contador de miembros',
    dbName: 'MEMBERS_COUNTER'
}
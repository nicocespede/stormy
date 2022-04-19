const { ids, addTimestamp, getTimestamps, removeTimestamp } = require("../app/cache");
const { pushDifference } = require("../app/general");

module.exports = client => {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (oldState.guild.id === ids.guilds.nckg || newState.guild.id === ids.guilds.nckg) {
            // ignore if mute/deafen update
            if (oldState.channelId === newState.channelId) return;

            var timestamps = getTimestamps();

            //check for new channel
            if (newState.channelId != null && newState.channelId != ids.channels.afk && newState.guild.id === ids.guilds.nckg) {
                const membersInNewChannel = newState.channel.members.has(ids.users.bot) ? newState.channel.members.size - 1 : newState.channel.members.size;
                if (membersInNewChannel === 2)
                    newState.channel.members.each(member => {
                        if (!timestamps[member.id])
                            addTimestamp(member.id, new Date());
                    });
                else if (membersInNewChannel > 2 || oldState.member.id === ids.users.bot) {
                    if (!timestamps[oldState.member.id])
                        addTimestamp(oldState.member.id, new Date());
                } else if (timestamps[newState.member.id]) {
                    await pushDifference(newState.member.id);
                    removeTimestamp(newState.member.id);
                }
            } else {
                var id = newState.member ? newState.member.id : newState.id;
                if (timestamps[id]) {
                    await pushDifference(id);
                    removeTimestamp(id);
                }
            }

            //check for old channel
            if (oldState.channelId != null && oldState.channelId != ids.channels.afk && oldState.guild.id === ids.guilds.nckg) {
                const membersInOldChannel = oldState.channel.members.has(ids.users.bot) ? oldState.channel.members.size - 1 : oldState.channel.members.size;
                if (membersInOldChannel < 2)
                    oldState.channel.members.each(async member => {
                        if (member.id != ids.users.bot)
                            if (timestamps[member.id]) {
                                await pushDifference(member.id);
                                removeTimestamp(member.id)
                            }
                    });
            }

            return;
        }
    });
};

module.exports.config = {
    displayName: 'Contador de estadísticas',
    dbName: 'STATS_COUNTER'
}
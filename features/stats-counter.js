const { ids, addTimestamp, getTimestamps, removeTimestamp } = require("../app/cache");
const { pushDifference } = require("../app/general");

module.exports = client => {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (oldState.guild.id === ids.guilds.nckg || newState.guild.id === ids.guilds.nckg) {
            // ignore if mute/deafen update
            if (oldState.channelId === newState.channelId) return;

            // check if someone connects
            if (oldState.channelId === null || oldState.channelId === ids.channels.afk
                || (oldState.guild.id != ids.guilds.nckg && newState.guild.id === ids.guilds.nckg)) {
                // start counting for the stats
                if (newState.channelId != ids.channels.afk)
                    if (newState.channel.members.size === 2)
                        newState.channel.members.each(member => addTimestamp(member.id, new Date()));
                    else if (newState.channel.members.size > 2)
                        addTimestamp(oldState.member.id, new Date());
                return;
            }

            //check if someone disconnects
            if (oldState.channelId != newState.channelId)
                //stop counting for the stats
                if (newState.channelId === null || newState.channelId === ids.channels.afk
                    || (oldState.guild.id === ids.guilds.nckg && newState.guild.id != ids.guilds.nckg)) {
                    var timestamps = getTimestamps();
                    if (oldState.channel.members.size > 1) {
                        var id = newState.member ? newState.member.id : newState.id;
                        if (timestamps[id]) {
                            await pushDifference(id);
                            removeTimestamp(id);
                        }
                    } else if (oldState.channel.members.size === 1)
                        for (const key in timestamps)
                            if (Object.hasOwnProperty.call(timestamps, key)){
                                await pushDifference(key);
                                removeTimestamp(key);
                            }
                }
        }
        return;
    });
};

module.exports.config = {
    displayName: 'Contador de estadísticas',
    dbName: 'STATS_COUNTER'
}
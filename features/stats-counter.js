const { ids, addTimestamp, getTimestamps, removeTimestamp } = require("../app/cache");
const { pushDifference } = require("../app/general");

module.exports = client => {
    client.on('ready', async () => {
        client.guilds.fetch(ids.guilds.nckg).then(guild => {
            guild.channels.cache.each(channel => {
                if (channel.isVoice() && channel.id != ids.channels.afk)
                    channel.members.each(member => addTimestamp(member.id, new Date()));
            });
        }).catch(console.error);
    });

    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (oldState.guild.id === ids.guilds.nckg || newState.guild.id === ids.guilds.nckg) {
            // ignore if mute/deafen update
            if (oldState.channelId === newState.channelId) return;

            // check if someone connects
            if (oldState.channelId === null || oldState.channelId === ids.channels.afk
                || (oldState.guild.id != ids.guilds.nckg && newState.guild.id === ids.guilds.nckg)) {
                // start counting for the stats
                if (newState.channelId != ids.channels.afk)
                    addTimestamp(oldState.member.id, new Date());
                return;
            }

            //check if someone disconnects
            if (oldState.channelId != newState.channelId)
                //stop counting for the stats
                if (newState.channelId === null || newState.channelId === ids.channels.afk
                    || (oldState.guild.id === ids.guilds.nckg && newState.guild.id != ids.guilds.nckg)) {
                    var timestamps = getTimestamps();
                    if (newState.member.id && timestamps[newState.member.id]) {
                        await pushDifference(newState.member.id);
                        removeTimestamp(newState.member.id);
                    } else
                        client.guilds.fetch(ids.guilds.nckg).then(async guild => {
                            for (const key in timestamps)
                                if (Object.hasOwnProperty.call(timestamps, key))
                                    await guild.members.fetch(key).catch(async _ => {
                                        await pushDifference(key);
                                        removeTimestamp(key);
                                    });
                        }).catch(console.error);
                }
        }
        return;
    });
};

module.exports.config = {
    displayName: 'Contador de estadísticas',
    dbName: 'STATS_COUNTER'
}
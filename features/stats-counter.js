const { Client } = require("discord.js");
const { addTimestamp, getTimestamps, removeTimestamp, getIds, updateIds, timeouts } = require("../src/cache");
const { pushDifference, getMembersStatus, pushDifferences } = require("../src/common");
const { CONSOLE_BLUE } = require("../src/constants");
const { consoleLog, fileLog } = require("../src/util");

/** @param {Client} client */
module.exports = client => {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        const ids = getIds() || await updateIds();
        if (oldState.guild.id === ids.guilds.default || newState.guild.id === ids.guilds.default) {

            const timestamps = getTimestamps();

            // check for streaming or deafen/undeafen updates
            if (!oldState.member.user.bot && oldState.channelId === newState.channelId && oldState.channelId != ids.channels.afk) {
                // start counter if user undeafens or starts streaming while being deafened,
                // and stop counter if user deafens and is not streaming
                if ((oldState.serverDeaf != newState.serverDeaf) || (oldState.selfDeaf != newState.selfDeaf)
                    || (oldState.streaming != newState.streaming)) {

                    const membersInChannel = await getMembersStatus(oldState.channel);

                    if (membersInChannel.size >= 2) {
                        for (const member of membersInChannel.valid)
                            if (!timestamps[member.id])
                                addTimestamp(member.id, new Date());

                        fileLog(`[stats-counter.voiceStateUpdateListener] Pushing stats and removing timestamps from muted/deafened members in channel ${oldState.channel.name}`);

                        await pushDifferences(membersInChannel.invalid.map(m => m.id));
                        for (const member of membersInChannel.invalid)
                            if (timestamps[member.id])
                                removeTimestamp(member.id);
                    } else {
                        fileLog(`[stats-counter.voiceStateUpdateListener] Pushing stats and removing timestamp from the last member of channel ${oldState.channel.name}`);

                        for (const [id, member] of oldState.channel.members)
                            if (!member.user.bot && timestamps[id]) {
                                await pushDifference(id, member.user.tag);
                                removeTimestamp(id);
                            }
                    }
                }
                return;
            }

            //check for new channel
            if (newState.channelId && newState.channelId !== ids.channels.afk && newState.guild.id === ids.guilds.default) {
                const membersInNewChannel = await getMembersStatus(newState.channel);
                if (membersInNewChannel.size === 2)
                    membersInNewChannel.valid.forEach(member => {
                        if (!timestamps[member.id])
                            addTimestamp(member.id, new Date());
                    });
                else if (membersInNewChannel.size > 2 || oldState.member.user.bot) {
                    if (!timestamps[oldState.member.id])
                        addTimestamp(oldState.member.id, new Date());
                } else if (timestamps[newState.member.id]) {
                    fileLog(`[stats-counter.voiceStateUpdateListener] Pushing stats and removing timestamp from a member who left a voice channel`);

                    await pushDifference(newState.member.id, newState.member.user.tag);
                    removeTimestamp(newState.member.id);
                }
            } else {
                const id = newState.member ? newState.member.id : newState.id;
                const tag = newState.member ? newState.member.user.tag : newState.id;
                if (timestamps[id]) {
                    fileLog(`[stats-counter.voiceStateUpdateListener] Pushing stats and removing timestamp from a member who left a voice channel`);

                    await pushDifference(id, tag);
                    removeTimestamp(id);
                }
            }

            //check for old channel
            if (oldState.channelId && oldState.channelId !== ids.channels.afk && oldState.guild.id === ids.guilds.default) {
                const membersInOldChannel = await getMembersStatus(oldState.channel);
                if (membersInOldChannel.size < 2 && Object.keys(timestamps).length > 0) {
                    fileLog(`[stats-counter.voiceStateUpdateListener] Pushing stats and removing timestamp from the last member of channel ${oldState.channel.name}`);

                    for (const [id, member] of oldState.channel.members)
                        if (!member.user.bot && timestamps[id]) {
                            await pushDifference(id, member.user.tag);
                            removeTimestamp(id);
                        }
                }
            }
            return;
        }
    });

    let exec = false;
    const save = async () => {
        if (exec) {
            const timestamps = getTimestamps();
            if (Object.keys(timestamps).length > 0) {
                consoleLog(`> Se cumplió el ciclo de 1 hora, enviando ${Object.keys(timestamps).length} estadísticas a la base de datos`, CONSOLE_BLUE);
                fileLog(`[stats-counter.save] Pushing all stats and restarting all timestamps after 1 hour loop completed`);

                await pushDifferences();
                for (const id in timestamps) if (Object.hasOwnProperty.call(timestamps, id))
                    addTimestamp(id, new Date());
            }
        } else exec = true;

        timeouts['stats-counter'] = setTimeout(save, 1000 * 60 * 60);
    };
    save();
};

module.exports.config = {
    displayName: 'Contador de estadísticas',
    dbName: 'STATS_COUNTER'
}
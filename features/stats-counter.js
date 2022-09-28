const chalk = require('chalk');
chalk.level = 1;
const { addTimestamp, getTimestamps, removeTimestamp, getIds, updateIds } = require("../app/cache");
const { pushDifference, getMembersStatus } = require("../app/general");

module.exports = client => {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        const ids = !getIds() ? await updateIds() : getIds();
        if (oldState.guild.id === ids.guilds.default || newState.guild.id === ids.guilds.default) {

            const timestamps = getTimestamps();

            // check for streaming or deafen/undeafen updates
            if (oldState.member.id != ids.users.bot && oldState.channelId === newState.channelId && oldState.channelId != ids.channels.afk) {
                // start counter if user undeafens or starts streaming while being deafened,
                // and stop counter if user deafens and is not streaming
                if ((oldState.serverDeaf != newState.serverDeaf) || (oldState.selfDeaf != newState.selfDeaf)
                    || (oldState.streaming != newState.streaming)) {

                    const membersInChannel = await getMembersStatus(oldState.channel);

                    if (membersInChannel.size >= 2) {
                        membersInChannel.valid.forEach(member => {
                            if (!timestamps[member.id])
                                addTimestamp(member.id, new Date());
                        });
                        membersInChannel.invalid.forEach(async member => {
                            if (timestamps[member.id]) {
                                await pushDifference(member.id, member.user.tag);
                                removeTimestamp(member.id);
                            }
                        });
                    } else
                        oldState.channel.members.each(async member => {
                            if (member.id != ids.users.bot)
                                if (timestamps[member.id]) {
                                    await pushDifference(member.id, member.user.tag);
                                    removeTimestamp(member.id);
                                }
                        });
                }
                return;
            }

            //check for new channel
            if (newState.channelId != null && newState.channelId != ids.channels.afk && newState.guild.id === ids.guilds.default) {
                const membersInNewChannel = await getMembersStatus(newState.channel);
                if (membersInNewChannel.size === 2)
                    membersInNewChannel.valid.forEach(member => {
                        if (!timestamps[member.id])
                            addTimestamp(member.id, new Date());
                    });
                else if (membersInNewChannel.size > 2 || oldState.member.id === ids.users.bot) {
                    if (!timestamps[oldState.member.id])
                        addTimestamp(oldState.member.id, new Date());
                } else if (timestamps[newState.member.id]) {
                    await pushDifference(newState.member.id, newState.member.user.tag);
                    removeTimestamp(newState.member.id);
                }
            } else {
                const id = newState.member ? newState.member.id : newState.id;
                const tag = newState.member ? newState.member.user.tag : newState.id;
                if (timestamps[id]) {
                    await pushDifference(id, tag);
                    removeTimestamp(id);
                }
            }

            //check for old channel
            if (oldState.channelId != null && oldState.channelId != ids.channels.afk && oldState.guild.id === ids.guilds.default) {
                const membersInOldChannel = await getMembersStatus(oldState.channel);
                if (membersInOldChannel.size < 2)
                    oldState.channel.members.each(async member => {
                        if (member.id != ids.users.bot)
                            if (timestamps[member.id]) {
                                await pushDifference(member.id, member.user.tag);
                                removeTimestamp(member.id)
                            }
                    });
            }
            return;
        }
    });

    let exec = false;
    const save = async () => {
        if (exec) {
            const timestamps = getTimestamps();
            if (Object.keys(timestamps).length > 0) {
                console.log(chalk.blue(`> Se cumplió el ciclo de 1 hora, enviando ${Object.keys(timestamps).length} estadísticas a la base de datos`));
                for (const key in timestamps)
                    if (Object.hasOwnProperty.call(timestamps, key)) {
                        await pushDifference(key);
                        addTimestamp(key, new Date());
                    }
            }
        } else exec = true;

        setTimeout(save, 1000 * 60 * 60);
    };
    save();
};

module.exports.config = {
    displayName: 'Contador de estadísticas',
    dbName: 'STATS_COUNTER'
}
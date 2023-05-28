const { Client, VoiceState } = require("discord.js");
const { addTimestamp, getTimestamps, getIds, timeouts } = require("../src/cache");
const { pushDifference, getMembersStatus, pushDifferences } = require("../src/common");
const { CONSOLE_BLUE } = require("../src/constants");
const { consoleLog, logToFile, logToFileFunctionTriggered, logToFileListenerTriggered } = require("../src/util");

const MODULE_NAME = 'features.stats-counter';

/** @param {Client} client */
module.exports = client => {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        logToFileListenerTriggered(MODULE_NAME, 'voiceStateUpdate');
        const moduleName = `${MODULE_NAME}.voiceStateUpdateListener`;

        const ids = await getIds();

        /**
         * Determines if the voice state belongs to the default guild, or not.
         * 
         * @param {VoiceState} state The voice state.
         * @returns True if the voice state belongs to the default guild, or false if not.
         */
        const isDefaultGuild = state => state.guild.id === ids.guilds.default;

        if (isDefaultGuild(oldState) || isDefaultGuild(newState)) {

            const timestamps = getTimestamps();
            const isBot = oldState.member.user.bot && newState.member.user.bot;
            const isSameChannel = oldState.channelId && newState.channelId && oldState.channelId === newState.channelId;

            /**
             * Determines if the voice state is related to the AFK voice channel, or not.
             * 
             * @param {VoiceState} state The voice state.
             * @returns True if the voice state is related to the AFK voice channel, or false if not.
            */
            const isAfkChannel = state => state.channelId && state.channel && state.channelId === ids.channels.afk;

            // check for streaming or deafen/undeafen updates
            if (!isBot && isSameChannel && !isAfkChannel(oldState)) {

                const isServerDeaf = oldState.serverDeaf !== null && newState.serverDeaf !== null && oldState.serverDeaf !== newState.serverDeaf;
                const isSelfDeaf = oldState.selfDeaf !== null && newState.selfDeaf !== null && oldState.selfDeaf !== newState.selfDeaf;
                const isDeaf = isServerDeaf || isSelfDeaf;
                const isStreaming = oldState.streaming !== null && newState.streaming !== null && oldState.streaming !== newState.streaming;

                // start counter if user undeafens or starts streaming while being deafened,
                // and stop counter if user deafens and is not streaming
                if (isDeaf || isStreaming) {

                    const { invalid, size, valid } = await getMembersStatus(oldState.channel);

                    if (size >= 2) {
                        for (const member of valid) {
                            const { id } = member;
                            if (!timestamps[id])
                                addTimestamp(id, new Date());
                        }

                        logToFile(moduleName, `A member has been muted/deafened in the channel ${oldState.channel.name}`);

                        await pushDifferences(false, invalid.map(m => m.id));
                    } else {
                        logToFile(moduleName, `One member left in the channel ${oldState.channel.name}`);

                        for (const [id, member] of oldState.channel.members) {
                            const { user } = member;
                            if (!user.bot)
                                await pushDifference(id, user.tag);
                        }
                    }
                }
                return;
            }

            const { channel: newChannel, member: newMember } = newState;

            //check for new channel
            if (newMember && !isAfkChannel(newState) && isDefaultGuild(newState)) {

                const { size, valid } = await getMembersStatus(newChannel);

                if (size === 2)
                    for (const member of valid) {
                        const { id } = member;
                        if (!timestamps[id])
                            addTimestamp(id, new Date());
                    }
                else if (size > 2 || isBot) {
                    if (!timestamps[oldState.member.id])
                        addTimestamp(oldState.member.id, new Date());
                } else {
                    const { id, user } = newMember;
                    const { tag } = user;

                    if (oldState)
                        logToFile(moduleName, `Pushing stats and removing timestamp of ${tag}`);

                    await pushDifference(id, tag);
                }
            } else {
                const tag = newMember ? newMember.user.tag : newState.id;
                logToFile(moduleName, `${tag} left the voice channel ${oldState.channel.name}`);

                const id = newMember ? newMember.id : newState.id;
                await pushDifference(id, tag);
            }

            //check for old channel
            if (!isAfkChannel(oldState) && isDefaultGuild(oldState)) {

                const { size } = await getMembersStatus(oldState.channel);

                if (size < 2 && Object.keys(timestamps).length > 0) {
                    logToFile(moduleName, `One member left in the channel ${oldState.channel.name}`);

                    for (const [id, member] of oldState.channel.members)
                        if (!member.user.bot)
                            await pushDifference(id, member.user.tag);
                }
            }
            return;
        }
    });

    let exec = false;
    const save = async () => {
        logToFileFunctionTriggered(MODULE_NAME, 'save');

        if (exec) {
            const timestamps = getTimestamps();
            if (Object.keys(timestamps).length > 0) {
                consoleLog(`> Se cumplió el ciclo de 1 hora, enviando ${Object.keys(timestamps).length} estadísticas a la base de datos`, CONSOLE_BLUE);
                logToFile(`${MODULE_NAME}.save`, `Pushing all stats and restarting all timestamps after 1 hour loop completed`);

                await pushDifferences(true);
            }
        } else exec = true;

        timeouts[MODULE_NAME] = setTimeout(save, 1000 * 60 * 60);
    };
    save();
};

module.exports.config = {
    displayName: 'Contador de estadísticas',
    dbName: 'STATS_COUNTER'
}
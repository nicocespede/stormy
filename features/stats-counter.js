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

            /**
             * Determines if the voice state is related to a bot, or not.
             * 
             * @param {VoiceState} state The voice state.
             * @returns True if the voice state is related to a bot, or false if not.
             */
            const isBot = state => !(!state.member) && state.member.user.bot;

            /**
             * Determines if the voice state has voice channel, or not.
             * 
             * @param {VoiceState} state The voice state.
             * @returns True if the voice state has a voice channel, or false if not.
            */
            const hasChannel = state => !(!state.channelId || !state.channel);

            /**
             * Determines if the voice state is related to the AFK voice channel, or not.
             * 
             * @param {VoiceState} state The voice state.
             * @returns True if the voice state is related to the AFK voice channel, or false if not.
            */
            const isAfkChannel = state => hasChannel(state) && state.channelId === ids.channels.afk && state.channel.id === ids.channels.afk;

            const isSameChannel = hasChannel(oldState) && hasChannel(newState) && oldState.channelId === newState.channelId && oldState.channel.id === newState.channel.id;

            const { channel: oldChannel, member: oldMember } = oldState;

            // check for streaming or deafen/undeafen updates
            if (!isBot(oldState) && isSameChannel && !isAfkChannel(oldState)) {

                const isServerDeaf = oldState.serverDeaf !== null && newState.serverDeaf !== null && oldState.serverDeaf !== newState.serverDeaf;
                const isSelfDeaf = oldState.selfDeaf !== null && newState.selfDeaf !== null && oldState.selfDeaf !== newState.selfDeaf;
                const isDeaf = isServerDeaf || isSelfDeaf;
                const isStreaming = oldState.streaming !== null && newState.streaming !== null && oldState.streaming !== newState.streaming;

                // start counter if user undeafens or starts streaming while being deafened,
                // and stop counter if user deafens and is not streaming
                if (isDeaf || isStreaming) {
                    logToFile(moduleName, `${oldMember.user.tag} has been muted/deafened in the voice channel ${oldChannel.name}`);

                    const { invalid, size, valid } = await getMembersStatus(oldChannel);

                    if (size >= 2) {
                        for (const member of valid) {
                            const { id } = member;
                            if (!timestamps[id])
                                addTimestamp(id, new Date());
                        }

                        await pushDifferences(false, invalid.map(m => m.id));
                    } else
                        for (const [id, member] of oldChannel.members) {
                            const { user } = member;
                            if (!user.bot)
                                await pushDifference(id, user.tag);
                        }
                }
                return;
            }

            const { channel: newChannel, member: newMember } = newState;

            //check for new channel
            if (isDefaultGuild(newState) && hasChannel(newState) && !isAfkChannel(newState) && newMember) {
                const { id, user } = newMember;
                const { tag } = user;

                logToFile(moduleName, `${tag} joined the voice channel ${newChannel.name}`);

                const { size, valid } = await getMembersStatus(newChannel);

                if (size === 2)
                    for (const member of valid) {
                        const { id: memberId } = member;
                        if (!timestamps[memberId])
                            addTimestamp(memberId, new Date());
                    }
                else if (size > 2 || isBot(newState)) {
                    if (!timestamps[id])
                        addTimestamp(id, new Date());
                } else
                    await pushDifference(id, tag);
            } else if (oldMember) {
                const { id, user } = oldMember;
                const { tag } = user;
                logToFile(moduleName, `${tag} left the voice channel ${oldChannel.name}`);

                await pushDifference(id, tag);
            }

            //check for old channel
            if (isDefaultGuild(oldState) && hasChannel(oldState) && !isAfkChannel(oldState)) {

                const { size } = await getMembersStatus(oldChannel);

                if (size === 1 && Object.keys(timestamps).length > 0) {
                    logToFile(moduleName, `One member left in the voice channel ${oldChannel.name}`);

                    for (const [id, member] of oldChannel.members)
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
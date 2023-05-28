const { getLastAction } = require("../src/cache");
const { MusicActions } = require("../src/constants");
const { leaveEmptyChannel, setNewVoiceChannel, setKicked } = require("../src/music");

module.exports = client => {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        // ignore if someone connects
        if (!oldState.channelId) return;
        // start the disconnection timer if another user disconnects from the same channel
        if (newState.id !== client.user.id) {
            if (oldState.channel.members.has(client.user.id) && (oldState.channelId !== newState.channelId ||
                ((!oldState.serverDeaf && newState.serverDeaf) || (!oldState.selfDeaf && newState.selfDeaf)))) {
                await new Promise(res => setTimeout(res, 60 * 1000));
                const channel = await client.channels.fetch(oldState.channelId).catch(console.error);
                const deafenedMembers = [...channel.members].filter(([_, member]) => member.voice.selfDeaf || member.voice.serverDeaf);
                if (channel.members.has(client.user.id) && (channel.members.size === 1 || deafenedMembers.length === channel.members.size))
                    leaveEmptyChannel(oldState.guild);
            }
            return;
        }
        // ignore if mute/deafen update
        if (oldState.channelId === newState.channelId) return;
        // send message if the bot is moved to another channel
        if (oldState.channelId !== newState.channelId && newState.channelId) {
            setNewVoiceChannel(newState.guild, newState.channel);
            return;
        }
        // clear the queue if was kicked
        const { action: lastAction } = getLastAction();
        if (lastAction && lastAction !== MusicActions.LEAVING_EMPTY_CHANNEL && lastAction !== MusicActions.STOPPING
            && lastAction !== MusicActions.ENDING && lastAction !== MusicActions.RESTARTING && lastAction !== MusicActions.ERROR)
            setKicked();
        return;
    });
};

module.exports.config = {
    displayName: 'Kickeo o cambio de canal del bot de música',
    dbName: 'MUSIC_BOT_KICK_OR_MOVE'
}
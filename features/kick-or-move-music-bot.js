const { getLastAction, musicActions, ids } = require("../app/cache");
const { leaveEmptyChannel, setNewVoiceChannel, setKicked } = require("../app/music");

module.exports = client => {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        // ignore if someone connects
        if (oldState.channelId === null) return;
        // start the disconnection timer if another user disconnects from the same channel
        if (newState.id != client.user.id) {
            if (oldState.channelId != newState.channelId && oldState.channel.members.has(client.user.id)) {
                new Promise(res => setTimeout(res, 60000)).then(() => {
                    client.channels.fetch(oldState.channelId).then(channel => {
                        if (channel.members.size === 1 && channel.members.has(client.user.id))
                            leaveEmptyChannel(client, oldState.guild);
                    }).catch(console.error);
                });
            }
            return;
        }
        // ignore if mute/deafen update
        if (oldState.channelId === newState.channelId) return;
        // send message if the bot is moved to another channel
        if (oldState.channelId !== newState.channelId && newState.channelId != null) {
            setNewVoiceChannel(client, newState.guild, newState.channel);
            return;
        }
        // clear the queue if was kicked
        if (getLastAction() != musicActions.leavingEmptyChannel && getLastAction() != musicActions.stopping
            && getLastAction() != musicActions.ending)
            setKicked(client, oldState.guild);
        return;
    });
};

module.exports.config = {
    displayName: 'Kickeo o cambio de canal del bot de música',
    dbName: 'MUSIC_BOT_KICK_OR_MOVE'
}
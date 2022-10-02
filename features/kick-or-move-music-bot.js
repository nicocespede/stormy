const { getLastAction } = require("../app/cache");
const { musicActions } = require("../app/constants");
const { leaveEmptyChannel, setNewVoiceChannel, setKicked } = require("../app/music");

const allMembersAreDeafened = async members => {
    let ret = true;
    members.each(member => {
        if (!member.user.bot && !member.voice.selfDeaf && !member.voice.serverDeaf) {
            ret = false;
            return;
        }
    });
    return ret;
};
module.exports = client => {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        // ignore if someone connects
        if (oldState.channelId === null) return;
        // start the disconnection timer if another user disconnects from the same channel
        if (newState.id != client.user.id) {
            if (oldState.channel.members.has(client.user.id) && (oldState.channelId != newState.channelId ||
                ((!oldState.serverDeaf && newState.serverDeaf) || (!oldState.selfDeaf && newState.selfDeaf)))) {
                new Promise(res => setTimeout(res, 60 * 1000)).then(() => {
                    client.channels.fetch(oldState.channelId).then(async channel => {
                        if (channel.members.has(client.user.id) && (channel.members.size === 1 || await allMembersAreDeafened(channel.members)))
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
        if (getLastAction() != musicActions.LEAVING_EMPTY_CHANNEL && getLastAction() != musicActions.STOPPING
            && getLastAction() != musicActions.ENDING && getLastAction() != musicActions.RESTARTING)
            setKicked(client, oldState.guild);
        return;
    });
};

module.exports.config = {
    displayName: 'Kickeo o cambio de canal del bot de música',
    dbName: 'MUSIC_BOT_KICK_OR_MOVE'
}
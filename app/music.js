const { MessageAttachment, MessageEmbed } = require("discord.js");
const { ids, updateLastAction, musicActions } = require("./cache");

function isAMusicChannel(id) {
    var ret = false;
    ids.channels.musica.forEach(channel => {
        if (id === channel)
            ret = true;
    });
    return ret;
}

function setNewVoiceChannel(client, guild, channel) {
    updateLastAction(musicActions.changingChannel);
    var queue = client.player.getQueue(guild.id);
    queue.metadata.send({
        embeds: [new MessageEmbed().setColor([195, 36, 255])
            .setDescription(`🔃 Fui movido al canal de voz **${channel.name}**.`)
            .setThumbnail(`attachment://icons8-change-64.png`)],
        files: [new MessageAttachment(`./assets/thumbs/music/icons8-change-64.png`)]
    });
}

function setKicked(client, guild) {
    updateLastAction(musicActions.beingKicked);
    var queue = client.player.getQueue(guild.id);
    queue.metadata.send({
        embeds: [new MessageEmbed().setColor([195, 36, 255])
            .setDescription("⚠️ Fui desconectado del canal de voz, 👋 ¡adiós!")
            .setThumbnail(`attachment://icons8-disconnected-64.png`)],
        files: [new MessageAttachment(`./assets/thumbs/music/icons8-disconnected-64.png`)]
    });
    queue.destroy();
}

function containsAuthor(track) {
    const author = track.author.split(' ');
    var ret = false;
    for (let i = 0; i < author.length; i++) {
        const element = author[i].toLowerCase();
        if (track.title.toLowerCase().includes(element)) {
            ret = true;
            break;
        }
    }
    return ret;
}

module.exports = { isAMusicChannel, setNewVoiceChannel, setKicked, containsAuthor }
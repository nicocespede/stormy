const { MessageEmbed } = require("discord.js");
const { ids, updateLastAction, musicActions } = require("./cache");

module.exports = {
    isAMusicChannel: (id) => {
        var ret = false;
        ids.channels.musica.forEach(channel => {
            if (id === channel)
                ret = true;
        });
        return ret;
    },

    setNewVoiceChannel: (client, guild, channel) => {
        updateLastAction(musicActions.changingChannel);
        var queue = client.player.getQueue(guild.id);
        queue.metadata.send({
            embeds: [new MessageEmbed().setColor([195, 36, 255])
                .setDescription(`🔃 Fui movido al canal de voz **${channel.name}**.`)
                .setThumbnail(`attachment://icons8-change-64.png`)],
            files: [`./assets/thumbs/music/icons8-change-64.png`]
        });
    },

    setKicked: (client, guild) => {
        updateLastAction(musicActions.beingKicked);
        var queue = client.player.getQueue(guild.id);
        if (queue)
            queue.metadata.send({
                embeds: [new MessageEmbed().setColor([195, 36, 255])
                    .setDescription("⚠️ Fui desconectado del canal de voz, 👋 ¡adiós!")
                    .setThumbnail(`attachment://icons8-disconnected-64.png`)],
                files: [`./assets/thumbs/music/icons8-disconnected-64.png`]
            });
        queue.destroy();
    },

    containsAuthor: (track) => {
        const author = track.author.split(' ');
        var ret = false;
        for (let i = 0; i < author.length; i++) {
            const element = author[i].toLowerCase();
            if (track.title.toLowerCase().includes(element)) {
                ret = true;
                break;
            }
        }
        if (!ret) {
            const title = track.title.split(' ');
            for (let i = 0; i < title.length; i++) {
                const element = title[i].toLowerCase();
                if (track.author.toLowerCase().includes(element)) {
                    ret = true;
                    break;
                }
            }
        }
        return ret;
    },

    leaveEmptyChannel: (client, guild) => {
        updateLastAction(musicActions.leavingEmptyChannel);
        var queue = client.player.getQueue(guild.id);
        queue.metadata.send({
            embeds: [new MessageEmbed().setColor([195, 36, 255])
                .setDescription("🔇 Ya no queda nadie escuchando música, 👋 ¡adiós!")
                .setThumbnail(`attachment://icons8-no-audio-64.png`)],
            files: [`./assets/thumbs/music/icons8-no-audio-64.png`]
        });
        queue.destroy();
    }
}
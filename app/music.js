const { QueryType } = require("discord-player");
const { EmbedBuilder } = require("discord.js");
const chalk = require('chalk');
chalk.level = 1;
const { updateLastAction, getTracksNameExtras, updateTracksNameExtras } = require("./cache");
const { MusicActions, githubRawURL, color } = require("./constants");
const { addQueue } = require("./mongodb");

module.exports = {
    setNewVoiceChannel: (client, guild, channel) => {
        updateLastAction(MusicActions.CHANGING_CHANNEL);
        const queue = client.player.getQueue(guild.id);
        if (queue)
            queue.metadata.send({
                embeds: [new EmbedBuilder().setColor(color)
                    .setDescription(`🔃 Fui movido al canal de voz **${channel.name}**.`)
                    .setThumbnail(`${githubRawURL}/assets/thumbs/music/change.png`)]
            });
    },

    setKicked: (client, guild) => {
        updateLastAction(MusicActions.BEING_KICKED);
        const queue = client.player.getQueue(guild.id);
        if (queue) {
            queue.metadata.send({
                embeds: [new EmbedBuilder().setColor(color)
                    .setDescription("⚠️ Fui desconectado del canal de voz, 👋 ¡adiós!")
                    .setThumbnail(`${githubRawURL}/assets/thumbs/music/disconnected.png`)]
            });
            queue.destroy();
        }
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
        updateLastAction(MusicActions.LEAVING_EMPTY_CHANNEL);
        const queue = client.player.getQueue(guild.id);
        if (queue) {
            queue.metadata.send({
                embeds: [new EmbedBuilder().setColor(color)
                    .setDescription("🔇 Ya no queda nadie escuchando música, 👋 ¡adiós!")
                    .setThumbnail(`${githubRawURL}/assets/thumbs/music/so-so.png`)]
            });
            queue.destroy();
        }
    },

    emergencyShutdown: async (client, guildId) => {
        updateLastAction(MusicActions.RESTARTING);
        const queue = client.player.getQueue(guildId);
        if (queue) {
            console.log(chalk.yellow('> Guardando cola de reproducción actual'));
            await queue.metadata.send({
                embeds: [new EmbedBuilder().setColor(color)
                    .setDescription(`⚠ Lo siento, tengo que reiniciarme 👋 ¡ya vuelvo!`)
                    .setThumbnail(`${githubRawURL}/assets/thumbs/music/restart.png`)]
            });
            const previousTracks = queue.previousTracks.slice();
            const currenTrack = previousTracks.pop();
            const current = { url: currenTrack.url, requestedBy: currenTrack.requestedBy };
            const previous = [];
            const tracks = [];
            previousTracks.forEach(track => {
                previous.push({ url: track.url, requestedBy: track.requestedBy });
            });
            queue.tracks.forEach(track => {
                tracks.push({ url: track.url, requestedBy: track.requestedBy });
            });
            await addQueue(current, queue.guild.id, queue.metadata.id, previous, tracks, queue.connection.channel.id);
            if (!queue.destroyed)
                queue.destroy(true);
        }
    },

    playInterruptedQueue: async client => {
        const previousQueueSchema = require('../models/previousQueue-schema');
        const results = await previousQueueSchema.find({});
        if (results.length > 0) {
            const previousQueue = results[0];
            const current = previousQueue.current;
            const guild = await client.guilds.fetch(previousQueue.guildId).catch(console.error);
            const metadata = await guild.channels.fetch(previousQueue.metadataId).catch(console.error);
            const previousTracks = previousQueue.previousTracks;
            const tracks = previousQueue.tracks;
            const voiceChannel = await guild.channels.fetch(previousQueue.voiceChannelId).catch(console.error);
            const embed = new EmbedBuilder().setColor(color);

            if (voiceChannel.members.size > 0) {
                console.log(chalk.yellow('> Reanudando reproducción interrumpida por el reinicio'));

                var res = await client.player.search(current.url, {
                    requestedBy: await guild.members.fetch(current.requestedBy),
                    searchEngine: QueryType.AUTO
                });

                const queue = await client.player.createQueue(guild, {
                    metadata: metadata
                });

                try {
                    if (!queue.connection) await queue.connect(voiceChannel)
                } catch {
                    await client.player.deleteQueue(guild.id);
                    metadata.send({
                        embeds: [embed.setDescription(`🛑 No me puedo unir al canal de voz.`)
                            .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)]
                    });
                    await previousQueueSchema.deleteMany({});
                    return;
                }

                await metadata.send({
                    embeds: [embed.setDescription(`⌛ Cargando cola de canciones interrumpida...`)
                        .setThumbnail(`${githubRawURL}/assets/thumbs/music/hourglass-sand-top.png`)]
                });

                const { joinVoiceChannel } = require('@discordjs/voice');
                joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    selfDeaf: true
                });

                queue.addTrack(res.tracks[0]);

                if (!queue.playing) await queue.play();

                for (let i = 0; i < previousTracks.length; i++) {
                    const element = previousTracks[i];
                    res = await client.player.search(element.url, {
                        requestedBy: await guild.members.fetch(element.requestedBy),
                        searchEngine: QueryType.AUTO
                    });
                    queue.previousTracks.push(res.tracks[0]);
                }

                for (let i = 0; i < tracks.length; i++) {
                    const element = tracks[i];
                    res = await client.player.search(element.url, {
                        requestedBy: await guild.members.fetch(element.requestedBy),
                        searchEngine: QueryType.AUTO
                    });
                    queue.tracks.push(res.tracks[0]);
                }

            } else {
                await metadata.send({
                    embeds: [embed.setDescription(`🤷🏼‍♂️ Se fueron todos, ¡así que yo también!`)
                        .setThumbnail(`${githubRawURL}/assets/thumbs/music/so-so.png`)]
                });
            }
            await previousQueueSchema.deleteMany({});
        }
    },

    cleanTitle: async title => {
        let newTitle = title;
        const tracksNameExtras = getTracksNameExtras() || await updateTracksNameExtras();
        for (const extra of tracksNameExtras)
            if (newTitle.includes(extra))
                newTitle = newTitle.replace(extra, '');
        return newTitle;
    }
}
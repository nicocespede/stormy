const { QueryType } = require("discord-player");
const { MessageEmbed } = require("discord.js");
const { updateLastAction } = require("./cache");
const { musicActions } = require("./constants");
const { addQueue, executeQuery } = require("./postgres");

module.exports = {
    setNewVoiceChannel: (client, guild, channel) => {
        updateLastAction(musicActions.CHANGING_CHANNEL);
        const queue = client.player.getQueue(guild.id);
        if (queue)
            queue.metadata.send({
                embeds: [new MessageEmbed().setColor([195, 36, 255])
                    .setDescription(`🔃 Fui movido al canal de voz **${channel.name}**.`)
                    .setThumbnail(`attachment://icons8-change-64.png`)],
                files: [`./assets/thumbs/music/icons8-change-64.png`]
            });
    },

    setKicked: (client, guild) => {
        updateLastAction(musicActions.BEING_KICKED);
        const queue = client.player.getQueue(guild.id);
        if (queue) {
            queue.metadata.send({
                embeds: [new MessageEmbed().setColor([195, 36, 255])
                    .setDescription("⚠️ Fui desconectado del canal de voz, 👋 ¡adiós!")
                    .setThumbnail(`attachment://icons8-disconnected-64.png`)],
                files: [`./assets/thumbs/music/icons8-disconnected-64.png`]
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
        updateLastAction(musicActions.LEAVING_EMPTY_CHANNEL);
        const queue = client.player.getQueue(guild.id);
        if (queue) {
            queue.metadata.send({
                embeds: [new MessageEmbed().setColor([195, 36, 255])
                    .setDescription("🔇 Ya no queda nadie escuchando música, 👋 ¡adiós!")
                    .setThumbnail(`attachment://icons8-no-audio-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-audio-64.png`]
            });
            queue.destroy();
        }
    },

    emergencyShutdown: async (client, guildId) => {
        updateLastAction(musicActions.RESTARTING);
        const queue = client.player.getQueue(guildId);
        if (queue) {
            console.log('> Guardando cola de reproducción actual');
            queue.metadata.send({
                embeds: [new MessageEmbed().setColor([195, 36, 255])
                    .setDescription(`⚠ Lo siento, tengo que reiniciarme 👋 ¡${queue.tracks.length < 500 ? 'ya vuelvo' : 'adiós'}!`)
                    .setThumbnail(`attachment://icons8-shutdown-64.png`)],
                files: [`./assets/thumbs/music/icons8-shutdown-64.png`]
            });
            if (queue.tracks.length < 500) {
                var previousTracks = queue.previousTracks.slice();
                await addQueue(
                    JSON.stringify(previousTracks.pop()).replace(/'/g, 'APOSTROFE'),
                    JSON.stringify(queue.guild),
                    JSON.stringify(queue.metadata),
                    JSON.stringify(previousTracks).replace(/'/g, 'APOSTROFE'),
                    JSON.stringify(queue.tracks).replace(/'/g, 'APOSTROFE'),
                    JSON.stringify(queue.connection.channel)
                );
            }
            queue.destroy(true);
        }
    },

    playInterruptedQueue: async client => {
        await executeQuery('SELECT * FROM "previousQueue";').then(async json => {
            if (json.length > 0) {
                const current = JSON.parse(json[0]['current'].replace(/APOSTROFE/g, "'"));
                const guild = await client.guilds.fetch(JSON.parse(json[0]['guild']).id).catch(console.error);
                const metadata = await guild.channels.fetch(JSON.parse(json[0]['metadata']).id).catch(console.error);
                const previousTracks = JSON.parse(json[0]['previousTracks'].replace(/APOSTROFE/g, "'"));
                const tracks = JSON.parse(json[0]['tracks'].replace(/APOSTROFE/g, "'"));
                const voiceChannel = await guild.channels.fetch(JSON.parse(json[0]['voiceChannel']).id).catch(console.error);

                if (voiceChannel.members.size > 0) {
                    console.log('> Reanudando reproducción interrumpida por el reinicio');

                    var res = await client.player.search(current.url, {
                        requestedBy: await guild.members.fetch(current.requestedBy),
                        searchEngine: QueryType.AUTO
                    });

                    const queue = await client.player.createQueue(guild, {
                        metadata: metadata
                    });

                    var embed = new MessageEmbed().setColor([195, 36, 255]);
                    var message = { files: [`./assets/thumbs/music/icons8-no-entry-64.png`] };

                    try {
                        if (!queue.connection) await queue.connect(voiceChannel)
                    } catch {
                        await client.player.deleteQueue(guild.id);
                        message.embeds = [embed.setDescription(`🛑 No me puedo unir al canal de voz.`)
                            .setThumbnail(`attachment://icons8-no-entry-64.png`)];
                        metadata.send(message);
                    }

                    message.embeds = [embed.setDescription(`⌛ Cargando cola de canciones interrumpida...`)
                        .setThumbnail(`attachment://icons8-sand-timer-64.png`)];
                    message.files = [`./assets/thumbs/music/icons8-sand-timer-64.png`];
                    await metadata.send(message);

                    const { joinVoiceChannel } = require('@discordjs/voice');
                    joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: voiceChannel.guild.id,
                        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                        selfDeaf: true
                    });

                    queue.addTrack(res.tracks[0]);

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

                    if (!queue.playing) await queue.play();
                } else
                    console.log('> No hay usuarios para reanudar la reproducción interrumpida');
                await executeQuery('DELETE FROM "previousQueue";').catch(console.error);
            }
        }).catch(console.error);
    }
}
const { QueryType } = require('discord-player');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { updateLastAction, getPlaylists, updatePlaylists, getIds, updateIds, addSongInQueue,
    //TEMP SOLUTION
    getBlacklistedSongs, updateBlacklistedSongs//
} = require('../../src/cache');
const { MusicActions, githubRawURL } = require('../../src/constants');
const { containsAuthor, cleanTitle, handleErrorInMusicChannel, setMusicPlayerMessage } = require("../../src/music");

module.exports = {
    category: 'Música',
    description: 'Agrega una canción como siguiente a la cola.',
    aliases: ['agregar-seguido', 'play-next', 'p-next', 'add-next'],
    options: [
        {
            name: 'canción',
            description: 'La URL o el nombre de la canción que se quiere reproducir.',
            required: true,
            type: ApplicationCommandOptionType.String
        }
    ],
    slash: 'both',

    minArgs: 1,
    expectedArgs: '<URL ó canción>',
    guildOnly: true,

    callback: async ({ guild, member, user, message, channel, client, interaction, text, instance }) => {
        const embed = new EmbedBuilder().setColor(instance.color);
        var song = message ? text : interaction.options.getString('canción');
        const reply = { custom: true, ephemeral: true };

        if (interaction) await interaction.deferReply();

        const ids = getIds() || await updateIds();
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `🛑 Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            return reply;
        }

        if (!member.voice.channel) {
            reply.embeds = [embed.setDescription(`🛑 ¡Debes estar en un canal de voz para usar este comando!`)
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            handleErrorInMusicChannel(message, interaction, reply, channel);
            return;
        }

        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            reply.embeds = [embed.setDescription(`🛑 ¡Debes estar en el mismo canal de voz que yo para usar este comando!`)
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            handleErrorInMusicChannel(message, interaction, reply, channel);
            return;
        }

        const playlists = getPlaylists() || await updatePlaylists();
        if (Object.keys(playlists).includes(song.toLowerCase()))
            song = playlists[song.toLowerCase()].url;

        //TEMP SOLUTION
        const blacklistedSongs = getBlacklistedSongs() || await updateBlacklistedSongs();
        if (Object.keys(blacklistedSongs).includes(song)) {
            song = blacklistedSongs[song];
        }//

        const res = await client.player.search(song, {
            requestedBy: member,
            searchEngine: QueryType.AUTO
        });

        if (!res || !res.tracks.length) {
            reply.embeds = [embed.setDescription(`🛑 ¡${user}, no se encontraron resultados! `)
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            handleErrorInMusicChannel(message, interaction, reply, channel);
            return;
        }

        const queue = await client.player.createQueue(guild, {
            metadata: channel
        });

        try {
            if (!queue.connection) await queue.connect(member.voice.channel)
        } catch {
            await client.player.deleteQueue(guild.id);
            reply.embeds = [embed.setDescription(`🛑 ${user}, no me puedo unir al canal de voz.`)
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        reply.embeds = [embed.setDescription(`⌛ Cargando ${res.playlist ? 'lista de reproducción' : 'canción'}...`)
            .setThumbnail(`${githubRawURL}/assets/thumbs/music/hourglass-sand-top.png`)];
        reply.ephemeral = false;
        const deferringMessage = message ? await message.reply(reply) : await interaction.editReply(reply);

        const voiceChannel = member.voice.channel;
        const { joinVoiceChannel } = require('@discordjs/voice');
        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: true
        });

        if (queue.tracks.length === 0) {
            updateLastAction(MusicActions.ADDING);
            addSongInQueue(res.tracks[0].url, message ? 'message' : 'interaction', message ? deferringMessage : interaction);
            res.playlist ? queue.addTracks(res.tracks) : queue.addTrack(res.tracks[0]);

            if (!queue.playing) await queue.play();
            return;
        }

        let description;
        let action;
        updateLastAction(MusicActions.ADDING_NEXT);
        if (res.playlist) {
            //TEMP SOLUTION
            for (let i = 0; i < res.tracks.length; i++) {
                const track = res.tracks[i];
                if (Object.keys(blacklistedSongs).includes(track.url)) {
                    const auxRes = await client.player.search(blacklistedSongs[track.url], {
                        requestedBy: member,
                        searchEngine: QueryType.AUTO
                    });
                    res.tracks[i] = auxRes.tracks[0];
                }
            }//
            const actualQueue = queue.tracks;
            queue.clear();
            const newQueue = res.tracks.concat(actualQueue);
            queue.addTracks(newQueue);
            description = `☑️ **${newQueue.length - actualQueue.length} canciones** de la lista de reproducción **[${res.playlist.title}](${res.playlist.url})** agregadas a la cola como siguientes.`;
            action = `s **${newQueue.length - actualQueue.length} canciones** de la lista de reproducción **[${res.playlist.title}](${res.playlist.url})**.`;
        } else {
            //TEMP SOLUTION
            if (Object.keys(blacklistedSongs).includes(res.tracks[0].url)) {
                const auxRes = await client.player.search(blacklistedSongs[res.tracks[0].url], {
                    requestedBy: member,
                    searchEngine: QueryType.AUTO
                });
                res.tracks[0] = auxRes.tracks[0];
            }//
            const track = res.tracks[0];
            queue.insert(track, 0);
            const filteredTitle = await cleanTitle(track.title);
            description = `☑️ Agregado a la cola como siguiente:\n\n[${filteredTitle}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ''}](${track.url}) - **${track.duration}**`;
            action = ` [${filteredTitle}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ''}](${track.url}).`;
        }
        const edit = {
            embeds: [embed.setDescription(description)
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/add-song.png`)]
        };
        message ? await deferringMessage.edit(edit) : await interaction.editReply(edit);

        addSongInQueue(res.tracks[0].url, message ? 'message' : 'interaction', message ? deferringMessage : interaction);
        setMusicPlayerMessage(queue, res.tracks[0], `☑️ ${message ? deferringMessage.mentions.repliedUser.tag : interaction.user.tag} agregó a la cola como siguiente${action}`);
        return;
    }

}
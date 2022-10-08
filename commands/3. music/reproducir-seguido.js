const { QueryType } = require('discord-player');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { updateLastAction, getPlaylists, updatePlaylists, getIds, updateIds, addSongInQueue,
    //TEMP SOLUTION
    getBlacklistedSongs, updateBlacklistedSongs//
} = require('../../app/cache');
const { MusicActions } = require('../../app/constants');
const { containsAuthor, cleanTitle } = require("../../app/music");

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

    callback: async ({ guild, member, user, message, channel, client, interaction, text }) => {
        const embed = new EmbedBuilder().setColor([195, 36, 255]);
        var song = message ? text : interaction.options.getString('canción');
        const reply = { custom: true, ephemeral: true, files: [`./assets/thumbs/music/icons8-no-entry-64.png`] };

        const ids = !getIds() ? await updateIds() : getIds();
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            reply.files = [];
            return reply;
        }

        if (!member.voice.channel) {
            reply.embeds = [embed.setDescription(`🛑 ¡Debes estar en un canal de voz para usar este comando!`)
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            reply.embeds = [embed.setDescription(`🛑 ¡Debes estar en el mismo canal de voz que yo para usar este comando!`)
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        if (interaction) await interaction.deferReply();
        const playlists = getPlaylists() || await updatePlaylists();
        if (Object.keys(playlists).includes(song.toLowerCase()))
            song = playlists[song.toLowerCase()];

        //TEMP SOLUTION
        const blacklistedSongs = !getBlacklistedSongs() ? await updateBlacklistedSongs() : getBlacklistedSongs();
        if (Object.keys(blacklistedSongs).includes(song)) {
            song = blacklistedSongs[song];
        }//

        const res = await client.player.search(song, {
            requestedBy: member,
            searchEngine: QueryType.AUTO
        });

        if (!res || !res.tracks.length) {
            reply.embeds = [embed.setDescription(`🛑 ¡${user}, no se encontraron resultados! `)
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const queue = await client.player.createQueue(guild, {
            metadata: channel
        });

        try {
            if (!queue.connection) await queue.connect(member.voice.channel)
        } catch {
            await client.player.deleteQueue(guild.id);
            reply.embeds = [embed.setDescription(`🛑 ${user}, no me puedo unir al canal de voz.`)
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        reply.embeds = [embed.setDescription(`⌛ Cargando ${res.playlist ? 'lista de reproducción' : 'canción'}...`)
            .setThumbnail(`attachment://icons8-sand-timer-64.png`)];
        reply.ephemeral = false;
        reply.files = [`./assets/thumbs/music/icons8-sand-timer-64.png`];
        const deferringMessage = message ? await message.reply(reply) : await interaction.editReply(reply);

        const voiceChannel = member.voice.channel;
        const { joinVoiceChannel } = require('@discordjs/voice');
        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: true
        });

        if (queue.tracks.length != 0) {
            let description;
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
                description = `☑️ **${newQueue.length - actualQueue.length} canciones** agregadas a la cola como siguientes.`;
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
            }
            const edit = {
                embeds: [embed.setDescription(description)
                    .setThumbnail(`attachment://icons8-add-song-64.png`)],
                files: [`./assets/thumbs/music/icons8-add-song-64.png`]
            };
            message ? await deferringMessage.edit(edit) : await interaction.editReply(edit);
            return;
        } else {
            updateLastAction(MusicActions.ADDING);
            addSongInQueue(res.tracks[0].url, message ? 'message' : 'interaction', message ? deferringMessage : interaction);
            res.playlist ? queue.addTracks(res.tracks) : queue.addTrack(res.tracks[0]);
        }

        if (!queue.playing) await queue.play();
        return;
    }

}
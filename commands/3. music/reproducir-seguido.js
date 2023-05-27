const { ICommand } = require("wokcommands");
const { QueryType, useMasterPlayer } = require('discord-player');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { updateLastAction, getPlaylists, updatePlaylists, getIds, addSongInQueue, getGithubRawUrl, removeSongInQueue,
    //TEMP SOLUTION
    getBlacklistedSongs//
} = require('../../src/cache');
const { MusicActions } = require('../../src/constants');
const { containsAuthor, cleanTitle, setMusicPlayerMessage, handleErrorEphemeral, handleError, createQueue, connectToVoiceChannel } = require("../../src/music");
const { consoleLogError, logToFileError, logToFileCommandUsage } = require('../../src/util');

const MODULE_NAME = 'commands.music.reproducir-seguido';

/**@type {ICommand}*/
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

    callback: async ({ guild, member, user, message, channel, interaction, text, instance }) => {
        logToFileCommandUsage(MODULE_NAME, text, interaction, user);

        const embed = new EmbedBuilder().setColor(instance.color);
        var song = message ? text : interaction.options.getString('canción');
        const reply = { ephemeral: true };

        const ids = await getIds();
        if (!ids.channels.musica.includes(channel.id)) {
            handleErrorEphemeral(reply, embed, `🛑 Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, message, interaction, channel);
            return;
        }

        if (!member.voice.channel) {
            handleErrorEphemeral(reply, embed, `🛑 ¡Debes estar en un canal de voz para usar este comando!`, message, interaction, channel);
            return;
        }

        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            handleErrorEphemeral(reply, embed, `🛑 ¡Debes estar en el mismo canal de voz que yo para usar este comando!`, message, interaction, channel);
            return;
        }

        if (interaction) await interaction.deferReply();

        const playlists = getPlaylists() || await updatePlaylists();
        if (Object.keys(playlists).includes(song.toLowerCase()))
            song = playlists[song.toLowerCase()].url;

        //TEMP SOLUTION
        const blacklistedSongs = await getBlacklistedSongs();
        if (Object.keys(blacklistedSongs).includes(song)) {
            song = blacklistedSongs[song];
        }//

        const player = useMasterPlayer();
        const res = await player.search(song, {
            requestedBy: member,
            searchEngine: QueryType.AUTO
        });

        if (!res || !res.tracks.length) {
            await handleError(reply, embed, `🛑 ¡${user}, no se encontraron resultados! `, message, interaction, channel);
            return;
        }

        const queue = createQueue(player, guild, channel);

        if (!(await connectToVoiceChannel(queue, member, player, reply, embed, message, interaction)))
            return;

        reply.embeds = [embed.setDescription(`⌛ Cargando ${res.playlist ? 'lista de reproducción' : 'canción'}...`)
            .setThumbnail(await getGithubRawUrl(`assets/thumbs/music/hourglass-sand-top.png`))];
        reply.ephemeral = false;
        const deferringMessage = message ? await message.reply(reply) : await interaction.editReply(reply);

        if (queue.isEmpty()) {
            updateLastAction(MusicActions.ADDING);
            addSongInQueue(res.tracks[0].url, message ? 'message' : 'interaction', message ? deferringMessage : interaction);
            res.playlist ? queue.addTrack(res.tracks) : queue.addTrack(res.tracks[0]);

            if (!queue.node.isPlaying())
                try {
                    await queue.node.play();
                } catch (e) {
                    updateLastAction(MusicActions.ERROR);
                    if (message)
                        deferringMessage.delete();
                    removeSongInQueue(res.tracks[0].url);
                    queue.delete();
                    consoleLogError(`> Error al iniciar reproducción de música, URL: [${res.tracks[0].url}]`)
                    logToFileError(MODULE_NAME, e);
                    handleError(reply, embed, '❌ Error al iniciar reproductor de música.\n\n_Intenta usar la URL directa de la canción, o una URL diferente._', message, interaction, channel);
                }
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
                    const auxRes = await player.search(blacklistedSongs[track.url], {
                        requestedBy: member,
                        searchEngine: QueryType.AUTO
                    });
                    res.tracks[i] = auxRes.tracks[0];
                }
            }//
            const actualQueue = queue.tracks.toArray();
            queue.tracks.clear();
            const newQueue = res.tracks.concat(actualQueue);
            queue.addTrack(newQueue);
            description = `☑️ **${newQueue.length - actualQueue.length} canciones** de la lista de reproducción **[${res.playlist.title}](${res.playlist.url})** agregadas a la cola como siguientes.`;
            action = `s **${newQueue.length - actualQueue.length} canciones** de la lista de reproducción **[${res.playlist.title}](${res.playlist.url})**.`;
        } else {
            //TEMP SOLUTION
            if (Object.keys(blacklistedSongs).includes(res.tracks[0].url)) {
                const auxRes = await player.search(blacklistedSongs[res.tracks[0].url], {
                    requestedBy: member,
                    searchEngine: QueryType.AUTO
                });
                res.tracks[0] = auxRes.tracks[0];
            }//
            const track = res.tracks[0];
            queue.insertTrack(track, 0);
            const filteredTitle = await cleanTitle(track.title);
            description = `☑️ Agregado a la cola como siguiente:\n\n[${filteredTitle}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ''}](${track.url}) - **${track.duration}**`;
            action = ` [${filteredTitle}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ''}](${track.url}).`;
        }
        const edit = {
            embeds: [embed.setDescription(description)
                .setThumbnail(await getGithubRawUrl(`assets/thumbs/music/add-song.png`))]
        };
        message ? await deferringMessage.edit(edit) : await interaction.editReply(edit);

        addSongInQueue(res.tracks[0].url, message ? 'message' : 'interaction', message ? deferringMessage : interaction);
        setMusicPlayerMessage(queue, res.tracks[0], `☑️ ${message ? deferringMessage.mentions.repliedUser.tag : interaction.user.tag} agregó a la cola como siguiente${action}`);
    }

}
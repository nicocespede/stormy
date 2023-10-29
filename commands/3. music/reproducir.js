const { ICommand } = require("wokcommands");
const { QueryType, useMainPlayer } = require('discord-player');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { updateLastAction, getPlaylists, updatePlaylists, getIds, addSongInQueue, getGithubRawUrl, removeSongInQueue,
    //TEMP SOLUTION
    getBlacklistedSongs//
} = require('../../src/cache');
const { MusicActions } = require('../../src/constants');
const { handleError, handleErrorEphemeral, createQueue, connectToVoiceChannel } = require('../../src/music');
const { logToFileError, logToFileCommandUsage, consoleLogError } = require('../../src/util');

const COMMAND_NAME = 'reproducir';
const MODULE_NAME = 'commands.music.' + COMMAND_NAME;

/**@type {ICommand}*/
module.exports = {
    category: 'Música',
    description: 'Reproduce una canción o la agrega a la cola si ya se está reproduciendo.',
    aliases: ['agregar', 'play', 'p', 'add'],
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
    expectedArgs: '[URL ó canción]',
    guildOnly: true,

    callback: async ({ guild, member, user, message, channel, interaction, text, instance }) => {
        logToFileCommandUsage(COMMAND_NAME, text, interaction, user);

        const embed = new EmbedBuilder().setColor(instance.color);
        let song = message ? text : interaction.options.getString('canción');
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
        if (Object.keys(blacklistedSongs).includes(song))
            song = blacklistedSongs[song];//

        const player = useMainPlayer();
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
            .setThumbnail(await getGithubRawUrl('assets/thumbs/music/hourglass-sand-top.png'))];
        reply.ephemeral = false;
        const deferringMessage = message ? await message.reply(reply) : await interaction.editReply(reply);

        updateLastAction(MusicActions.ADDING);

        //TEMP SOLUTION
        for (let i = 0; i < res.tracks.length; i++) {
            const { url } = res.tracks[i];
            if (Object.keys(blacklistedSongs).includes(url)) {
                const auxRes = await player.search(blacklistedSongs[url], {
                    requestedBy: member,
                    searchEngine: QueryType.AUTO
                });
                res.tracks[i] = auxRes.tracks[0];
            }
        }//

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
                if (!queue.deleted)
                    queue.delete();
                consoleLogError(`> Error al iniciar reproducción de música, URL: [${res.tracks[0].url}]`);
                logToFileError(MODULE_NAME, e);
                handleError(reply, embed, '❌ Error al iniciar reproductor de música.\n\n_Intenta usar la URL directa de la canción, o una URL diferente._', message, interaction, channel);
            }
    }
}
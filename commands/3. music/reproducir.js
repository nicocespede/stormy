const { QueryType, useMasterPlayer } = require('discord-player');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { updateLastAction, getPlaylists, updatePlaylists, getIds, addSongInQueue, getGithubRawUrl,
    //TEMP SOLUTION
    getBlacklistedSongs, updateBlacklistedSongs//
} = require('../../src/cache');
const { MusicActions } = require('../../src/constants');
const { handleError, handleErrorEphemeral, createQueue, connectToVoiceChannel } = require('../../src/music');

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
        const blacklistedSongs = getBlacklistedSongs() || await updateBlacklistedSongs();
        if (Object.keys(blacklistedSongs).includes(song))
            song = blacklistedSongs[song];//

        const player = useMasterPlayer();
        const res = await player.search(song, {
            requestedBy: member,
            searchEngine: QueryType.AUTO
        });

        if (!res || !res.tracks.length) {
            handleError(reply, embed, `🛑 ¡${user}, no se encontraron resultados! `, message, interaction, channel);
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
            await queue.node.play();

        return;
    }
}
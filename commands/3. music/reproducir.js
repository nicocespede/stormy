const { QueryType } = require('discord-player');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { updateLastAction, getPlaylists, updatePlaylists, getIds, updateIds, addSongInQueue,
    //TEMP SOLUTION
    getBlacklistedSongs, updateBlacklistedSongs//
} = require('../../app/cache');
const { MusicActions, githubRawURL } = require('../../app/constants');

module.exports = {
    category: 'Música',
    description: 'Reproduce una canción o la agrega a la cola si ya se está reproduciendo.',
    aliases: ['agregar', 'play', 'p', 'add'],
    options: [
        {
            name: 'canción',
            description: 'La URL o el nombre de la canción que se quiere reproducir.',
            required: false,
            type: ApplicationCommandOptionType.String
        }
    ],
    slash: 'both',

    expectedArgs: '[URL ó canción]',
    guildOnly: true,

    callback: async ({ guild, member, user, message, channel, client, interaction, text, instance }) => {
        const embed = new EmbedBuilder().setColor(instance.color);
        var song = message ? text : interaction.options.getString('canción');
        const reply = { custom: true, ephemeral: true };

        const ids = getIds() || await updateIds();
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            return reply;
        }

        if (!member.voice.channel) {
            reply.embeds = [embed.setDescription(`🛑 ¡Debes estar en un canal de voz para usar este comando!`)
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            reply.embeds = [embed.setDescription(`🛑 ¡Debes estar en el mismo canal de voz que yo para usar este comando!`)
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        if (!song || song === '') {
            const queue = client.player.getQueue(guild.id);

            if (!queue) {
                reply.embeds = [embed.setDescription("🛑 ¡No hay ninguna canción para reanudar!")
                    .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
                return reply;
            }

            const success = queue.setPaused(false);

            reply.embeds = [embed.setDescription(success ? "▶️ Música reanudada." : `🛑 ¡La música no está pausada!`)
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/${success ? `resume-button` : `no-entry`}.png`)];
            reply.ephemeral = false;
            return reply;
        } else {
            if (interaction) await interaction.deferReply();
            const playlists = getPlaylists() || await updatePlaylists();
            if (Object.keys(playlists).includes(song.toLowerCase()))
                song = playlists[song.toLowerCase()];

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
                message ? await message.reply(reply) : await interaction.editReply(reply);
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
                message ? await message.reply(reply) : await interaction.editReply(reply);
                return;
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

            updateLastAction(MusicActions.ADDING);

            //TEMP SOLUTION
            if (res.playlist)
                for (let i = 0; i < res.tracks.length; i++) {
                    const track = res.tracks[i];
                    if (Object.keys(blacklistedSongs).includes(track.url)) {
                        const auxRes = await client.player.search(blacklistedSongs[track.url], {
                            requestedBy: member,
                            searchEngine: QueryType.AUTO
                        });
                        res.tracks[i] = auxRes.tracks[0];
                    }
                }
            else if (Object.keys(blacklistedSongs).includes(res.tracks[0].url)) {
                const auxRes = await client.player.search(blacklistedSongs[res.tracks[0].url], {
                    requestedBy: member,
                    searchEngine: QueryType.AUTO
                });
                res.tracks[0] = auxRes.tracks[0];
            }//
            addSongInQueue(res.tracks[0].url, message ? 'message' : 'interaction', message ? deferringMessage : interaction);

            res.playlist ? queue.addTracks(res.tracks) : queue.addTrack(res.tracks[0]);

            if (!queue.playing) await queue.play();
        }
        return;
    }
}
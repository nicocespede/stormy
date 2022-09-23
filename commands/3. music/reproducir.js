const { QueryType } = require('discord-player');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { updateLastAction, getPlaylists, updatePlaylists, getIds, updateIds,
    //TEMP SOLUTION
    getBlacklistedSongs, updateBlacklistedSongs//
} = require('../../app/cache');
const { ids, musicActions } = require('../../app/constants');

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

        if (!song || song === '') {
            const queue = client.player.getQueue(guild.id);

            if (!queue) {
                reply.embeds = [embed.setDescription("🛑 ¡No hay ninguna canción para reanudar!")
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)];
                return reply;
            }

            const success = queue.setPaused(false);

            reply.embeds = [embed.setDescription(success ? "▶️ Música reanudada." : `🛑 ¡La música no está pausada!`)
                .setThumbnail(success ? `attachment://icons8-resume-button-64.png` : `attachment://icons8-no-entry-64.png`)];
            reply.ephemeral = false;
            reply.files = [success ? `./assets/thumbs/music/icons8-resume-button-64.png` : `./assets/thumbs/music/icons8-no-entry-64.png`];
            return reply;
        } else {
            if (interaction) await interaction.deferReply();
            const playlists = getPlaylists().names.length === 0 ? await updatePlaylists() : getPlaylists();
            if (playlists.names.includes(song.toLowerCase()))
                song = playlists.urls[playlists.names.indexOf(song.toLowerCase())];

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
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)];
                message ? await message.reply(reply) : await interaction.editReply(reply);
                return;
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

            updateLastAction(musicActions.ADDING);

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

            res.playlist ? queue.addTracks(res.tracks) : queue.addTrack(res.tracks[0]);

            if (!queue.playing) await queue.play();
            message ? deferringMessage.delete() : interaction.deleteReply();
        }
        return;
    }
}
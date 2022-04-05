const { QueryType } = require('discord-player');
const { MessageEmbed } = require('discord.js');
const { updateLastAction, musicActions, getPlaylists } = require('../../app/cache');
const { isAMusicChannel, containsAuthor } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Agrega una canción como siguiente a la cola.',
    aliases: ['agregar-seguido', 'play-next', 'p-next', 'add-next'],
    options: [
        {
            name: 'canción',
            description: 'La URL o el nombre de la canción que se quiere reproducir.',
            required: true,
            type: 'STRING'
        }
    ],
    slash: 'both',

    expectedArgs: '<URL ó canción>',
    guildOnly: true,

    callback: async ({ guild, member, user, message, channel, client, interaction, text }) => {
        var embed = new MessageEmbed().setColor([195, 36, 255]);
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;
        if (!isAMusicChannel(channel.id)) {
            messageOrInteraction.reply({ content: `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, ephemeral: true });
            return;
        }
        if (!member.voice.channel) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription(`🛑 ¡Debes estar en un canal de voz para usar este comando!`)
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }
        if (guild.me.voice.channel && member.voice.channel.id !== guild.me.voice.channel.id) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription(`🛑 ¡Debes estar en el mismo canal de voz que yo para usar este comando!`)
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }

        var playlists = getPlaylists();
        if (playlists.names.includes(text.toLowerCase()))
            text = playlists.urls[playlists.names.indexOf(text.toLowerCase())];

        const res = await client.player.search(text, {
            requestedBy: member,
            searchEngine: QueryType.AUTO
        });

        if (!res || !res.tracks.length) {
            messageOrInteraction.reply({
                embeds: [embed.setDescription(`🛑 ¡${user}, no se encontraron resultados! `)
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }

        const queue = await client.player.createQueue(guild, {
            metadata: channel
        });

        try {
            if (!queue.connection) await queue.connect(member.voice.channel)
        } catch {
            await client.player.deleteQueue(guild.id);
            messageOrInteraction.reply({
                embeds: [embed.setDescription(`🛑 ${user}, no me puedo unir al canal de voz.`)
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                ephemeral: true
            });
            return;
        }

        const m = await messageOrInteraction.reply({
            embeds: [embed.setDescription(`⌛ Cargando ${res.playlist ? 'lista de reproducción' : 'canción'}...`)
                .setThumbnail(`attachment://icons8-sand-timer-64.png`)],
            files: [`./assets/thumbs/music/icons8-sand-timer-64.png`],
            ephemeral: true
        });

        let voiceChannel = member.voice.channel;
        const { joinVoiceChannel } = require('@discordjs/voice');
        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: true
        });

        if (queue.tracks.length != 0) {
            var description;
            updateLastAction(musicActions.addingNext);
            if (res.playlist) {
                var actualQueue = queue.tracks;
                queue.clear();
                var newQueue = res.tracks.concat(actualQueue);
                queue.addTracks(newQueue);
                description = `☑️ **${newQueue.length - actualQueue.length} canciones** agregadas a la cola como siguientes.`;
            } else {
                var track = res.tracks[0];
                queue.insert(track, 0);
                description = `☑️ Agregado a la cola como siguiente:\n\n[${track.title}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ''}](${track.url}) - **${track.duration}**`;
            }
            await messageOrInteraction.reply({
                embeds: [embed.setDescription(description)
                    .setThumbnail(`attachment://icons8-add-song-64.png`)],
                files: [`./assets/thumbs/music/icons8-add-song-64.png`]
            }).then(() => m.delete());
            return;
        } else {
            updateLastAction(musicActions.adding);
            if (res.playlist)
                queue.addTracks(res.tracks);
            else
                queue.addTrack(res.tracks[0]);
        }

        if (!queue.playing) await queue.play();
        m.delete();
        return;
    }

}
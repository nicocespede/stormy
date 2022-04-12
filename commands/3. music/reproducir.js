const { QueryType } = require('discord-player');
const { MessageEmbed, Constants } = require('discord.js');
const { musicActions, updateLastAction, getPlaylists, updatePlaylists } = require('../../app/cache');
const { isAMusicChannel } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Reproduce una canción o la agrega a la cola si ya se está reproduciendo.',
    aliases: ['agregar', 'play', 'p', 'add'],
    options: [
        {
            name: 'canción',
            description: 'La URL o el nombre de la canción que se quiere reproducir.',
            required: false,
            type: Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    slash: 'both',

    expectedArgs: '<URL ó canción>',
    guildOnly: true,

    callback: async ({ guild, member, user, message, channel, args, client, interaction, text }) => {
        var embed = new MessageEmbed().setColor([195, 36, 255]);
        var messageOrInteraction = message ? message : interaction;
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
        if (!args[0]) {
            const queue = client.player.getQueue(guild.id);

            if (!queue) {
                messageOrInteraction.reply({
                    embeds: [embed.setDescription("🛑 ¡No hay ninguna canción para reanudar!")
                        .setThumbnail(`attachment://icons8-no-entry-64.png`)],
                    files: [`./assets/thumbs/music/icons8-no-entry-64.png`],
                    ephemeral: true
                });
                return;
            }

            const success = queue.setPaused(false);

            messageOrInteraction.reply({
                embeds: [embed.setDescription(success ? "▶️ Música reanudada." : `🛑 ¡Ocurrió un error!`)
                    .setThumbnail(success ? `attachment://icons8-resume-button-64.png` : `attachment://icons8-no-entry-64.png`)],
                files: [success ? `./assets/thumbs/music/icons8-resume-button-64.png` : `./assets/thumbs/music/icons8-no-entry-64.png`]
            });
            return;
        } else {
            var playlists = getPlaylists().names.length === 0 ? await updatePlaylists() : getPlaylists();
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

            updateLastAction(musicActions.adding);

            if (res.playlist)
                queue.addTracks(res.tracks);
            else
                queue.addTrack(res.tracks[0]);

            if (!queue.playing) await queue.play();
            m.delete();
        }
        return;
    }
}
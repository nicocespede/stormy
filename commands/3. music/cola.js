const { EmbedBuilder } = require("discord.js");
const { ids } = require("../../app/constants");
const { containsAuthor, cleanTitle } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Muestra la cola de reproducción.',
    aliases: ['queue'],

    slash: 'both',

    maxArgs: 0,
    guildOnly: true,

    callback: async ({ guild, member, user, channel, client }) => {
        var errorEmbed = new EmbedBuilder().setColor([195, 36, 255]);
        var reply = { custom: true, ephemeral: true, files: [`./assets/thumbs/music/icons8-no-entry-64.png`] };
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            reply.files = [];
            return reply;
        }
        if (!member.voice.channel) {
            reply.embeds = [errorEmbed.setDescription("🛑 ¡Debes estar en un canal de voz para usar este comando!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            reply.embeds = [errorEmbed.setDescription("🛑 No hay música reproduciéndose.")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        if (!queue.tracks[0]) {
            reply.embeds = [errorEmbed.setDescription("🛑 ¡No hay más canciones en la cola!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const embed = new EmbedBuilder();

        embed.setColor([195, 36, 255]);
        embed.setThumbnail(`attachment://icons8-playlist-64.png`);

        const tracks = queue.tracks.map((track, i) => `**${i + 1}**. ${track.title}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ''} - ** ${track.duration} ** `);

        const songs = queue.tracks.length;

        const filteredTitle = await cleanTitle(queue.current.title);
        var description = `**▶️ Ahora reproduciendo:**\n\n${filteredTitle}${!queue.current.url.includes('youtube') || !containsAuthor(queue.current) ? ` | ${queue.current.author}` : ''} - **${queue.current.duration}**\n\n**📄 Cola de reproducción:**\n\n`
        var songsShown;
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const filteredTitle = await cleanTitle(track);
            var aux = description + filteredTitle + '\n';
            if (aux.length <= 4096)
                description = aux;
            else {
                songsShown = i - 1;
                break;
            }
        }

        embed.setDescription(description);

        embed.setFooter({ text: songs > songsShown ? `+otra${songs - songsShown > 1 ? 's' : ''} ${songs - songsShown === 1 ? 'canción' : `${songs - songsShown} canciones`}...` : `` });

        reply.embeds = [embed];
        reply.ephemeral = false;
        reply.files = [`./assets/thumbs/music/icons8-playlist-64.png`];
        return reply;
    }
}
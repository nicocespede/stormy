const { EmbedBuilder } = require("discord.js");
const { getIds, updateIds } = require("../../app/cache");
const { githubRawURL } = require("../../app/constants");
const { containsAuthor, cleanTitle } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Muestra la cola de reproducción.',
    aliases: ['queue'],

    slash: 'both',

    maxArgs: 0,
    guildOnly: true,

    callback: async ({ guild, member, user, channel, client, instance, interaction, message }) => {
        const embed = new EmbedBuilder().setColor(instance.color);
        const reply = { custom: true, ephemeral: true };

        const ids = getIds() || await updateIds();
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            return reply;
        }
        if (!member.voice.channel) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en un canal de voz para usar este comando!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            reply.embeds = [embed.setDescription("🛑 No hay música reproduciéndose.")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        if (!queue.tracks[0]) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay más canciones en la cola!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        const deferringMessage = message ? await message.reply({ content: 'Cargando cola de reproducción...' }) : await interaction.deferReply({ ephemeral: false });

        embed.setThumbnail(`${githubRawURL}/assets/thumbs/music/numbered-list.png`);

        const tracks = queue.tracks.map((track, i) => `**${i + 1}**. ${track.title}${!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ''} - ** ${track.duration} ** `);

        const songs = queue.tracks.length;

        const filteredTitle = await cleanTitle(queue.current.title);
        let description = `**▶️ Ahora reproduciendo:**\n\n${filteredTitle}${!queue.current.url.includes('youtube') || !containsAuthor(queue.current) ? ` | ${queue.current.author}` : ''} - **${queue.current.duration}**\n\n**📄 Cola de reproducción:**\n\n`
        let songsShown;
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const filteredTitle = await cleanTitle(track);
            const aux = description + filteredTitle + '\n';
            if (aux.length <= 4096)
                description = aux;
            else {
                songsShown = i - 1;
                break;
            }
        }

        embed.setDescription(description);

        if (songs > songsShown)
            embed.setFooter({ text: `+otra${songs - songsShown > 1 ? 's' : ''} ${songs - songsShown === 1 ? 'canción' : `${songs - songsShown} canciones`}...` });

        reply.embeds = [embed];
        reply.ephemeral = false;
        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
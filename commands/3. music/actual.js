const { EmbedBuilder } = require("discord.js");
const { getIds, updateIds } = require("../../app/cache");
const { githubRawURL } = require("../../app/constants");
const { containsAuthor, cleanTitle } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Muestra la canción actual en reproducción.',
    aliases: ['current'],

    slash: 'both',

    maxArgs: 0,
    guildOnly: true,

    callback: async ({ guild, member, user, channel, client, instance }) => {
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

        const track = queue.current;

        const progress = queue.createProgressBar();
        const timestamp = queue.getPlayerTimestamp();

        const filteredTitle = await cleanTitle(track.title);
        reply.embeds = [embed.setDescription(`${progress}\n\n**Progreso:** ${timestamp.progress}%\n**Volumen:** ${queue.volume}%\n**URL:** ${track.url}\n**Agregada por:** ${track.requestedBy.tag}`)
            .setImage(track.thumbnail)
            .setTitle(filteredTitle + (!track.url.includes('youtube') || !containsAuthor(track) ? ` | ${track.author}` : ''))];
        reply.ephemeral = false;
        return reply;
    }
}
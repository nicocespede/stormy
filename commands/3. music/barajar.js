const { EmbedBuilder } = require("discord.js");
const { getIds, updateIds } = require("../../app/cache");
const { githubRawURL } = require("../../app/constants");

module.exports = {
    category: 'Música',
    description: 'Baraja la cola de reproducción.',
    aliases: ['shuffle'],

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
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en un canal de voz para barajar!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }
        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para barajar!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay ninguna cola de reproducción para barajar!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        if (queue.tracks.length <= 1) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay suficientes canciones en la cola para barajar!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        const success = queue.shuffle();

        reply.embeds = [embed.setDescription(success ? "🔀 Cola de reproducción barajada." : `🛑 ¡Ocurrió un error!`)
            .setThumbnail(`${githubRawURL}/assets/thumbs/music/${success ? `shuffle` : `no-entry`}.png`)];
        reply.ephemeral = false;
        return reply;
    }
}
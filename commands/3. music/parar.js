const { EmbedBuilder } = require("discord.js");
const { updateLastAction, getIds, updateIds } = require("../../app/cache");
const { MusicActions, githubRawURL } = require("../../app/constants");

module.exports = {
    category: 'Música',
    description: 'Para la reproducción (hace que el bot se desconecte del canal).',
    aliases: ['stop'],

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
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en un canal de voz para parar música!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para parar la reproducción!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay ninguna canción para parar!")
                .setThumbnail(`${githubRawURL}/assets/thumbs/music/no-entry.png`)];
            return reply;
        }

        updateLastAction(MusicActions.STOPPING);
        queue.destroy();

        reply.embeds = [embed.setDescription("⏹️ Música parada, 👋 ¡adiós!")
            .setThumbnail(`${githubRawURL}/assets/thumbs/music/stop.png`)];
        reply.ephemeral = false;
        return reply;
    }
}
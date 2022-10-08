const { EmbedBuilder } = require("discord.js");
const { updateLastAction, getIds, updateIds } = require("../../app/cache");
const { MusicActions } = require("../../app/constants");

module.exports = {
    category: 'Música',
    description: 'Para la reproducción (hace que el bot se desconecte del canal).',
    aliases: ['stop'],

    slash: 'both',

    maxArgs: 0,
    guildOnly: true,

    callback: async ({ guild, member, user, channel, client }) => {
        const embed = new EmbedBuilder().setColor([195, 36, 255]);
        const reply = { custom: true, ephemeral: true, files: [`./assets/thumbs/music/icons8-no-entry-64.png`] };
        const ids = !getIds() ? await updateIds() : getIds();
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            reply.files = [];
            return reply;
        }

        if (!member.voice.channel) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en un canal de voz para parar música!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para parar la reproducción!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay ninguna canción para parar!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        updateLastAction(MusicActions.STOPPING);
        queue.destroy();

        reply.embeds = [embed.setDescription("⏹️ Música parada, 👋 ¡adiós!")
            .setThumbnail(`attachment://icons8-stop-64.png`)];
        reply.ephemeral = false;
        reply.files = [`./assets/thumbs/music/icons8-stop-64.png`];
        return reply;
    }
}
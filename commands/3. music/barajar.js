const { EmbedBuilder } = require("discord.js");
const { getIds, updateIds } = require("../../app/cache");

module.exports = {
    category: 'Música',
    description: 'Baraja la cola de reproducción.',
    aliases: ['shuffle'],

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
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en un canal de voz para barajar!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }
        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            reply.embeds = [embed.setDescription("🛑 ¡Debes estar en el mismo canal de voz que yo para barajar!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const queue = client.player.getQueue(guild.id);

        if (!queue || !queue.playing) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay ninguna cola de reproducción para barajar!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        if (queue.tracks.length <= 1) {
            reply.embeds = [embed.setDescription("🛑 ¡No hay suficientes canciones en la cola para barajar!")
                .setThumbnail(`attachment://icons8-no-entry-64.png`)];
            return reply;
        }

        const success = queue.shuffle();

        reply.embeds = [embed.setDescription(success ? "🔀 Cola de reproducción barajada." : `🛑 ¡Ocurrió un error!`)
            .setThumbnail(success ? `attachment://icons8-shuffle-64.png` : `attachment://icons8-no-entry-64.png`)];
        reply.ephemeral = false;
        reply.files = [success ? `./assets/thumbs/music/icons8-shuffle-64.png` : `./assets/thumbs/music/icons8-no-entry-64.png`];
        return reply;
    }
}
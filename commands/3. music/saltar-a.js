const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getIds, updateIds, updateLastAction } = require("../../src/cache");
const { GITHUB_RAW_URL, MusicActions } = require("../../src/constants");
const { handleErrorEphemeral } = require("../../src/music");
const { useMasterPlayer } = require("discord-player");

module.exports = {
    category: 'Música',
    description: 'Saltear hasta una canción determinada de la cola de reproducción.',
    aliases: ['saltear-hasta', 'saltar-hasta', 'skip-to'],

    options: [
        {
            name: 'número',
            description: 'El número de la canción a la que se quiere saltar.',
            required: true,
            type: ApplicationCommandOptionType.Integer
        }
    ],
    slash: 'both',

    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '<número>',
    guildOnly: true,

    callback: async ({ guild, member, user, message, channel, args, interaction, instance }) => {
        const embed = new EmbedBuilder().setColor(instance.color);
        const number = message ? args[0] : interaction.options.getInteger('número');
        const reply = { ephemeral: true, fetchReply: true };

        const ids = getIds() || await updateIds();
        if (!ids.channels.musica.includes(channel.id)) {
            handleErrorEphemeral(reply, embed, `🛑 Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, message, interaction, channel);
            return;
        }

        if (!member.voice.channel) {
            handleErrorEphemeral(reply, embed, "🛑 ¡Debes estar en un canal de voz para usar este comando!", message, interaction, channel);
            return;
        }

        if (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id) {
            handleErrorEphemeral(reply, embed, "🛑 ¡Debes estar en el mismo canal de voz que yo para usar este comando!", message, interaction, channel);
            return;
        }

        const player = useMasterPlayer();
        const queue = player.nodes.get(guild.id);

        if (!queue || !queue.node.isPlaying()) {
            handleErrorEphemeral(reply, embed, "🛑 ¡No hay ninguna canción para saltear!", message, interaction, channel);
            return;
        }

        const index = parseInt(number) - 1;

        if (index < 0 || index >= queue.getSize() || isNaN(index)) {
            handleErrorEphemeral(reply, embed, `🛑 El número ingresado es inválido.`, message, interaction, channel);
            return;
        }

        queue.node.skipTo(index);
        reply.embeds = [embed.setDescription(`⏭️ **${index + 1} canciones** salteadas.`)
            .setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/music/go-to-end.png`)];
        reply.ephemeral = false;
        const replyMessage = message ? await message.reply(reply) : await interaction.reply(reply);
        updateLastAction(MusicActions.SKIPPING_MANY, user.tag);

        setTimeout(async () => {
            if (message) message.delete();
            replyMessage.delete();
        }, 1000 * 30);
    }
}
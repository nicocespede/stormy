const { ICommand } = require("wokcommands");
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getIds, updateLastAction, getGithubRawUrl } = require("../../src/cache");
const { MusicActions } = require("../../src/constants");
const { handleErrorEphemeral } = require("../../src/music");
const { useMainPlayer } = require("discord-player");
const { logToFileCommandUsage, getUserTag } = require("../../src/util");

/**@type {ICommand}*/
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

    callback: async ({ args, channel, guild, instance, interaction, member, message, text, user }) => {
        logToFileCommandUsage('saltar-a', text, interaction, user);

        const embed = new EmbedBuilder().setColor(instance.color);
        const number = message ? args[0] : interaction.options.getInteger('número');
        const reply = { ephemeral: true, fetchReply: true };

        const ids = await getIds();
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

        const player = useMainPlayer();
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

        const skipped = [];
        for (let i = 0; i < index; i++)
            skipped.push(queue.tracks.at(i));

        queue.node.skipTo(index);

        reply.embeds = [embed.setDescription(`⏭️ **${index + 1} canciones** salteadas.`)
            .setThumbnail(await getGithubRawUrl('assets/thumbs/music/go-to-end.png'))];
        reply.ephemeral = false;
        const replyMessage = message ? await message.reply(reply) : await interaction.reply(reply);
        updateLastAction(MusicActions.SKIPPING_MANY, getUserTag(user));

        setTimeout(async () => {
            if (message) message.delete();
            replyMessage.delete();
        }, 1000 * 30);

        queue.history.push(skipped.reverse());
    }
}
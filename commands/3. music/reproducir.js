const { isAMusicChannel } = require("../../app/music");

module.exports = {
    category: 'Música',
    description: 'Reproduce una canción o la agrega a la cola si ya se está reproduciendo.',
    aliases: ['play', 'p', 'add'],
    options: [
        {
            name: 'URL ó canción',
            description: 'La URL o el nombre de la canción que se quiere reproducir.',
            required: true,
            type: 'STRING'
        }
    ],
    slash: 'both',

    expectedArgs: '<URL ó canción>',
    minArgs: 1,
    guildOnly: true,

    callback: async ({ guild, member, user, message, channel, args, text, client, prefix, instance, interaction }) => {
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;
        if (!isAMusicChannel(channel.id))
            messageOrInteraction.reply({ content: `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`, ephemeral: true });
        if (!member.voice.channel)
            messageOrInteraction.reply({ content: "¡Debes estar en un canal de voz para reproducir música!", ephemeral: true });
        if (guild.me.voice.channel && member.voice.channel.id !== guild.me.voice.channel.id)
            messageOrInteraction.reply({ content: "¡Debes estar en el mismo canal de voz que yo para agregar canciones!", ephemeral: true });
        return;
    }
}
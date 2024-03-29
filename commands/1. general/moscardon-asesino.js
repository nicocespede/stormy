const { ApplicationCommandOptionType } = require('discord.js');
const { PREFIX } = require('../../src/constants');
const { getIds, getGithubRawUrl } = require('../../src/cache');

module.exports = {
    aliases: ['moscardondelamuerte', 'moscardóndelamuerte', 'moscardón-asesino'],
    category: 'General',
    description: `Envía un moscardón asesino por mensaje directo a un amigo.`,
    options: [
        {
            name: 'amigo',
            description: `La mención de quien recibe el moscardón asesino.`,
            required: true,
            type: ApplicationCommandOptionType.User
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<@amigo>',
    minArgs: 1,
    maxArgs: 1,

    callback: async ({ instance, user, message, interaction, guild }) => {
        const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
        var type = 'asesino';
        const cmd = message ? message.content.toLowerCase().split(' ')[0].substring(1) : 'moscardon-asesino';
        if (cmd === 'moscardondelamuerte') type = 'de la muerte';
        const reply = { custom: true, ephemeral: true };
        const ids = await getIds();
        if (!target)
            reply.content = instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                REASON: "Debe haber una mención luego del comando.",
                PREFIX: PREFIX,
                COMMAND: cmd,
                ARGUMENTS: "`<@amigo>`"
            });
        else if (target.user.id === user.id)
            reply.content = `⚠ ¡Lo siento <@${user.id}>, no podés enviarte un moscardón ${type} a vos mismo!`;
        else if (target.user.id === ids.users.bot)
            reply.content = `⚠ ¡Lo siento <@${user.id}>, no podés enviarme un moscardón ${type} a mí!`;
        else {
            reply.content = `🪰 ¡Moscardón ${type} enviado!`;
            reply.ephemeral = false;

            await target.send({ files: [{ attachment: await getGithubRawUrl('assets/moscas/moscardon.png') }] }).catch(() => {
                reply.content = `❌ Lo siento, no pude enviarle el mensaje a este usuario.`;
                reply.ephemeral = true;
            });
        }
        return reply;
    }
}
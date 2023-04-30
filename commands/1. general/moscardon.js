const { ApplicationCommandOptionType } = require('discord.js');
const { PREFIX, GITHUB_RAW_URL } = require('../../src/constants');
const { getIds, updateIds } = require('../../src/cache');

const files = ['mosca0.png', 'mosca1.png', 'mosca2.png', 'mosca3.gif'];

module.exports = {
    category: 'General',
    description: 'Envía un moscardón por mensaje directo a un amigo.',
    aliases: ['moscardón'],
    options: [
        {
            name: 'amigo',
            description: 'La mención de quien recibe el moscardón.',
            required: true,
            type: ApplicationCommandOptionType.User
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<@amigo>',
    minArgs: 1,
    maxArgs: 1,

    callback: async ({ user, message, interaction, instance, guild }) => {
        const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
        const reply = { custom: true, ephemeral: true };
        const ids = getIds() || await updateIds();
        if (!target)
            reply.content = instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                REASON: "Debe haber una mención luego del comando.",
                PREFIX: PREFIX,
                COMMAND: "moscardon",
                ARGUMENTS: "`<@amigo>`"
            });
        else if (target.user.id === user.id)
            reply.content = `⚠ ¡Lo siento <@${user.id}>, no podés enviarte un moscardón a vos mismo!`;
        else if (target.user.id === ids.users.bot)
            reply.content = `⚠ ¡Lo siento <@${user.id}>, no podés enviarme un moscardón a mí!`;
        else {
            reply.content = `🪰 ¡Moscardón enviado!`;
            reply.ephemeral = false;
            const random = Math.floor(Math.random() * (files.length));
            await target.send({ files: [{ attachment: `${GITHUB_RAW_URL}/assets/moscas/${files[random]}` }] }).catch(() => {
                reply.content = `❌ Lo siento, no pude enviarle el mensaje a este usuario.`
                reply.ephemeral = true;
            });
        }
        return reply;
    }
}
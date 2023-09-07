const { ICommand } = require("wokcommands");
const { ApplicationCommandOptionType } = require('discord.js');
const { PREFIX, MEMBER_NICKNAME_MAX_LENGTH } = require('../../src/constants');
const { getIds } = require('../../src/cache');
const { isOwner, getErrorEmbed } = require('../../src/common');
const { getUserTag, logToFileError, consoleLogError, logToFileCommandUsage, getSuccessEmbed, getWarningEmbed } = require('../../src/util');

const COMMAND_NAME = 'apodo';
const MODULE_NAME = 'commands.general.' + COMMAND_NAME;

/**
 * Generates an embed which contains the information of the nickname change.
 * 
 * @param {String} tag The tag of the user.
 * @param {String} oldNickname The old nickname of the user.
 * @param {String} newNickname The new nickname of the user.
 * @returns An embed with the information of the nickname change.
 */
const buildSuccessEmbed = (tag, oldNickname, newNickname) => {
    if (newNickname.length === 0)
        return getSuccessEmbed(`Apodo de **${tag}** reseteado correctamente.`);

    return getSuccessEmbed(`Apodo de **${tag}** cambiado correctamente.`)
        .setFields([
            { name: 'Apodo viejo', value: oldNickname, inline: true },
            { name: '\u200b', value: '→', inline: true },
            { name: 'Apodo nuevo', value: newNickname, inline: true }
        ]);
};

/**@type {ICommand}*/
module.exports = {
    category: 'General',
    description: 'Cambia el apodo a un amigo (sólo para usuarios autorizados).',
    options: [
        {
            name: 'amigo',
            description: 'La mención de quien recibe el nuevo apodo.',
            required: true,
            type: ApplicationCommandOptionType.User
        },
        {
            name: 'apodo',
            description: 'El apodo nuevo (si no se ingresa nada, el apodo se resetea).',
            required: false,
            type: ApplicationCommandOptionType.String
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<@amigo> [apodo]',
    minArgs: 1,

    callback: async ({ args, guild, instance, interaction, message, text, user }) => {
        logToFileCommandUsage(COMMAND_NAME, text, interaction, user);

        const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
        const newNickname = args.slice(1).join(' ');

        const reply = { custom: true, ephemeral: true };

        const ids = await getIds();
        try {
            const role = await guild.roles.fetch(ids.roles.mod);
            const isAuthorized = await isOwner(user.id) || role.members.has(user.id);
            if (!isAuthorized)
                reply.embeds = [getWarningEmbed(`Lo siento <@${user.id}>, no tenés autorización para cambiar apodos.`)];
            else if (!target)
                reply.embeds = [getWarningEmbed(instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
                    REASON: "Debe haber una mención y (opcionalmente) el nuevo apodo luego del comando.",
                    PREFIX: PREFIX,
                    COMMAND: "apodo",
                    ARGUMENTS: "`<@amigo>` `[apodo]`"
                }))];
            else if (target.user.id === ids.users.bot)
                reply.embeds = [getWarningEmbed(`¡No podés cambiarme el apodo a mí!`)];
            else if (newNickname.length > MEMBER_NICKNAME_MAX_LENGTH)
                reply.embeds = [getWarningEmbed(`El apodo no puede contener más de ${MEMBER_NICKNAME_MAX_LENGTH} caracteres.`)];
            else {
                const oldNickname = target.nickname ? target.nickname : target.user.username;
                await target.setNickname(newNickname);
                reply.embeds = [buildSuccessEmbed(getUserTag(target.user), oldNickname, newNickname)];
                reply.ephemeral = false;
            }
        } catch (error) {
            if (error.message === 'Missing Permissions' && target.id === ids.users.stormer)
                reply.embeds = [getWarningEmbed('Lo siento, Discord no me permite cambiarle el apodo al dueño del servidor.')];
            else {
                consoleLogError('> Error al cambiar apodo de ' + getUserTag(target.user));
                logToFileError(MODULE_NAME, error);
                reply.embeds = [await getErrorEmbed(`Lo siento, no se pudo cambiar el apodo.`)];
            }
        }
        return reply;
    }
}
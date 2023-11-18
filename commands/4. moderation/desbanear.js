const { ICommand } = require("wokcommands");
const { ButtonBuilder, ActionRowBuilder, ApplicationCommandOptionType, ButtonStyle } = require('discord.js');
const { getBanned, updateBanned, getIds } = require('../../src/cache');
const { PREFIX } = require('../../src/constants');
const { isOwner, getErrorEmbed } = require('../../src/common');
const { logToFileCommandUsage, getWarningEmbed, getDenialEmbed, getWarningMessage, getSuccessEmbed, consoleLogError, logToFileError, getSimpleEmbed, getUserTag } = require('../../src/util');

const COMMAND_NAME = 'desbanear';
const MODULE_NAME = 'commands.moderation.' + COMMAND_NAME;

/**@type {ICommand}*/
module.exports = {
    category: 'Moderación',
    description: 'Quita el baneo a un usuario (sólo para usuarios autorizados).',
    aliases: 'unban',
    options: [
        {
            name: 'indice',
            description: `El índice otorgado por el comando \`${PREFIX}baneados\`.`,
            required: true,
            type: ApplicationCommandOptionType.Integer
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<índice>',
    minArgs: 1,
    maxArgs: 1,

    callback: async ({ args, channel, guild, interaction, message, text, user }) => {
        logToFileCommandUsage(COMMAND_NAME, text, interaction, user);

        const number = message ? args[0] : interaction.options.getInteger('indice');
        const reply = { custom: true, ephemeral: true };
        const ids = await getIds();
        const banRole = await guild.roles.fetch(ids.roles.mod).catch(console.error);
        const isAuthorized = await isOwner(user.id) || banRole.members.has(user.id);
        const index = parseInt(number) - 1;
        const bans = getBanned() || await updateBanned();
        if (!isAuthorized) {
            reply.embeds = [getDenialEmbed(`Lo siento <@${user.id}>, no tenés autorización para desbanear usuarios.`)];
            return reply;
        } else if (index < 0 || index >= Object.keys(bans).length || isNaN(index)) {
            reply.embeds = [getWarningEmbed(`El índice ingresado es inválido.`)];
            return reply;
        } else {
            const id = Object.keys(bans)[index];
            const ban = bans[id];
            if (user.id !== ban.responsible && ban.responsible !== "Desconocido") {
                reply.embeds = [getDenialEmbed(`Hola <@${user.id}>, no tenés permitido desbanear a este usuario ya que fue baneado por otra persona.`)];
                return reply;
            } else {
                const row = new ActionRowBuilder()
                    .addComponents(new ButtonBuilder().setCustomId('unban_yes')
                        .setEmoji('✔️')
                        .setLabel('Confirmar')
                        .setStyle(ButtonStyle.Success))
                    .addComponents(new ButtonBuilder().setCustomId('unban_no')
                        .setEmoji('❌')
                        .setLabel('Cancelar')
                        .setStyle(ButtonStyle.Danger));

                reply.components = [row];
                reply.content = getWarningMessage(`¿Estás seguro de querer desbanear a **${getUserTag(ban.user)}**?`);

                const replyMessage = message ? await message.reply(reply) : interaction.reply(reply);

                const filter = btnInt => user.id === btnInt.user.id;

                const collector = channel.createMessageComponentCollector({ filter, max: 1, time: 1000 * 15 });

                collector.on('end', async collection => {
                    const edit = { components: [], content: null };
                    if (!collection.first())
                        edit.embeds = [getSimpleEmbed('⌛ La acción expiró.')];
                    else if (collection.first().customId === 'unban_no')
                        edit.embeds = [getSimpleEmbed('❌ La acción fue cancelada.')];
                    else
                        try {
                            await guild.members.unban(id);
                            edit.embeds = [getSuccessEmbed(`Hola <@${user.id}>, el usuario fue desbaneado correctamente.`)];
                        } catch (error) {
                            consoleLogError(`> Error al desbanear a ${getUserTag(ban.user)}`);
                            logToFileError(MODULE_NAME, error);
                            edit.embeds = [await getErrorEmbed('Lo siento, ocurrió un error al desbanear al usuario.')];
                        }
                    message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
                });
            }
        }
        return;
    }
}
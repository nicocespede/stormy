const { ICommand } = require("wokcommands");
const { ButtonBuilder, ActionRowBuilder, ApplicationCommandOptionType, ButtonStyle } = require('discord.js');
const { addBanResponsible, getIds } = require('../../src/cache');
const { isOwner, getErrorEmbed } = require('../../src/common');
const { getUserTag, getWarningEmbed, getSyntaxErrorMessage, getDenialEmbed, getWarningMessage, getSimpleEmbed, getSuccessEmbed, consoleLogError, logToFileError, logToFileCommandUsage } = require('../../src/util');

const COMMAND_NAME = 'banear';
const MODULE_NAME = 'commands.moderation.' + COMMAND_NAME;

/**@type {ICommand}*/
module.exports = {
    category: 'Moderación',
    description: 'Banea a un usuario (sólo para usuarios autorizados).',
    aliases: 'ban',
    options: [
        {
            name: 'amigo',
            description: 'La mención de quien recibe el ban.',
            required: true,
            type: ApplicationCommandOptionType.User
        },
        {
            name: 'razón',
            description: 'La razón del baneo.',
            required: false,
            type: ApplicationCommandOptionType.String
        }
    ],
    slash: 'both',
    guildOnly: true,

    expectedArgs: '<@amigo> [razón]',
    minArgs: 1,

    callback: async ({ args, channel, guild, instance, interaction, message, text, user }) => {
        logToFileCommandUsage(COMMAND_NAME, text, interaction, user);

        const target = message ? message.mentions.members.first() : interaction.options.getMember('amigo');
        const aux = args.splice(1).join(' ');
        const banReason = message ? (aux === '' ? null : aux) : interaction.options.getString('razón');
        const reply = { custom: true, ephemeral: true };
        const ids = await getIds();
        const banRole = await guild.roles.fetch(ids.roles.mod).catch(console.error);
        const isAuthorized = await isOwner(user.id) || banRole.members.has(user.id);
        if (!isAuthorized) {
            reply.embeds = [getDenialEmbed(`Lo siento <@${user.id}>, no tenés autorización para banear usuarios.`)];
            return reply;
        } else if (!target) {
            reply.embeds = [getWarningEmbed(getSyntaxErrorMessage(instance, guild, "Debe haber una mención y (opcionalmente) la razón del baneo luego del comando.", COMMAND_NAME, "`<@amigo>` `[razón]`"))];
            return reply;
        } else if (target.user.id === ids.users.bot) {
            reply.embeds = [getWarningEmbed(`Lo siento <@${user.id}>, ¡no podés banearme a mí!`)];
            return reply;
        } else if (target.user.id === user.id) {
            reply.embeds = [getWarningEmbed(`Lo siento <@${user.id}>, ¡no podés banearte a vos mismo!`)];
            return reply;
        } else if (await isOwner(target.user.id)) {
            reply.embeds = [getWarningEmbed(`Lo siento <@${user.id}>, los dueños de casa no pueden ser baneados.`)];
            return reply;
        } else {
            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder().setCustomId('ban_yes')
                    .setEmoji('✔️')
                    .setLabel('Confirmar')
                    .setStyle(ButtonStyle.Success))
                .addComponents(new ButtonBuilder().setCustomId('ban_no')
                    .setEmoji('❌')
                    .setLabel('Cancelar')
                    .setStyle(ButtonStyle.Danger));

            reply.components = [row];
            reply.content = getWarningMessage(`¿Estás seguro de querer banear a **${getUserTag(target.user)}**?`);

            const replyMessage = message ? await message.reply(reply) : await interaction.reply(reply);

            const filter = btnInt => user.id === btnInt.user.id;

            const collector = channel.createMessageComponentCollector({ filter, max: 1, time: 1000 * 15 });

            collector.on('end', async collection => {
                const edit = { components: [], content: null };
                if (!collection.first())
                    edit.embeds = [getSimpleEmbed('⌛ La acción expiró.')];
                else if (collection.first().customId === 'ban_no')
                    edit.embeds = [getSimpleEmbed('❌ La acción fue cancelada.')];
                else
                    try {
                        await target.ban({ days: 0, reason: banReason });
                        addBanResponsible(target.user.id, user.id);
                        edit.embeds = [getSuccessEmbed(`Hola <@${user.id}>, el usuario fue baneado correctamente.`)];
                    } catch (error) {
                        consoleLogError(`> Error al banear a ${getUserTag(target.user)}`);
                        logToFileError(MODULE_NAME, error);
                        edit.embeds = [await getErrorEmbed('Lo siento, ocurrió un error al banear al usuario.')];
                    }
                message ? await replyMessage.edit(edit) : await interaction.editReply(edit);
            });
        }
        return;
    }
}
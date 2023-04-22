const { EmbedBuilder, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getIds, updateIds, getBillboardMessageInfo, updateBillboardMessageInfo } = require('../../src/cache');
const { updateBillboardMessage } = require('../../src/mongodb');
const { GITHUB_RAW_URL } = require('../../src/constants');
const { log } = require('../../src/util');
const { isOwner } = require('../../src/common');

const prefix = 'billboard-';

const getNewEmbed = async (interaction) => {
    await new Promise(res => setTimeout(res, 1000 * 0.5));
    const { message, guild } = interaction;
    const embed = EmbedBuilder.from(message.embeds[0]);
    const ids = getIds() || await updateIds();
    const role = await guild.roles.fetch(ids.roles.funcion).catch(console.error);
    if (role.members.size === 0)
        embed.setFields([]);
    else {
        const field = { name: '👥 Espectadores:', value: `` };
        role.members.forEach(member => field.value += `• ${member.user.tag}\n`);
        embed.setFields([field]);
    }
    return embed;
};

module.exports = {
    category: 'Privados',
    description: 'Permite gestionar la cartelera.',

    options: [{
        name: 'activar',
        description: 'Crea un nuevo mensaje para la cartelera.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            {
                name: 'titulo',
                description: 'El nombre de la película.',
                required: true,
                type: ApplicationCommandOptionType.String
            }, {
                name: 'fecha',
                description: 'Fecha y hora en que se verá la película.',
                required: true,
                type: ApplicationCommandOptionType.String
            }, {
                name: 'url',
                description: 'La URL de la imagen.',
                required: true,
                type: ApplicationCommandOptionType.String
            }
        ]
    }, {
        name: 'desactivar',
        description: 'Desactiva la cartelera y quita el rol \'función\' a todos.',
        type: ApplicationCommandOptionType.Subcommand
    }],

    slash: true,
    guildOnly: true,

    init: client => {
        client.on('interactionCreate', async interaction => {
            if (!interaction.isButton()) return;

            const { guild, customId } = interaction;
            if (!guild || !customId.startsWith(prefix)) return;

            const ids = getIds() || await updateIds();
            const buttonId = customId.replace(prefix, '');
            const roleId = ids.roles.funcion;
            const member = interaction.member;

            if (buttonId === 'out' && member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
                log(`> Rol 'función' quitado a ${member.user.tag}`, 'yellow');
            } else if (buttonId === 'in' && !member.roles.cache.has(roleId)) {
                await member.roles.add(roleId);
                log(`> Rol 'función' asignado a ${member.user.tag}`, 'green');
            } else {
                interaction.deferUpdate();
                return;
            }

            interaction.update({ embeds: [await getNewEmbed(interaction)] });
        });
    },

    callback: async ({ client, instance, interaction, user, guild }) => {
        const reply = { custom: true, ephemeral: true };

        const ids = getIds() || await updateIds();
        if (!(await isOwner(user.id))) {
            reply.content = '⚠ No estás autorizado para usar este comando.';
            reply.ephemeral = false;
            return reply;
        }

        const subCommand = interaction.options.getSubcommand();

        if (subCommand === 'activar') {
            const thumbs = ['cinema', 'clapperboard', 'movie', 'movie-projector'];

            const title = interaction.options.getString('titulo');
            const date = interaction.options.getString('fecha');
            const url = interaction.options.getString('url');
            const random = Math.floor(Math.random() * (thumbs.length));

            try {
                const messageData = {
                    components: [new ActionRowBuilder()
                        .addComponents(new ButtonBuilder()
                            .setCustomId(`${prefix}in`)
                            .setEmoji('🖐🏼')
                            .setLabel('Participo')
                            .setStyle(ButtonStyle.Primary))
                        .addComponents(new ButtonBuilder()
                            .setCustomId(`${prefix}out`)
                            .setEmoji('👋🏼')
                            .setLabel('No participo')
                            .setStyle(ButtonStyle.Danger))],
                    content: `<@&${ids.roles.cine}>`,
                    embeds: [new EmbedBuilder()
                        .setColor(instance.color)
                        .setDescription(`**🕔 Fecha y horario:**\n${date}`)
                        .setImage(url)
                        .setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/movies/${thumbs[random]}.png`)
                        .setTitle(title)]
                };
                const channel = await client.channels.fetch(ids.channels.cartelera).catch(console.error);
                const message = await channel.send(messageData);
                await updateBillboardMessage(true, message.id).catch(console.error);
                await updateBillboardMessageInfo();
                reply.content = `✅ Cartelera activada.`;
            } catch (e) {
                if (e.message === 'Received one or more errors') {
                    const messages = e.errors.filter(error => error.message === 'Invalid URL');
                    reply.content = messages.length !== 0 ? '⚠ URL inválida.'
                        : `❌ Ocurrieron errores:\n\n• ${e.errors.map(error => error.message).join('\n• ')}`;
                } else
                    reply.content = `❌ Ocurrió un error: ${e.message}.`
            }

            return reply;
        }

        const { isActive, messageId } = getBillboardMessageInfo() || await updateBillboardMessageInfo();
        if (!isActive)
            reply.content = '⚠ El recolector de reacciones no está activo.';
        else {
            const channel = await guild.channels.fetch(ids.channels.cartelera).catch(console.error);
            const message = await channel.messages.fetch(messageId).catch(console.error);
            message.edit({ components: [] });
            const role = await guild.roles.fetch(ids.roles.funcion).catch(console.error);
            role.members.forEach(async member => {
                await member.roles.remove(role).catch(console.error);
                log(`> Rol 'función' quitado a ${member.user.tag}`, 'yellow');
            });
            await updateBillboardMessage(false, messageId).catch(console.error);
            await updateBillboardMessageInfo();
            reply.content = `✅ Cartelera desactivada.`;
        }

        return reply;
    }
}
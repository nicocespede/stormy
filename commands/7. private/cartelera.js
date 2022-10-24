const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const chalk = require('chalk');
chalk.level = 1;
const { initiateReactionCollector, stopReactionCollector } = require('../../app/general');
const { getIds, updateIds, getReactionCollectorInfo, updateReactionCollectorInfo } = require('../../app/cache');
const { updateBillboardCollectorMessage } = require('../../app/mongodb');
const { githubRawURL } = require('../../app/constants');

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

    callback: async ({ client, instance, interaction, user, guild }) => {
        const reply = { custom: true, ephemeral: true };

        const ids = getIds() || await updateIds();
        if (user.id !== ids.users.stormer && user.id !== ids.users.darkness) {
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
                const msg = {
                    content: `<@&${ids.roles.cine}>`,
                    embeds: [new EmbedBuilder()
                        .setTitle(title)
                        .setDescription(`${date}\n\n(reaccioná a este mensaje con ✅ si querés participar)`)
                        .setColor(instance.color)
                        .setThumbnail(`${githubRawURL}/assets/thumbs/movies/${thumbs[random]}.png`)
                        .setImage(url)]
                };
                initiateReactionCollector(client, msg);
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

        const { isActive, messageId } = getReactionCollectorInfo() || await updateReactionCollectorInfo();
        if (!isActive)
            reply.content = '⚠ El recolector de reacciones no está activo.';
        else {
            await updateBillboardCollectorMessage(false, messageId).catch(console.error);
            await updateReactionCollectorInfo();
            stopReactionCollector();
            const role = await guild.roles.fetch(ids.roles.funcion).catch(console.error);
            const members = await guild.members.fetch().catch(console.error);
            members.forEach(async member => {
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role).catch(console.error);
                    console.log(chalk.yellow(`> Rol 'función' quitado a ${member.user.tag}`))
                }
            });
            reply.content = `✅ Cartelera desactivada.`;
        }

        return reply;
    }
}
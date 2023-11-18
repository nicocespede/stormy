const { ICommand } = require('wokcommands');
const { ButtonBuilder, ActionRowBuilder, ApplicationCommandOptionType, ButtonStyle, Client } = require("discord.js");
const { getCollectorMessages } = require("../../src/cache");
const { RolesMessagesData } = require('../../src/constants');
const { logToFileCommandUsage, getWarningEmbed, getSuccessEmbed } = require('../../src/util');

const buttonStyles = ['primary', 'secondary', 'success', 'danger'];
const prefix = 'button-roles-';

/**@type {ICommand}*/
module.exports = {
    category: 'Privados',
    description: 'Agrega un botón al mensaje de roles.',

    slash: true,
    ownerOnly: true,
    guildOnly: true,

    options: [
        {
            name: 'tipo',
            description: 'El tipo del mensaje al que se añadirá el botón.',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: RolesMessagesData
        },
        {
            name: 'rol',
            description: 'El rol para el botón.',
            required: true,
            type: ApplicationCommandOptionType.Role
        },
        {
            name: 'emoji',
            description: 'El emoji para el botón.',
            required: true,
            type: ApplicationCommandOptionType.String
        },
        {
            name: 'estilo',
            description: 'El estilo para el botón.',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: buttonStyles.map(style => ({ name: style, value: style.toLowerCase() }))
        },
        {
            name: 'etiqueta',
            description: 'La etiqueta para el botón.',
            required: true,
            type: ApplicationCommandOptionType.String
        },
        {
            name: 'texto',
            description: 'El texto que se agregará al mensaje.',
            required: true,
            type: ApplicationCommandOptionType.String
        }
    ],

    /**@param {Client} client*/
    init: client => {
        client.on('interactionCreate', interaction => {
            if (!interaction.isButton()) return;

            const { guild, customId } = interaction;
            if (!guild || !customId.startsWith(prefix)) return;

            const roleId = customId.replace(prefix, '');
            const member = interaction.member;

            if (member.roles.cache.has(roleId)) {
                member.roles.remove(roleId);

                interaction.reply({ ephemeral: true, content: `Ya no tenés el rol <@&${roleId}>.` });
            } else {
                member.roles.add(roleId);

                interaction.reply({ ephemeral: true, content: `Ahora tenés el rol <@&${roleId}>.` });
            }
        });
    },

    callback: async ({ guild, interaction, text, user }) => {
        logToFileCommandUsage('boton-rol', text, interaction, user);

        const role = interaction.options.getRole('rol');
        const emoji = interaction.options.getString('emoji');

        let buttonStyle = interaction.options.getString('estilo') || 'primary';
        if (!buttonStyles.includes(buttonStyle.toLowerCase()))
            return { custom: true, embeds: [getWarningEmbed(`Estilo de botón desconocido. Los estilos válidos son: _"${buttonStyles.join('", "')}"_.`)], ephemeral: true };

        switch (buttonStyle) {
            case 'primary':
                buttonStyle = ButtonStyle.Primary;
                break;
            case 'secondary':
                buttonStyle = ButtonStyle.Secondary;
                break;
            case 'success':
                buttonStyle = ButtonStyle.Success;
                break;
            case 'danger':
                buttonStyle = ButtonStyle.Danger;
                break;
        }

        const buttonLabel = interaction.options.getString('etiqueta');
        const messageText = interaction.options.getString('texto');
        const type = interaction.options.getString('tipo');

        const collectorMessages = await getCollectorMessages();
        const data = collectorMessages[type];

        if (!data)
            return { custom: true, embeds: [getWarningEmbed(`El botón con ID '${type}' no existe.`)], ephemeral: true };

        const { channelId, messageId } = data;
        const channel = guild.channels.cache.get(channelId);
        const roleMessage = await channel.messages.fetch({ message: messageId });

        const rows = [];
        roleMessage.components.forEach(c => rows.push(ActionRowBuilder.from(c)));

        const button = new ButtonBuilder()
            .setLabel(buttonLabel)
            .setEmoji(emoji)
            .setStyle(buttonStyle)
            .setCustomId(`${prefix}${role.id}`);
        let content = roleMessage.content;
        let added = false;

        for (const row of rows) {
            if (row.components.length < 5) {
                row.addComponents(button);
                content += `\n${messageText}`;
                added = true;
                break;
            }
        }

        if (!added) {
            if (rows.length >= 5)
                return { custom: true, ephemeral: true, embeds: [getWarningEmbed('No puedo agregar más botones a este mensaje.')] };

            content += `\n${rows.length === 0 ? '\n' : ''}${messageText}`;
            rows.push(new ActionRowBuilder().addComponents(button));
        }

        roleMessage.edit({ content: content, components: rows });

        return { custom: true, ephemeral: true, embeds: [getSuccessEmbed('Botón agregado al mensaje de roles.')] };
    }
}
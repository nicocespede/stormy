const { ButtonBuilder, ActionRowBuilder, ApplicationCommandOptionType, ButtonStyle } = require("discord.js");
const { getRolesMessageInfo, updateRolesMessageInfo } = require("../../src/cache");

const buttonStyles = ['primary', 'secondary', 'success', 'danger'];
const prefix = 'button-roles-';

module.exports = {
    category: 'Privados',
    description: 'Agrega un botón al mensaje de roles.',
    aliases: ['role-btn'],

    slash: 'both',
    ownerOnly: true,
    guildOnly: true,

    minArgs: 4,
    expectedArgs: '<rol> <emoji> <estilo> <etiqueta> <texto>',
    options: [
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

    callback: async ({ guild, message, interaction, args }) => {
        args.shift();

        let role = message ? message.mentions.roles.first() : interaction.options.getRole('rol');

        const emoji = args.shift();

        let buttonStyle = args.shift() || 'primary';
        if (!buttonStyles.includes(buttonStyle.toLowerCase()))
            return `Estilo de botón desconocido. Los estilos válidos son: _"${buttonStyles.join('", "')}"_.`;

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

        const buttonLabel = args.shift();

        const text = args.join(' ');

        const data = getRolesMessageInfo() || await updateRolesMessageInfo();

        const channelId = data.channelId;
        const messageId = data.messageId;
        const channel = guild.channels.cache.get(channelId);
        const roleMessage = await channel.messages.fetch({ message: messageId });

        const rows = [];
        roleMessage.components.forEach(c => {
            rows.push(ActionRowBuilder.from(c));
        });

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
                content += `\n${text}`;
                added = true;
                break;
            }
        }

        if (!added) {
            if (rows.length >= 5)
                return { custom: true, ephemeral: true, content: 'No puedo agregar más botones a este mensaje.' };

            content += `\n${rows.length === 0 ? '\n' : ''}${text}`;
            rows.push(new ActionRowBuilder().addComponents(button));
        }

        roleMessage.edit({ content: content, components: rows });

        return { custom: true, ephemeral: true, content: 'Botón agregado al mensaje de roles.' };
    }
}
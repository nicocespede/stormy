const { Constants, MessageButton, MessageActionRow } = require("discord.js");
const { getRolesMessageInfo, updateRolesMessageInfo } = require("../../app/cache");

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
            type: Constants.ApplicationCommandOptionTypes.ROLE
        },
        {
            name: 'emoji',
            description: 'El emoji para el botón.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.STRING
        },
        {
            name: 'estilo',
            description: 'El estilo para el botón.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.STRING,
            choices: buttonStyles.map(style => ({ name: style, value: style.toUpperCase() }))
        },
        {
            name: 'etiqueta',
            description: 'La etiqueta para el botón.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.STRING
        },
        {
            name: 'texto',
            description: 'El texto que se agregará al mensaje.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.STRING
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

        const buttonStyle = args.shift() || 'primary';
        if (!buttonStyles.includes(buttonStyle.toLowerCase()))
            return `Estilo de botón desconocido. Los estilos válidos son: _"${buttonStyles.join('", "')}"_.`;

        const buttonLabel = args.shift();

        const text = args.join(' ');

        const data = !getRolesMessageInfo() ? await updateRolesMessageInfo() : getRolesMessageInfo();

        const channelId = data.channelId;
        const messageId = data.messageId;
        const channel = guild.channels.cache.get(channelId);
        const roleMessage = await channel.messages.fetch(messageId);

        const rows = roleMessage.components;
        const button = new MessageButton()
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
            rows.push(new MessageActionRow().addComponents(button));
        }

        roleMessage.edit({ content: content, components: rows });

        return { custom: true, ephemeral: true, content: 'Botón agregado al mensaje de roles.' };
    }
}
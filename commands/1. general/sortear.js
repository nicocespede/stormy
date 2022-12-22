const { ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const title = '🎲 __**Sorteo**__\n';

const buttonsData = {
    'add-elements': {
        customId: 'add-elements',
        disabled: [],
        emoji: '➕',
        label: 'Agregar elementos',
        style: ButtonStyle.Primary
    },
    'stop-collecting': {
        customId: 'stop-collecting',
        disabled: [],
        emoji: '🛑',
        label: 'Parar recolector de elementos',
        style: ButtonStyle.Primary
    },
    'delete-elements': {
        customId: 'delete-elements',
        disabled: [],
        emoji: '➖',
        label: 'Eliminar elemento',
        style: ButtonStyle.Primary
    },
    'exit-draw': {
        customId: 'exit-draw',
        disabled: [],
        emoji: '🚪',
        label: 'Salir',
        style: ButtonStyle.Danger
    },
    draw: {
        customId: 'draw',
        disabled: [],
        emoji: '✅',
        label: 'Sortear',
        style: ButtonStyle.Success
    }
};

const statesData = {
    cancelled: { description: `${title}\n❌ Este sorteo **terminó** ó fue **cancelado**.` },
    'collecting-elements': {
        buttons: ['stop-collecting'],
        description: `${title}\n⚠ Cada mensaje que envíes en este canal se agregará como un elemento nuevo al sorteo.\n\u200b`
    },
    'deleting-elements': {
        buttons: ['stop-collecting'],
        description: `${title}\n⚠ Cada mensaje que envíes en este canal eliminará del sorteo al elemento que coincida.\n\u200b`
    },
    expired: { description: `${title}\n⌛ Este sorteo **expiró**.` },
    ready: {
        buttons: ['add-elements', 'delete-elements', 'exit-draw', 'draw'],
        description: `${title}\n⚠ Utilice los **botones** para **agregar** o **quitar** elementos.`
    },
    start: {
        buttons: ['add-elements', 'exit-draw'],
        description: `${title}\n⚠ Utilice los **botones** para **agregar** o **quitar** elementos.\n\u200b`
    }
};

const getRow = state => {
    const row = new ActionRowBuilder();

    const { buttons } = statesData[state];
    for (const button of buttons) {
        const { customId, disabled, emoji, label, style } = buttonsData[button];
        row.addComponents(new ButtonBuilder()
            .setCustomId(customId)
            .setEmoji(emoji)
            .setStyle(style)
            .setLabel(label)
            .setDisabled(disabled ? disabled.includes(state) : false));
    }

    return row;
};

module.exports = {
    category: 'General',
    description: 'Realiza un sorteo entre los elementos que se agreguen.',

    options: [
        {
            name: 'ganadores',
            description: 'La cantidad de ganadores que se desean.',
            required: true,
            type: ApplicationCommandOptionType.Integer
        }
    ],

    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '<ganadores>',
    slash: 'both',

    callback: async ({ args, channel, interaction, message, user }) => {
        const winnersAmount = message ? parseInt(args[0]) : interaction.options.getInteger('ganadores');
        let state = 'start';
        let elements = [];
        let messagesCollector;

        const { description } = statesData[state];
        const reply = { components: [getRow(state)], content: description };
        const replyMessage = message ? await message.reply(reply) : await interaction.reply(reply);

        const interactionsFilter = int => int.user.id === user.id;
        const interactionsCollector = channel.createMessageComponentCollector({ filter: interactionsFilter, idle: 1000 * 60 * 60 });

        interactionsCollector.on('collect', async btnInt => {
            if (!btnInt.isButton()) return;

            if (btnInt.user.id !== user.id) {
                btnInt.deferUpdate();
                return;
            }

            const { customId } = btnInt;
            if (!Object.keys(buttonsData).includes(customId)) return;

            const buttonsFilter = message => user.id === message.author.id;

            if (customId === 'add-elements') {
                state = 'collecting-elements';

                messagesCollector = channel.createMessageCollector({ filter: buttonsFilter, idle: 1000 * 60 * 5 });

                messagesCollector.on('collect', msg => {
                    elements = elements.concat(msg.content.split('\n'));
                    msg.delete();
                });

                messagesCollector.on('end', () => {
                    if (state === 'collecting-elements' || state === 'deleting-elements') {
                        interactionsCollector.stop();
                        return;
                    }

                    if (elements.length === 0)
                        state = 'start';

                    const { description } = statesData[state];
                    const edit = { components: [getRow(state)], content: description };

                    if (state === 'ready')
                        edit.content += ` Se sorteará${winnersAmount > 1 ? 'n' : ''} **${winnersAmount}** entre los siguientes elementos:\n\n- ${elements.join('\n- ')}\n\u200b`;

                    btnInt.message.interaction ? btnInt.editReply(edit) : btnInt.message.edit(edit);
                });

                const { description } = statesData[state];
                btnInt.update({ components: [getRow(state)], content: description });
                return;
            }

            if (customId === 'stop-collecting') {
                btnInt.deferUpdate();
                state = 'ready';
                messagesCollector.stop();
                return;
            }

            if (customId === 'delete-elements') {
                state = 'deleting-elements';
                return;
            }

            if (customId === 'exit-draw') {
                btnInt.deferUpdate();
                state = 'cancelled';
                interactionsCollector.stop();
                return;
            }

            const winners = [];
            const elementsCopy = elements.slice(0);
            for (let i = 0; i < winnersAmount; i++) {
                const random = Math.floor(Math.random() * (elementsCopy.length));
                winners.push(elementsCopy.splice(random, 1));
            }

            btnInt.update({ content: `${title}\n🏆 ${winnersAmount > 1 ? 'Los ganadores del sorteo son:' : 'El ganador del sorteo es:'}\n\n- ${winners.join('\n- ')}\n\n_Sorteo realizado el ${(new Date()).toLocaleString('es-AR')}_` });
        });

        interactionsCollector.on('end', _ => {
            const { description } = statesData[state === 'cancelled' ? state : 'expired'];
            const edit = { components: [], content: description };
            message ? replyMessage.editReply(edit) : interaction.editReply(edit);
        });
    }
}
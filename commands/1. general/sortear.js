const { ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { convertTZ } = require("../../src/util");
const { ARGENTINA_LOCALE_STRING } = require("../../src/constants");

const title = '🎲 __**Sorteo**__\n';

const buttonsData = {
    'add-elements': {
        emoji: '➕',
        label: 'Agregar elementos',
        style: ButtonStyle.Primary
    },
    'stop-collecting': {
        emoji: '🛑',
        label: 'Parar recolector de mensajes',
        style: ButtonStyle.Primary
    },
    'delete-elements': {
        emoji: '➖',
        label: 'Eliminar elementos',
        style: ButtonStyle.Primary
    },
    'clear-elements': {
        emoji: '❌',
        label: 'Limpiar elementos',
        style: ButtonStyle.Primary
    },
    'exit-draw': {
        emoji: '🚪',
        label: 'Salir',
        style: ButtonStyle.Danger
    },
    draw: {
        emoji: '✅',
        label: 'Sortear',
        style: ButtonStyle.Success
    }
};

const statesData = {
    cancelled: { description: `${title}\n❌ Este sorteo fue **cancelado**.` },
    'collecting-elements': {
        buttons: ['stop-collecting'],
        description: `${title}\n⚠ **Cada mensaje** que envíes en este canal **se agregará como un elemento nuevo** al sorteo.\n\u200b`
    },
    completed: { description: title },
    'deleting-elements': {
        buttons: ['stop-collecting'],
        description: `${title}\n⚠ **Cada mensaje** que envíes en este canal **eliminará del sorteo al elemento** que coincida.\n\u200b`
    },
    expired: { description: `${title}\n⌛ Este sorteo **expiró**.\n` },
    ready: {
        buttons: ['add-elements', 'delete-elements', 'clear-elements', 'exit-draw', 'draw'],
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
        const { emoji, label, style } = buttonsData[button];
        row.addComponents(new ButtonBuilder()
            .setCustomId(button)
            .setEmoji(emoji)
            .setStyle(style)
            .setLabel(label));
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
        let winners;
        let date;
        let messagesCollector;

        const { description } = statesData[state];
        const reply = { components: [getRow(state)], content: description, fetchReply: true };
        const replyMessage = message ? await message.reply(reply) : await interaction.reply(reply);

        const interactionsCollector = channel.createMessageComponentCollector({ idle: 1000 * 60 * 60 });

        interactionsCollector.on('collect', async btnInt => {
            if (!btnInt.isButton()) return;

            const { customId } = btnInt;
            if (!Object.keys(buttonsData).includes(customId)) return;

            if (btnInt.user.id !== user.id) {
                btnInt.reply({ content: `¡Estos botones no son para vos! 😡`, ephemeral: true });
                return;
            }

            const messagesFilter = message => user.id === message.author.id;

            if (customId === 'add-elements' || customId === 'delete-elements') {
                state = customId === 'add-elements' ? 'collecting-elements' : 'deleting-elements';

                messagesCollector = channel.createMessageCollector({ filter: messagesFilter, idle: 1000 * 60 * 5 });

                messagesCollector.on('collect', msg => {
                    const args = msg.content.split('\n');
                    if (customId === 'add-elements')
                        elements = elements.concat(args);
                    else
                        for (const element of args)
                            if (elements.includes(element))
                                elements.splice(elements.indexOf(element), 1);
                    msg.delete();
                });

                messagesCollector.on('end', () => {
                    if (state === 'collecting-elements' || state === 'deleting-elements') {
                        interactionsCollector.stop(!winners ? 'expired' : 'completed');
                        return;
                    }

                    if (elements.length === 0)
                        state = 'start';

                    const { description } = statesData[state];
                    const edit = { components: [getRow(state)], content: description };

                    if (state === 'ready')
                        edit.content += ` Se sorteará${winnersAmount > 1 ? 'n' : ''} **${winnersAmount}** entre los siguientes elementos:\n\n- ${elements.join('\n- ')}\n\u200b`;

                    replyMessage.edit(edit);
                });

                const { description } = statesData[state];
                btnInt.update({ components: [getRow(state)], content: description });
                return;
            }

            if (customId === 'clear-elements') {
                state = 'start';
                elements = [];
                const { description } = statesData[state];
                btnInt.update({ components: [getRow(state)], content: description });
                return;
            }

            if (customId === 'stop-collecting') {
                state = 'ready';
                btnInt.deferUpdate();
                messagesCollector.stop();
                return;
            }

            if (customId === 'exit-draw') {
                btnInt.deferUpdate();
                interactionsCollector.stop(!winners ? 'cancelled' : 'completed');
                return;
            }

            if (elements.length <= winnersAmount) {
                btnInt.reply({ content: `⚠ Debe haber al menos **${winnersAmount + 1} elementos** para realizar el sorteo.`, ephemeral: true })
                return;
            }

            winners = [];
            const elementsCopy = elements.slice(0);
            for (let i = 0; i < winnersAmount; i++) {
                const random = Math.floor(Math.random() * (elementsCopy.length));
                winners.push(elementsCopy.splice(random, 1));
            }

            date = convertTZ(new Date()).toLocaleString(ARGENTINA_LOCALE_STRING);
            btnInt.update({ content: `${title}\n🏆 ${winnersAmount > 1 ? 'Los ganadores del sorteo son:' : 'El ganador del sorteo es:'}\n\n- ${winners.join('\n- ')}\n\n_Sorteo realizado el ${date}_` });
        });

        interactionsCollector.on('end', (_, reason) => {
            const { description } = statesData[reason === 'idle' ? 'expired' : reason];
            const edit = { components: [], content: description };
            if (winners)
                edit.content += `\n🏆 ${winnersAmount > 1 ? 'Los ganadores del sorteo fueron:' : 'El ganador del sorteo fue:'}\n\n- ${winners.join('\n- ')}\n\n_Sorteo realizado el ${date}_`;
            replyMessage.edit(edit);
        });
    }
}
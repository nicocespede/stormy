const { ApplicationCommandOptionType } = require("discord.js");
const { ICommand } = require("wokcommands");
const { addBanResponsible } = require("../../src/cache");
const { logToFileSubCommandUsage } = require("../../src/util");

/**@type {ICommand}*/
module.exports = {
    category: 'Privados',
    description: 'Simula eventos.',

    options: [{
        name: 'baneo',
        description: 'Simula el baneo de un usuario del servidor.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: 'razon',
            description: 'La razón del baneo.',
            required: false,
            type: ApplicationCommandOptionType.String
        }]
    }, {
        name: 'desbaneo',
        description: 'Simula el desbaneo de un usuario del servidor.',
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: 'entrada',
        description: 'Simula la entrada de un usuario al servidor.',
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: 'salida',
        description: 'Simula la salida de un usuario del servidor.',
        type: ApplicationCommandOptionType.Subcommand
    }],

    slash: true,
    ownerOnly: true,
    testOnly: true,

    callback: ({ client, guild, interaction, member, text }) => {
        const subCommand = interaction.options.getSubcommand();
        logToFileSubCommandUsage('simular', text, subCommand, interaction, member.user);

        let content = '';

        switch (subCommand) {
            case 'baneo':
                const reason = interaction.options.getString('razon');
                client.emit('guildBanAdd', { user: member.user, reason: reason, guild: guild });
                addBanResponsible(user.id, user.id);
                content = '¡Baneo simulado!';
                break;

            case 'desbaneo':
                client.emit('guildBanRemove', { user: user, guild: guild });
                content = '¡Desbaneo simulado!';
                break;

            case 'entrada':
                client.emit('guildMemberAdd', member);
                content = '¡Entrada simulada!';
                break;

            case 'salida':
                client.emit('guildMemberRemove', member);
                content = '¡Salida simulada!';
                break;
        }

        return { content, custom: true, ephemeral: true }
    }
}
const { ApplicationCommandOptionType } = require("discord.js");
const { addBanResponsible } = require("../../app/cache");
const { testing } = require("../../app/constants");

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
        name: 'reinicio',
        description: 'Simula el reinicio del bot.',
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: 'salida',
        description: 'Simula la salida de un usuario del servidor.',
        type: ApplicationCommandOptionType.Subcommand
    }],

    slash: true,
    testOnly: true,
    ownerOnly: true,

    callback: ({ client, guild, interaction, member }) => {
        const subCommand = interaction.options.getSubcommand();

        switch (subCommand) {
            case 'baneo':
                const reason = interaction.options.getString('razon');
                client.emit('guildBanAdd', { user: member.user, reason: reason, guild: guild });
                addBanResponsible(user.id, user.id);
                return '¡Baneo simulado!';

            case 'desbaneo':
                client.emit('guildBanRemove', { user: user, guild: guild });
                return '¡Desbaneo simulado!';

            case 'entrada':
                client.emit('guildMemberAdd', member);
                return '¡Entrada simulada!';

            case 'reinicio':
                if (testing) {
                    process.emit('SIGINT');
                    return 'Reinicio simulado, ¡adiós!';
                }
                return 'Este comando sólo puede utilizarse en un entorno de prueba.';

            case 'salida':
                client.emit('guildMemberRemove', member);
                return '¡Salida simulada!';
        }
    }
}
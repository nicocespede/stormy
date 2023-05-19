const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { getGithubRawUrl } = require('../../src/cache');

const secondsToHours = seconds => {
    // calculate (and subtract) whole hours
    let hours = Math.floor(seconds / 3600) % 24;
    seconds -= hours * 3600;
    // calculate (and subtract) whole minutes
    let minutes = Math.ceil(seconds / 60) % 60;
    return `${hours > 0 ? `${hours}h` : ''} ${minutes > 0 ? `${minutes}m` : ''}`;
};

module.exports = {
    category: 'Juegos/Películas',
    description: 'Comandos útiles para el juego Marvel Future Fight.',

    options: [{
        name: 'calcular',
        description: 'Calcula tiempo restante de generación de divisas.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            {
                name: 'divisa',
                description: 'El nombre de la divisa a calcular.',
                required: true,
                type: ApplicationCommandOptionType.String,
                choices: [{ name: '⚡ Energía', value: 'energy' },
                { name: '🕔 Puntos de aumento', value: 'boost-points' }]
            },
            {
                name: 'stock',
                description: 'La cantidad de divisa que se tiene actualmente.',
                required: false,
                type: ApplicationCommandOptionType.Integer
            },
            {
                name: 'limite',
                description: 'La cantidad de divisa que se espera tener.',
                required: false,
                type: ApplicationCommandOptionType.Integer
            }
        ]
    }],
    slash: true,

    callback: async ({ interaction }) => {
        const subCommand = interaction.options.getSubcommand();

        if (subCommand === 'calcular') {
            const currency = interaction.options.getString('divisa');
            const stock = interaction.options.getInteger('stock') || 0;
            const limit = interaction.options.getInteger('limite') || (currency === 'boost-points' ? 100 : 120);
            const restorationTime = 60 * (currency === 'boost-points' ? 1.5 : 5);

            const goal = limit - stock;
            const remainingTime = secondsToHours(goal * restorationTime);

            return {
                custom: true,
                ephemeral: true,
                embeds: [new EmbedBuilder()
                    .setTitle(`${currency === 'energy' ? '⚡' : '🕔'} Calculadora de ${currency === 'energy' ? 'energía' : 'puntos de aumento'}`)
                    .setDescription(`Tiempo restante para tener **${limit} ${currency === 'energy' ? 'de energía' : 'puntos de aumento'}**:\n\n**${remainingTime}**`)
                    .setColor(currency === 'energy' ? [200, 125, 10] : [76, 0, 2])
                    .setThumbnail(`attachment://mff-${currency}.png`)],
                files: [await getGithubRawUrl(`assets/thumbs/games/mff-${currency}.png`)]
            };
        }
    }
}
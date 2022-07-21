const { MessageEmbed, Constants } = require('discord.js');
const { getCrosshairs, updateCrosshairs } = require('../../app/cache');

module.exports = {
    category: 'Juegos/Películas',
    description: 'Ver una mira de Valorant.',
    aliases: ['ver-crosshair'],

    options: [{
        name: 'id',
        description: 'El ID de la mira que se quiere ver.',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.INTEGER
    }
    ],
    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '<id>',
    slash: 'both',

    callback: async ({ message, interaction, args, guild }) => {
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });

        var reply = { ephemeral: true };

        const crosshairs = !getCrosshairs() ? await updateCrosshairs() : getCrosshairs();
        const id = message ? parseInt(args[0]) : interaction.options.getInteger('id');

        if (isNaN(id) || !Object.keys(crosshairs).includes(id.toString())) {
            reply.content = `¡Uso incorrecto! El ID es inválido.`;
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        } else {
            const selectedCrosshair = crosshairs[id];
            var owner = '';
            await guild.members.fetch(selectedCrosshair.owner).then(member => owner = ` de ${member.user.username}`).catch(_ => owner = ` de usuario desconocido`);
            reply.embeds = [new MessageEmbed()
                .setTitle(selectedCrosshair.name + owner)
                .setDescription(`Código de importación de la mira:\n\n` + selectedCrosshair.code)
                .setColor([255, 70, 85])
                .setThumbnail(`attachment://valorant.png`)];
            if (selectedCrosshair.imageUrl != 'null')
                reply.embeds[0].setImage(selectedCrosshair.imageUrl);
            reply.files = ['./assets/thumbs/valorant.png'];
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        }
        return;
    }
}
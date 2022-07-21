const { MessageEmbed } = require('discord.js');
const { getCrosshairs, updateCrosshairs } = require('../../app/cache');
const { prefix } = require('../../app/constants');

module.exports = {
    category: 'Juegos/Películas',
    description: 'Ver las miras de Valorant guardadas.',
    aliases: ['crosshairs'],

    maxArgs: 0,
    slash: 'both',

    callback: async ({ user, message, interaction }) => {
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });

        var reply = { ephemeral: true };
        const crosshairs = !getCrosshairs() ? await updateCrosshairs() : getCrosshairs();
        const userCrosshairsField = { name: 'Tus miras', value: '', inline: false };
        const crosshairsField = { name: 'Otras miras', value: '', inline: false };
        for (const ch in crosshairs)
            if (Object.hasOwnProperty.call(crosshairs, ch)) {
                const crosshair = crosshairs[ch];
                if (crosshair.owner === user.id)
                    userCrosshairsField.value += `**${ch}.** ${crosshair.name}\n`;
                else
                    crosshairsField.value += `**${ch}.** ${crosshair.name}\n`;
            }
        if (userCrosshairsField.value === '') userCrosshairsField.value = 'No hay miras guardadas.';
        if (crosshairsField.value === '') crosshairsField.value = 'No hay miras guardadas.';

        reply.embeds = [new MessageEmbed()
            .setTitle(`**Miras**`)
            .setDescription(`Hola <@${user.id}>, para ver una mira utiliza el comando \`${prefix}ver-mira\` seguido del ID de la mira.\n\nLas miras guardadas son:\n\n`)
            .setFields([userCrosshairsField, crosshairsField])
            .setColor([255, 70, 85])
            .setThumbnail(`attachment://valorant.png`)];
        reply.files = ['./assets/thumbs/valorant.png'];
        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
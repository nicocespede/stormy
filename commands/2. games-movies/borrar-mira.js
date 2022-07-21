const { Constants } = require('discord.js');
const { getCrosshairs, updateCrosshairs } = require('../../app/cache');
const { prefix } = require('../../app/constants');
const { deleteCrosshair } = require('../../app/postgres');

module.exports = {
    category: 'Juegos/Películas',
    description: 'Elimina una mira de Valorant.',
    aliases: ['borrar-crosshair', 'eliminar-crosshair'],

    options: [{
        name: 'id',
        description: 'El ID de la mira que se quiere borrar.',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.INTEGER
    }],
    minArgs: 1,
    maxArgs: 1,
    expectedArgs: '<id>',
    slash: 'both',

    callback: async ({ message, interaction, args, user }) => {
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });

        var reply = { ephemeral: true };

        const id = message ? parseInt(args[0]) : interaction.options.getInteger('id');

        if (!id) {
            reply.content = `¡Uso incorrecto! Debés introducir el ID de la mira. Usá **"${prefix}borrar-mira <id>"**.`;
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }

        if (isNaN(id)) {
            reply.content = `¡Uso incorrecto! El ID es inválido. Usá **"${prefix}borrar-mira <id>"**.`;
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }

        const crosshairs = !getCrosshairs() ? await updateCrosshairs() : getCrosshairs();
        if (!Object.keys(crosshairs).includes(id.toString()))
            reply.content = `La mira que intentás borrar no existe.`;
        else if (user.id != crosshairs[id].owner)
            reply.content = `Lo siento, no podés borrar una mira de otro usuario.`;
        else
            await deleteCrosshair(id).then(async () => {
                await updateCrosshairs();
                reply.content = `La mira fue borrada de manera exitosa.`;
                reply.ephemeral = false;
            }).catch(console.error);
        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
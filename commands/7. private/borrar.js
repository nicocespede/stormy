const { ApplicationCommandOptionType } = require("discord.js");
const { getIds, updateIds } = require("../../src/cache");

module.exports = {
    category: 'Privados',
    description: 'Elimina todos los mensajes del canal de mensajes directos de un usuario.',

    options: [{
        name: 'id',
        description: 'El ID del usuario.',
        type: ApplicationCommandOptionType.String,
        required: true
    }],

    slash: true,
    ownerOnly: true,

    callback: async ({ client, interaction }) => {
        interaction.deferReply({ ephemeral: true });
        const targetId = interaction.options.getString('id');
        let deleted = 0;
        const user = await client.users.fetch(targetId).catch(console.error);
        const dmChannel = await user.createDM().catch(console.error);
        const messages = await dmChannel.messages.fetch().catch(console.error);
        const ids = getIds() || await updateIds();
        for (const [_, m] of messages)
            if (m.author.id === ids.users.bot) {
                await m.delete().catch(console.error);
                deleted++;
                await new Promise(res => setTimeout(res, 1000 * 2));
            }
        interaction.editReply({ content: deleted > 0 ? `Se borraron **${deleted} mensajes**.` : 'Este usuario no tiene ningún mensaje directo.' });
    }
}
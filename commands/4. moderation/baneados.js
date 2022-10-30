const { EmbedBuilder } = require('discord.js');
const { getBanned, updateBanned } = require('../../src/cache');

module.exports = {
    category: 'Moderación',
    description: 'Responde con la lista de usuarios actualmente baneados del servidor.',

    maxArgs: 0,
    slash: 'both',
    guildOnly: true,

    callback: async ({ guild, client, instance, user }) => {
        const banned = getBanned() || await updateBanned();
        let description = `Hola <@${user.id}>, los usuarios actualmente baneados son:\n\n`;
        let fields = [];
        const responsiblesIds = [...new Set(Object.entries(banned).map(([_, value]) => value.responsible))];

        if (responsiblesIds.length === 0)
            description += '_No hay usuarios baneados actualmente._';
        else {
            const usersField = { name: 'Usuario', value: '', inline: true };
            const responsiblesField = { name: 'Baneado por', value: ``, inline: true };
            const reasonsField = { name: 'Razón', value: ``, inline: true };

            const members = await guild.members.fetch(responsiblesIds).catch(console.error);
            let i = 1;
            for (const key in banned) if (Object.hasOwnProperty.call(banned, key)) {
                const { reason, responsible, user } = banned[key];
                usersField.value += `**${i++}. **${user}\n\n`;
                const responsibleMember = members.get(responsible);
                responsiblesField.value += `${responsibleMember ? responsibleMember.user.username : 'Desconocido'}\n\n`;
                reasonsField.value += `${reason || `No se proporcionó razón`}\n\n`;
            }

            fields = [usersField, responsiblesField, reasonsField];
        }

        return {
            custom: true,
            embeds: [new EmbedBuilder()
                .setTitle(`**Usuarios baneados**`)
                .setDescription(description)
                .addFields(fields)
                .setColor(instance.color)
                .setThumbnail(client.user.avatarURL())],
            ephemeral: true
        };
    }
}
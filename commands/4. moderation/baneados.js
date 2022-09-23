const { EmbedBuilder } = require('discord.js');
const { getBanned, updateBanned } = require('../../app/cache');

module.exports = {
    category: 'Moderación',
    description: 'Responde con la lista de usuarios actualmente baneados del servidor.',

    maxArgs: 0,
    slash: 'both',
    guildOnly: true,

    callback: async ({ guild, client, instance, user }) => {
        const banned = !getBanned().ids ? await updateBanned() : getBanned();
        const usersField = { name: 'Usuario', value: '', inline: true };
        const responsiblesField = { name: 'Baneado por', value: ``, inline: true };
        const reasonsField = { name: 'Razón', value: ``, inline: true };
        var i = 1;
        for (const key in banned.bans)
            if (Object.hasOwnProperty.call(banned.bans, key)) {
                const ban = banned.bans[key];
                usersField.value += `**${i++}. **${ban.user}\n\n`;
                if (ban.responsible === "Desconocido")
                    responsiblesField.value += "Desconocido\n\n";
                else
                    await guild.members.fetch(ban.responsible).then(member => {
                        responsiblesField.value += `${member.user.username}\n\n`;
                    }).catch(async () => responsiblesField.value += "Desconocido\n\n");
                reasonsField.value += `${ban.reason ? ban.reason : `No se proporcionó razón`}\n\n`;
            }

        return {
            custom: true,
            embeds: [new EmbedBuilder()
                .setTitle(`**Usuarios baneados**`)
                .setDescription(`Hola <@${user.id}>, los usuarios actualmente baneados son:\n\n${usersField.value.length === 0 ? '_No hay usuarios baneados actualmente._' : ''}`)
                .addFields(usersField.value.length > 0 ? [usersField, responsiblesField, reasonsField] : [])
                .setColor(instance.color)
                .setThumbnail(client.user.avatarURL())],
            ephemeral: true
        };
    }
}
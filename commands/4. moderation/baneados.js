const { MessageEmbed } = require('discord.js');
const { getBanned, updateBanned } = require('../../app/cache');

module.exports = {
    category: 'Moderación',
    description: 'Responde con la lista de usuarios actualmente baneados del servidor.',

    maxArgs: 0,
    slash: 'both',
    guildOnly: true,

    callback: async ({ guild, client, instance, user }) => {
        const banned = !getBanned() ? await updateBanned() : getBanned();
        var usersField = { name: 'Usuario', value: '', inline: true };
        var responsiblesField = { name: 'Baneado por', value: ``, inline: true };
        var reasonsField = { name: 'Razón', value: ``, inline: true };
        for (var i = 0; i < banned.length; i++) {
            const actualBan = banned[i];
            usersField.value += `**${i + 1}. **${actualBan['bans_user']}\n\n`;
            if (actualBan['bans_responsible'] == "Desconocido")
                responsiblesField.value += "Desconocido\n\n";
            else
                await guild.members.fetch(actualBan['bans_responsible']).then(member => {
                    responsiblesField.value += `${member.user.username}\n\n`;
                }).catch(async () => responsiblesField.value += "Desconocido\n\n");
            reasonsField.value += `${actualBan['bans_reason'] != null && actualBan['bans_reason'] != 'null' ? actualBan['bans_reason']
                : `No se proporcionó razón`}\n\n`;
        }
        return {
            custom: true,
            embeds: [new MessageEmbed()
                .setTitle(`**Usuarios baneados**`)
                .setDescription(`Hola <@${user.id}>, los usuarios actualmente baneados son:\n\n${usersField.value.length === 0 ? '_No hay usuarios baneados actualmente._' : ''}`)
                .addFields(usersField.value.length > 0 ? [usersField, responsiblesField, reasonsField] : [])
                .setColor(instance.color)
                .setThumbnail(client.user.avatarURL())],
            ephemeral: true
        };
    }
}
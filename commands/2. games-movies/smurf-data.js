const { MessageAttachment, MessageEmbed } = require('discord.js');
const ValorantAPI = require("unofficial-valorant-api");
const { ids, smurf } = require('../../app/cache');

function getAliases() {
    var aliases = [];
    for (const key in smurf)
        aliases.push(key);
    return aliases;
}

module.exports = {
    aliases: getAliases(),
    category: 'Juegos/Películas',
    description: 'Responde con los datos de la cuenta smurf seleccionada.',

    maxArgs: 0,
    slash: false,
    hidden: true,

    callback: ({ message, client }) => {
        var cmd = message.content.split(' ')[0].substring(1);
        const account = smurf[cmd];
        client.guilds.fetch(ids.guilds.nckg).then(guild => {
            guild.roles.fetch(ids.roles.smurf).then(async role => {
                if (message.channel.type != 'DM')
                    message.reply({ content: 'Este comando solo se puede utilizar por mensajes directos.' });
                else if (!role.members.has(message.author.id))
                    message.reply({ content: `Hola <@${message.author.id}>, no estás autorizado a usar este comando.` });
                else {
                    var accInfo = account[0].split('#');
                    await ValorantAPI.getMMR('v1', 'na', accInfo[0], accInfo[1]).then(mmr => {
                        if (mmr.status == 204)
                            var thumb = `assets/thumbs/ranks/unranked.png`;
                        else
                            var thumb = `assets/thumbs/ranks/${mmr.data.currenttierpatched.toLowerCase()}.png`;
                        message.reply({
                            embeds: [new MessageEmbed()
                                .setTitle(`**${account[0]}**`)
                                .setColor([7, 130, 169])
                                .addFields([{ name: 'Nombre de usuario:', value: account[1], inline: true },
                                { name: 'Contraseña:', value: account[2], inline: true }])
                                .setThumbnail(`attachment://rank.png`)],
                            files: [new MessageAttachment(thumb, 'rank.png')]
                        });
                    }).catch(console.error);
                }
            }).catch(console.error);
        }).catch(console.error);
        return;
    }
}
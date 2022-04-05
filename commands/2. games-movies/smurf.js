const { MessageEmbed } = require('discord.js');
const ValorantAPI = require("unofficial-valorant-api");
const { ids, smurf, prefix } = require('../../app/cache');

function translateRank(rank) {
    if (rank == null)
        return 'Sin clasificar';
    var rankName = rank.split(' ');
    var ret;
    switch (rankName[0]) {
        case 'Iron':
            ret = `Hierro ${rankName[1]}`;
            break;
        case 'Bronze':
            ret = `Bronce ${rankName[1]}`;
            break;
        case 'Silver':
            ret = `Plata ${rankName[1]}`;
            break;
        case 'Gold':
            ret = `Oro ${rankName[1]}`;
            break;
        case 'Platinum':
            ret = `Platino ${rankName[1]}`;
            break;
        case 'Diamond':
            ret = `Diamante ${rankName[1]}`;
            break;
        case 'Immortal':
            ret = `Inmortal ${rankName[1]}`;
            break;
        case 'Radiant':
            ret = `Radiante`;
            break;
    }
    return ret;
}

module.exports = {
    category: 'Juegos/Películas',
    description: 'Envía un MD con la información de las cuentas smurf de Valorant (sólo para usuarios autorizados).',

    maxArgs: 0,
    slash: 'both',
    guildOnly: true,

    callback: ({ guild, member, user, message, channel, interaction }) => {
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;
        guild.roles.fetch(ids.roles.smurf).then(async role => {
            if (!role.members.has(user.id))
                messageOrInteraction.reply({ content: `Hola <@${user.id}>, ¿para qué me rompes los huevos si vos no vas a smurfear? Pedazo de horrible.` });
            else {
                if (message) var deferringMessage = await message.reply({ content: `Por favor esperá mientras obtengo los rangos actualizados de las cuentas...` });
                else if (interaction) await interaction.deferReply({ ephemeral: true });
                var accountsField = { name: 'Cuenta', value: '', inline: true };
                var commandsField = { name: 'Comando', value: ``, inline: true };
                var ranksField = { name: 'Rango', value: ``, inline: true };
                for (var acc in smurf) {
                    var aux = acc;
                    acc = smurf[acc];
                    var accInfo = acc[0].split('#');
                    await ValorantAPI.getMMR('v1', 'na', accInfo[0], accInfo[1]).then(mmr => {
                        if (mmr.data.name != null && mmr.data.tag != null)
                            accountsField.value += `${mmr.data.name}#${mmr.data.tag}\n\n`;
                        else
                            accountsField.value += `${acc[0]}\n\n`;
                        commandsField.value += `${prefix}${aux}\n\n`;
                        ranksField.value += `${translateRank(mmr.data.currenttierpatched)}\n\n`;
                    }).catch(console.error);
                }
                member.send({
                    embeds: [new MessageEmbed()
                        .setTitle(`**Cuentas smurf**`)
                        .setDescription(`Hola <@${user.id}>, ingresa el comando de la cuenta smurf que deseas:\n\n`)
                        .setColor([7, 130, 169])
                        .addFields([accountsField, commandsField, ranksField])
                        .setThumbnail(`attachment://smurf.png`)],
                    files: [`./assets/thumbs/smurf.png`]
                }).then(() => {
                    if (message) deferringMessage.delete().then(channel.send({ content: `Hola <@${user.id}>, ¡revisá tus mensajes privados!` }));
                    else if (interaction) interaction.editReply({ content: `Hola <@${user.id}>, ¡revisá tus mensajes privados!`, ephemeral: true });
                }).catch(() => {
                    messageOrInteraction.reply({ content: `Lo siento <@${user.id}>, no pude enviarte el mensaje directo. :disappointed:`, ephemeral: true });
                });
            }
        }).catch(console.error);
        return;
    }
}
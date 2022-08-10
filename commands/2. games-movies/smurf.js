const { MessageEmbed } = require('discord.js');
const ValorantAPI = require("unofficial-valorant-api");
const { getSmurfs, updateSmurfs } = require('../../app/cache');
const { prefix, ids } = require('../../app/constants');

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
        case 'Ascendant':
            ret = `Ascendente ${rankName[1]}`;
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

    callback: async ({ guild, member, user, message, interaction }) => {
        var reply = { custom: true, ephemeral: true };
        const smurfRole = await guild.roles.fetch(ids.roles.smurf).catch(console.error);
        if (!smurfRole.members.has(user.id)) {
            reply.content = `Hola <@${user.id}>, ¿para qué me rompes los huevos si vos no vas a smurfear? Pedazo de horrible.`;
            reply.ephemeral = false;
            return reply;
        } else {
            const familyRole = await guild.roles.fetch(ids.roles.familia).catch(console.error);
            const isVip = user.id === ids.users.stormer || user.id === ids.users.darkness || familyRole.members.has(user.id);
            const deferringMessage = message ? await message.reply({ content: `Por favor esperá mientras obtengo los rangos actualizados de las cuentas...` })
                : await interaction.deferReply({ ephemeral: true });
            var accountsField = { name: 'Cuenta', value: '', inline: true };
            var commandsField = { name: 'Comando', value: ``, inline: true };
            var ranksField = { name: 'Rango', value: ``, inline: true };
            const smurfs = !getSmurfs() ? await updateSmurfs() : getSmurfs();
            for (const command in smurfs)
                if (Object.hasOwnProperty.call(smurfs, command)) {
                    const account = smurfs[command];
                    if (!account.vip || isVip) {
                        const accInfo = account.name.split('#');
                        await ValorantAPI.getMMR('v1', 'na', accInfo[0], accInfo[1]).then(mmr => {
                            accountsField.value += `${account.bannedUntil != '' ? '⛔ ' : ''}${mmr.data.name != null && mmr.data.tag != null ? `${mmr.data.name}#${mmr.data.tag}` : `${acc[0]}`}\n\n`;
                            commandsField.value += `${prefix}${command}\n\n`;
                            ranksField.value += `${translateRank(mmr.data.currenttierpatched)}\n\n`;
                        }).catch(console.error);
                    }
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
                reply.content = `Hola <@${user.id}>, ¡revisá tus mensajes privados!`;
                message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            }).catch(() => {
                reply.content = `Lo siento <@${user.id}>, no pude enviarte el mensaje directo. :disappointed:`;
                message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            });
        }
        return;
    }
}
const { MessageAttachment, MessageEmbed } = require('discord.js');
const ValorantAPI = require("unofficial-valorant-api");
const { getSmurfs, updateSmurfs } = require('../../app/cache');
const { ids } = require('../../app/constants');

module.exports = {
    aliases: ['4g', 'notsassy', 'elon', 'cande', 'maria', 'pou', 'marito', 'pitufowilly', 'pipeline', 'monster', 'mango', 'stormy',
        'stormersmurf', 'ysya', 'tomi'],
    category: 'Juegos/Películas',
    description: 'Responde con los datos de la cuenta smurf seleccionada.',

    maxArgs: 0,
    slash: false,
    hidden: true,

    callback: async ({ message, client, user }) => {
        const cmd = message.content.toLowerCase().split(' ')[0].substring(1);
        const smurfs = !getSmurfs() ? await updateSmurfs() : getSmurfs();
        const account = smurfs[cmd];
        var reply = { custom: true };
        const guild = await client.guilds.fetch(ids.guilds.default).catch(console.error);
        const smurfRole = await guild.roles.fetch(ids.roles.smurf).catch(console.error);
        if (message.channel.type != 'DM')
            reply.content = 'Este comando solo se puede utilizar por mensajes directos.';
        else if (!smurfRole.members.has(user.id))
            reply.content = `Hola <@${user.id}>, no estás autorizado a usar este comando.`;
        else {
            const familyRole = await guild.roles.fetch(ids.roles.familia).catch(console.error);
            const isVip = user.id === ids.users.stormer || user.id === ids.users.darkness || familyRole.members.has(user.id);
            if (account.vip && !isVip)
                reply.content = `Hola <@${user.id}>, no estás autorizado a usar este comando.`;
            else {
                const accInfo = account.name.split('#');
                await ValorantAPI.getMMR('v1', 'na', accInfo[0], accInfo[1]).then(mmr => {
                    const thumb = mmr.data.currenttierpatched === null ? `assets/thumbs/ranks/unranked.png`
                        : `assets/thumbs/ranks/${mmr.data.currenttierpatched.toLowerCase()}.png`;
                    reply.embeds = [new MessageEmbed()
                        .setTitle(`**${account.name}**`)
                        .setColor([7, 130, 169])
                        .addFields([{ name: 'Nombre de usuario:', value: account.user, inline: true },
                        { name: 'Contraseña:', value: account.password, inline: true }])
                        .setThumbnail(`attachment://rank.png`)];
                    if (account.bannedUntil != '')
                        reply.embeds[0].setDescription(`⚠ ESTA CUENTA ESTÁ BANEADA HASTA EL **${account.bannedUntil}** ⚠`);
                    reply.files = [new MessageAttachment(thumb, 'rank.png')];
                }).catch(console.error);
            }
        }
        return reply;
    }
}
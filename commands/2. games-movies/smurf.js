const { AttachmentBuilder, EmbedBuilder, ApplicationCommandOptionType, ChannelType } = require('discord.js');
const ValorantAPI = require("unofficial-valorant-api");
const { getSmurfs, updateSmurfs, updateIds, getIds } = require('../../app/cache');
const { prefix } = require('../../app/constants');

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

    options: [{
        name: 'id',
        description: 'El ID de la cuenta de la que se quiere obtener la información.',
        required: false,
        type: ApplicationCommandOptionType.String
    }],
    maxArgs: 1,
    expectedArgs: '<id>',
    slash: 'both',

    callback: async ({ guild, member, user, message, interaction, client, args, channel }) => {
        const id = message ? args[0] : interaction.options.getString('id');
        const reply = { custom: true, ephemeral: true };
        const ids = !getIds() ? await updateIds() : getIds();
        if (!id) {
            if (channel.type === ChannelType.DM) {
                reply.content = 'Este comando solo se puede utilizar en un servidor.';
                return reply;
            } else {
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
                    var commandsField = { name: 'ID', value: ``, inline: true };
                    var ranksField = { name: 'Rango', value: ``, inline: true };
                    const smurfs = !getSmurfs() ? await updateSmurfs() : getSmurfs();
                    for (const command in smurfs)
                        if (Object.hasOwnProperty.call(smurfs, command)) {
                            const account = smurfs[command];
                            if (!account.vip || isVip) {
                                const accInfo = account.name.split('#');
                                await ValorantAPI.getMMR('v1', 'na', accInfo[0], accInfo[1]).then(mmr => {
                                    accountsField.value += `${account.bannedUntil != '' ? '⛔ ' : ''}${mmr.data.name != null && mmr.data.tag != null ? `${mmr.data.name}#${mmr.data.tag}` : `${account.name}`}\n\n`;
                                    commandsField.value += `${command}\n\n`;
                                    ranksField.value += `${translateRank(mmr.data.currenttierpatched)}\n\n`;
                                }).catch(console.error);
                            }
                        }
                    member.send({
                        embeds: [new EmbedBuilder()
                            .setTitle(`**Cuentas smurf**`)
                            .setDescription(`Hola <@${user.id}>, para obtener la información de una cuenta, utilizá nuevamente el comando \`${prefix}smurf\` seguido del ID de la cuenta deseada.\n\n`)
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
            }
            return;
        } else {
            const defaultGuild = await client.guilds.fetch(ids.guilds.default).catch(console.error);
            const smurfRole = await defaultGuild.roles.fetch(ids.roles.smurf).catch(console.error);
            const smurfs = !getSmurfs() ? await updateSmurfs() : getSmurfs();
            const deferringMessage = message ? await message.reply({ content: `Por favor esperá mientras obtengo la información de la cuenta...` })
                : await interaction.deferReply({ ephemeral: true });
            if (channel.type != ChannelType.DM)
                reply.content = 'Este comando solo se puede utilizar por mensajes directos.';
            else if (!smurfRole.members.has(user.id))
                reply.content = `Hola <@${user.id}>, no estás autorizado a usar este comando.`;
            else if (!Object.keys(smurfs).includes(id))
                reply.content = `Hola <@${user.id}>, la cuenta indicada no existe.`;
            else {
                const familyRole = await defaultGuild.roles.fetch(ids.roles.familia).catch(console.error);
                const isVip = user.id === ids.users.stormer || user.id === ids.users.darkness || familyRole.members.has(user.id);
                const account = smurfs[id];
                if (account.vip && !isVip)
                    reply.content = `Hola <@${user.id}>, no estás autorizado a usar este comando.`;
                else {
                    const accInfo = account.name.split('#');
                    await ValorantAPI.getMMR('v1', 'na', accInfo[0], accInfo[1]).then(mmr => {
                        try {
                            const thumb = !mmr.data.currenttierpatched ? `assets/thumbs/ranks/unranked.png`
                                : `assets/thumbs/ranks/${mmr.data.currenttierpatched.toLowerCase()}.png`;
                            reply.embeds = [new EmbedBuilder()
                                .setTitle(`**${account.name}**`)
                                .setColor([7, 130, 169])
                                .addFields([{ name: 'Nombre de usuario:', value: account.user, inline: true },
                                { name: 'Contraseña:', value: account.password, inline: true }])
                                .setThumbnail(`attachment://rank.png`)];
                            if (account.bannedUntil != '')
                                reply.embeds[0].setDescription(`⚠ ESTA CUENTA ESTÁ BANEADA HASTA EL **${account.bannedUntil}** ⚠`);
                            reply.files = [new AttachmentBuilder(thumb, { name: 'rank.png' })];
                        } catch {
                            reply.embeds = [new EmbedBuilder()
                                .setColor([7, 130, 169])
                                .setDescription('❌ Lo siento, ocurrió un error, intentá de nuevo.')];
                        }
                    }).catch(console.error);
                }
            }
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }
    }
}
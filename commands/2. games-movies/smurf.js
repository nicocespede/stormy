const { AttachmentBuilder, EmbedBuilder, ApplicationCommandOptionType, ChannelType } = require('discord.js');
const HenrikDevValorantAPI = require("unofficial-valorant-api");
const ValorantAPI = new HenrikDevValorantAPI();
const chalk = require('chalk');
const { getSmurfs, updateSmurfs, updateIds, getIds } = require('../../src/cache');
const { prefix, githubRawURL } = require('../../src/constants');

const translateRank = rank => {
    if (!rank)
        return 'Sin clasificar';
    const split = rank.split(' ');
    const rankName = split[0];
    const rankDivision = split[1];
    switch (rankName) {
        case 'Iron':
            return `Hierro ${rankDivision}`;
        case 'Bronze':
            return `Bronce ${rankDivision}`;
        case 'Silver':
            return `Plata ${rankDivision}`;
        case 'Gold':
            return `Oro ${rankDivision}`;
        case 'Platinum':
            return `Platino ${rankDivision}`;
        case 'Diamond':
            return `Diamante ${rankDivision}`;
        case 'Ascendant':
            return `Ascendente ${rankDivision}`;
        case 'Immortal':
            return `Inmortal ${rankDivision}`;
        case 'Radiant':
            return `Radiante`;
    }
};

const getRankColor = rank => {
    if (!rank)
        return [110, 113, 117];
    const rankName = rank.split(' ')[0];
    switch (rankName) {
        case 'Iron':
            return [148, 147, 148];
        case 'Bronze':
            return [137, 91, 0];
        case 'Silver':
            return [155, 164, 161];
        case 'Gold':
            return [211, 145, 49];
        case 'Platinum':
            return [60, 115, 123];
        case 'Diamond':
            return [140, 106, 189];
        case 'Ascendant':
            return [16, 103, 60];
        case 'Immortal':
            return [153, 77, 129];
        case 'Radiant':
            return [255, 255, 178];
    }
};

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

    callback: async ({ guild, member, user, message, interaction, client, args, channel, instance }) => {
        const id = message ? args[0] : interaction.options.getString('id');
        const reply = { custom: true, ephemeral: true };
        const ids = getIds() || await updateIds();
        if (!id) {
            if (channel.type === ChannelType.DM) {
                reply.content = '⚠ Este comando solo se puede utilizar en un servidor.';
                return reply;
            } else {
                const smurfRole = await guild.roles.fetch(ids.roles.smurf).catch(console.error);
                const isAuthorized = user.id === ids.users.stormer || user.id === ids.users.darkness || smurfRole.members.has(user.id);
                if (!isAuthorized) {
                    reply.content = `😂 Hola <@${user.id}>, ¿para qué me rompes los huevos si vos no vas a smurfear? Pedazo de horrible.`;
                    reply.ephemeral = false;
                    return reply;
                } else {
                    const familyRole = await guild.roles.fetch(ids.roles.familia).catch(console.error);
                    const isVip = user.id === ids.users.stormer || user.id === ids.users.darkness || familyRole.members.has(user.id);
                    const deferringMessage = message ? await message.reply({ content: `Por favor esperá mientras obtengo los rangos actualizados de las cuentas...` })
                        : await interaction.deferReply({ ephemeral: true });
                    const accountsField = { name: 'Cuenta', value: '', inline: true };
                    const commandsField = { name: 'ID', value: ``, inline: true };
                    const ranksField = { name: 'Rango', value: ``, inline: true };
                    const smurfs = getSmurfs() || await updateSmurfs();
                    let errorsCounter = 0;
                    let description = `Hola <@${user.id}>, `;
                    for (const command in smurfs) if (Object.hasOwnProperty.call(smurfs, command)) {
                        const account = smurfs[command];
                        if (!account.vip || isVip) {
                            const accInfo = account.name.split('#');
                            const mmr = await ValorantAPI.getMMR({
                                version: 'v1',
                                region: 'na',
                                name: accInfo[0],
                                tag: accInfo[1],
                            }).catch(console.error);
                            if (mmr.error) {
                                errorsCounter++;
                                console.log(chalk.red(`ValorantAPIError fetching ${account.name}:\n${JSON.stringify(mmr.error)}`));
                                accountsField.value += `${account.bannedUntil ? '⛔ ' : ''}${account.name}\n\n`;
                                ranksField.value += `???\n\n`;
                            } else {
                                accountsField.value += `${account.bannedUntil ? '⛔ ' : ''}${!mmr.data.name && !mmr.data.tag ? account.name : `${mmr.data.name}#${mmr.data.tag}`}\n\n`;
                                ranksField.value += `${translateRank(mmr.data.currenttierpatched)}\n\n`;
                            }
                            commandsField.value += `${command}\n\n`;
                        }
                    }

                    description += `${errorsCounter > 0 ? `ocurrió un error y no pude obtener el rango de ${errorsCounter} cuentas.\n\nP` : 'p'}ara obtener la información de una cuenta, utilizá nuevamente el comando \`${prefix}smurf\` seguido del ID de la cuenta deseada.\n\n`;

                    member.send({
                        embeds: [new EmbedBuilder()
                            .setTitle(`**Cuentas smurf**`)
                            .setDescription(description)
                            .setColor(instance.color)
                            .addFields([accountsField, commandsField, ranksField])
                            .setThumbnail(`${githubRawURL}/assets/thumbs/games/valorant.png`)]
                    }).then(() => {
                        reply.content = `✅ Hola <@${user.id}>, ¡revisá tus mensajes privados!`;
                        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
                    }).catch(() => {
                        reply.content = `❌ Lo siento <@${user.id}>, no pude enviarte el mensaje directo. :disappointed:`;
                        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
                    });
                }
            }
            return;
        } else {
            const defaultGuild = await client.guilds.fetch(ids.guilds.default).catch(console.error);
            const deferringMessage = message ? await message.reply({ content: `Por favor esperá mientras obtengo la información de la cuenta...` })
                : await interaction.deferReply({ ephemeral: true });
            const smurfRole = await defaultGuild.roles.fetch(ids.roles.smurf).catch(console.error);
            const isAuthorized = user.id === ids.users.stormer || user.id === ids.users.darkness || smurfRole.members.has(user.id);
            const smurfs = getSmurfs() || await updateSmurfs();
            if (channel.type !== ChannelType.DM)
                reply.content = '⚠ Este comando solo se puede utilizar por mensajes directos.';
            else if (!isAuthorized)
                reply.content = `⚠ Hola <@${user.id}>, no estás autorizado para usar este comando.`;
            else if (!Object.keys(smurfs).includes(id))
                reply.content = `⚠ Hola <@${user.id}>, la cuenta indicada no existe.`;
            else {
                const familyRole = await defaultGuild.roles.fetch(ids.roles.familia).catch(console.error);
                const isVip = user.id === ids.users.stormer || user.id === ids.users.darkness || familyRole.members.has(user.id);
                const account = smurfs[id];
                if (account.vip && !isVip)
                    reply.content = `⚠ Hola <@${user.id}>, no estás autorizado para usar este comando.`;
                else {
                    const accInfo = account.name.split('#');
                    const mmr = await ValorantAPI.getMMR({
                        version: 'v1',
                        region: 'na',
                        name: accInfo[0],
                        tag: accInfo[1],
                    }).catch(console.error);
                    if (mmr.error) {
                        console.log(chalk.red(`ValorantAPIError fetching ${account.name}:\n${JSON.stringify(mmr.error)}`));
                        reply.embeds = [new EmbedBuilder()
                            .setTitle(account.name)
                            .setColor(getRankColor(null))];
                        reply.files = [new AttachmentBuilder(`${githubRawURL}/assets/thumbs/games/unranked.png`, { name: 'rank.png' })];
                    } else {
                        const thumb = !mmr.data.images ? `${githubRawURL}/assets/thumbs/games/unranked.png` : mmr.data.images.large;
                        reply.embeds = [new EmbedBuilder()
                            .setTitle(`**${!mmr.data.name && !mmr.data.tag ? account.name : `${mmr.data.name}#${mmr.data.tag}`}**`)
                            .setColor(getRankColor(mmr.data.currenttierpatched))];
                        reply.files = [new AttachmentBuilder(thumb, { name: 'rank.png' })];
                    }
                    if (account.bannedUntil)
                        reply.embeds[0].setDescription(`⚠ ESTA CUENTA ESTÁ BANEADA HASTA EL **${account.bannedUntil.toLocaleDateString('es-AR')}** ⚠`);
                    reply.embeds[0].addFields([{ name: 'Nombre de usuario:', value: account.user, inline: true },
                    { name: 'Contraseña:', value: account.password, inline: true }])
                        .setThumbnail(`attachment://rank.png`);
                }
            }
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }
    }
}
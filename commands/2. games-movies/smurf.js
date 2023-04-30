const { AttachmentBuilder, EmbedBuilder, ApplicationCommandOptionType, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const HenrikDevValorantAPI = require("unofficial-valorant-api");
const ValorantAPI = new HenrikDevValorantAPI();
const { getSmurfs, updateSmurfs, updateIds, getIds } = require('../../src/cache');
const { PREFIX, GITHUB_RAW_URL, color, ARGENTINA_LOCALE_STRING, CONSOLE_RED } = require('../../src/constants');
const { isOwner } = require('../../src/common');
const { consoleLog, convertTZ } = require('../../src/util');

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

const getEmbed = async (color, guild, userId) => {
    const ids = getIds() || await updateIds();
    const vipRole = await guild.roles.fetch(ids.roles.vip).catch(console.error);
    const isVip = await isOwner(userId) || vipRole.members.has(userId);

    const smurfs = getSmurfs() || await updateSmurfs();
    const auxArray = [];
    for (const command in smurfs) if (Object.hasOwnProperty.call(smurfs, command)) {
        const { bannedUntil, name, vip } = smurfs[command];
        if (!vip || isVip) {
            const obj = { bannedUntil, command, name };
            const accInfo = name.split('#');
            obj['mmr'] = await ValorantAPI.getMMR({
                name: accInfo[0],
                region: 'na',
                tag: accInfo[1],
                version: 'v1'
            }).catch(console.error);
            auxArray.push(obj);
        }
    }

    auxArray.sort((a, b) => {
        const mmr1 = !a.mmr.error ? (a.mmr.data.currenttier || 0) : -1;
        const mmr2 = !b.mmr.error ? (b.mmr.data.currenttier || 0) : -1;
        return mmr1 - mmr2;
    });

    const accountsField = { name: 'Cuenta', value: '', inline: true };
    const commandsField = { name: 'ID', value: ``, inline: true };
    const ranksField = { name: 'Rango', value: ``, inline: true };
    let errorsCounter = 0;
    let description = `Hola <@${userId}>, `;
    for (const account of auxArray) {
        const { bannedUntil, command, mmr, name } = account;
        if (!mmr.error) {
            accountsField.value += `${bannedUntil ? '⛔ ' : ''}${!mmr.data.name && !mmr.data.tag ? name : `${mmr.data.name}#${mmr.data.tag}`}\n\n`;
            ranksField.value += `${translateRank(mmr.data.currenttierpatched)}\n\n`;
        } else {
            errorsCounter++;
            consoleLog(`ValorantAPIError fetching ${name}:\n${JSON.stringify(mmr.error)}`, CONSOLE_RED);
            accountsField.value += `${bannedUntil ? '⛔ ' : ''}${name}\n\n`;
            ranksField.value += `???\n\n`;
        }
        commandsField.value += `${command}\n\n`;
    }

    description += `${errorsCounter > 0 ? `ocurrió un error y no pude obtener el rango de ${errorsCounter} cuentas.\n\nP` : 'p'}ara obtener la información de una cuenta, utilizá nuevamente el comando \`${PREFIX}smurf\` seguido del ID de la cuenta deseada.\n\n`;

    return new EmbedBuilder()
        .setColor(color)
        .setDescription(description)
        .addFields([accountsField, commandsField, ranksField])
        .setFooter({ text: `Actualizado por última vez el ${convertTZ(new Date()).toLocaleString(ARGENTINA_LOCALE_STRING, { dateStyle: 'short', timeStyle: 'short' })}` })
        .setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/games/valorant.png`)
        .setTitle(`**Cuentas smurf**`);
};

const getRow = type => {
    const customId = type === 'update' || type === 'updating' ? 'update-smurfs' : 'report-ban';
    const disabled = type === 'success' || type === 'updating';
    let emoji;
    let label;
    let style;

    const row = new ActionRowBuilder();
    if (type === 'report') {
        emoji = '🚩';
        label = "Reportar cuenta baneada";
        style = ButtonStyle.Secondary;
    }

    if (type === 'success' || type === 'retry') {
        emoji = type === 'success' ? '👍🏼' : '🔄';
        label = type === 'success' ? "¡Gracias por tu reporte!" : "Reintentar";
        style = type === 'success' ? ButtonStyle.Success : ButtonStyle.Danger;
    }

    if (type === 'update' || type === 'updating') {
        emoji = '🔄';
        label = type === 'update' ? "Actualizar" : 'Actualizando...';
        style = ButtonStyle.Primary;
    }

    return row.addComponents(new ButtonBuilder()
        .setCustomId(customId)
        .setEmoji(emoji)
        .setLabel(label)
        .setStyle(style)
        .setDisabled(disabled));
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

    init: client => {
        client.on('interactionCreate', async interaction => {
            if (!interaction.isButton()) return;

            const { customId, message, user } = interaction;
            if (customId !== 'report-ban' && customId !== 'update-smurfs') return;

            const ids = getIds() || await updateIds();
            if (customId === 'report-ban') {
                const stormer = await client.users.fetch(ids.users.stormer).catch(console.error);
                try {
                    await stormer.send({
                        embeds: [new EmbedBuilder()
                            .setTitle('Reporte de baneo en cuenta smurf')
                            .setAuthor({ name: user.username, iconURL: user.avatarURL() })
                            .setDescription(`Cuenta: **${EmbedBuilder.from(message.embeds[0]).data.title}**`)
                            .setColor(color)
                            .setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/flag.png`)]
                    });
                    await interaction.update({ components: [getRow('success')] });
                } catch (e) {
                    consoleLog(`> Error sending report:\n${e.stack}`, CONSOLE_RED);
                    await interaction.update({ components: [getRow('retry')] });
                }
            }

            if (customId === 'update-smurfs') {
                const defaultGuild = await client.guilds.fetch(ids.guilds.default).catch(console.error);
                await interaction.update({ components: [getRow('updating')] });
                interaction.message.edit({
                    components: [getRow('update')],
                    embeds: [await getEmbed(color, defaultGuild, interaction.user.id)]
                });
            }
        });
    },

    callback: async ({ guild, member, user, message, interaction, client, args, channel, instance }) => {
        const id = message ? args[0] : interaction.options.getString('id');
        const reply = { custom: true, ephemeral: true };
        const ids = getIds() || await updateIds();

        if (!id) {
            if (channel.type === ChannelType.DM) {
                reply.content = '⚠ Este comando solo se puede utilizar en un servidor.';
                return reply;
            }

            const smurfRole = await guild.roles.fetch(ids.roles.smurf).catch(console.error);
            const isAuthorized = await isOwner(user.id) || smurfRole.members.has(user.id);
            if (!isAuthorized) {
                reply.content = `😂 Hola <@${user.id}>, ¿para qué me rompes los huevos si vos no vas a smurfear? Pedazo de horrible.`;
                reply.ephemeral = false;
                return reply;
            }

            const deferringMessage = message ? await message.reply({ content: `Por favor esperá mientras obtengo los rangos actualizados de las cuentas...` })
                : await interaction.deferReply({ ephemeral: true });

            try {
                await member.send({ components: [getRow('update')], embeds: [await getEmbed(instance.color, guild, user.id)] });
                reply.content = `✅ Hola <@${user.id}>, ¡revisá tus mensajes privados!`;
            } catch (error) {
                consoleLog(`> Error al enviar cuentas smurfs:\n${error.stack}`);
                reply.content = `❌ Lo siento <@${user.id}>, no pude enviarte el mensaje directo. :disappointed:`;
            }
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }

        const defaultGuild = await client.guilds.fetch(ids.guilds.default).catch(console.error);
        const deferringMessage = message ? await message.reply({ content: `Por favor esperá mientras obtengo la información de la cuenta...` })
            : await interaction.deferReply({ ephemeral: true });
        const smurfRole = await defaultGuild.roles.fetch(ids.roles.smurf).catch(console.error);
        const isAuthorized = await isOwner(user.id) || smurfRole.members.has(user.id);
        const smurfs = getSmurfs() || await updateSmurfs();
        if (channel.type !== ChannelType.DM)
            reply.content = '⚠ Este comando solo se puede utilizar por mensajes directos.';
        else if (!isAuthorized)
            reply.content = `⚠ Hola <@${user.id}>, no estás autorizado para usar este comando.`;
        else if (!Object.keys(smurfs).includes(id.toLowerCase()))
            reply.content = `⚠ Hola <@${user.id}>, la cuenta indicada no existe.`;
        else {
            const vipRole = await defaultGuild.roles.fetch(ids.roles.vip).catch(console.error);
            const isVip = await isOwner(user.id) || vipRole.members.has(user.id);
            const account = smurfs[id.toLowerCase()];
            if (account.vip && !isVip)
                reply.content = `⚠ Hola <@${user.id}>, no estás autorizado para usar este comando.`;
            else {
                const accInfo = account.name.split('#');
                const mmr = await ValorantAPI.getMMR({
                    name: accInfo[0],
                    region: 'na',
                    tag: accInfo[1],
                    version: 'v1'
                }).catch(console.error);
                if (mmr.error) {
                    consoleLog(`ValorantAPIError fetching ${account.name}:\n${JSON.stringify(mmr.error)}`, CONSOLE_RED);
                    reply.embeds = [new EmbedBuilder()
                        .setTitle(account.name)
                        .setColor(getRankColor(null))];
                    reply.files = [new AttachmentBuilder(`${GITHUB_RAW_URL}/assets/thumbs/games/unranked.png`, { name: 'rank.png' })];
                } else {
                    const thumb = !mmr.data.images ? `${GITHUB_RAW_URL}/assets/thumbs/games/unranked.png` : mmr.data.images.large;
                    reply.embeds = [new EmbedBuilder()
                        .setTitle(`**${!mmr.data.name && !mmr.data.tag ? account.name : `${mmr.data.name}#${mmr.data.tag}`}**`)
                        .setColor(getRankColor(mmr.data.currenttierpatched))];
                    reply.files = [new AttachmentBuilder(thumb, { name: 'rank.png' })];
                }
                if (account.bannedUntil)
                    reply.embeds[0].setDescription(`⚠ ESTA CUENTA ESTÁ BANEADA HASTA EL **${convertTZ(account.bannedUntil).toLocaleDateString(ARGENTINA_LOCALE_STRING)}** ⚠`);
                else if (user.id !== ids.users.stormer)
                    reply.components = [getRow('report')];
                reply.embeds[0].addFields([{ name: 'Nombre de usuario:', value: account.user, inline: true },
                { name: 'Contraseña:', value: account.password, inline: true }])
                    .setThumbnail(`attachment://rank.png`);
                reply.content = null;
            }
        }
        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
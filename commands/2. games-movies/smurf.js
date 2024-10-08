const { ICommand } = require('wokcommands');
const { AttachmentBuilder, EmbedBuilder, ApplicationCommandOptionType, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client } = require('discord.js');
const { APIResponse } = require("unofficial-valorant-api");
const UnofficialValorantAPI = require("unofficial-valorant-api");
const ValorantAPI = new UnofficialValorantAPI(process.env.VALORANT_API_KEY);
const { getSmurfs, updateSmurfs, getIds, getGithubRawUrl } = require('../../src/cache');
const { PREFIX, color, ARGENTINA_LOCALE_STRING } = require('../../src/constants');
const { isOwner, getErrorEmbed } = require('../../src/common');
const { convertTZ, logToFileCommandUsage, consoleLogError, logToFile, logToFileError, getSuccessEmbed, getSimpleEmbed, getWarningEmbed, getDenialEmbed, getWarningMessage } = require('../../src/util');

const MODULE_NAME = "games-movies.smurf";

const MMR_VERSION = 'v2';
const REGION = 'latam';

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

const getEmbed = async (color, userId) => {
    const smurfs = getSmurfs() || await updateSmurfs();
    const auxArray = [];
    for (const command in smurfs) if (Object.hasOwnProperty.call(smurfs, command)) {
        const { bannedUntil, name, vip } = smurfs[command];
        const accInfo = name.split('#');
        auxArray.push({
            bannedUntil,
            command,
            mmr: await getMMR(accInfo[0], accInfo[1]),
            name,
            vip
        });
    }

    auxArray.sort((a, b) => {
        const mmr1 = !a.mmr.error ? (a.mmr.data.current_data.currenttier || 0) : -1;
        const mmr2 = !b.mmr.error ? (b.mmr.data.current_data.currenttier || 0) : -1;
        return mmr1 - mmr2;
    });

    const accountsField = { name: 'Cuenta', value: '', inline: true };
    const commandsField = { name: 'ID', value: ``, inline: true };
    const ranksField = { name: 'Rango', value: ``, inline: true };
    let errorsCounter = 0;
    let description = `Hola <@${userId}>, `;
    for (const account of auxArray) {
        const { command, mmr, name } = account;
        if (mmr && !mmr.error) {
            accountsField.value += `${getAccountName(account, !mmr.data.name && !mmr.data.tag ? name : `${mmr.data.name}#${mmr.data.tag}`)}\n\n`;
            ranksField.value += `${translateRank(mmr.data.current_data.currenttierpatched)}\n\n`;
        } else {
            errorsCounter++;
            consoleLogError(`> Error al obtener datos de la cuenta ${name}`);
            if (mmr)
                logToFile(MODULE_NAME + `.getEmbed`, `Error: ValorantAPIError fetching ${name}\n` + JSON.stringify(mmr.error));
            accountsField.value += `${getAccountName(account, name)}\n\n`;
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
        .setThumbnail(await getGithubRawUrl(`assets/thumbs/games/valorant.png`))
        .setTitle(`**Cuentas smurf**`);
};

const getAccountName = (account, name) => {
    let emojis = '';
    const { bannedUntil, vip } = account;
    if (!name)
        name = account.name;
    if (vip)
        emojis += '💎';
    if (bannedUntil)
        emojis += '⛔';
    return emojis.length > 0 ? emojis + ' ' + name : name;
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

/**
 * Gets the MMR data of an account from the API.
 * 
 * @param {String} name The name of the account.
 * @param {String} tag The tag of the account.
 * @returns {Promise<APIResponse | null>} The API Response containing the MMR data of the account
 */
const getMMR = async (name, tag) => {
    try {
        return await ValorantAPI.getMMR({
            version: MMR_VERSION,
            region: REGION,
            name,
            tag
        });
    } catch (error) {
        logToFileError(MODULE_NAME, error);
        return null;
    }
};

/**@type {ICommand}*/
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

    /**@param {Client} client*/
    init: client => {
        client.on('interactionCreate', async interaction => {
            if (!interaction.isButton()) return;

            const { customId, message, user } = interaction;
            if (customId !== 'report-ban' && customId !== 'update-smurfs') return;

            const ids = await getIds();
            if (customId === 'report-ban') {
                const stormer = await client.users.fetch(ids.users.stormer).catch(console.error);
                try {
                    await stormer.send({
                        embeds: [new EmbedBuilder()
                            .setTitle('Reporte de baneo en cuenta smurf')
                            .setAuthor({ name: user.username, iconURL: user.avatarURL() })
                            .setDescription(`Cuenta: **${EmbedBuilder.from(message.embeds[0]).data.title}**`)
                            .setColor(color)
                            .setThumbnail(await getGithubRawUrl(`assets/thumbs/flag.png`))]
                    });
                    await interaction.update({ components: [getRow('success')] });
                } catch (e) {
                    consoleLogError(`> Error al enviar reporte de cuenta de Valorant`);
                    logToFileError(MODULE_NAME + `.init`, e);
                    await interaction.update({ components: [getRow('retry')] });
                }
            }

            if (customId === 'update-smurfs') {
                await interaction.update({ components: [getRow('updating')] });
                interaction.message.edit({
                    components: [getRow('update')],
                    embeds: [await getEmbed(color, interaction.user.id)]
                });
            }
        });
    },

    callback: async ({ args, channel, client, guild, instance, interaction, member, message, text, user }) => {
        logToFileCommandUsage('smurf', text, interaction, user);

        const id = message ? args[0] : interaction.options.getString('id');
        const reply = { custom: true, ephemeral: true };
        const ids = await getIds();

        if (!id) {
            if (channel.type === ChannelType.DM) {
                reply.embeds = [getWarningEmbed(`Este comando solo se puede utilizar en un servidor.`)];
                return reply;
            }

            const smurfRole = await guild.roles.fetch(ids.roles.smurf).catch(console.error);
            const isAuthorized = await isOwner(user.id) || smurfRole.members.has(user.id);
            if (!isAuthorized) {
                reply.embeds = [getSimpleEmbed(`😂 Hola <@${user.id}>, ¿para qué me rompes los huevos si vos no vas a smurfear? Pedazo de horrible.`)];
                reply.ephemeral = false;
                return reply;
            }

            const deferringMessage = message ? await message.reply({ embeds: [getSimpleEmbed(`⌛ Por favor esperá mientras obtengo los rangos actualizados de las cuentas...`)] })
                : await interaction.deferReply({ ephemeral: true });

            try {
                await member.send({ components: [getRow('update')], embeds: [await getEmbed(instance.color, user.id)] });
                reply.embeds = [getSuccessEmbed(`Hola <@${user.id}>, ¡revisá tus mensajes privados!`)];
            } catch (error) {
                consoleLogError(`> Error al enviar cuentas smurfs`);
                logToFileError(MODULE_NAME, error);
                reply.embeds = [await getErrorEmbed(`Lo siento <@${user.id}>, no pude enviarte el mensaje directo. :disappointed:`)];
            }
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }

        const defaultGuild = await client.guilds.fetch(ids.guilds.default).catch(console.error);
        const deferringMessage = message ? await message.reply({ embeds: [getSimpleEmbed(`⌛ Por favor esperá mientras obtengo la información de la cuenta...`)] })
            : await interaction.deferReply({ ephemeral: true });
        const smurfRole = await defaultGuild.roles.fetch(ids.roles.smurf).catch(console.error);
        const isAuthorized = await isOwner(user.id) || smurfRole.members.has(user.id);
        const smurfs = getSmurfs() || await updateSmurfs();
        if (channel.type !== ChannelType.DM)
            reply.embeds = [getWarningEmbed(`Este comando solo se puede utilizar por mensajes directos.`)];
        else if (!isAuthorized)
            reply.embeds = [getDenialEmbed(`Hola <@${user.id}>, no estás autorizado para usar este comando.`)];
        else if (!Object.keys(smurfs).includes(id.toLowerCase()))
            reply.embeds = [getWarningEmbed(`Hola <@${user.id}>, la cuenta indicada no existe.`)];
        else {
            const vipRole = await defaultGuild.roles.fetch(ids.roles.vip).catch(console.error);
            const isVip = await isOwner(user.id) || vipRole.members.has(user.id);
            const account = smurfs[id.toLowerCase()];
            if (account.vip && !isVip)
                reply.embeds = [getDenialEmbed(`Hola <@${user.id}>, no estás autorizado para usar esta cuenta.`)];
            else {
                const accInfo = account.name.split('#');
                const mmr = await getMMR(accInfo[0], accInfo[1]);

                if (!mmr || mmr.error) {
                    consoleLogError(`> Error al obtener datos de la cuenta ${account.name}`);
                    if (mmr)
                        logToFile(MODULE_NAME, `Error: ValorantAPIError fetching ${account.name}\n` + JSON.stringify(mmr.error));
                    reply.embeds = [new EmbedBuilder()
                        .setTitle(account.name)
                        .setColor(getRankColor(null))];
                    reply.files = [new AttachmentBuilder(await getGithubRawUrl(`assets/thumbs/games/unranked.png`), { name: 'rank.png' })];
                } else {
                    const thumb = !mmr.data.current_data.images ? await getGithubRawUrl(`assets/thumbs/games/unranked.png`) : mmr.data.current_data.images.large;
                    reply.embeds = [new EmbedBuilder()
                        .setTitle(`**${!mmr.data.name && !mmr.data.tag ? account.name : `${mmr.data.name}#${mmr.data.tag}`}**`)
                        .setColor(getRankColor(mmr.data.current_data.currenttierpatched))];
                    reply.files = [new AttachmentBuilder(thumb, { name: 'rank.png' })];
                }
                if (account.bannedUntil)
                    reply.embeds[0].setDescription(getWarningMessage(`ESTA CUENTA ESTÁ BANEADA HASTA EL **${convertTZ(account.bannedUntil).toLocaleDateString(ARGENTINA_LOCALE_STRING)}** ⚠️`));
                else if (user.id !== ids.users.stormer)
                    reply.components = [getRow('report')];
                reply.embeds[0].addFields([
                    { name: 'Nombre de usuario:', value: account.user, inline: true },
                    { name: 'Contraseña:', value: account.password, inline: true }
                ]).setThumbnail(`attachment://rank.png`);
            }
        }
        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
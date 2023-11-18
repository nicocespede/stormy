const { EmbedBuilder, Client } = require("discord.js");
const { updateBanned, updateSombraBans, getBansResponsibles, removeBanResponsible, getIds } = require("../src/cache");
const { getBannedMemberEmbedInfo } = require("../src/characters");
const { countMembers, pushDifference } = require("../src/common");
const { getUserTag, consoleLogError, logToFileError } = require("../src/util");
const { addBan, addSombraBan } = require("../src/mongodb");

const MODULE_NAME = 'features.ban-message';

/** @param {Client} client */
module.exports = client => {
    client.on('guildBanAdd', async ban => {
        await new Promise(res => setTimeout(res, 1000 * 1));
        const bansResponsibles = getBansResponsibles();

        const { reason, user } = ban;
        const tag = getUserTag(user);

        const responsible = bansResponsibles[user.id] || 'Desconocido';
        if (bansResponsibles[user.id])
            removeBanResponsible(user.id);
        const banReason = !reason || reason.trim().length === 0 ? null : reason;
        const embedInfo = await getBannedMemberEmbedInfo(tag, banReason);

        await pushDifference(user.id, tag);

        try {
            await addBan(user.id, tag, responsible, embedInfo.character, banReason);
            await updateBanned();
        } catch (error) {
            consoleLogError('> Error al agregar ban a la base de datos');
            logToFileError(MODULE_NAME, error);
        }

        const ids = await getIds();
        const channel = await client.channels.fetch(ids.channels.welcome);

        if (!channel)
            consoleLogError('> Error al obtener canal de bienvenida');
        else
            channel.send({
                embeds: [new EmbedBuilder()
                    .setTitle(embedInfo.title)
                    .setDescription(embedInfo.description)
                    .setColor(embedInfo.color)
                    .setThumbnail(embedInfo.thumbnail)]
            });

        if (user.id === ids.users.sombra)
            try {
                await addSombraBan(banReason);
                await updateSombraBans();
            } catch (error) {
                consoleLogError('> Error al guardar ban de Sombra en la base de datos');
                logToFileError(MODULE_NAME, error);
            }

        countMembers(client);
    });
};

module.exports.config = {
    displayName: 'Mensaje de baneo',
    dbName: 'BAN_MESSAGE'
}
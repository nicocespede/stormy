const { EmbedBuilder, Client } = require("discord.js");
const { getBanned, updateBanned, getIds } = require("../src/cache");
const { getUserTag, consoleLogError, logToFileError } = require("../src/util");
const { getUnbannedMemberEmbedInfo } = require("../src/characters");
const { deleteBan } = require("../src/mongodb");

const MODULE_NAME = 'features.unban-message';

/** @param {Client} client */
module.exports = client => {
    client.on('guildBanRemove', async ban => {
        const banned = getBanned() || await updateBanned();
        const { user } = ban;

        if (Object.keys(banned).includes(user.id)) {
            try {
                await deleteBan(user.id);
                await updateBanned();
            } catch (error) {
                consoleLogError('> Error al eliminar ban de la base de datos');
                logToFileError(MODULE_NAME, error);
            }

            const ids = await getIds();
            const channel = await client.channels.fetch(ids.channels.welcome);
            if (!channel)
                consoleLogError('> Error al obtener canal de bienvenida');
            else {
                const embedInfo = await getUnbannedMemberEmbedInfo(getUserTag(user), banned[user.id].character);
                channel.send({
                    embeds: [new EmbedBuilder()
                        .setTitle(embedInfo.title)
                        .setDescription(embedInfo.description)
                        .setColor(embedInfo.color)
                        .setThumbnail(embedInfo.thumbnail)]
                });
            }
        }
    });
};

module.exports.config = {
    displayName: 'Mensaje de desbaneo',
    dbName: 'UNBAN_MESSAGE'
}
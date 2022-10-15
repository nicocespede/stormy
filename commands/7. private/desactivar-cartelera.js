const chalk = require('chalk');
chalk.level = 1;
const { getReactionCollectorInfo, updateReactionCollectorInfo, getIds, updateIds } = require('../../app/cache');
const { stopReactionCollector } = require('../../app/general');
const { updateBillboardCollectorMessage } = require('../../app/mongodb');

module.exports = {
    category: 'Privados',
    description: 'Desactiva la cartelera y quita el rol \'función\' a todos.',

    maxArgs: 0,
    slash: false,
    ownerOnly: true,

    callback: async ({ guild, message }) => {
        const { isActive, messageId } = getReactionCollectorInfo() || await updateReactionCollectorInfo();
        if (!isActive)
            message.author.send({ content: 'El recolector de reacciones no está activo.' });
        else {
            await updateBillboardCollectorMessage(false, messageId).catch(console.error);
            await updateReactionCollectorInfo();
            stopReactionCollector();
            const ids = getIds() || await updateIds();
            const role = await guild.roles.fetch(ids.roles.funcion).catch(console.error);
            const members = await guild.members.fetch().catch(console.error);
            members.forEach(async member => {
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role).catch(console.error);
                    console.log(chalk.yellow(`> Rol 'función' quitado a ${member.user.tag}`))
                }
            });
        }
        message.delete();
        return;
    }
}
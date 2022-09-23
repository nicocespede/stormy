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
        const aux = !getReactionCollectorInfo() ? await updateReactionCollectorInfo() : getReactionCollectorInfo();
        if (!aux.isActive)
            message.author.send({ content: 'El recolector de reacciones no está activo.' });
        else
            updateBillboardCollectorMessage(false, aux.messageId).then(async () => {
                await updateReactionCollectorInfo();
                stopReactionCollector();
                const ids = !getIds() ? await updateIds() : getIds();
                guild.roles.fetch(ids.roles.funcion).then(role => {
                    guild.members.fetch().then(members => {
                        members.forEach(member => {
                            if (member.roles.cache.has(role.id))
                                member.roles.remove(role).then(() => console.log(`> Rol 'función' quitado a ${member.user.tag}`)).catch(console.error);
                        });
                    }).catch(console.error);
                }).catch(console.error);
            }).catch(console.error);
        message.delete();
        return;
    }
}
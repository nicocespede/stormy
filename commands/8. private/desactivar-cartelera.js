const { getReactionCollectorInfo, updateReactionCollectorInfo } = require('../../app/cache');
const { ids } = require('../../app/constants');
const { stopReactionCollector } = require('../../app/general');
const { updateCollectorMessage } = require('../../app/postgres');

module.exports = {
    category: 'Privados',
    description: 'Desactiva la cartelera y quita el rol \'función\' a todos.',

    maxArgs: 0,
    slash: false,
    ownerOnly: true,

    callback: async ({ guild, message }) => {
        var aux = !getReactionCollectorInfo() ? await updateReactionCollectorInfo() : getReactionCollectorInfo();
        aux = aux[0];
        if (!aux['activeCollector'])
            message.author.send({ content: 'El recolector de reacciones no está activo.' });
        else
            updateCollectorMessage(false, aux['messageId']).then(async () => {
                await updateReactionCollectorInfo();
                stopReactionCollector();
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
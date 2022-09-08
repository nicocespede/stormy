const { updateCrosshairs } = require('../../app/cache');
const { addCrosshair } = require('../../app/mongodb');

module.exports = {
    category: 'Juegos/Películas',
    description: 'Guarda miras de Valorant.',
    aliases: ['agregar-crosshair'],

    minArgs: 2,
    expectedArgs: '<nombre> <codigo>',
    slash: false,

    callback: async ({ user, message, args }) => {
        const deferringMessage = await message.reply({ content: 'Procesando acción...' });

        var reply = { ephemeral: true };

        const code = args.pop();
        const name = args.join(' ');
        const attachment = message.attachments.size != 0 ? message.attachments.first().url : null;

        await addCrosshair(name, code, user.id, attachment).then(async () => {
            reply.content = `Se agregó la mira **${name}**.`;
            reply.ephemeral = false;
        }).catch(console.error);
        
        deferringMessage.edit(reply);
        await updateCrosshairs();
        return;
    }
}
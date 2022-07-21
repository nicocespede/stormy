const { updateCrosshairs } = require('../../app/cache');
const { prefix } = require('../../app/constants');
const { addCrosshair } = require('../../app/postgres');

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

        if (!name) {
            reply.content = `¡Uso incorrecto! Debés introducir un nombre para la mira. Usá **"${prefix}miras agregar <nombre> <codigo>"**.`;
            deferringMessage.edit(reply);
            return;
        }

        if (!code) {
            reply.content = `¡Uso incorrecto! Debés introducir el código de la mira. Usá **"${prefix}miras agregar <nombre> <codigo>"**.`;
            deferringMessage.edit(reply);
            return;
        }

        await addCrosshair(name, code, user.id, attachment).then(async () => {
            await updateCrosshairs();
            reply.content = `Se agregó la mira **${name}**.`;
            reply.ephemeral = false;
        }).catch(console.error);

        deferringMessage.edit(reply);
        return;
    }
}
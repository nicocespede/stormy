const { executeQuery } = require("../../app/postgres");

module.exports = {
    category: 'Privados',
    description: 'Elimina la cola de reproducción previa de la base de datos.',

    maxArgs: 0,
    slash: 'both',
    ownerOnly: true,

    callback: async () => {
        const reply = { custom: true };
        await executeQuery('DELETE FROM "previousQueue";').catch(console.error);
        reply.content = `> Cola de reproducción previa eliminada de la base de datos`;
        return reply;
    }
}
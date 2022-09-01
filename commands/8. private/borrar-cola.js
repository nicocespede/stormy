module.exports = {
    category: 'Privados',
    description: 'Elimina la cola de reproducción previa de la base de datos.',

    maxArgs: 0,
    slash: 'both',
    ownerOnly: true,

    callback: async () => {
        const reply = { custom: true };
        const previousQueueSchema = require('../../models/previousQueue-schema');
        const result = await previousQueueSchema.deleteMany({});
        reply.content = result.deletedCount > 0 ? `Cola de reproducción previa eliminada de la base de datos`
            : `No hay cola de reproducción previa para eliminar`;
        return reply;
    }
}
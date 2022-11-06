const { updateReminders, timeouts } = require('../src/cache');
const { convertTZ, log } = require('../src/util');
const reminderSchema = require('../models/reminder-schema');

module.exports = client => {
    const check = async () => {
        const date = convertTZ(new Date());
        date.setMinutes(date.getMinutes() + 1);
        date.setSeconds(0);
        date.setMilliseconds(0);

        const query = { date: { $lt: date } };
        const results = await reminderSchema.find(query);

        for (const result of results) {
            const { description, userId } = result;
            const user = await client.users.fetch(userId);
            if (!user) {
                log(`> Usuario "${userId}" no encontrado`, 'red');
                continue;
            }

            user.send({ content: `🔔 **RECORDATORIO** ⏰\n\n${description}` })
                .catch(_ => log(`> No se pudo enviar el recordatorio a ${user.tag} `, 'red'));
        }

        const deletion = await reminderSchema.deleteMany(query);
        if (deletion.deletedCount > 0) {
            const moreThan1 = deletion.deletedCount > 1;
            log(`> ${deletion.deletedCount} recordatorio${moreThan1 ? 's' : ''} eliminado${moreThan1 ? 's' : ''} de la base de datos`, 'green');
            updateReminders();
        }

        timeouts['reminders-checker'] = setTimeout(check, 1000 * 60);
    };
    check();
};

module.exports.config = {
    displayName: 'Verificador de recordatorios',
    dbName: 'REMINDERS_CHECKER'
};
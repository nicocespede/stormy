const { updateReminders, timeouts } = require('../src/cache');
const { consoleLog, getUserTag } = require('../src/util');
const reminderSchema = require('../models/reminder-schema');
const { CONSOLE_GREEN, CONSOLE_RED } = require('../src/constants');

module.exports = client => {
    const check = async () => {
        const date = new Date();
        date.setMinutes(date.getMinutes() + 1);
        date.setSeconds(0);
        date.setMilliseconds(0);

        const query = { date: { $lt: date } };
        const results = await reminderSchema.find(query);

        for (const result of results) {
            const { description, userId } = result;
            const user = await client.users.fetch(userId);
            if (!user) {
                consoleLog(`> Usuario "${userId}" no encontrado`, CONSOLE_RED);
                continue;
            }

            user.send({ content: `🔔 **RECORDATORIO** ⏰\n\n${description}` })
                .catch(_ => consoleLog(`> No se pudo enviar el recordatorio a ${getUserTag(user)} `, CONSOLE_RED));
        }

        const deletion = await reminderSchema.deleteMany(query);
        if (deletion.deletedCount > 0) {
            const moreThan1 = deletion.deletedCount > 1;
            consoleLog(`> ${deletion.deletedCount} recordatorio${moreThan1 ? 's' : ''} eliminado${moreThan1 ? 's' : ''} de la base de datos`, CONSOLE_GREEN);
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
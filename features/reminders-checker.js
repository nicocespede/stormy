const chalk = require('chalk');
chalk.level = 1;
const { updateReminders } = require('../app/cache');
const { convertTZ } = require('../app/general');
const reminderSchema = require('../models/reminder-schema');

module.exports = client => {
    const check = async () => {
        const date = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
        date.setMinutes(date.getMinutes() + 1);
        date.setSeconds(0);
        date.setMilliseconds(0);

        const query = { date: { $lt: date } };
        const results = await reminderSchema.find(query);

        for (const result of results) {
            const { description, userId } = result;
            const user = await client.users.fetch(userId);
            if (!user) {
                console.log(chalk.red(`> Usuario "${userId}" no encontrado.`));
                continue;
            }

            user.send({ content: `🔔 **RECORDATORIO** ⏰\n\n${description}` })
                .catch(_ => console.log(chalk.red(`> No se pudo enviar el recordatorio a ${user.tag}. `)));
        }

        const deletion = await reminderSchema.deleteMany(query);
        if (deletion.deletedCount > 0) {
            const moreThan1 = deletion.deletedCount > 1;
            console.log(chalk.green(`> ${deletion.deletedCount} recordatorio${moreThan1 ? 's' : ''} eliminado${moreThan1 > 1 ? 's' : ''} de la base de datos`));
            updateReminders();
        }

        setTimeout(check, 1000 * 60);
    };
    check();
};

module.exports.config = {
    displayName: 'Verificador de recordatorios',
    dbName: 'REMINDERS_CHECKER'
};
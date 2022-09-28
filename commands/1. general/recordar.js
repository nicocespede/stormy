const { ApplicationCommandOptionType } = require('discord.js');
const chalk = require('chalk');
chalk.level = 1;
const reminderSchema = require('../../models/reminder-schema');

module.exports = {
    category: 'General',
    description: 'Establece un aviso programado a modo de alarma.',
    options: [
        {
            name: 'descripcion',
            description: 'La descripción del aviso.',
            required: true,
            type: ApplicationCommandOptionType.String
        },
        {
            name: 'tiempo-o-fecha',
            description: 'Dentro de cuánto tiempo o en qué fecha se quiere recibir el aviso.',
            required: true,
            type: ApplicationCommandOptionType.String
        }
    ],
    slash: true,

    callback: async ({ user, interaction }) => {
        const description = interaction.options.getString('descripcion');
        const time = interaction.options.getString('tiempo-o-fecha');

        const reply = { custom: true, ephemeral: true };

        let totalTime = 0;
        let number;
        let type;
        const split = time.split(' ');
        for (const arg of split) {
            try {
                const secondSplit = arg.match(/\d+|\D+/g);
                number = parseInt(secondSplit[0]);
                type = secondSplit[1].toLowerCase();
            } catch {
                reply.content = `⚠ **¡Formato de tiempo inválido!** _Ejemplo de formato: "1d 2h 3m" donde 'd' = días, 'h' =  horas y 'm' = minutos._`;
                return reply;
            }

            if (type === 'h')
                totalTime += number * 60;
            else if (type === 'd')
                totalTime += number * 60 * 24;
            else if (type !== 'm') {
                reply.content = `⚠ Por favor usá **"m"**, **"h"** o **"d"** para **minutos**, **horas** y **días** respectivamente.`;
                return reply;
            } else
                totalTime += number;
        }

        const date = new Date();
        date.setMinutes(date.getMinutes() + totalTime);

        await new reminderSchema({ description: description, userId: user.id, date: date }).save();
        console.log(chalk.green('> Recordatorio agregado a la base de datos'));

        reply.content = `✅ Tu recordatorio para el **${date.toLocaleDateString('es-AR')}** a las **${date.toLocaleTimeString('es-AR', { timeStyle: 'short' })}** fue guardado satisfactoriamente.`;
        return reply;
    }
}
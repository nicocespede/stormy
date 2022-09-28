const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const chalk = require('chalk');
chalk.level = 1;
const { updateReminders, getReminders } = require('../../app/cache');
const reminderSchema = require('../../models/reminder-schema');
const { githubRawURL } = require('../../app/constants');
const { convertTZ } = require('../../app/general');

module.exports = {
    category: 'General',
    description: 'Establece un aviso programado a modo de alarma.',

    options: [{
        name: 'ver',
        description: 'Responde con la lista de tus recordatorios guardados.',
        type: ApplicationCommandOptionType.Subcommand
    }, {
        name: 'agregar',
        description: 'Guarda un recordatorio nuevo.',
        type: ApplicationCommandOptionType.Subcommand,
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
        ]
    }, {
        name: 'borrar',
        description: 'Borra un recordatorio guardado.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            {
                name: 'id',
                description: 'El ID del recordatorio.',
                required: true,
                type: ApplicationCommandOptionType.Integer
            }
        ]
    }],

    slash: true,

    callback: async ({ user, interaction }) => {
        const subCommand = interaction.options.getSubcommand();

        if (subCommand === 'ver') {
            const reminders = getReminders() || await updateReminders();
            const filtered = reminders.filter(r => r.userId === user.id);

            if (filtered.length > 0) {
                let description = `Hola <@${user.id}>, tus recordatorios guardados son:\n\n`;
                for (let i = 0; i < filtered.length; i++) {
                    const reminder = filtered[i];
                    description += `**${i + 1}.** ${reminder.description}: **${reminder.date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}**\n\n`;
                }

                interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('🔔 Tus recordatorios')
                        .setDescription(description)
                        .setColor([255, 2, 6])
                        .setThumbnail('attachment://alarm.png')],
                    ephemeral: true,
                    files: [`${githubRawURL}/assets/thumbs/alarm.png`]
                });
                return;
            } else
                return { custom: true, ephemeral: true, content: '⚠ No tenés ningún recordatorio guardado.' }
        } else if (subCommand === 'agregar') {
            const description = interaction.options.getString('descripcion');
            const arg = interaction.options.getString('tiempo-o-fecha');

            const reply = { custom: true, ephemeral: true };

            let date;

            if (!/[\-\/\:]/.test(arg)) {
                let totalTime = 0;
                let time;
                let type;
                const split = arg.split(' ');
                for (const arg of split) {
                    try {
                        const secondSplit = arg.match(/\d+|\D+/g);
                        time = parseInt(secondSplit[0]);
                        type = secondSplit[1].toLowerCase();
                    } catch {
                        reply.content = `⚠ **¡Formato de tiempo inválido!** _Ejemplo de formato: "1d 2h 3m" donde 'd' = días, 'h' =  horas y 'm' = minutos._`;
                        return reply;
                    }

                    if (type === 'h')
                        totalTime += time * 60;
                    else if (type === 'd')
                        totalTime += time * 60 * 24;
                    else if (type !== 'm') {
                        reply.content = `⚠ Por favor usá **"m"**, **"h"** o **"d"** para **minutos**, **horas** y **días** respectivamente.`;
                        return reply;
                    } else
                        totalTime += time;
                }

                date = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
                date.setMinutes(date.getMinutes() + totalTime);

            } else {
                const splittedArg = arg.split(' ');
                if (splittedArg.length != 2) {
                    reply.content = `⚠ **¡Formato de fecha inválido!** Formatos válidos: _DD/MM/AAAA HH:MM_ o _DD-MM-AAAA HH:MM_.`;
                    return reply;
                }

                const dateMatch = splittedArg[0].match(/^(?:(?:31(\/|-)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/);
                const timeMatch = splittedArg[1].match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/);

                if (!dateMatch) {
                    reply.content = `⚠ La fecha es inválida.`;
                    return reply;
                }

                if (!timeMatch) {
                    reply.content = `⚠ La hora es inválida.`;
                    return reply;
                }

                const split = dateMatch[0].split(/[\-\.\/]/);
                date = convertTZ(new Date(`${split[1]}/${split[0]}/${split[2]} ${timeMatch[0]}`), 'America/Argentina/Buenos_Aires');

                if (date < convertTZ(new Date(), 'America/Argentina/Buenos_Aires')) {
                    reply.content = '⚠ La fecha introducida ya pasó.';
                    return reply;
                }
            }

            await new reminderSchema({ description: description, userId: user.id, date: date }).save();
            console.log(chalk.green('> Recordatorio agregado a la base de datos'));
            updateReminders();

            reply.content = `✅ Tu recordatorio para el **${date.toLocaleDateString('es-AR')}** a las **${date.toLocaleTimeString('es-AR', { timeStyle: 'short' })}** fue guardado satisfactoriamente.`;
            return reply;

        } else if (subCommand === 'borrar') {
            const id = interaction.options.getInteger('id');
            const reminders = getReminders() || await updateReminders();
            const filtered = reminders.filter(r => r.userId === user.id);

            if (filtered.length === 0)
                return { content: `⚠ No tenés recordatorios guardados.`, custom: true, ephemeral: true };

            const index = id - 1;

            if (index < 0 || index >= filtered.length)
                return { custom: true, ephemeral: true, content: '⚠ El ID es inválido.' }

            const selected = filtered[id - 1];
            const deletion = await reminderSchema.deleteOne({ _id: selected._id }).catch(console.error);
            if (deletion.deletedCount > 0) {
                console.log(chalk.green(`> Recordatorio eliminado de la base de datos`));
                updateReminders();
                return { content: `✅ Recordatorio borrado satisfactoriamente.`, custom: true, ephemeral: true };
            }
            return { content: `❌ Lo siento, algo salió mal.`, custom: true, ephemeral: true };
        }
    }
}
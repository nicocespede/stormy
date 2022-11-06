const { ApplicationCommandOptionType } = require('discord.js');
const { getSmurfs, updateSmurfs, getIds, updateIds } = require('../../src/cache');
const { convertTZ } = require('../../src/util');
const { addSmurf, deleteSmurf, updateSmurf } = require('../../src/mongodb');

module.exports = {
    category: 'Privados',
    description: 'Administra las cuentas smurf de Valorant.',

    options: [{
        name: 'agregar',
        description: 'Guarda una cuenta smurf.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            {
                name: 'comando',
                description: 'El comando que utilizará esta cuenta.',
                required: true,
                type: ApplicationCommandOptionType.String
            },
            {
                name: 'nombre',
                description: 'El nombre de la cuenta.',
                required: true,
                type: ApplicationCommandOptionType.String
            },
            {
                name: 'usuario',
                description: 'El usuario de la cuenta.',
                required: true,
                type: ApplicationCommandOptionType.String
            },
            {
                name: 'contraseña',
                description: 'La contraseña de la cuenta.',
                required: true,
                type: ApplicationCommandOptionType.String
            },
            {
                name: 'vip',
                description: 'Si es para usuarios VIP o no.',
                required: true,
                type: ApplicationCommandOptionType.Boolean
            }
        ]
    }, {
        name: 'borrar',
        description: 'Borra una cuenta guardada.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            {
                name: 'comando',
                description: 'El comando de la cuenta que se quiere borrar.',
                required: true,
                type: ApplicationCommandOptionType.String
            }
        ]
    }, {
        name: 'ban',
        description: 'Actualiza el ban de una cuenta guardada.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            {
                name: 'comando',
                description: 'El comando de la cuenta que se quiere actualizar.',
                required: true,
                type: ApplicationCommandOptionType.String
            }, {
                name: 'fecha',
                description: 'La fecha hasta que la cuenta se encuentra banneada.',
                required: true,
                type: ApplicationCommandOptionType.String
            }
        ]
    }],
    slash: true,

    callback: async ({ user, interaction }) => {
        const subCommand = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true });

        const reply = { ephemeral: true };

        const ids = getIds() || await updateIds();
        if (user.id != ids.users.stormer && user.id != ids.users.darkness) {
            reply.content = `Hola <@${user.id}>, no tenés autorización para usar este comando.`;
            interaction.editReply(reply);
            return;
        }

        if (subCommand === 'agregar') {
            const accountCommand = interaction.options.getString('comando').toLowerCase();
            const accountName = interaction.options.getString('nombre');
            const accountUser = interaction.options.getString('usuario');
            const accountPassword = interaction.options.getString('contraseña');
            const isVip = interaction.options.getBoolean('vip');

            const smurfs = getSmurfs() || await updateSmurfs();
            if (Object.keys(smurfs).includes(accountCommand))
                reply.content = `⚠ Ya hay una cuenta vinculada a ese comando.`;
            else
                await addSmurf(accountCommand, accountName, accountUser, accountPassword, isVip).then(async () => {
                    await updateSmurfs();
                    reply.content = `Se agregó la cuenta **${accountName}**.`;
                    reply.ephemeral = false;
                }).catch(console.error);
            interaction.editReply(reply);
            return;
        } else if (subCommand === 'borrar') {
            const accountCommand = interaction.options.getString('comando').toLowerCase();

            const smurfs = getSmurfs() || await updateSmurfs();
            if (!Object.keys(smurfs).includes(accountCommand))
                reply.content = `⚠ La cuenta que intentás borrar no existe.`;
            else
                await deleteSmurf(accountCommand).then(async () => {
                    await updateSmurfs();
                    reply.content = `✅ La cuenta fue borrada de manera exitosa.`;
                    reply.ephemeral = false;
                }).catch(console.error);
            interaction.editReply(reply);
            return;
        } else {
            const accountCommand = interaction.options.getString('comando').toLowerCase();
            const arg = interaction.options.getString('fecha');

            const smurfs = getSmurfs() || await updateSmurfs();
            if (!Object.keys(smurfs).includes(accountCommand)) {
                reply.content = `⚠ La cuenta que intentás actualizar no existe.`;
                interaction.editReply(reply);
                return;
            }

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

                date = convertTZ(new Date());
                date.setMinutes(date.getMinutes() + totalTime);

            } else {
                const dateMatch = arg.match(/^(?:(?:31(\/|-)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/);

                if (!dateMatch) {
                    reply.content = `⚠ La fecha es inválida.`;
                    return reply;
                }

                const split = dateMatch[0].split(/[\-\.\/]/);
                date = new Date(`${split[1]}/${split[0]}/${split[2]}`);

                if (date < new Date()) {
                    reply.content = '⚠ La fecha introducida ya pasó.';
                    return reply;
                }
            }

            await updateSmurf(accountCommand, date).catch(console.error);
            await updateSmurfs();
            reply.content = `✅ La cuenta fue actualizada de manera exitosa.`;
            reply.ephemeral = false;
            interaction.editReply(reply);
        }
    }
}
const { Constants } = require('discord.js');
const { getSmurfs, updateSmurfs } = require('../../app/cache');
const { ids } = require('../../app/constants');
const { convertTZ } = require('../../app/general');
const { addSmurf, deleteSmurf, updateSmurf } = require('../../app/mongodb');

const validateDate = (date) => {
    const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
    const ret = { valid: false, reason: 'La fecha debe estar en el formato DD/MM/AAAA.' };
    if (date.length != 10) return ret;
    if (date.substring(2, 3) != '/' || date.substring(5, 6) != '/') return ret;
    const split = date.split('/');
    const day = parseInt(split[0]);
    const month = parseInt(split[1]);
    const year = parseInt(split[2]);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return ret;
    ret.reason = 'La fecha es inválida.';
    if (day < 1 || day > 31 || month < 1 || month > 12) return ret;
    const thirtyDaysMonths = [4, 6, 9, 11];
    if (month === 2 && day > 29) return ret;
    else if (thirtyDaysMonths.includes(month) && day > 30) return ret;
    if (convertTZ(`${month}/${day}/${year}`, 'America/Argentina/Buenos_Aires') < today) return ret;
    ret.valid = true;
    return ret;
};

module.exports = {
    category: 'Privados',
    description: 'Administra las cuentas smurf de Valorant.',

    options: [{
        name: 'agregar',
        description: 'Guarda una cuenta smurf.',
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'comando',
                description: 'El comando que utilizará esta cuenta.',
                required: true,
                type: Constants.ApplicationCommandOptionTypes.STRING
            },
            {
                name: 'nombre',
                description: 'El nombre de la cuenta.',
                required: true,
                type: Constants.ApplicationCommandOptionTypes.STRING
            },
            {
                name: 'usuario',
                description: 'El usuario de la cuenta.',
                required: true,
                type: Constants.ApplicationCommandOptionTypes.STRING
            },
            {
                name: 'contraseña',
                description: 'La contraseña de la cuenta.',
                required: true,
                type: Constants.ApplicationCommandOptionTypes.STRING
            },
            {
                name: 'vip',
                description: 'Si es para usuarios VIP o no.',
                required: true,
                type: Constants.ApplicationCommandOptionTypes.BOOLEAN
            }
        ]
    }, {
        name: 'borrar',
        description: 'Borra una cuenta guardada.',
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'comando',
                description: 'El comando de la cuenta que se quiere borrar.',
                required: true,
                type: Constants.ApplicationCommandOptionTypes.STRING
            }
        ]
    }, {
        name: 'ban',
        description: 'Actualiza el ban de una cuenta guardada.',
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'comando',
                description: 'El comando de la cuenta que se quiere actualizar.',
                required: true,
                type: Constants.ApplicationCommandOptionTypes.STRING
            }, {
                name: 'fecha',
                description: 'La fecha hasta que la cuenta se encuentra banneada.',
                required: true,
                type: Constants.ApplicationCommandOptionTypes.STRING
            }
        ]
    }],
    slash: true,

    callback: async ({ user, interaction }) => {
        const subCommand = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true });

        const reply = { ephemeral: true };

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

            const smurfs = !getSmurfs() ? await updateSmurfs() : getSmurfs();
            if (Object.keys(smurfs).includes(accountCommand))
                reply.content = `Ya hay una cuenta vinculada a ese comando.`;
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

            const smurfs = !getSmurfs() ? await updateSmurfs() : getSmurfs();
            if (!Object.keys(smurfs).includes(accountCommand))
                reply.content = `La cuenta que intentás borrar no existe.`;
            else
                await deleteSmurf(accountCommand).then(async () => {
                    await updateSmurfs();
                    reply.content = `La cuenta fue borrada de manera exitosa.`;
                    reply.ephemeral = false;
                }).catch(console.error);
            interaction.editReply(reply);
            return;
        } else {
            const accountCommand = interaction.options.getString('comando').toLowerCase();
            const date = interaction.options.getString('fecha');

            const smurfs = !getSmurfs() ? await updateSmurfs() : getSmurfs();
            if (!Object.keys(smurfs).includes(accountCommand))
                reply.content = `La cuenta que intentás actualizar no existe.`;
            else if (!validateDate(date).valid)
                reply.content = validateDate(date).reason;
            else
                await updateSmurf(accountCommand, date).then(async () => {
                    await updateSmurfs();
                    reply.content = `La cuenta fue actualizada de manera exitosa.`;
                    reply.ephemeral = false;
                }).catch(console.error);
            interaction.editReply(reply);
            return;
        }
    }
}
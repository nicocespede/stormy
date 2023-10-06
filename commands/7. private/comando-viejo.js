const { ICommand } = require('wokcommands');
const { logToFileCommandUsage, getWarningEmbed } = require('../../src/util');

const commandsPath = '../../commands/';
const oldCommandsData = {
    dolar: { module: '5. prices', name: 'usd' },
    dólar: { module: '5. prices', name: 'usd' },
    recordatorio: { module: '1. general', name: 'boquear' }
};

/**
 * Builds the full array of aliases of a command.
 * 
 * @param {String} name The name of the command.
 * @param {String[]} aliases The aliases of the command, if so.
 * @returns The full list of aliases.
 */
const getAliases = (name, aliases) => {
    if (name !== 'dolar' && name !== 'dólar' && aliases)
        return [name].concat(aliases);

    return [name];
};

/**
 * Formats the list of expected arguments of a command.
 * 
 * @param {String} args The args list.
 * @returns The formatted args list.
 */
const buildArgs = args => {
    if (!args)
        return '';

    const splitted = args.split(' ');
    return `\`${splitted.join('` `')}\``;
};

/**@type {ICommand}*/
module.exports = {
    category: 'Privados',
    description: 'Arroja un mensaje cuando se quiere utilizar un comando que fue renombrado.',
    aliases: Object.keys(oldCommandsData),

    slash: false,

    callback: async ({ message, prefix, user }) => {
        const cmd = message.content.toLowerCase().split(' ')[0].substring(1);

        logToFileCommandUsage(cmd, null, null, user);

        const { module, name } = oldCommandsData[cmd];
        const { aliases, expectedArgs, slash } = require(`${commandsPath}${module}/${name}.js`);

        let slashCommands = '';
        let regularCommands = '';
        for (const alias of getAliases(name, aliases)) {
            const args = buildArgs(expectedArgs);
            if (slash)
                slashCommands += `/${alias} ${args}\n`;
            if (slash === 'both' || !slash)
                regularCommands += `${prefix}${alias} ${args}\n`;
        }

        return { custom: true, embeds: [getWarningEmbed(`**Este comando ya no está disponible**, por favor utilizá alguna de las siguientes variantes:\n\n${slashCommands}${regularCommands}`)] };
    }
}
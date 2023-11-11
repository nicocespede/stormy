const { default: WOKCommands } = require('wokcommands');
const { User, CommandInteraction, EmbedBuilder, Guild } = require('discord.js');
const { CONSOLE_GREEN, CONSOLE_YELLOW, ARGENTINA_TZ_STRING, CONSOLE_RED, CONSOLE_BLUE, PREFIX, ARGENTINA_LOCALE_STRING, EMBED_DESCRIPTION_MAX_LENGTH, color, ARGENTINA_HOURS_OFFSET } = require('./constants');
const chalk = require('chalk');
const fs = require('fs');
chalk.level = 1;

/**
 * Converts a date to a timezone.
 * 
 * @param {Date | String} date The date to be converted.
 * @param {String} [tzString] The timezone needed.
 * @returns The converted date.
 */
const convertTZ = (date, tzString = ARGENTINA_TZ_STRING) => new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString }));

/**
 * Append zero to length.
 * 
 * @param {String} value Value to append zero.
 * @param {Number} length Needed length.
 * @returns String with appended zeros if needed.
 */
const appendZeroToLength = (value, length) => `${value}`.padStart(length, '0');

/**
 * Get date as text.
 * 
 * @param {Date} now Now date.
 * @returns Date as text. Example: "2018-12-03, 07:32:13".
 */
const getDateAsText = now => {
    const nowText = appendZeroToLength(now.getFullYear(), 4) + '-'
        + appendZeroToLength(now.getMonth() + 1, 2) + '-'
        + appendZeroToLength(now.getDate(), 2) + ', '
        + appendZeroToLength(now.getHours(), 2) + ':'
        + appendZeroToLength(now.getMinutes(), 2) + ':'
        + appendZeroToLength(now.getSeconds(), 2);
    return nowText;
}

/**
     * Logs a message to the console with custom color.
     * 
     * @param {String} string The message to be logged.
     * @param {String} color The color of the text.
     */
const consoleLog = (string, color) => {
    const date = convertTZ(new Date());
    const now = getDateAsText(date);
    let colored;
    switch (color) {
        case CONSOLE_BLUE:
            colored = chalk.blue(string);
            break;
        case CONSOLE_GREEN:
            colored = chalk.green(string);
            break;
        case CONSOLE_RED:
            colored = chalk.red(string);
            break;
        case CONSOLE_YELLOW:
            colored = chalk.yellow(string);
            break;
        default:
            colored = string;
            break;
    }
    console.log(`${now}: ${colored}`);
};

/**
 * Log to file.
 * 
 * @param {String} [moduleName] The name of the module where the log is called from.
 * @param {String} string The message to be logged.
 * @param {String} [delimiter] Delimiter. Default: `\n`.
 */
const logToFile = (moduleName, string, delimiter = '\n') => {
    const now = convertTZ(new Date());
    const dateString = `${now.getFullYear()}-${appendZeroToLength(now.getMonth() + 1, 2)}-${appendZeroToLength(now.getDate(), 2)}`;
    const path = `./logs/log_${dateString}.log`;

    // Define log text.
    const logText = getDateAsText(now) + ' -> ' + (!moduleName ? string : `[${moduleName}] ${string}`) + delimiter;

    // Save log to file.
    fs.appendFile(path, logText, 'utf8', error => {
        // If error - show in console.
        if (error)
            consoleLog(`> Error al escribir log:\n${error.stack}`);
    });
};

/**
     * Logs to a file the usage of a command.
     * 
     * @param {String} commandName The name of the command used.
     * @param {String} [args] The args of the command used.
     * @param {CommandInteraction} interaction The interaction of the command.
     * @param {User} user The user who used the command.
     */
const logToFileCommandUsage = (commandName, args, interaction, user) => {
    const prefix = interaction ? '/' : PREFIX;
    logToFile(`${commandName}.callback`, `${getUserTag(user)} used ${prefix}${commandName}${args ? ` [${args}]` : ''}`);
};

/**
 * Gets the tag of a user.
 * 
 * @param {User} user The user to get the tag from.
 * @returns The tag of a user.
 */
const getUserTag = user => {
    if (user.discriminator === '0')
        return user.username;

    return user.tag;
};

/**
 * Generates a message starting with the success emoji.
 * 
 * @param {String} text The text of the message.
 * @returns The success message.
 */
const getSuccessMessage = text => '✅ ' + text;

/**
 * Generates a message starting with the warning emoji.
 * 
 * @param {String} text The text of the message.
 * @returns The warning message.
 */
const getWarningMessage = text => '⚠️ ' + text;

/**
 * Generates a message starting with the denial emoji.
 * 
 * @param {String} text The text of the message.
 * @returns The denial message.
 */
const getDenialMessage = text => '⛔ ' + text;

/**
 * Generates a message starting with the error emoji.
 * 
 * @param {String} text The text of the message.
 * @returns The error message.
 */
const getErrorMessage = text => '❌ ' + text;

/**
 * Generates an embed and sets a description to it.
 * 
 * @param {String} description The description.
 * @returns An embed with a pre-set description.
 */
const getSimpleEmbed = description => (new EmbedBuilder()).setDescription(description).setColor(color);

module.exports = {
    convertTZ,

    splitMessage: message => {
        const split = message.split(' ');
        const ret = [];
        let chunk = '';
        for (let i = 0; i < split.length; i++) {
            const word = split[i];
            const aux = chunk + word + ' ';
            if (aux.length > 2000) {
                ret.push(chunk);
                chunk = '';
            }
            chunk += word + ' ';
            if (i === split.length - 1) ret.push(chunk);
        }
        return ret;
    },

    consoleLog,

    /**
     * Logs an error message to the console.
     * 
     * @param {String} message The message to be logged.
     */
    consoleLogError: message => consoleLog(message, CONSOLE_RED),

    logToFile,

    logToFileCommandUsage,

    /**
     * Logs to a file the usage of a command.
     * 
     * @param {String} commandName The name of the command used.
     * @param {String} [args] The args of the command used.
     * @param {String} subCommandName The name of the subcommand used.
     * @param {CommandInteraction} interaction The interaction of the command.
     * @param {User} user The user who used the command.
     */
    logToFileSubCommandUsage: (commandName, args, subCommandName, interaction, user) => logToFileCommandUsage(commandName, args === 'undefined' ? subCommandName : args, interaction, user),

    /**
     * Logs to a file when a function is called.
     * 
     * @param {String} moduleName The name of the module the log is called from.
     * @param {String} functionName The name of the function called.
     */
    logToFileFunctionTriggered: (moduleName, functionName) => logToFile(moduleName, `Function triggered: ${functionName}`),

    /**
     * Logs to a file when a listener is triggered.
     * 
     * @param {String} moduleName The name of the module the log is called from.
     * @param {String} listenerName The name of the listener triggered.
     */
    logToFileListenerTriggered: (moduleName, listenerName) => logToFile(moduleName, `Listener triggered: ${listenerName}`),

    /**
     * Logs to a file when an error ocurrs.
     * 
     * @param {String} moduleName The name of the module the log is called from.
     * @param {Error} error The error to be logged.
     */
    logToFileError: (moduleName, error) => logToFile(moduleName, !error.stack ? error : error.stack),

    splitEmbedDescription: string => {
        const split = string.split('\n');
        const ret = [];
        let chunk = '';
        for (let i = 0; i < split.length; i++) {
            const line = split[i];
            const aux = chunk + line + '\n';
            if (aux.length > EMBED_DESCRIPTION_MAX_LENGTH) {
                ret.push(chunk);
                chunk = '';
            }
            chunk += line + '\n';
            if (i === split.length - 1) ret.push(chunk)
        }
        return ret;
    },

    convertTime: time => {
        let split = time.split(' ');
        const indicator = split.pop();
        split = split[0].split(':');
        switch (indicator) {
            case 'am':
                return `${split[0] === '12' ? '00' : split[0] < 10 ? `0${split[0]}` : split[0]}:${split[1]}`;
            case 'pm':
                const parsedHours = parseInt(split[0]);
                const finalHours = parsedHours + 12;
                return `${finalHours === 24 ? '12' : finalHours < 10 ? `0${finalHours}` : finalHours}:${split[1]}`;
        }
    },

    /**
     * Formats a number to currency format.
     * 
     * @param {Number} value The value to be formatted.
     * @param {Number} maximumFractionDigits The maximum amount of decimals.
     * @param {String} currency The currency code.
     * @returns The formatted number.
     */
    formatNumber: (value, maximumFractionDigits, currency) => value.toLocaleString(ARGENTINA_LOCALE_STRING, { currency, style: 'currency', maximumFractionDigits }),

    getUserTag,

    getSuccessMessage,
    getWarningMessage,
    getDenialMessage,
    getErrorMessage,

    getSimpleEmbed,

    /**
     * Generates an embed with a success message as description.
     * 
     * @param {String} description The description.
     * @returns An embed with a success message.
     */
    getSuccessEmbed: description => getSimpleEmbed(getSuccessMessage(description)).setColor([119, 178, 85]),

    /**
     * Generates an embed with a warning message as description.
     * 
     * @param {String} description The description.
     * @returns An embed with a warning message.
     */
    getWarningEmbed: description => getSimpleEmbed(getWarningMessage(description)).setColor([255, 204, 77]),

    /**
     * Generates an embed with a denial message as description.
     * 
     * @param {String} description The description.
     * @returns An embed with a denial message.
     */
    getDenialEmbed: description => getSimpleEmbed(getDenialMessage(description)).setColor([190, 25, 49]),

    /**
     * Builds the custom syntax error message.
     * 
     * @param {WOKCommands} instance The WOKCommands instance.
     * @param {Guild} guild The guild.
     * @param {String} reason The reason.
     * @param {String} command The name of the command.
     * @param {String} arguments The arguments the command needs.
     * @returns The custom syntax error message.
     */
    getSyntaxErrorMessage: (instance, guild, reason, command, arguments) => {
        return instance.messageHandler.get(guild, 'CUSTOM_SYNTAX_ERROR', {
            REASON: reason,
            PREFIX: PREFIX,
            COMMAND: command,
            ARGUMENTS: arguments
        })
    },

    /**
     * Converts a date from the local timezone to UTC.
     * 
     * @param {Date} date The date to convert.
     * @returns The converted date.
     */
    convertToUTCFromLocal: date => {
        const offset = date.getTimezoneOffset() / 60;
        date.setHours(date.getHours() + offset);
        return date;
    },

    /**
     * Converts a date from Buenos Aires timezone to UTC.
     * 
     * @param {Date} date The date to convert.
     * @returns The converted date.
     */
    convertToUTCFromArgentina: date => {
        date.setHours(date.getHours() + ARGENTINA_HOURS_OFFSET);
        return date;
    },

    /**
     * Converts a date string to an UTC Date.
     * 
     * @param {String} string The date string.
     * @returns The UTC Date.
     */
    getUTCDate: string => {
        const date = new Date(string);

        const offset = process.env.TZ_OFFSET;
        if (offset)
            date.setHours(date.getHours() + parseInt(offset) + date.getTimezoneOffset());

        return date;
    }
};
const { CONSOLE_GREEN, CONSOLE_YELLOW, ARGENTINA_TZ_STRING, CONSOLE_RED, CONSOLE_BLUE, PREFIX } = require('./constants');
const log = require('log-to-file');
const chalk = require('chalk');
const { User, Message, CommandInteraction } = require('discord.js');
chalk.level = 1;

const convertTZ = (date, tzString) => {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString || ARGENTINA_TZ_STRING }));
};

/**
* Logs a message to a file.
* 
* @param {String} string The message to be logged.
*/
const fileLog = string => {
    const now = new Date();
    const dateString = `${now.getDate()}-${now.getMonth() + 1}-${now.getUTCFullYear()}`;
    const path = `./logs/log_${dateString}.log`;
    log(string, path);
};

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

    /**
     * Logs a message to the console with custom color.
     * 
     * @param {String} string The message to be logged.
     * @param {String} color The color of the text.
     */
    consoleLog: (string, color) => {
        const date = convertTZ(new Date());
        const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
        const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
        const hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
        const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
        const seconds = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();
        const now = `${day}-${month}-${date.getFullYear()} ${hours}:${minutes}:${seconds}`;
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
    },

    fileLog,

    /**
     * Logs to a file the usage of a command.
     * 
     * @param {String} commandName The name of the command used.
     * @param {CommandInteraction} interaction The interaction of the command.
     * @param {Message} message The message of the command.
     * @param {User} user The user who used the command.
     */
    fileLogCommandUsage: (commandName, interaction, message, user) => {
        const prefix = interaction ? '/' : PREFIX;
        fileLog(`[${commandName}.callback] ${user.tag} used ${prefix}${commandName}`);
    },

    splitEmbedDescription: string => {
        const split = string.split('\n');
        const ret = [];
        let chunk = '';
        for (let i = 0; i < split.length; i++) {
            const line = split[i];
            const aux = chunk + line + '\n';
            if (aux.length > 4096) {
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
    }
};
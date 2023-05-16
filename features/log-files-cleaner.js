const { timeouts } = require('../src/cache');
const { CONSOLE_YELLOW } = require('../src/constants');
const { logToFile, logToFileFunctionTriggered, consoleLog, convertTZ } = require('../src/util');
const fs = require('fs');

const LOG_FILES_PATH = './logs/';
const LOG_FILE_PREFIX = 'log_';
const LOG_FILE_EXTENSION = '.log';

const MODULE_NAME = 'log-files-cleaner';
const FULL_MODULE_NAME = `features.${MODULE_NAME}`;

const ONE_DAY_MILLIS = 1000 * 60 * 60 * 24;
const ONE_WEEK_MILLIS = ONE_DAY_MILLIS * 7;

/**
 * Determines if a file is a log file or not by its name.
 * 
 * @param {String} fileName The name of the file.
 * @returns True if the name of the file includes the determined prefix and extension, or false if not.
 */
const isLogFile = fileName => fileName.startsWith(LOG_FILE_PREFIX) && fileName.endsWith(LOG_FILE_EXTENSION);

/**
 * Determines if a file is from more than a week ago or not by its name.
 * 
 * @param {String} fileName The name of the file.
 * @param {Date} now The current date.
 * @returns True if the name of the file includes a date older than a week, or false if not.
 */
const isOlderThanAWeek = (fileName, now) => {
    const dateString = fileName.replace(LOG_FILE_PREFIX, '').replace(LOG_FILE_EXTENSION, '');
    const date = new Date(dateString);

    const difference = now - date;
    return !isNaN(difference) && difference > ONE_WEEK_MILLIS;
};

/**
 * Determines if a log file needs to be deleted or not.
 * 
 * @param {String} fileName The name of the file.
 * @param {Date} now The current date.
 * @returns True if the file needs to be deleted, or false if not.
 */
const needsDeletion = (fileName, now) => isLogFile(fileName) && isOlderThanAWeek(fileName, now);

module.exports = _ => {
    const checkAndDelete = () => {
        logToFileFunctionTriggered(FULL_MODULE_NAME, 'checkAndDelete');

        const files = fs.readdirSync(LOG_FILES_PATH);

        const now = convertTZ(new Date());
        now.setHours(0, 0, 0, 0);

        let deleted = 0;

        for (const file of files)
            if (needsDeletion(file, now)) {
                fs.unlinkSync(LOG_FILES_PATH + file);
                deleted++;
            }

        if (deleted > 0) {
            logToFile(FULL_MODULE_NAME, `${deleted} log file${deleted > 1 ? 's' : ''} deleted`);
            consoleLog(`> ${deleted} archivo${deleted > 1 ? 's' : ''} de log eliminados`, CONSOLE_YELLOW);
        }

        timeouts[MODULE_NAME] = setTimeout(checkAndDelete, ONE_DAY_MILLIS);
    }

    checkAndDelete();
};

module.exports.config = {
    displayName: 'Limpiador de archivos de log',
    dbName: 'LOG_FILES_CLEANER'
};
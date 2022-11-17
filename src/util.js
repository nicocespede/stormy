const chalk = require('chalk');
chalk.level = 1;

const convertTZ = (date, tzString) => {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString || 'America/Argentina/Buenos_Aires' }));
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

    log: (string, color) => {
        let colored;
        switch (color) {
            case 'blue':
                colored = chalk.blue(string);
                break;
            case 'green':
                colored = chalk.green(string);
                break;
            case 'red':
                colored = chalk.red(string);
                break;
            case 'yellow':
                colored = chalk.yellow(string);
                break;
            default:
                colored = string;
                break;
        }
        console.log(colored);
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
    }
};
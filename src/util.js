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
        const date = convertTZ(new Date());
        const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
        const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
        const hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
        const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
        const seconds = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();
        const now = `${day}-${month}-${date.getFullYear()} ${hours}:${minutes}:${seconds}`;
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
        console.log(`${now}: ${colored}`);
    }
};
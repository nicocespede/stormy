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
    },

    splitLines: (string, maxLength) => {
        const split = string.split('\n');
        const ret = [];
        let chunk = '';
        for (let i = 0; i < split.length; i++) {
            const line = split[i];
            const aux = chunk + line + '\n';
            if (aux.length > maxLength) {
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
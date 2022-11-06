const chalk = require('chalk');
chalk.level = 1;

const convertTZ = (date, tzString) => {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString || 'America/Argentina/Buenos_Aires' }));
};

module.exports = {
    convertTZ,

    log: (string, color) => {
        const date = convertTZ(new Date());
        const now = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
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
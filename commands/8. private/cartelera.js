const { MessageEmbed } = require('discord.js');
const { initiateReactionCollector } = require('../../app/general');
const fs = require('fs');

async function getRandomThumb(path) {
    var fileName;
    return new Promise(function (resolve, reject) {
        //passsing directoryPath and callback function
        fs.readdir(`./assets/thumbs/${path}`, function (err, files) {
            //handling error
            if (err)
                return console.log('Unable to scan directory: ' + err);
            var random = Math.floor(Math.random() * files.length);
            fileName = files[random];
        });
        setTimeout(function () { resolve(); }, 1000);
    }).then(function () {
        return fileName;
    });
}

module.exports = {
    category: 'Privados',
    description: 'Crea un nuevo mensaje para la cartelera.',

    minArgs: 2,
    expectedArgs: '<url> <descripción>',
    slash: false,
    permissions: ['ADMINISTRATOR'],

    callback: ({ message, args, client }) => {
        const url = args[0];
        args = args.splice(1);
        getRandomThumb('movies').then(fileName => {
            const msg = {
                content: '@everyone',
                embeds: [new MessageEmbed()
                    .setDescription(args.join(" "))
                    .setColor([255, 0, 6])
                    .setThumbnail(`attachment://${fileName}`)
                    .setImage(url)],
                files: [`./assets/thumbs/movies/${fileName}`]
            };
            initiateReactionCollector(client, msg);
            message.delete();
        });
        return;
    }
}
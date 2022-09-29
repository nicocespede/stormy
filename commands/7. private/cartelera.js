const { EmbedBuilder } = require('discord.js');
const { initiateReactionCollector } = require('../../app/general');
const { getIds, updateIds } = require('../../app/cache');
const { githubRawURL } = require('../../app/constants');

const files = ['camera.png', 'clapper.png', 'popcorn.png'];

module.exports = {
    category: 'Privados',
    description: 'Crea un nuevo mensaje para la cartelera.',

    minArgs: 2,
    expectedArgs: '<url> <descripción>',
    slash: false,
    ownerOnly: true,

    callback: async ({ message, args, client }) => {
        const url = args[0];
        args = args.splice(1);
        const ids = getIds() || await updateIds();
        const random = Math.floor(Math.random() * (files.length));
        const msg = {
            content: `<@&${ids.roles.cine}>`,
            embeds: [new EmbedBuilder()
                .setDescription(args.join(" "))
                .setColor([255, 0, 6])
                .setThumbnail(`attachment://${files[random]}`)
                .setImage(url)],
            files: [`${githubRawURL}/assets/thumbs/movies/${files[random]}`]
        };
        initiateReactionCollector(client, msg);
        message.delete();
        return;
    }
}
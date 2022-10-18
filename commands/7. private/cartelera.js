const { EmbedBuilder } = require('discord.js');
const { initiateReactionCollector } = require('../../app/general');
const { getIds, updateIds } = require('../../app/cache');
const { githubRawURL } = require('../../app/constants');

const thumbs = ['cinema', 'clapperboard', 'movie', 'movie-projector'];

module.exports = {
    category: 'Privados',
    description: 'Crea un nuevo mensaje para la cartelera.',

    minArgs: 2,
    expectedArgs: '<url> <descripción>',
    slash: false,
    ownerOnly: true,

    callback: async ({ message, args, client, instance }) => {
        const url = args.pop();
        const ids = getIds() || await updateIds();
        const random = Math.floor(Math.random() * (thumbs.length));
        const msg = {
            content: `<@&${ids.roles.cine}>`,
            embeds: [new EmbedBuilder()
                .setDescription(args.join(" "))
                .setColor(instance.color)
                .setThumbnail(`${githubRawURL}/assets/thumbs/movies/${thumbs[random]}.png`)
                .setImage(url)]
        };
        initiateReactionCollector(client, msg);
        message.delete();
        return;
    }
}
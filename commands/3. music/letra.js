const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { prefix, ids } = require('../../app/constants');
const { containsAuthor, cleanTitle } = require("../../app/music");
const Genius = require("genius-lyrics");
const { splitMessage } = require('../../app/general');
const Client = new Genius.Client();

module.exports = {
    category: 'Música',
    description: 'Muestra la letra de la canción actual o la de la canción ingresada.',
    aliases: ['lyrics'],
    options: [
        {
            name: 'canción',
            description: 'El nombre de la canción de la que se quiere la letra.',
            required: false,
            type: ApplicationCommandOptionType.String
        }
    ],
    slash: 'both',

    expectedArgs: '[canción]',
    guildOnly: true,

    callback: async ({ guild, user, message, channel, client, interaction, text }) => {
        var embed = new EmbedBuilder().setColor([195, 36, 255]);
        const messageOrInteraction = message ? message : interaction;
        const song = message ? text : interaction.options.getString('canción');
        var reply = { custom: true, ephemeral: true };
        if (!ids.channels.musica.includes(channel.id)) {
            reply.content = `Hola <@${user.id}>, este comando se puede utilizar solo en los canales de música.`;
            return reply;
        }

        if (!song) {
            const queue = client.player.getQueue(guild.id);

            if (!queue || !queue.playing) {
                reply.embeds = [embed.setDescription(`🛑 ¡No hay ninguna canción de la cual mostrar la letra! Podés usar el comando **${prefix}letra** seguido del nombre de la canción que buscás.`)
                    .setThumbnail(`attachment://icons8-no-entry-64.png`)];
                reply.files = [`./assets/thumbs/music/icons8-no-entry-64.png`];
                return reply;
            }

            const filteredTitle = await cleanTitle(queue.current.title);
            await Client.songs.search(filteredTitle + (!queue.current.url.includes('youtube') || !containsAuthor(queue.current) ? ` - ${queue.current.author}` : ``)).then(async searches => {
                const firstSong = searches[0];
                var lyrics = await firstSong.lyrics();
                lyrics = lyrics.replace(/[[]/g, '**[');
                lyrics = lyrics.replace(/[\]]/g, ']**');
                var chunks = splitMessage(lyrics);
                await messageOrInteraction.reply({ content: chunks[0] });
                chunks.shift();
                if (chunks.length > 0)
                    chunks.forEach(async element => await channel.send({ content: element }));
            }).catch(async error => {
                if (error.message === 'No result was found') {
                    reply.embeds = [embed.setDescription(`🛑 ¡No se encontraron resultados de letras para la canción actual!`)
                        .setThumbnail(`attachment://icons8-no-entry-64.png`)];
                    reply.files = [`./assets/thumbs/music/icons8-no-entry-64.png`];
                    await messageOrInteraction.reply(reply);
                } else
                    console.error;
            });
        } else {
            await Client.songs.search(song).then(async searches => {
                const firstSong = searches[0];
                var lyrics = await firstSong.lyrics();
                lyrics = lyrics.replace(/[[]/g, '**[');
                lyrics = lyrics.replace(/[\]]/g, ']**');
                var chunks = splitMessage(lyrics);
                await messageOrInteraction.reply({ content: chunks[0] }).catch(console.error);
                chunks.shift();
                chunks.forEach(async element => await channel.send({ content: element }));
            }).catch(async error => {
                if (error.message === 'No result was found') {
                    reply.embeds = [embed.setDescription(`🛑 ¡No se encontraron resultados de letras para la canción ingresada!`)
                        .setThumbnail(`attachment://icons8-no-entry-64.png`)];
                    reply.files = [`./assets/thumbs/music/icons8-no-entry-64.png`];
                    await messageOrInteraction.reply(reply);
                } else
                    console.error;
            });
        }
        return;
    }
}
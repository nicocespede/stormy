const { Constants } = require("discord.js");
const { updateMcu, updateGames: updateGamesCache, updateTracksNameExtras } = require("../../app/cache");
const { ids } = require("../../app/constants");
const { updateMovies, updateGames } = require("../../app/mongodb");

const choices = [
    { name: 'Juegos y películas', value: 'games-and-movies' },
    { name: 'Extras de nombres de pistas', value: 'tracks-name-extras' }
];

module.exports = {
    category: 'Privados',
    description: 'Actualiza el caché seleccionado.',

    options: [{
        name: 'nombre',
        description: 'El nombre del caché que se quiere actualizar.',
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: true,
        choices: choices
    }],
    slash: true,
    ownerOnly: true,

    callback: async ({ client, interaction }) => {
        const name = interaction.options.getString('nombre');
        if (name === 'games-and-movies') {
            var oldGames;
            var oldMovies;
            const moviesAndGamesSchema = require('../../models/moviesAndGames-schema');
            const results = await moviesAndGamesSchema.find({});
            results.forEach(element => {
                if (element._id === 'movies')
                    oldMovies = element.data;
                else if (element._id === 'games')
                    oldGames = element.data;
            });
            const newStuff = { movies: [], games: [] };
            const updatedStuff = { movies: [], games: [] };
            const mcu = await updateMcu();
            mcu.forEach(movie => {
                var found = false;
                oldMovies.forEach(element => {
                    if (movie.name === element.name) {
                        found = true;
                        var updated = [];
                        var added = [];
                        for (const key in movie.lastUpdate)
                            if (Object.hasOwnProperty.call(movie.lastUpdate, key))
                                if (!element.lastUpdate[key])
                                    added.push(key)
                                else if (movie.lastUpdate[key] !== element.lastUpdate[key])
                                    updated.push(key);
                        if (updated.length > 0)
                            updatedStuff.movies.push({ name: movie.name, versions: updated, updateInfo: movie.updateInfo });
                        if (added.length > 0)
                            newStuff.movies.push({ name: movie.name, versions: added });
                        return;
                    }
                });
                if (!found)
                    newStuff.movies.push({ name: movie.name, versions: Object.keys(movie.lastUpdate) });
            });
            const games = await updateGamesCache();
            games.forEach(game => {
                var found = false;
                oldGames.forEach(element => {
                    if (game.name === element.name) {
                        found = true;
                        if (game.lastUpdate !== element.lastUpdate)
                            updatedStuff.games.push(game.name);
                        return;
                    }
                });
                if (!found)
                    newStuff.games.push(game.name);
            });
            if (updatedStuff.games.length != 0 || updatedStuff.movies.length != 0
                || newStuff.games.length != 0 || newStuff.movies.length != 0) {
                client.channels.fetch(ids.channels.anuncios).then(async channel => {
                    let content = '';
                    if (updatedStuff.movies.length != 0 || newStuff.movies.length != 0) {
                        content += `<@&${ids.roles.anunciosUcm}>\n\n🎬 **___Universo Cinematográfico de Marvel:___**\n\`\`\``;
                        for (let i = 0; i < newStuff.movies.length; i++) {
                            const element = newStuff.movies[i];
                            content += `• Se agregó ${element.name} en ${element.versions.length > 1 ? 'las versiones' : 'la versión'} ${element.versions.join(', ')}.\n`;
                        }
                        for (let i = 0; i < updatedStuff.movies.length; i++) {
                            const element = updatedStuff.movies[i];
                            content += `• Se ${element.versions.length > 1 ? 'actualizaron las versiones' : 'actualizó la versión'} ${element.versions.join(', ')} de ${element.name}: ${element.updateInfo}.\n`;
                        }
                        content += '```';
                        await updateMovies(mcu);
                    }
                    if (updatedStuff.games.length != 0 || newStuff.games.length != 0) {
                        content += `\n<@&${ids.roles.anunciosJuegos}>\n\n🎮 **___Juegos:___**\n\`\`\``;
                        for (let i = 0; i < newStuff.games.length; i++)
                            content += `• Se agregó el juego ${newStuff.games[i]}.\n`;
                        for (let i = 0; i < updatedStuff.games.length; i++)
                            content += `• Se actualizó el juego ${updatedStuff.games[i]}.\n`;
                        content += '```';
                        await updateGames(games);
                    }
                    channel.send(content).catch(console.error);
                }).catch(console.error);
            }
        } else if (name === 'tracks-name-extras')
            await updateTracksNameExtras();
        return 'Caché actualizado.';
    }
}
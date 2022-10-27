const { ApplicationCommandOptionType } = require("discord.js");
const chalk = require("chalk");
chalk.level = 1;
const { updateMcu, updateGames: updateGamesCache, updateTracksNameExtras, getIds, updateIds, updateCharacters,
    //TEMP SOLUTION
    updateBlacklistedSongs//
} = require("../../app/cache");
const { updateMovies, updateGames } = require("../../app/mongodb");

const choices = [
    { name: '🎵 Extras de nombres de pistas', value: 'tracks-name-extras' },
    { name: '🆔 IDs', value: 'ids' },
    { name: '🎮 Juegos y películas', value: 'games-and-movies' },
    //TEMP SOLUTION
    { name: '❌ Lista negra de pistas', value: 'tracks-blacklist' },//
    { name: '👥 Personajes', value: 'characters' }
];

module.exports = {
    category: 'Privados',
    description: 'Actualiza el caché seleccionado.',

    options: [{
        name: 'nombre',
        description: 'El nombre del caché que se quiere actualizar.',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: choices
    }],
    slash: true,
    ownerOnly: true,

    callback: async ({ client, interaction }) => {
        await interaction.deferReply({ ephemeral: true });
        const name = interaction.options.getString('nombre');
        try {
            if (name === 'games-and-movies') {
                const moviesAndGamesSchema = require('../../models/moviesAndGames-schema');
                const oldGames = (await moviesAndGamesSchema.find({ _id: 'games' }))[0];
                const oldMovies = (await moviesAndGamesSchema.find({ _id: 'movies' }))[0];
                const newStuff = { movies: [], games: [] };
                const updatedStuff = { movies: [], games: [] };

                const mcu = await updateMcu();
                mcu.forEach(movie => {
                    const { name, updateInfo, versions } = movie;
                    const found = oldMovies.data.filter(m => m.name === name)[0];
                    if (!found)
                        newStuff.movies.push({ name: name, versions: Object.keys(versions) });
                    else {
                        const added = [];
                        const updated = [];
                        for (const key in versions) if (Object.hasOwnProperty.call(versions, key))
                            if (!found.versions[key])
                                added.push(key)
                            else if (versions[key].lastUpdate !== found.versions[key].lastUpdate)
                                updated.push(key);
                        if (added.length > 0)
                            newStuff.movies.push({ name: name, versions: added });
                        if (updated.length > 0)
                            updatedStuff.movies.push({ name: name, versions: updated, updateInfo: updateInfo });
                    }
                });

                const games = await updateGamesCache();
                games.forEach(game => {
                    const found = oldGames.data.filter(g => g.name === game.name)[0];
                    if (!found)
                        newStuff.games.push(game.name + ` (${game.year})`);
                    else if (game.lastUpdate !== found.lastUpdate)
                        updatedStuff.games.push(game.name + ` (${game.year})`);
                });

                const ids = getIds() || await updateIds();
                if (updatedStuff.games.length !== 0 || updatedStuff.movies.length !== 0
                    || newStuff.games.length !== 0 || newStuff.movies.length !== 0) {
                    let content = '';
                    if (updatedStuff.movies.length !== 0 || newStuff.movies.length !== 0) {
                        content += `<@&${ids.roles.anunciosUcm}>\n\n<:marvel:${ids.emojis.marvel}> **___Universo Cinematográfico de Marvel:___**\n\`\`\``;
                        for (let i = 0; i < newStuff.movies.length; i++) {
                            const element = newStuff.movies[i];
                            content += `• Se agregó ${element.name} en ${element.versions.length > 1 ? 'las versiones' : 'la versión'} ${element.versions.join(', ')}.\n`;
                        }
                        for (let i = 0; i < updatedStuff.movies.length; i++) {
                            const element = updatedStuff.movies[i];
                            content += `• Se ${element.versions.length > 1 ? 'actualizaron las versiones' : 'actualizó la versión'} ${element.versions.join(', ')} de ${element.name}: ${element.updateInfo}.\n`;
                        }
                        content += '```';

                        const dbUpdate = [];
                        for (const element of mcu) {
                            const { name, versions } = element;
                            const newObj = { name, versions: {} };
                            for (const ver in versions) if (Object.hasOwnProperty.call(versions, ver))
                                newObj.versions[ver] = { lastUpdate: versions[ver].lastUpdate };
                            dbUpdate.push(newObj);
                        }
                        await updateMovies(dbUpdate);
                    }
                    if (updatedStuff.games.length !== 0 || newStuff.games.length !== 0) {
                        content += `\n<@&${ids.roles.anunciosJuegos}>\n\n🎮 **___Juegos:___**\n\`\`\``;
                        for (let i = 0; i < newStuff.games.length; i++)
                            content += `• Se agregó el juego ${newStuff.games[i]}.\n`;
                        for (let i = 0; i < updatedStuff.games.length; i++)
                            content += `• Se actualizó el juego ${updatedStuff.games[i]}.\n`;
                        content += '```';
                        await updateGames(games);
                    }
                    const channel = await client.channels.fetch(ids.channels.anuncios).catch(console.error);
                    channel.send(content).catch(console.error);
                }
            } else if (name === 'tracks-name-extras')
                await updateTracksNameExtras();
            //TEMP SOLUTION
            else if (name === 'tracks-blacklist')
                await updateBlacklistedSongs();//
            else if (name === 'ids')
                await updateIds();
            else if (name === 'characters')
                await updateCharacters();

            await interaction.editReply({ content: '✅ Caché actualizado.' });
        } catch (e) {
            console.log(chalk.red(`Error in actualizar-cache.js:\n${e}`));
            await interaction.editReply({ content: '❌ Ocurrió un error.' });
        }
        return;
    }
}
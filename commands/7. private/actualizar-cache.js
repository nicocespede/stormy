const { ApplicationCommandOptionType } = require("discord.js");
const chalk = require("chalk");
const { updateMcuData, updateGames: updateGamesCache, updateTracksNameExtras, getIds, updateIds, updateCharacters,
    //TEMP SOLUTION
    updateBlacklistedSongs//
} = require("../../src/cache");
const { updateMovies, updateGames } = require("../../src/mongodb");

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
                const oldUcm = (await moviesAndGamesSchema.find({ _id: 'ucm' }))[0];
                const newStuff = { movies: [], games: [] };
                const updatedStuff = { movies: [], games: [] };

                const mcu = await updateMcuData();
                for (const id in mcu) if (Object.hasOwnProperty.call(mcu, id)) {
                    const { name, updateInfo, versions, year } = mcu[id];
                    const found = oldUcm.data.filter(m => m.name === name)[0];

                    if (!found) {
                        newStuff.movies.push({ name: `${name} (${year})`, versions: Object.keys(versions) });
                        continue;
                    }

                    const versionsEntries = Object.entries(versions);
                    const added = versionsEntries.filter(([key, _]) => !found.versions[key]).map(([key, _]) => key);
                    const updated = versionsEntries
                        .filter(([key, _]) => found.versions[key] && versions[key].lastUpdate !== found.versions[key].lastUpdate)
                        .map(([key, _]) => key);

                    if (added.length > 0)
                        newStuff.movies.push({ name: `${name} (${year})`, versions: added });
                    if (updated.length > 0)
                        updatedStuff.movies.push({ name: `${name} (${year})`, versions: updated, updateInfo: updateInfo });
                }

                const games = await updateGamesCache();
                for (const game of games) {
                    const { lastUpdate, name, updateInfo, year } = game;
                    const found = oldGames.data.filter(g => g.name === name)[0];
                    if (!found)
                        newStuff.games.push(name + ` (${year})`);
                    else if (lastUpdate !== found.lastUpdate)
                        updatedStuff.games.push({ name: name + ` (${year})`, updateInfo: updateInfo });
                }

                if (updatedStuff.games.length > 0 || updatedStuff.movies.length > 0
                    || newStuff.games.length > 0 || newStuff.movies.length > 0) {
                    const ids = getIds() || await updateIds();
                    let content = '';
                    if (updatedStuff.movies.length > 0 || newStuff.movies.length > 0) {
                        content += `<@&${ids.roles.anunciosUcm}>\n\n<:marvel:${ids.emojis.marvel}> **___Universo Cinematográfico de Marvel:___**\n\`\`\``;
                        for (let i = 0; i < updatedStuff.movies.length; i++) {
                            const element = updatedStuff.movies[i];
                            content += `• Se ${element.versions.length > 1 ? 'actualizaron las versiones' : 'actualizó la versión'} ${element.versions.join(', ')} de ${element.name}: ${element.updateInfo}.\n`;
                        }
                        for (let i = 0; i < newStuff.movies.length; i++) {
                            const element = newStuff.movies[i];
                            content += `• Se agregó ${element.name} en ${element.versions.length > 1 ? 'las versiones' : 'la versión'} ${element.versions.join(', ')}.\n`;
                        }
                        content += '```';

                        const dbUpdate = [];
                        for (const id in mcu) if (Object.hasOwnProperty.call(mcu, id)) {
                            const { name, versions } = mcu[id];
                            const newObj = { name, versions: {} };
                            for (const ver in versions) if (Object.hasOwnProperty.call(versions, ver))
                                newObj.versions[ver] = { lastUpdate: versions[ver].lastUpdate };
                            dbUpdate.push(newObj);
                        }
                        await updateMovies('ucm', dbUpdate);
                    }

                    if (updatedStuff.games.length > 0 || newStuff.games.length > 0) {
                        content += `\n<@&${ids.roles.anunciosJuegos}>\n\n🎮 **___Juegos:___**\n\`\`\``;
                        for (let i = 0; i < updatedStuff.games.length; i++)
                            content += `• Se actualizó el juego ${updatedStuff.games[i].name}${updatedStuff.games[i].updateInfo}.\n`;
                        for (let i = 0; i < newStuff.games.length; i++)
                            content += `• Se agregó el juego ${newStuff.games[i]}.\n`;
                        content += '```';

                        const dbUpdate = [];
                        for (const element of games) {
                            const { name, lastUpdate } = element;
                            dbUpdate.push({ name, lastUpdate });
                        }
                        await updateGames(dbUpdate);
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
            console.log(chalk.red(`Error in actualizar-cache.js:\n${e.stack}`));
            await interaction.editReply({ content: '❌ Ocurrió un error.' });
        }
        return;
    }
}
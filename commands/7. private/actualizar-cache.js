const { ICommand } = require("wokcommands");
const { ApplicationCommandOptionType } = require("discord.js");
const { getDownloadsData, updateDownloadsData, updateGames: updateGamesCache, updateTracksNameExtras, getIds, updateIds, updateCharacters,
    //TEMP SOLUTION
    updateBlacklistedSongs//
} = require("../../src/cache");
const { updateMovies, updateGames } = require("../../src/mongodb");
const { logToFileError, consoleLogError, logToFileCommandUsage } = require("../../src/util");

const COMMAND_NAME = 'actualizar-cache';
const MODULE_NAME = 'commands.private.' + COMMAND_NAME;

const choices = [
    { name: '🎵 Extras de nombres de pistas', value: 'tracks-name-extras' },
    { name: '🆔 IDs', value: 'ids' },
    { name: '🎮 Juegos y películas', value: 'games-and-movies' },
    //TEMP SOLUTION
    { name: '❌ Lista negra de pistas', value: 'tracks-blacklist' },//
    { name: '👥 Personajes', value: 'characters' }
];

/**@type {ICommand}*/
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

    callback: async ({ client, interaction, text, user }) => {
        logToFileCommandUsage(COMMAND_NAME, text, interaction, user);

        await interaction.deferReply({ ephemeral: true });
        const name = interaction.options.getString('nombre');
        try {
            if (name === 'games-and-movies') {
                const moviesAndGamesSchema = require('../../models/moviesAndGames-schema');
                const newStuff = { games: [] };
                const updatedStuff = { games: [] };

                const checkForUpdates = async id => {
                    const result = await moviesAndGamesSchema.find({ _id: id });

                    if (!result[0]) {
                        newStuff[id] = 'all';
                        return;
                    }

                    newStuff[id] = [];
                    updatedStuff[id] = [];

                    const oldStuff = result[0];
                    const data = await updateDownloadsData(id);
                    for (const k in data) if (Object.hasOwnProperty.call(data, k)) {
                        const { name, updateInfo, versions, year } = data[k];
                        const found = oldStuff.data.filter(m => m.name === name)[0];

                        if (!found) {
                            newStuff[id].push({ name: `${name} (${year})`, versions: Object.keys(versions) });
                            continue;
                        }

                        const versionsEntries = Object.entries(versions);
                        const added = versionsEntries.filter(([key, _]) => !found.versions[key]).map(([key, _]) => key);
                        const updated = versionsEntries
                            .filter(([key, _]) => found.versions[key] && versions[key].lastUpdate !== found.versions[key].lastUpdate)
                            .map(([key, _]) => key);

                        if (added.length > 0)
                            newStuff[id].push({ name: `${name} (${year})`, versions: added });
                        if (updated.length > 0)
                            updatedStuff[id].push({ name: `${name} (${year})`, versions: updated, updateInfo: updateInfo });
                    }
                };

                const chronologiesIds = ['mcu', 'db']
                for (const id of chronologiesIds)
                    await checkForUpdates(id);

                const oldGames = (await moviesAndGamesSchema.find({ _id: 'games' }))[0];
                const games = await updateGamesCache();
                for (const game of games) {
                    const { id, lastUpdate, name, platform, updateInfo, year } = game;
                    const found = oldGames.data.filter(g => g.id === `${platform}-${id}`)[0];
                    if (!found)
                        newStuff.games.push(name + ` (${year})`);
                    else if (lastUpdate !== found.lastUpdate)
                        updatedStuff.games.push({ name: name + ` (${year})`, updateInfo: updateInfo });
                }

                const newStuffKeys = Object.keys(newStuff).filter(k => k !== 'games');
                const updatedStuffKeys = Object.keys(updatedStuff).filter(k => k !== 'games');
                if (updatedStuff.games.length > 0 || updatedStuffKeys.length > 0
                    || newStuff.games.length > 0 || newStuffKeys.length > 0) {
                    const ids = await getIds();
                    const collectionsData = {
                        'db': { emoji: 'dragon_ball', role: 'anunciosDb', title: 'Universo de Dragon Ball' },
                        'mcu': { emoji: 'marvel', role: 'anunciosUcm', title: 'Universo Cinematográfico de Marvel' }
                    };

                    const getMessagePart = async id => {
                        let content = '';
                        const { emoji, role, title } = collectionsData[id];

                        if (newStuff[id] === 'all') {
                            const data = getDownloadsData(id) || await updateDownloadsData(id);
                            content += `\n@everyone\n\n<:${emoji}:${ids.emojis[emoji]}> **___${title}:___**\n\`\`\`• Se agregaron ${Object.keys(data).length} elementos para descargar.\`\`\``;
                            return content;
                        }

                        if (updatedStuff[id].length === 0 && newStuff[id].length === 0)
                            return content;

                        content += `\n<@&${ids.roles[role]}>\n\n<:${emoji}:${ids.emojis[emoji]}> **___${title}:___**\n\`\`\``;
                        for (let i = 0; i < updatedStuff[id].length; i++) {
                            const element = updatedStuff[id][i];
                            content += `• Se ${element.versions.length > 1 ? 'actualizaron las versiones' : 'actualizó la versión'} ${element.versions.join(', ')} de ${element.name}: ${element.updateInfo}.\n`;
                        }
                        for (let i = 0; i < newStuff[id].length; i++) {
                            const element = newStuff[id][i];
                            content += `• Se agregó ${element.name} en ${element.versions.length > 1 ? 'las versiones' : 'la versión'} ${element.versions.join(', ')}.\n`;
                        }
                        content += '```';

                        return content;
                    };

                    const getDatabaseUpdate = async id => {
                        const data = getDownloadsData(id) || await updateDownloadsData(id);
                        const dbUpdate = [];
                        for (const key in data) if (Object.hasOwnProperty.call(data, key)) {
                            const { name, versions } = data[key];
                            const newObj = { name, versions: {} };
                            for (const ver in versions) if (Object.hasOwnProperty.call(versions, ver))
                                newObj.versions[ver] = { lastUpdate: versions[ver].lastUpdate };
                            dbUpdate.push(newObj);
                        }
                        return dbUpdate;
                    };

                    let content = '';
                    for (const id of chronologiesIds) {
                        if (newStuff[id] === 'all') {
                            content += await getMessagePart(id);
                            await new moviesAndGamesSchema({ _id: id, data: await getDatabaseUpdate(id) }).save();
                        } else if (newStuff[id].length > 0 || updatedStuff[id].length > 0) {
                            content += await getMessagePart(id);
                            await updateMovies(id, await getDatabaseUpdate(id));
                        }
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
                            const { id, lastUpdate, platform } = element;
                            dbUpdate.push({ id: `${platform}-${id}`, lastUpdate });
                        }
                        await updateGames(dbUpdate);
                    }
                    const channel = await client.channels.fetch(ids.channels.anuncios).catch(console.error);
                    if (content.length > 0)
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
            logToFileError(MODULE_NAME, e);
            consoleLogError(`> Error al actualizar cache de '${name}'`);
            await interaction.editReply({ content: '❌ Ocurrió un error.' });
        }
        return;
    }
}
const { ICommand } = require("wokcommands");
const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedField, User, Guild, Client } = require("discord.js");
const { getIds, getFWCData, getCollectors, getGithubRawUrl } = require('../../src/cache');
const { addCollector, updateCollector } = require("../../src/mongodb");
const { convertTZ, consoleLogError, getUserTag, logToFileError, logToFileCommandUsage } = require("../../src/util");
const { ARGENTINA_LOCALE_STRING } = require("../../src/constants");
const { addAnnouncementsRole, isOwner } = require("../../src/common");

const COMMAND_NAME = 'mundial';
const MODULE_NAME = 'commands.games-movies.' + COMMAND_NAME;

const BASE_PRIZE = 5000;
const PACKAGE_CONTENT = 5;
const PREMIUM_PACKAGE_PERCENTAGE_CHANCE = 1;
const PREMIUM_PACKAGE_MINIMUM_RATING = 90;

const FWC_COLOR = [154, 16, 50];
const FWC_GOLD_COLOR = [205, 172, 93];
const FWC_THUMB_PATH = `assets/thumbs/fwc/fwc-2022.png`;
const FWC_GOLD_THUMB_PATH = `assets/thumbs/fwc/fwc-2022-gold.png`;

const MATCHES_BUTTONS_PREFIX = 'fwc-matches-';
const SELECT_MENUS_PREFIX = 'fwc-teams-';
const GROUP_SELECTOR_CUSTOM_ID = `group-selector`;
const TEAM_SELECTOR_CUSTOM_ID = 'team-selector';
const PAGINATOR_PREFIX = 'teams-paginator';
const PREVIOUS_ARROW_CUSTOM_ID = 'prev-page';
const NEXT_ARROW_CUSTOM_ID = 'next-page';

const GROUPS_LETTERS = 'ABCDEFGH';

const newCollectorMessage = '<@&{ROLE_ID}>\n\n🃏 ¡**{USERNAME}** se unió a los coleccionistas!\n\n💰 El premio acumulado es de **${AMOUNT}**.';

const membershipsData = {
    free: { label: '⚫ Gratis', price: 0, rate: 8 },
    bronze: { label: '🟠 Bronce', price: 500, rate: 12 },
    silver: { label: '⚪ Plata', price: 1000, rate: 10 },
    gold: { label: '🟡 Oro', price: 1500, rate: 8 }
};

const achievementsData = {
    "1st-place": {
        check: async owned => { return await hasAllPlayersFromTeam(owned, "ARG") },
        description: `Consigue todos los jugadores de la **selección campeona**: {REPLACEMENT}.`,
        name: "Campeones del mundo",
        replacement: async () => { return await getTeamName("ARG") }
    },
    "2nd-place": {
        check: async owned => { return await hasAllPlayersFromTeam(owned, "FRA") },
        description: `Consigue todos los jugadores de la **selección subcampeona**: {REPLACEMENT}.`,
        name: "Se intentó pero no se pudo",
        replacement: async () => { return await getTeamName("FRA") }
    },
    "3rd-place": {
        check: async owned => { return await hasAllPlayersFromTeam(owned, "CRO") },
        description: `Consigue todos los jugadores de la **selección dueña del tercer lugar**: {REPLACEMENT}.`,
        name: "Peor es nada",
        replacement: async () => { return await getTeamName("CRO") }
    },
    "award-best-goal": {
        check: async owned => { return hasPlayer("BRA-9", owned) },
        description: `Consigue al jugador ganador del **Gol del Torneo**: {REPLACEMENT}.`,
        name: "¡Ay Dibu, qué loco que estás!",
        replacement: async () => { return await getPlayerName("BRA-9") }
    },
    "award-fair-play": {
        check: async owned => { return await hasAllPlayersFromTeam(owned, "ENG") },
        description: `Consigue todos los jugadores de la selección ganadora del **Trofeo FIFA Fair Play*: {REPLACEMENT}.`,
        name: "Juego limpio",
        replacement: async () => { return await getTeamName("ENG") }
    },
    "award-gk": {
        check: async owned => { return hasPlayer("ARG-23", owned) },
        description: `Consigue al jugador ganador del **Guante de Oro**: {REPLACEMENT}.`,
        name: "¡Ay Dibu, qué loco que estás!",
        replacement: async () => { return await getPlayerName("ARG-23") }
    },
    "award-mvp": {
        check: async owned => { return hasPlayer("ARG-10", owned) },
        description: `Consigue al jugador ganador del **Balón de Oro**: {REPLACEMENT}.`,
        name: "G.O.A.T.",
        replacement: async () => { return await getPlayerName("ARG-10") }
    },
    "award-top-scorer": {
        check: async owned => { return hasPlayer("FRA-10", owned) },
        description: `Consigue al jugador ganador de la **Bota de Oro**: {REPLACEMENT}.`,
        name: "Máximo anotador",
        replacement: async () => { return await getPlayerName("FRA-10") }
    },
    "award-young": {
        check: async owned => { return hasPlayer("ARG-24", owned) },
        description: `Consigue al jugador ganador del **Premio al Jugador Joven de la FIFA**: {REPLACEMENT}.`,
        name: "Joven promesa",
        replacement: async () => { return await getPlayerName("ARG-24") }
    },
    "completion-25": {
        check: async owned => { return owned.length >= Math.ceil(await getTotalCards() * 0.25) },
        description: "Consigue el **25% de la colección**.",
        name: "Coleccionista principiante"
    },
    "completion-50": {
        check: async owned => { return owned.length >= Math.ceil(await getTotalCards() * 0.50) },
        description: "Consigue el **50% de la colección**.",
        name: "Coleccionista amateur"
    },
    "completion-75": {
        check: async owned => { return owned.length >= Math.ceil(await getTotalCards() * 0.75) },
        description: "Consigue el **75% de la colección**.",
        name: "Coleccionista profesional"
    },
    "completion-100": {
        check: async owned => { return owned.length === await getTotalCards() },
        description: "**Completa** la colección.",
        name: "Coleccionista experto"
    },
    def: {
        check: async owned => { return await hasAllPlayersFromPosition(owned, "def") },
        description: "Consigue todos los **defensores**.",
        name: "Defensa impenetrable"
    },
    del: {
        check: async owned => { return await hasAllPlayersFromPosition(owned, "del") },
        description: "Consigue todos los **delanteros**.",
        name: "Ataque imparable"
    },
    med: {
        check: async owned => { return await hasAllPlayersFromPosition(owned, "med") },
        description: "Consigue todos los **mediocampistas**.",
        name: "Mediocampo dominado"
    },
    oldest: {
        check: async owned => { return hasPlayer("MEX-1", owned) },
        description: "Consigue al jugador **más viejo del torneo**: {REPLACEMENT}.",
        name: "El más experimentado",
        replacement: async () => { return await getPlayerName("MEX-1") }
    },
    platinum: {
        check: async achievements => { return achievements.length === (Object.keys(achievementsData).length - 1) },
        description: "Consigue **todos los logros**.",
        name: "Coleccionista definitivo"
    },
    por: {
        check: async owned => { return await hasAllPlayersFromPosition(owned, "por") },
        description: "Consigue todos los **arqueros**.",
        name: "Valla invicta"
    },
    scorers: {
        check: async owned => { return await hasAllScorers(owned) },
        description: "Consigue todos los **goleadores**.",
        name: "Gol asegurado"
    },
    "trades-10": {
        check: async trades => { return trades.length >= 10 },
        description: "Realiza **10 intercambios**.",
        name: "Comerciante principiante"
    },
    "trades-25": {
        check: async trades => { return trades.length >= 25 },
        description: "Realiza **25 intercambios**.",
        name: "Comerciante amateur"
    },
    "trades-50": {
        check: async trades => { return trades.length >= 50 },
        description: "Realiza **50 intercambios**.",
        name: "Comerciante profesional"
    },
    "trades-100": {
        check: async trades => { return trades.length >= 100 },
        description: "Realiza **100 intercambios**.",
        name: "Comerciante experto"
    },
    youngest: {
        check: async owned => { return hasPlayer("GER-26", owned) },
        description: "Consigue al jugador **más joven del torneo**: {REPLACEMENT}.",
        name: "Cuidado con el niño",
        replacement: async () => { return await getPlayerName("GER-26") }
    }
};

/**
 * Builds the message to be sent to the announcements channel when a new collector is registered.
 * 
 * @param {User} user The user of the new collector.
 * @returns The message to be sent to announcements channel.
 */
const getNewCollectorFinalMessage = async user => {
    const ids = await getIds();
    const roleId = ids.roles.coleccionistas;
    const username = getUserTag(user);

    let amount = BASE_PRIZE;
    for (const collector of await getCollectors()) {
        const { price } = membershipsData[collector.membership];
        amount += price;
    }

    return newCollectorMessage.replace('{ROLE_ID}', roleId).replace('{USERNAME}', username).replace('{AMOUNT}', amount.toLocaleString(ARGENTINA_LOCALE_STRING));
};

/**
 * Builds a string with the information of a team.
 * 
 * @param {String} teamId The ID of the team.
 * @param {String[]} owned The IDs of the owned players.
 * @param {Number} page The current page number.
 * @param {Number} totalPages The total pages number.
 * @returns The content for a message.
 */
const getTeamMessageContent = async (teamId, owned, page, totalPages) => {
    const { teams } = await getFWCData();
    const { flag, name, players } = teams[teamId];
    return `${flag} **${name}:** ${getOwnedAmountFromTeam(owned, teamId)}/${players} obtenidas\n\nPágina ${page} | ${totalPages}`;
};

/**
 * Destructures the content of a message into a team ID and the current page.
 * 
 * @param {String} content The content of a message.
 * @returns The team ID and the current page.
 */
const destructureMessageContent = async content => {
    const splitted = content.split(' ');
    const teamId = await getTeamIdByName(splitted[1].replace(/[*]|[:]/g, ''));
    const page = parseInt(splitted[splitted.length - 3]) - 1;
    return { teamId, page };
};

/**
 * Gets a team ID by its name.
 *
 * @param {String} name The name of the team.
 * @returns The team ID.
 */
const getTeamIdByName = async name => {
    const { teams } = await getFWCData();
    return Object.entries(teams).filter(([_, team]) => team.name === name).map(([id, _]) => id).shift();
};

/**
 * Counts how many players of a team are owned.
 * 
 * @param {String[]} owned The IDs of the owned players.
 * @param {String} teamId The ID of the team.
 * @returns The amount of players owned from a team.
 */
const getOwnedAmountFromTeam = (owned, teamId) => owned.filter(c => c.startsWith(teamId)).length;

/**
 * Gets a collector by it's ID.
 * 
 * @param {String} id The ID of the collector.
 * @returns The collector.
 */
const getCollector = async id => {
    const collectors = await getCollectors();
    return collectors.find(c => c._id === id);
};

/**
 * Builds an array of arrays of embeds with information of the players.
 * 
 * @param {String[]} owned The IDs of the owned players.
 * @param {String} teamId The ID of the team.
 * @returns A collection of embeds.
 */
const getTeamEmbeds = async (owned, teamId) => {
    const ret = [];
    let actualArray = [];

    const { players } = await getFWCData();

    for (const id of Object.keys(players).filter(id => id.startsWith(teamId))) {
        if (actualArray.length === 10) {
            ret.push(actualArray);
            actualArray = [];
        }

        const embed = !owned.includes(id) ? await getMysteriousPlayerEmbed(id) : await getPlayerEmbed(id);
        actualArray.push(embed);
    }
    ret.push(actualArray);
    return ret;
};

/**
 * Builds a row with the next and previous arrow buttons.
 * 
 * @param {Number} page The current page number.
 * @param {Number} totalPages The total amount of pages.
 * @returns A row with the arrow buttons.
 */
const getArrowsButtons = (page, totalPages) => {
    const row = new ActionRowBuilder();

    row.addComponents(new ButtonBuilder()
        .setCustomId(`${PAGINATOR_PREFIX}${PREVIOUS_ARROW_CUSTOM_ID}`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅')
        .setLabel('Anterior')
        .setDisabled(page === 0));

    row.addComponents(new ButtonBuilder()
        .setCustomId(`${PAGINATOR_PREFIX}${NEXT_ARROW_CUSTOM_ID}`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('➡')
        .setLabel('Siguiente')
        .setDisabled(page === totalPages - 1));

    return row;
};

/**
 * Builds a row with a string select menu for all groups.
 * 
 * @param {String} defaultValue The default value for the select menu.
 * @returns A row with the select menu.
 */
const getGroupSelectMenu = defaultValue => {
    const groupSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`${SELECT_MENUS_PREFIX}${GROUP_SELECTOR_CUSTOM_ID}`)
        .setPlaceholder('Seleccione un grupo')
        .setMinValues(1)
        .setMaxValues(1);

    for (const letter of GROUPS_LETTERS) {
        const options = { label: `Grupo ${letter}`, value: letter };
        if (defaultValue && options.value === defaultValue)
            options.default = true;
        groupSelectMenu.addOptions(options);
    }

    return new ActionRowBuilder().addComponents(groupSelectMenu);
};

/**
 * Builds a row with a string select menu for all teams.
 * 
 * @param {String} group The letter of the group.
 * @param {String} defaultValue The default value for the select menu.
 * @returns A row with the select menu.
 */
const getTeamSelectMenu = async (group, defaultValue) => {
    const { teams } = await getFWCData();

    const teamSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`${SELECT_MENUS_PREFIX}${TEAM_SELECTOR_CUSTOM_ID}`)
        .setPlaceholder('Seleccione un equipo')
        .setMinValues(1)
        .setMaxValues(1);

    const letterIndex = GROUPS_LETTERS.indexOf(group);
    const index = letterIndex + (3 * (letterIndex + 1)) + 1;

    const teamsEntries = Object.entries(teams);
    for (let i = index - 4; i < index; i++) {
        const [id, team] = teamsEntries[i];
        const options = { label: team.name, value: id };
        if (defaultValue && options.value === defaultValue)
            options.default = true;
        teamSelectMenu.addOptions(options);
    }

    return new ActionRowBuilder().addComponents(teamSelectMenu);
};

/**
 * Builds an array of arrays of embeds with the achievements information.
 * 
 * @param {String[]} achievements The IDs of the owned achievements.
 * @returns A collection of embeds.
 */
const getAchievementsEmbeds = async achievements => {
    const ret = [];
    let actualArray = [];
    for (const id of Object.keys(achievementsData)) {
        if (actualArray.length === 10) {
            ret.push(actualArray);
            actualArray = [];
        }

        const embed = !achievements.includes(id) ? await getMysteriousAchievementEmbed() : await getAchievementEmbed(id);
        actualArray.push(embed);
    }
    ret.push(actualArray);
    return ret;
};

/**
 * Builds an embed of a not owned achievement.
 * 
 * @returns An embed of a not owned achievement.
 */
const getMysteriousAchievementEmbed = async () => {
    return new EmbedBuilder()
        .setColor([154, 16, 50])
        .setDescription('???'.repeat(15))
        .setThumbnail(await getGithubRawUrl(`assets/thumbs/fwc/ach-mystery.png`))
        .setTitle('???');
};

/**
 * Builds an embed which contains the information of an achievement.
 * 
 * @param {String} achievementId The ID of the achievement.
 * @returns An embed with the information of the achievement.
 */
const getAchievementEmbed = async achievementId => {
    const achievement = achievementsData[achievementId];
    const description = !achievement.description.includes('{REPLACEMENT}')
        ? achievement.description
        : achievement.description.replace('{REPLACEMENT}', await achievement.replacement());

    return new EmbedBuilder()
        .setColor([154, 16, 50])
        .setDescription(description)
        .setThumbnail(await getGithubRawUrl(`assets/thumbs/fwc/ach-${achievementId}.png`))
        .setTitle(achievement.name);
};

/**
 * Builds a list of every owned player.
 * 
 * @param {String[]} array The IDs of players.
 * @returns A text formatted as a list with all the owned players.
 */
const generateList = array => {
    let list = '';
    let lastCountry = '';
    for (const id of array) {
        const splitted = id.split('-');
        const country = splitted.shift();
        const number = splitted.shift();

        if (country === lastCountry)
            list += `, ${number}`;
        else {
            list += `\n**${country}**: ${number}`;
            lastCountry = country;
        }
    }
    return list.substring(1);
};

/**
 * Gets the letter of the group which a team belongs to.
 * 
 * @param {String} teamId The ID of the team.
 * @returns The letter of the group the team belongs to.
 */
const getGroup = async teamId => {
    const { teams } = await getFWCData();
    const index = Object.keys(teams).indexOf(teamId);
    if (index < 4)
        return 'A';
    else if (index < 8)
        return 'B';
    else if (index < 12)
        return 'C';
    else if (index < 16)
        return 'D';
    else if (index < 20)
        return 'E';
    else if (index < 24)
        return 'F';
    else if (index < 28)
        return 'G';
    else
        return 'H';
};

/**
 * Adds new fields to an already existing collection of fields.
 * 
 * @param {EmbedField[]} fields An already existing collection of fields.
 * @param {String} fieldName The name of the new fields.
 * @param {String[]} arrayToAdd The elements to be added.
 */
const addFields = async (fields, fieldName, arrayToAdd) => {
    const { teams } = await getFWCData();
    const list = generateList(arrayToAdd);
    let lastGroup = 'A';
    let actualField = { name: fieldName, value: `**Grupo ${lastGroup}**\n` };
    for (const line of list.split('\n')) {
        const teamId = line.substring(2, 5);
        const group = await getGroup(teamId);
        const { flag } = teams[teamId];
        if (group === lastGroup)
            actualField.value += `${flag} ${line}\n`;
        else {
            fields.push(actualField);
            lastGroup = group;
            actualField = { name: `Grupo ${lastGroup}`, value: `${flag} ${line}\n` };
        }
    }
    fields.push(actualField);
};

/**
 * Builds an embed with the information of a collector's profile.
 * 
 * @param {User} user The collector's user.
 * @returns An embed with the collector's profile information.
 */
const getProfileEmbed = async user => {
    const { achievements, lastOpened, owned, repeated } = await getCollector(user.id);

    const fields = [{ name: '📊 Media promedio', value: `${await getAverageRating(owned)}`, inline: true },
    { name: '⚽ Goles', value: `${await getGoals(owned)}/${await getTotalGoals()}`, inline: true },
    { name: '🏆 Logros', value: `${achievements.length}/${Object.keys(achievementsData).length}`, inline: true },
    { name: '🧧 Último paquete abierto', value: `${lastOpened.content.join(', ')}` }];

    await addFields(fields, `🃏 Obtenidas: ${owned.length}/${await getTotalCards()}`, owned);
    await addFields(fields, `🔁 Repetidas: ${repeated.length}`, repeated);

    const embed = new EmbedBuilder()
        .setTitle(`Perfil de coleccionista: ${user.username}`)
        .setFields(fields)
        .setColor(FWC_COLOR)
        .setThumbnail(await getGithubRawUrl(FWC_THUMB_PATH));

    return embed;
};

/**
 * Builds an embed with the general information regarding every collector's statistics.
 * 
 * @param {Guild} guild The guild where the command is being executed.
 * @returns An embed with the stats of every collector.
 */
const getStatsEmbed = async guild => {
    const embed = new EmbedBuilder()
        .setTitle('Estadísticas de coleccionistas')
        .setDescription(`**Referencias:**\n\n🃏 Obtenidas | 🔁 Repet. | 📊 Media prom. | ⚽ Goles | 🏆 Logros`)
        .setColor(FWC_COLOR)
        .setThumbnail(await getGithubRawUrl(FWC_THUMB_PATH));
    const fields = [];
    let namesField = { name: 'Coleccionista', value: '', inline: true };
    let statsField = { name: '\u200b', value: '', inline: true };

    const collectors = await getCollectors();
    const members = await guild.members.fetch(collectors.map(c => c._id)).catch(console.error);

    const totalCards = await getTotalCards();
    const totalGoals = await getTotalGoals();
    const totalAchievements = Object.keys(achievementsData).length;

    for (let i = 0; i < collectors.length; i++) {
        const { _id, achievements, owned, repeated } = collectors[i];
        const newStat = `🃏 ${owned.length}/${totalCards} | 🔁 ${repeated.length} | 📊 ${await getAverageRating(owned)} | ⚽ ${await getGoals(owned)}/${totalGoals} | 🏆 ${achievements.length}/${totalAchievements}`;
        const aux = statsField.value + `${newStat}\n\n`;

        if (aux.length <= 1024) {
            namesField.value += `**${i + 1}.** ${members.get(_id).user.username}\n\n`;
            statsField.value += `${newStat}\n\n`;
            continue;
        }

        fields.push({ name: '\u200b', value: '\u200b', inline: true }, namesField, statsField);

        namesField = { name: 'Coleccionista (continuación)', value: `*${members.get(_id).user.username}*\n\n`, inline: true };
        statsField = { name: '\u200b', value: `${newStat}\n\n`, inline: true };
    }

    if (fields.length === 0)
        fields.push(namesField, statsField);
    else
        fields.push({ name: '\u200b', value: '\u200b', inline: true }, namesField, statsField);

    embed.addFields(fields);
    return embed;
};

/**
 * Calculates the average rating of all the owned players.
 * 
 * @param {String[]} owned The IDs of the players owned.
 * @returns The average rating of all owned players.
 */
const getAverageRating = async owned => {
    const { players } = await getFWCData();
    let amount = 0;
    let sum = 0;
    owned.forEach(c => {
        amount++;
        sum += players[c].rating;
    });
    return Math.round(sum / amount);
};

/**
 * Calculates the sum of goals of all the owned players.
 * 
 * @param {String[]} owned The IDs of the players owned.
 * @returns The sum of goals of all the owned players.
 */
const getGoals = async owned => {
    const { players } = await getFWCData();
    let goals = 0;
    owned.forEach(c => goals += players[c].goals ? players[c].goals : 0);
    return goals;
};

/**
 * Calculates the sum of goals of all the players.
 * 
 * @returns The total sum of goals of all the players.
 */
const getTotalGoals = async () => {
    const { players } = await getFWCData();
    let goals = 0;
    Object.entries(players).forEach(([_, p]) => goals += p.goals ? p.goals : 0);
    return goals;
};

/**
 * Sorts an array.
 * 
 * @param {String[]} array The array of IDs to be sorted.
 */
const sort = async array => {
    const { players } = await getFWCData();
    const ids = Object.keys(players);
    array.sort((a, b) => ids.indexOf(a) - ids.indexOf(b));
};

/**
 * Gets a formatted text of the name of a player by it's ID.
 * 
 * @param {String} id The ID of the player.
 * @returns The formatted name of the player.
 */
const getPlayerName = async id => {
    const { players, teams } = await getFWCData();
    const player = players[id];
    const team = teams[id.substring(0, 3)];
    return `${team.flag} **${player.name}**`;
};

/**
 * Gets a formatted text of the name of a team by it's ID.
 * 
 * @param {String} id The ID of the team.
 * @returns The formatted name of the team.
 */
const getTeamName = async id => {
    const { teams } = await getFWCData();
    const team = teams[id];
    return `${team.flag} **${team.name}**`;
};

/**
 * Determines if the collector owns all of the tournament scorers or not.
 * 
 * @param {String[]} owned The IDs of the players owned.
 * @returns True if the collector owns every scorer, or false if not.
 */
const hasAllScorers = async owned => {
    const { players } = await getFWCData();
    const filtered = owned.filter(c => players[c].goals);
    return filtered.length === await getTotalScorers();
};

/**
 * Calculates the total amount of players who scored at the tournament.
 * 
 * @returns The total amount of scorers.
 */
const getTotalScorers = async () => {
    const { players } = await getFWCData();
    const filtered = Object.entries(players).filter(([_, player]) => player.goals);
    return Object.keys(filtered).length;
};

/**
 * Determines whether a player is owned or not.
 * 
 * @param {String} id The ID of the player.
 * @param {String[]} owned The IDs of the owned players.
 * @returns If the array includes the ID or not.
 */
const hasPlayer = (id, owned) => owned.includes(id);

/**
 * Determines if all of the players from a position are owned.
 * 
 * @param {String []} owned The IDs of the owned players.
 * @param {String} position The player position to be checked for.
 * @returns True if all of the players from the indicated position are owned, or false if not.
 */
const hasAllPlayersFromPosition = async (owned, position) => {
    const { achievements, players } = await getFWCData();
    const filtered = owned.filter(c => achievements[position].includes(players[c].position));
    return filtered.length === await getTotalPlayersFromPosition(position);
};

/**
 * Calculates the total amount of players who play in a position.
 * 
 * @param {String} position The players position.
 * @returns The total amount of existing players in that position.
 */
const getTotalPlayersFromPosition = async position => {
    const { achievements, players } = await getFWCData();
    const filtered = Object.entries(players).filter(([_, player]) => achievements[position].includes(player.position));
    return Object.keys(filtered).length;
};

/**
 * Determines if the collector owns all the players of a team or not.
 * 
 * @param {String[]} owned The IDs of the players owned.
 * @param {String} team The ID of the team.
 * @returns True if the collector owns every player of the team, or false if not.
 */
const hasAllPlayersFromTeam = async (owned, team) => {
    const { teams } = await getFWCData();
    const filtered = owned.filter(c => c.startsWith(`${team}-`));
    return filtered.length === teams[team].players;
};

/**
 * Calculates the total amount of existing collectible cards.
 * 
 * @returns The total amount of cards.
 */
const getTotalCards = async () => {
    const { players } = await getFWCData();
    return Object.keys(players).length;
};

/**
 * Adds new cards to the owned and repeated collections.
 * 
 * @param {String[]} newCards The new cards to be added.
 * @param {String[]} ownedCards The already owned cards.
 * @param {String[]} repeatedCards The repeated cards.
 * @returns The owned and repeated cards with the new cards added.
 */
const addNewCards = async (newCards, ownedCards, repeatedCards) => {
    const newOwned = ownedCards.slice();
    const newRepeated = repeatedCards.slice();
    newCards.filter(id => !ownedCards.includes(id)).forEach(card => newOwned.push(card));
    newCards.filter(id => ownedCards.includes(id)).forEach(card => newRepeated.push(card));
    await sort(newOwned);
    await sort(newRepeated);
    return { newOwned, newRepeated };
};

/**
 * Formats a player's goals amount text.
 * 
 * @param {Number} goals The amount of goals of the player.
 * @returns The formatted goals text.
 */
const getGoalsString = goals => {
    const emoji = `⚽ `;

    if (goals <= 4)
        return emoji.repeat(goals);

    const firstLineLength = Math.ceil(goals / 2);
    const secondLineLength = goals - firstLineLength;

    return `${emoji.repeat(firstLineLength)}\n${emoji.repeat(secondLineLength)}`;
};

/**
 * Determines if a package will be premium or not.
 * 
 * @returns True if the package will be premium, or false if not.
 */
const isPremiumPackage = () => {
    const random = Math.floor(Math.random() * 99) + 1;
    return random <= PREMIUM_PACKAGE_PERCENTAGE_CHANCE;
};

/**
 * Gets an array of random players IDs.
 * 
 * @param {Number} amount The amount of players wanted.
 * @param {Boolean} premium If the package is premium or not.
 * @returns A collection of players IDs.
 */
const getRandomPlayersIds = async (amount, premium) => {
    const { players } = await getFWCData();
    const playersIds = !premium ? Object.keys(players)
        : Object.entries(players).filter(([_, player]) => player.rating >= PREMIUM_PACKAGE_MINIMUM_RATING).map(([id, _]) => id);
    const ids = [];
    for (let i = 0; i < amount; i++) {
        const random = Math.floor(Math.random() * playersIds.length);
        ids.push(playersIds.splice(random, 1).shift());
    }
    return ids;
};

/**
 * Formats the rating of a player.
 * 
 * @param {Number} rating The rating of the player.
 * @returns The formatted rating text.
 */
const getRatingText = rating => {
    if (rating <= 69)
        return `🟠 ${rating}`;
    else if (rating <= 74)
        return `⚫ ${rating}`;
    else if (rating <= 79)
        return `🟡 ${rating}`;
    else if (rating <= 83)
        return `🟢 ${rating}`;
    else if (rating <= 86)
        return `🔵 ${rating}`;
    else if (rating <= 89)
        return `🔴 ${rating}`;
    else
        return `🟣 ${rating}`;
};

/**
 * Builds an embed that contains a not owned player information.
 * 
 * @param {String} playerId The ID of the player.
 * @returns An embed with the not owned player information.
 */
const getMysteriousPlayerEmbed = async playerId => {
    const { players, teams } = await getFWCData();
    const { goals } = players[playerId];
    const { color, flag } = teams[playerId.split('-')[0]];

    const questionMarks = "???";

    let fields = [{ name: '#️ID', value: playerId },
    { name: 'Nacimiento', value: questionMarks, inline: true },
    { name: `Nacionalidad`, value: `🏳`, inline: true }];

    fields.push(goals ? { name: 'Goles', value: questionMarks, inline: true } : { name: '\u200b', value: `\u200b`, inline: true });

    fields = fields.concat([{ name: 'Club', value: `🏳 ${questionMarks}`, inline: true },
    { name: 'Posición', value: questionMarks, inline: true },
    { name: 'Calificación', value: `⚪ ${questionMarks}`, inline: true }]);

    return new EmbedBuilder()
        .setTitle(`${flag} \u200b ${playerId.split('-')[1]} | ${questionMarks}`)
        .setFields(fields)
        .setImage(await getGithubRawUrl(`assets/fwc/misterious-player.png`))
        .setThumbnail(await getGithubRawUrl(`assets/fwc/misterious-team.png`))
        .setColor(color);
};

/**
 * Builds an embed that contains the player information.
 * 
 * @param {String} playerId The ID of the player.
 * @returns An embed with the player information.
 */
const getPlayerEmbed = async playerId => {
    const { players, positions, teams } = await getFWCData();
    const { birth, club, goals, name, nationality, picture, position, rating } = players[playerId];
    const { color, emblem, flag } = teams[playerId.split('-')[0]];

    let fields = [{ name: '#️ID', value: playerId },
    { name: 'Nacimiento', value: birth, inline: true },
    { name: `Nacionalidad${nationality.includes(' ') ? 'es' : ''}`, value: nationality, inline: true }];

    fields.push(goals ? { name: 'Goles', value: getGoalsString(goals), inline: true } : { name: '\u200b', value: `\u200b`, inline: true });

    fields = fields.concat([{ name: 'Club', value: club, inline: true },
    { name: 'Posición', value: positions[position].replace(/ /g, '\n'), inline: true },
    { name: 'Calificación', value: getRatingText(rating), inline: true }]);

    return new EmbedBuilder()
        .setTitle(`${flag} \u200b ${playerId.split('-')[1]} | ${name}`)
        .setFields(fields)
        .setImage(picture)
        .setThumbnail(emblem)
        .setColor(color);
};

/**
 * Builds rows with all of the tournament stages buttons.
 * 
 * @returns Rows with the stages buttons.
 */
const getMatchesCategoriesButtons = async () => {
    const rows = [];
    let row = new ActionRowBuilder();
    const { stages } = await getFWCData();
    for (const id in stages) if (Object.hasOwnProperty.call(stages, id)) {
        const { emoji, label } = stages[id];
        if (row.components.length >= 4) {
            rows.push(row);
            row = new ActionRowBuilder();
        }
        row.addComponents(new ButtonBuilder()
            .setCustomId(MATCHES_BUTTONS_PREFIX + id)
            .setEmoji(emoji)
            .setLabel(label)
            .setStyle(ButtonStyle.Secondary));
    }
    rows.push(row);
    return rows;
};

/**
 * Builds rows with all of the matches buttons of a stage.
 * 
 * @param {String} stageId The ID of the stage.
 * @returns Rows with the matches buttons.
 */
const getMatchesButtons = async stageId => {
    const rows = [];
    let row = new ActionRowBuilder();
    const { matches } = await getFWCData();
    const stage = matches[stageId];
    for (const matchId in stage) if (Object.hasOwnProperty.call(stage, matchId)) {
        const { emoji, label } = stage[matchId];
        if (row.components.length >= 4) {
            rows.push(row);
            row = new ActionRowBuilder();
        }
        row.addComponents(new ButtonBuilder()
            .setCustomId(`${MATCHES_BUTTONS_PREFIX}${stageId}-${matchId}`)
            .setEmoji(emoji)
            .setLabel(label)
            .setStyle(ButtonStyle.Secondary));
    }
    rows.push(row);
    return rows;
};

/**
 * Builds a row with a back button.
 * 
 * @param {String} id The custom ID for the button.
 * @returns A row with a button.
 */
const getBackButton = id => {
    return new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
            .setCustomId(`${MATCHES_BUTTONS_PREFIX}back-${id}`)
            .setEmoji('⬅')
            .setLabel('Volver')
            .setStyle(ButtonStyle.Danger));
};

/**@type {ICommand}*/
module.exports = {
    category: 'Juegos/Películas',
    description: 'Contiene los comandos relacionados a la Copa del Mundo Catar 2022.',

    options: [{
        name: 'ver-perfil',
        description: 'Muestra el perfil de un coleccionista.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: 'usuario',
            description: 'El usuario del coleccionista que se quiere ver.',
            required: false,
            type: ApplicationCommandOptionType.User
        }]
    }, {
        name: 'abrir-paquete',
        description: 'Abre un paquete de jugadores.',
        type: ApplicationCommandOptionType.Subcommand
    },
    {
        name: 'estadisticas',
        description: 'Muestra las estadísticas de los coleccionistas.',
        type: ApplicationCommandOptionType.Subcommand
    },
    {
        name: 'ver-equipos',
        description: 'Muestra las tarjetas de cada equipo.',
        type: ApplicationCommandOptionType.Subcommand
    },
    {
        name: 'ver-logros',
        description: 'Muestra los logros.',
        type: ApplicationCommandOptionType.Subcommand
    },
    {
        name: 'partidos',
        description: 'Abre el navegador de partidos.',
        type: ApplicationCommandOptionType.Subcommand
    },
    {
        name: 'registrar-coleccionista',
        description: 'Registrar/actualizar un coleccionista.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: 'usuario',
            description: 'El usuario del coleccionista.',
            required: true,
            type: ApplicationCommandOptionType.User
        }, {
            name: 'membresia',
            description: 'La membresía del coleccionista.',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: Object.entries(membershipsData).map(([key, value]) => ({ name: value.label, value: key }))
        }]
    }],
    slash: true,
    guildOnly: true,

    /**@param {Client} client*/
    init: client => {
        client.on('interactionCreate', async interaction => {
            // select menus
            if (interaction.isStringSelectMenu()) {
                let { customId, user } = interaction;
                if (!customId.startsWith(SELECT_MENUS_PREFIX)) return;

                customId = customId.replace(SELECT_MENUS_PREFIX, '');

                const value = interaction.values.shift();

                // group selector
                if (customId === GROUP_SELECTOR_CUSTOM_ID) {
                    interaction.update({
                        content: `⚽ **Seleccione el grupo y equipo que desea ver:**\n\u200b`,
                        components: [getGroupSelectMenu(value), await getTeamSelectMenu(value)]
                    });
                    return;
                }

                // team selector
                const { owned } = await getCollector(user.id);
                const embeds = await getTeamEmbeds(owned, value);

                interaction.reply({
                    content: await getTeamMessageContent(value, owned, 1, embeds.length),
                    components: [getArrowsButtons(0, embeds.length)],
                    embeds: embeds[0],
                    ephemeral: true
                });

                return;
            }

            if (!interaction.isButton()) return;

            let { customId } = interaction;

            // team embeds
            if (customId.startsWith(PAGINATOR_PREFIX)) {

                customId = customId.replace(PAGINATOR_PREFIX, '');

                const { message, user } = interaction;
                let { teamId: actualTeamId, page: actualPage } = await destructureMessageContent(message.content);

                const { owned } = await getCollector(user.id);
                const embeds = await getTeamEmbeds(owned, actualTeamId);

                if (customId === PREVIOUS_ARROW_CUSTOM_ID && actualPage > 0) --actualPage;
                else if (customId === NEXT_ARROW_CUSTOM_ID && actualPage < embeds.length - 1) ++actualPage;

                await interaction.update({
                    content: await getTeamMessageContent(actualTeamId, owned, actualPage + 1, embeds.length),
                    components: [getArrowsButtons(actualPage, embeds.length)],
                    embeds: embeds[actualPage]
                });

                return;
            }

            // matches buttons
            if (!customId.startsWith(MATCHES_BUTTONS_PREFIX)) return;

            if (interaction.user.id !== interaction.message.interaction.user.id) {
                interaction.reply({ content: `¡Estos botones no son para vos! 😡`, ephemeral: true });
                return;
            }

            customId = customId.replace(MATCHES_BUTTONS_PREFIX, '');

            let split = customId.split('-');
            if (split[0] === 'back') {
                const goTo = split[1];
                if (goTo !== 'main') {
                    customId = goTo;
                    split = [goTo];
                } else {
                    interaction.update({
                        components: await getMatchesCategoriesButtons(),
                        content: '⚽ \u200b **__Partidos de la Copa Mundial Catar 2022__**\n\u200b',
                        files: []
                    });
                    return;
                }
            }

            if (split.length === 1) {
                const { stages } = await getFWCData();
                const { label } = stages[customId];
                interaction.update({
                    components: await getMatchesButtons(customId).concat([getBackButton('main')]),
                    content: `⚽ \u200b **__${label}__**\n\u200b`,
                    files: []
                });
                return;
            }

            const stageId = split[0];
            const matchId = split[1];

            interaction.update({
                components: [getBackButton(stageId)],
                content: null,
                files: [await getGithubRawUrl(`assets/fwc/${stageId}-${matchId}.png`)]
            });
        });
    },

    callback: async ({ channel, client, guild, interaction, text, user }) => {
        logToFileCommandUsage(COMMAND_NAME, text, interaction, user);

        const subCommand = interaction.options.getSubcommand();
        const ids = await getIds();

        if (subCommand === 'registrar-coleccionista') {
            if (ids.users.stormer !== user.id) {
                interaction.reply({ content: '⛔ Lo siento, no tenés permiso para usar este comando.', ephemeral: true });
                return;
            }

            await interaction.deferReply();
            try {
                const target = interaction.options.getMember('usuario');
                const membership = interaction.options.getString('membresia');
                if (target && membership) {
                    const targetId = target.user.id;
                    if (!(await getCollector(targetId))) {
                        await addAnnouncementsRole(ids.roles.coleccionistas, guild, target);
                        await addCollector(targetId, membership);
                        await interaction.editReply({ content: '✅ Coleccionista registrado con éxito.', ephemeral: true });
                    } else {
                        await updateCollector({ _id: targetId, membership });
                        await interaction.editReply({ content: '✅ Coleccionista actualizado con éxito.', ephemeral: true });
                    }

                    const announcementsChannel = await client.channels.fetch(ids.channels.anuncios);
                    announcementsChannel.send({ content: await getNewCollectorFinalMessage(target.user) });

                    return;
                }
            } catch (error) {
                logToFileError(MODULE_NAME, error);
            }
            interaction.editReply({ content: '❌ Ocurrió un error al registrar al coleccionista.', ephemeral: true });

            return;
        }

        const sharedInitialBehaviour = ['ver-perfil', 'abrir-paquete', 'ver-equipos', 'ver-logros'];
        if (sharedInitialBehaviour.includes(subCommand)) {
            // shared behaviour
            if (channel.id !== ids.channels.fwc)
                return { content: `🛑 Este comando solo puede ser utilizado en el canal <#${ids.channels.fwc}>.`, custom: true, ephemeral: true };

            const collector = await getCollector(user.id);
            if (!collector) {
                interaction.reply({ content: '❌ lo siento, ocurrió un error.', ephemeral: true });
                return;
            }

            const { achievements, membership, owned, repeated, timeout } = collector;

            switch (subCommand) {
                case 'ver-perfil':
                    const target = interaction.options.getMember('usuario');

                    const targetUser = !target ? user : target.user;

                    await interaction.deferReply();

                    try {
                        await interaction.editReply({ embeds: [await getProfileEmbed(targetUser)] });
                    } catch (error) {
                        consoleLogError(`> Error al enviar mensaje de perfil del coleccionista ${getUserTag(target)}`);
                        logToFileError(MODULE_NAME, error);
                        await interaction.editReply({ content: '❌ Lo siento, ocurrió un error al generar el mensaje.' });
                    }

                    break;

                case 'abrir-paquete':
                    const FWC_THUMB = await getGithubRawUrl(FWC_THUMB_PATH);
                    await interaction.deferReply();

                    const now = new Date();
                    if (now < timeout) {
                        const convertedDate = convertTZ(timeout);
                        const date = convertedDate.toLocaleDateString('es-AR', { dateStyle: 'medium' });
                        const time = convertedDate.toLocaleTimeString('es-AR', { timeStyle: 'short' });
                        await interaction.editReply({
                            embeds: [new EmbedBuilder()
                                .setDescription(`⏳ Podrás abrir el próximo sobre el **${date} a las ${time} hs...**`)
                                .setColor(FWC_COLOR)
                                .setThumbnail(FWC_THUMB)]
                        });
                        return;
                    }

                    const isPremium = isPremiumPackage();

                    const description = !isPremium ? `🔄 **Abriendo paquete de 5 jugadores...**`
                        : `⭐ **ABRIENDO PAQUETE PREMIUM** ⭐\n\n¡Estás de suerte! La posibilidad de obtener un paquete premium es del ${PREMIUM_PACKAGE_PERCENTAGE_CHANCE}%.`;
                    await interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setDescription(description)
                            .setColor(!isPremium ? FWC_COLOR : FWC_GOLD_COLOR)
                            .setThumbnail(!isPremium ? FWC_THUMB : await getGithubRawUrl(FWC_GOLD_THUMB_PATH))]
                    });

                    const playersIds = await getRandomPlayersIds(PACKAGE_CONTENT, isPremium);

                    const { newOwned, newRepeated } = await addNewCards(playersIds, owned, repeated);

                    const platinumKey = 'platinum';
                    const notToCheck = [platinumKey, 'trades-10', 'trades-25', 'trades-50', 'trades-100'];

                    //check for new achievements
                    const newAchievements = [];
                    if (achievements.length < Object.keys(achievementsData).length)
                        for (const key in achievementsData) if (Object.hasOwnProperty.call(achievementsData, key))
                            if (!notToCheck.includes(key) && await achievementsData[key].check(newOwned) && !achievements.includes(key))
                                newAchievements.push(key);

                    //check for platinum achievement
                    const allAchievements = achievements.concat(newAchievements);
                    if (await achievementsData[platinumKey].check(allAchievements)) {
                        newAchievements.push(platinumKey);
                        allAchievements.push(platinumKey);
                    }

                    const { rate } = membershipsData[membership];
                    await updateCollector({
                        achievements: allAchievements,
                        _id: user.id,
                        lastOpened: { date: now, content: playersIds },
                        owned: newOwned,
                        repeated: newRepeated,
                        timeout: now.setHours(now.getHours() + rate)
                    });

                    const reply = { content: `**<@${user.id}> - ${!isPremium ? '🧧' : '⭐'} PAQUETE ${!isPremium ? 'NORMAL' : 'PREMIUM'}**\n\n✅ Obtuviste:\n\u200b` };

                    if (isPremium)
                        await new Promise(res => setTimeout(res, 1000 * 3));

                    const embeds = [];
                    for (const id of playersIds) {
                        embeds.push(await getPlayerEmbed(id));
                        reply.embeds = embeds;
                        await new Promise(res => setTimeout(res, 1000 * 3.5));
                        await interaction.editReply(reply);
                    }

                    for (const id of newAchievements)
                        await interaction.followUp({
                            content: `🔔 **¡<@${user.id}> consiguió un logro!**\n\u200b`,
                            embeds: [await getAchievementEmbed(id)]
                        });
                    break;

                case 'ver-equipos':
                    await interaction.deferReply({ ephemeral: true });

                    await interaction.editReply({
                        components: [getGroupSelectMenu()],
                        content: `⚽ **Seleccione el grupo que desea ver:**\n\u200b`
                    });
                    break;

                case 'ver-logros':
                    await interaction.deferReply({ ephemeral: true });

                    const achievementsEmbeds = await getAchievementsEmbeds(achievements);

                    await interaction.editReply({ content: `🏆 **Logros obtenidos:** ${achievements.length}/${Object.keys(achievementsData).length}\n\u200b`, embeds: achievementsEmbeds.shift() });

                    for (const embeds of achievementsEmbeds)
                        await interaction.followUp({ embeds: embeds, ephemeral: true });
                    break;
            }

            return;
        }

        switch (subCommand) {
            case 'estadisticas':
                await interaction.deferReply();

                await interaction.editReply({ embeds: [await getStatsEmbed(guild)] });
                break;

            case 'partidos':
                await interaction.reply({
                    components: await getMatchesCategoriesButtons(),
                    content: '⚽ \u200b **__Partidos de la Copa Mundial Catar 2022__**\n\u200b'
                });
                break;
        }
    }
}
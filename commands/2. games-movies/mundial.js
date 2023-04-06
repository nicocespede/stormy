const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getIds, updateIds, getFWCData, updateFWCData, getCollectors, updateCollectors } = require('../../src/cache');
const { addAnnouncementsRole } = require("../../src/general");
const { githubRawURL } = require("../../src/constants");
const { addCollector, updateCollector } = require("../../src/mongodb");
const { convertTZ, log } = require("../../src/util");

const packageContent = 5;
const premiumPercentageChance = 1;
const timeoutHours = 12;

const fwcColor = [154, 16, 50];
const fwcGoldColor = [205, 172, 93];
const fwcThumb = `${githubRawURL}/assets/thumbs/fwc/fwc-2022.png`;
const fwcGoldThumb = `${githubRawURL}/assets/thumbs/fwc/fwc-2022-gold.png`;

const buttonsPrefix = 'fwc-matches-';
const stagesData = {
    G1: { emoji: "1️⃣", label: "Fase 1" },
    G2: { emoji: "2️⃣", label: "Fase 2" },
    G3: { emoji: "3️⃣", label: "Fase 3" },
    P1: { emoji: "4️⃣", label: "Octavos de final" },
    P2: { emoji: "5️⃣", label: "Cuartos de final" },
    P3: { emoji: "6️⃣", label: "Semifinales" },
    P4: { emoji: "7️⃣", label: "Tercer puesto" },
    P5: { emoji: "8️⃣", label: "Final" }
};
const matchesData = {
    G1: {
        M1: { emoji: "🇶🇦", label: "QAT 0-2 ECU" },
        M2: { emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", label: "ENG 6-2 IRN" },
        M3: { emoji: "🇸🇳", label: "SEN 0-2 NED" },
        M4: { emoji: "🇺🇸", label: "USA 1-1 WAL" },
        M5: { emoji: "🇦🇷", label: "ARG 1-2 KSA" },
        M6: { emoji: "🇩🇰", label: "DEN 0-0 TUN" },
        M7: { emoji: "🇲🇽", label: "MEX 0-0 POL" },
        M8: { emoji: "🇫🇷", label: "FRA 4-1 AUS" },
        M9: { emoji: "🇲🇦", label: "MAR 0-0 CRO" },
        M10: { emoji: "🇩🇪", label: "GER 1-2 JPN" },
        M11: { emoji: "🇪🇸", label: "ESP 7-0 CRC" },
        M12: { emoji: "🇧🇪", label: "BEL 1-0 CAN" },
        M13: { emoji: "🇨🇭", label: "SUI 1-0 CMR" },
        M14: { emoji: "🇺🇾", label: "URU 0-0 KOR" },
        M15: { emoji: "🇵🇹", label: "POR 3-2 GHA" },
        M16: { emoji: "🇧🇷", label: "BRA 2-0 SRB" }
    },
    G2: {
        M1: { emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", label: "WAL 0-2 IRN" },
        M2: { emoji: "🇶🇦", label: "QAT 1-3 SEN" },
        M3: { emoji: "🇳🇱", label: "NED 1-1 ECU" },
        M4: { emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", label: "ENG 0-0 USA" },
        M5: { emoji: "🇹🇳", label: "TUN 0-1 AUS" },
        M6: { emoji: "🇵🇱", label: "POL 2-0 KSA" },
        M7: { emoji: "🇫🇷", label: "FRA 2-1 DEN" },
        M8: { emoji: "🇦🇷", label: "ARG 2-0 MEX" },
        M9: { emoji: "🇯🇵", label: "JPN 0-1 CRC" },
        M10: { emoji: "🇧🇪", label: "BEL 0-2 MAR" },
        M11: { emoji: "🇭🇷", label: "CRO 4-1 CAN" },
        M12: { emoji: "🇪🇸", label: "ESP 1-1 GER" },
        M13: { emoji: "🇨🇲", label: "CMR 3-3 SRB" },
        M14: { emoji: "🇰🇷", label: "KOR 2-3 GHA" },
        M15: { emoji: "🇧🇷", label: "BRA 1-0 SUI" },
        M16: { emoji: "🇵🇹", label: "POR 2-0 URU" }
    },
    G3: {
        M1: { emoji: "🇳🇱", label: "NED 2-0 QAT" },
        M2: { emoji: "🇪🇨", label: "ECU 1-2 SEN" },
        M3: { emoji: "🇮🇷", label: "IRN 0-1 USA" },
        M4: { emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", label: "WAL 0-3 ENG" },
        M5: { emoji: "🇹🇳", label: "TUN 1-0 FRA" },
        M6: { emoji: "🇦🇺", label: "AUS 1-0 DEN" },
        M7: { emoji: "🇸🇦", label: "KSA 1-2 MEX" },
        M8: { emoji: "🇵🇱", label: "POL 0-2 ARG" },
        M9: { emoji: "🇨🇦", label: "CAN 1-2 MAR" },
        M10: { emoji: "🇭🇷", label: "CRO 0-0 BEL" },
        M11: { emoji: "🇯🇵", label: "JPN 2-1 ESP" },
        M12: { emoji: "🇨🇷", label: "CRC 2-4 GER" },
        M13: { emoji: "🇰🇷", label: "KOR 2-1 POR" },
        M14: { emoji: "🇬🇭", label: "GHA 0-2 URU" },
        M15: { emoji: "🇨🇲", label: "CMR 1-0 BRA" },
        M16: { emoji: "🇷🇸", label: "SRB 2-3 SUI" }
    },
    P1: {
        M1: { emoji: "🇳🇱", label: "NED 3-1 USA" },
        M2: { emoji: "🇦🇷", label: "ARG 2-1 AUS" },
        M3: { emoji: "🇫🇷", label: "FRA 3-1 POL" },
        M4: { emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", label: "ENG 3-0 SEN" },
        M5: { emoji: "🇯🇵", label: "JPN (1) 1-1 (3) CRO" },
        M6: { emoji: "🇧🇷", label: "BRA 4-1 KOR" },
        M7: { emoji: "🇲🇦", label: "MAR (3) 0-0 (0) ESP" },
        M8: { emoji: "🇵🇹", label: "POR 6-1 SUI" }
    },
    P2: {
        M1: { emoji: "🇭🇷", label: "CRO (4) 1-1 (2) BRA" },
        M2: { emoji: "🇳🇱", label: "NED (3) 2-2 (4) ARG" },
        M3: { emoji: "🇲🇦", label: "MAR 1-0 POR" },
        M4: { emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", label: "ENG 1-2 FRA" }
    },
    P3: {
        M1: { emoji: "🇦🇷", label: "ARG 3-0 CRO" },
        M2: { emoji: "🇫🇷", label: "FRA 2-0 MAR" }
    },
    P4: {
        M1: { emoji: "🇭🇷", label: "CRO 2-1 MAR" }
    },
    P5: {
        M1: { emoji: "🇦🇷", label: "ARG (4) 3-3 (2) FRA" }
    }
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
    /*"3rd-place": {
        check: async owned => { return await hasAllPlayersFromTeam(owned, "CRO") },
        description: `Consigue todos los jugadores de la **selección dueña del tercer lugar**: {REPLACEMENT}.`,
        name: "Peor es nada",
        replacement: async () => {return await getTeamName("CRO")}
    },*/
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
    /*
    oldest: {
        check: async owned => { return hasPlayer("???-??", owned) },
        description: "Consigue al jugador **más viejo del torneo**: ? **???**.",
        name: "El más experimentado"
    },*/
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
    }
    /*,
    youngest: {
        check: async owned => { return hasPlayer("???-??", owned) },
        description: "Consigue al jugador **más joven del torneo**: ? **???**.",
        name: "Cuidado con el niño"
    }*/
};

const getAchievementsEmbeds = async achievements => {
    const ret = [];
    let actualArray = [];
    for (const id of Object.keys(achievementsData)) {
        if (actualArray.length === 10) {
            ret.push(actualArray);
            actualArray = [];
        }

        const embed = !achievements.includes(id) ? getMysteriousAchievementEmbed() : await getAchievementEmbed(id);
        actualArray.push(embed);
    }
    ret.push(actualArray);
    return ret;
};

const getMysteriousAchievementEmbed = () => {
    return new EmbedBuilder()
        .setColor([154, 16, 50])
        .setDescription('???'.repeat(15))
        .setThumbnail(`${githubRawURL}/assets/thumbs/fwc/ach-mystery.png`)
        .setTitle('???');
};

const getAchievementEmbed = async achievementId => {
    const achievement = achievementsData[achievementId];
    const description = !achievement.description.includes('{REPLACEMENT}')
        ? achievement.description
        : achievement.description.replace('{REPLACEMENT}', await achievement.replacement());

    return new EmbedBuilder()
        .setColor([154, 16, 50])
        .setDescription(description)
        .setThumbnail(`${githubRawURL}/assets/thumbs/fwc/ach-${achievementId}.png`)
        .setTitle(achievement.name);
};

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

const getGroup = async teamId => {
    const { teams } = getFWCData() || await updateFWCData();
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

const addFields = async (fields, fieldName, arrayToAdd) => {
    const { teams } = getFWCData() || await updateFWCData();
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

const getProfileEmbed = async user => {
    const collectors = getCollectors() || await updateCollectors();
    const { achievements, owned, repeated } = collectors.find(c => c._id === user.id);

    const fields = [{ name: '📊 Media promedio', value: `${await getAverageRating(owned)}`, inline: true },
    { name: '⚽ Goles', value: `${await getGoals(owned)}/${await getTotalGoals()}`, inline: true },
    { name: '🏆 Logros', value: `${achievements.length}/${Object.keys(achievementsData).length}`, inline: true }];

    const { players } = getFWCData() || await updateFWCData();

    await addFields(fields, `🃏 Obtenidas: ${owned.length}/${await getTotalCards()}`, owned);
    await addFields(fields, `🔁 Repetidas: ${repeated.length}`, repeated);

    const embed = new EmbedBuilder()
        .setTitle(`Perfil de coleccionista: ${user.username}`)
        .setFields(fields)
        .setColor(fwcColor)
        .setThumbnail(fwcThumb);

    return embed;
};

const getStatsEmbed = async guild => {
    const embed = new EmbedBuilder()
        .setTitle('Estadísticas de coleccionistas')
        .setDescription(`**Referencias:**\n\n🃏 Obtenidas | 🔁 Repet. | 📊 Media prom. | ⚽ Goles | 🏆 Logros`)
        .setColor(fwcColor)
        .setThumbnail(fwcThumb);
    const fields = [];
    let namesField = { name: 'Coleccionista', value: '', inline: true };
    let statsField = { name: '\u200b', value: '', inline: true };

    const collectors = getCollectors() || await updateCollectors();
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

const getAverageRating = async owned => {
    const { players } = getFWCData() || await updateFWCData();
    let amount = 0;
    let sum = 0;
    owned.forEach(c => {
        amount++;
        sum += players[c].rating;
    });
    return Math.round(sum / amount);
};

const getGoals = async owned => {
    const { players } = getFWCData() || await updateFWCData();
    let goals = 0;
    owned.forEach(c => goals += players[c].goals ? players[c].goals : 0);
    return goals;
};

const getTotalGoals = async () => {
    const { players } = getFWCData() || await updateFWCData();
    let goals = 0;
    Object.entries(players).forEach(([_, p]) => goals += p.goals ? p.goals : 0);
    return goals;
};

const sort = async array => {
    const { players } = getFWCData() || await updateFWCData();
    const ids = Object.keys(players);
    array.sort((a, b) => ids.indexOf(a) - ids.indexOf(b));
};

const getPlayerName = async id => {
    const { players, teams } = getFWCData() || await updateFWCData();
    const player = players[id];
    const team = teams[id.substring(0, 3)];
    return `${team.flag} **${player.name}**`;
};

const getTeamName = async id => {
    const { teams } = getFWCData() || await updateFWCData();
    const team = teams[id];
    return `${team.flag} **${team.name}**`;
};

const hasAllScorers = async owned => {
    const { players } = getFWCData() || await updateFWCData();
    const filtered = owned.filter(c => players[c].goals);
    return filtered.length === await getTotalScorers();
};

const getTotalScorers = async () => {
    const { players } = getFWCData() || await updateFWCData();
    const filtered = Object.entries(players).filter(([_, player]) => player.goals);
    return Object.keys(filtered).length;
};

const hasPlayer = (id, owned) => owned.includes(id);

const hasAllPlayersFromPosition = async (owned, position) => {
    const { achievements, players } = getFWCData() || await updateFWCData();
    const filtered = owned.filter(c => achievements[position].includes(players[c].position));
    return filtered.length === await getTotalPlayersFromPosition(position);
};

const getTotalPlayersFromPosition = async position => {
    const { achievements, players } = getFWCData() || await updateFWCData();
    const filtered = Object.entries(players).filter(([_, player]) => achievements[position].includes(player.position));
    return Object.keys(filtered).length;
};

const hasAllPlayersFromTeam = async (owned, team) => {
    const { teams } = getFWCData() || await updateFWCData();
    const filtered = owned.filter(c => c.startsWith(`${team}-`));
    return filtered.length === teams[team].players;
};

const getTotalCards = async () => {
    const { players } = getFWCData() || await updateFWCData();
    return Object.keys(players).length;
};

const addNewCards = async (newCards, ownedCards, repeatedCards) => {
    const newOwned = ownedCards.slice();
    const newRepeated = repeatedCards.slice();
    newCards.filter(id => !ownedCards.includes(id)).forEach(card => newOwned.push(card));
    newCards.filter(id => ownedCards.includes(id)).forEach(card => newRepeated.push(card));
    await sort(newOwned);
    await sort(newRepeated);
    return { newOwned, newRepeated };
};

const isCollector = async id => {
    const collectors = getCollectors() || await updateCollectors();
    const found = collectors.find(c => c._id === id);
    return found ? true : false;
};

const getGoalsString = goals => {
    const emoji = `⚽ `;

    if (goals <= 4)
        return emoji.repeat(goals);

    const firstLineLength = Math.ceil(goals / 2);
    const secondLineLength = goals - firstLineLength;

    return `${emoji.repeat(firstLineLength)}\n${emoji.repeat(secondLineLength)}`;
};

const isPremiumPackage = () => {
    const random = Math.floor(Math.random() * 99) + 1;
    return random <= premiumPercentageChance;
};

const getRandomPlayersIds = async (amount, premium) => {
    const { players } = getFWCData() || await updateFWCData();
    const playersIds = !premium ? Object.keys(players)
        : Object.entries(players).filter(([_, player]) => player.rating > 88).map(([id, _]) => id);
    const ids = [];
    for (let i = 0; i < amount; i++) {
        const random = Math.floor(Math.random() * playersIds.length);
        ids.push(playersIds.splice(random, 1).shift());
    }
    return ids;
};

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

const getMysteriousPlayerEmbed = async playerId => {
    const { players, teams } = getFWCData() || await updateFWCData();
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
        .setImage(`${githubRawURL}/assets/fwc/misterious-player.png`)
        .setThumbnail(`${githubRawURL}/assets/fwc/misterious-team.png`)
        .setColor(color);
};

const getPlayerEmbed = async playerId => {
    const { players, positions, teams } = getFWCData() || await updateFWCData();
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

const getMatchesCategoriesButtons = () => {
    const rows = [];
    let row = new ActionRowBuilder();
    for (const id in stagesData) if (Object.hasOwnProperty.call(stagesData, id)) {
        const { emoji, label } = stagesData[id];
        if (row.components.length >= 4) {
            rows.push(row);
            row = new ActionRowBuilder();
        }
        row.addComponents(new ButtonBuilder()
            .setCustomId(buttonsPrefix + id)
            .setEmoji(emoji)
            .setLabel(label)
            .setStyle(ButtonStyle.Secondary));
    }
    rows.push(row);
    return rows;
};

const getMatchesButtons = stageId => {
    const rows = [];
    let row = new ActionRowBuilder();
    const stage = matchesData[stageId];
    for (const matchId in stage) if (Object.hasOwnProperty.call(stage, matchId)) {
        const { emoji, label } = stage[matchId];
        if (row.components.length >= 4) {
            rows.push(row);
            row = new ActionRowBuilder();
        }
        row.addComponents(new ButtonBuilder()
            .setCustomId(`${buttonsPrefix}${stageId}-${matchId}`)
            .setEmoji(emoji)
            .setLabel(label)
            .setStyle(ButtonStyle.Secondary));
    }
    rows.push(row);
    return rows;
};

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
        name: 'ver-tarjeta',
        description: 'Muestra la tarjeta indicada.',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: 'id',
            description: 'El ID de la tarjeta que se quiere ver.',
            required: true,
            type: ApplicationCommandOptionType.String
        }]
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
    }],
    slash: true,
    guildOnly: true,

    init: client => {
        const getBackButton = id => {
            return new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`${buttonsPrefix}back-${id}`)
                    .setEmoji('⬅')
                    .setLabel('Volver')
                    .setStyle(ButtonStyle.Danger));
        };

        client.on('interactionCreate', interaction => {
            if (!interaction.isButton()) return;

            const { customId } = interaction;
            if (!customId.startsWith(buttonsPrefix)) return;

            if (interaction.user.id !== interaction.message.interaction.user.id) {
                interaction.reply({ content: `¡Estos botones no son para vos! 😡`, ephemeral: true });
                return;
            }

            let id = customId.replace(buttonsPrefix, '');

            let split = id.split('-');
            if (split[0] === 'back') {
                const goTo = split[1];
                if (goTo !== 'main') {
                    id = goTo;
                    split = [goTo];
                } else {
                    interaction.update({
                        components: getMatchesCategoriesButtons(),
                        content: '⚽ \u200b **__Partidos de la Copa Mundial Catar 2022__**\n\u200b',
                        files: []
                    });
                    return;
                }
            }

            if (split.length === 1) {
                const { label } = stagesData[id];
                interaction.update({
                    components: getMatchesButtons(id).concat([getBackButton('main')]),
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
                files: [`${githubRawURL}/assets/fwc/matches/${stageId}-${matchId}.png`]
            });
        });
    },

    //callback: async ({ instance, message, args,  }) => {
    callback: async ({ channel, guild, interaction, member, user }) => {
        const subCommand = interaction.options.getSubcommand();

        const ids = getIds() || await updateIds();
        if (channel.id !== ids.channels.fwc)
            return { content: `🛑 Este comando solo puede ser utilizado en el canal <#${ids.channels.fwc}>.`, custom: true, ephemeral: true };

        const sharedInitialBehaviour = ['ver-perfil', 'abrir-paquete', 'ver-tarjeta', 'ver-logros'];
        if (sharedInitialBehaviour.includes(subCommand)) {
            // shared behaviour
            await addAnnouncementsRole(ids.roles.coleccionistas, guild, member);

            if (!(await isCollector(user.id))) {
                await addCollector(user.id);
                await updateCollectors();
            }

            const collectors = getCollectors() || await updateCollectors();
            const { achievements, owned, repeated, timeout } = collectors.find(c => c._id === user.id);

            switch (subCommand) {
                case 'ver-perfil':
                    const target = interaction.options.getMember('usuario');

                    const targetUser = !target ? user : target.user;

                    if (!(await isCollector(targetUser.id)))
                        return { content: `🛑 Este usuario no es un coleccionista.`, custom: true, ephemeral: true };

                    await interaction.deferReply();

                    try {
                        await interaction.editReply({ embeds: [await getProfileEmbed(targetUser)] });
                    } catch (error) {
                        log(error, 'red');
                        await interaction.editReply({ content: '❌ Lo siento, ocurrió un error al generar el mensaje.' });
                    }

                    break;

                case 'abrir-paquete':
                    await interaction.deferReply();

                    const now = new Date();
                    if (now < timeout) {
                        const convertedDate = convertTZ(timeout);
                        const date = convertedDate.toLocaleDateString('es-AR', { dateStyle: 'medium' });
                        const time = convertedDate.toLocaleTimeString('es-AR', { timeStyle: 'short' });
                        await interaction.editReply({
                            embeds: [new EmbedBuilder()
                                .setDescription(`⏳ Podrás abrir el próximo sobre el **${date} a las ${time} hs...**`)
                                .setColor(fwcColor)
                                .setThumbnail(fwcThumb)]
                        });
                        return;
                    }

                    const isPremium = isPremiumPackage();

                    const description = !isPremium ? `🔄 **Abriendo paquete de 5 jugadores...**`
                        : `⭐ **ABRIENDO PAQUETE PREMIUM** ⭐\n\n¡Estás de suerte! La posibilidad de obtener un paquete premium es del ${premiumPercentageChance}%.`;
                    await interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setDescription(description)
                            .setColor(!isPremium ? fwcColor : fwcGoldColor)
                            .setThumbnail(!isPremium ? fwcThumb : fwcGoldThumb)]
                    });

                    const playersIds = await getRandomPlayersIds(packageContent, isPremium);

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

                    await updateCollector({
                        achievements: allAchievements,
                        _id: user.id,
                        lastOpened: { date: now, content: playersIds },
                        owned: newOwned,
                        repeated: newRepeated,
                        timeout: now.setHours(now.getHours() + timeoutHours)
                    });
                    await updateCollectors();

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

                case 'ver-tarjeta':
                    const cardId = interaction.options.getString('id').replace('#', '');

                    const { players } = getFWCData() || await updateFWCData();
                    if (!Object.keys(players).includes(cardId)) {
                        await interaction.reply({ content: '❌ El **ID** indicado es **inválido**.', ephemeral: true });
                        return;
                    }

                    await interaction.deferReply();

                    if (!owned.includes(cardId))
                        await interaction.editReply({ embeds: [await getMysteriousPlayerEmbed(cardId)] });
                    else
                        await interaction.editReply({ embeds: [await getPlayerEmbed(cardId)] });
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
                    components: getMatchesCategoriesButtons(),
                    content: '⚽ \u200b **__Partidos de la Copa Mundial Catar 2022__**\n\u200b'
                });
                break;
        }
    }
}
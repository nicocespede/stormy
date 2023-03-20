const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getIds, updateIds, getFWCData, updateFWCData, getCollectors, updateCollectors } = require('../../src/cache');
const { addAnnouncementsRole } = require("../../src/general");
const { githubRawURL } = require("../../src/constants");
const { addCollector, updateCollector } = require("../../src/mongodb");
const { convertTZ } = require("../../src/util");

const packageContent = 5;
const premiumPercentageChance = 1;
const timeoutHours = 12;

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

const addNewCards = (newCards, ownedCards, repeatedCards) => {
    const newOwned = ownedCards.slice();
    const newRepeated = repeatedCards.slice();
    newCards.filter(id => !ownedCards.includes(id)).forEach(card => newOwned.push(card));
    newCards.filter(id => ownedCards.includes(id)).forEach(card => newRepeated.push(card));
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
        name: 'abrir-paquete',
        description: 'Abre un paquete de jugador.',
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
                files: [`${githubRawURL}/assets/fwc/${stageId}-${matchId}.png`]
            });
        });
    },

    //callback: async ({ instance, message, args,  }) => {
    callback: async ({ channel, guild, interaction, member, user }) => {
        const subCommand = interaction.options.getSubcommand();

        const ids = getIds() || await updateIds();
        if (channel.id !== ids.channels.fwc)
            return { content: `🛑 Este comando solo puede ser utilizado en el canal <#${ids.channels.fwc}>.`, custom: true, ephemeral: true };

        await interaction.deferReply();

        switch (subCommand) {
            case 'abrir-paquete':
                await addAnnouncementsRole(ids.roles.coleccionistas, guild, member);

                if (!(await isCollector(user.id))) {
                    await addCollector(user.id);
                    await updateCollectors();
                }

                const collectors = getCollectors() || await updateCollectors();
                const { achievements, owned, repeated, timeout } = collectors.find(c => c._id === user.id);

                let fwcColor = [154, 16, 50];
                let fwcThumb = `${githubRawURL}/assets/thumbs/fwc/fwc-2022.png`;

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

                if (isPremium) {
                    fwcColor = [205, 172, 93];
                    fwcThumb = `${githubRawURL}/assets/thumbs/fwc/fwc-2022-gold.png`;
                }

                const description = !isPremium ? `🔄 **Abriendo paquete de 5 jugadores...**`
                    : `⭐ **ABRIENDO PAQUETE PREMIUM** ⭐\n\n¡Estás de suerte! La posibilidad de obtener un paquete premium es del ${premiumPercentageChance}%.`;
                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setDescription(description)
                        .setColor(fwcColor)
                        .setThumbnail(fwcThumb)]
                });

                const playersIds = await getRandomPlayersIds(packageContent, isPremium);

                const { newOwned, newRepeated } = addNewCards(playersIds, owned, repeated);

                await updateCollector({
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
                break;

            case 'partidos':
                await interaction.editReply({
                    components: getMatchesCategoriesButtons(),
                    content: '⚽ \u200b **__Partidos de la Copa Mundial Catar 2022__**\n\u200b'
                });
                break;
        }
    }
}
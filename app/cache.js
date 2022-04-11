const { executeQuery, updateStat, addStat } = require('./postgres');

const testing = false;

const mcu = [
    {
        name: "Captain America: The First Avenger (2011)",
        type: "Película",
        lastUpdate: "11/01/2022",
        thumbURL: "captain-america.png"
    },
    {
        name: "Agent Carter Season 1 (2015)",
        type: "Serie",
        lastUpdate: "11/01/2022",
        thumbURL: "agent-carter.png"
    },
    {
        name: "Agent Carter Season 2 (2016)",
        type: "Serie",
        lastUpdate: "11/01/2022",
        thumbURL: "agent-carter.png"
    },
    {
        name: "Marvel One-Shot: Agent Carter (2013)",
        type: "Cortometraje",
        lastUpdate: "24/01/2022",
        thumbURL: "agent-carter.png"
    },
    {
        name: "Captain Marvel (2019)",
        type: "Película",
        lastUpdate: "16/11/2021",
        thumbURL: "captain-marvel.png"
    },
    {
        name: "Iron Man (2008)",
        type: "Película",
        lastUpdate: "11/01/2022",
        thumbURL: "iron-man.png"
    },
    {
        name: "Iron Man 2 (2010)",
        type: "Película",
        lastUpdate: "12/01/2022",
        thumbURL: "iron-man.png"
    },
    {
        name: "The Incredible Hulk (2008)",
        type: "Película",
        lastUpdate: "11/01/2022",
        thumbURL: "hulk.png"
    },
    {
        name: "Marvel One-Shot: The Consultant (2011)",
        type: "Cortometraje",
        lastUpdate: "24/01/2022",
        thumbURL: "agents-of-shield.png"
    },
    {
        name: "Marvel One-Shot: A Funny Thing Happened On The Way To Thor's Hammer (2011)",
        type: "Cortometraje",
        lastUpdate: "24/01/2022",
        thumbURL: "agents-of-shield.png"
    },
    {
        name: "Thor (2011)",
        type: "Película",
        lastUpdate: "11/01/2022",
        thumbURL: "thor.png"
    },
    {
        name: "The Avengers (2012)",
        type: "Película",
        lastUpdate: "11/01/2022",
        thumbURL: "avengers.png"
    },
    {
        name: "Marvel One-Shot: Item 47 (2012)",
        type: "Cortometraje",
        lastUpdate: "24/01/2022",
        thumbURL: "agents-of-shield.png"
    },
    {
        name: "Thor: The Dark World (2013)",
        type: "Película",
        lastUpdate: "11/01/2022",
        thumbURL: "thor.png"
    },
    {
        name: "Iron Man 3 (2013)",
        type: "Película",
        lastUpdate: "11/01/2022",
        thumbURL: "iron-man.png"
    },
    {
        name: "Marvel One-Shot: All Hail The King (2014)",
        type: "Cortometraje",
        lastUpdate: "24/01/2022",
        thumbURL: "agents-of-shield.png"
    },
    {
        name: "Captain America: The Winter Soldier (2014)",
        type: "Película",
        lastUpdate: "16/11/2021",
        thumbURL: "captain-america.png"
    },
    {
        name: "Agents of S.H.I.E.L.D. Season 1 (2013)",
        type: "Serie",
        lastUpdate: "11/01/2022",
        thumbURL: "agents-of-shield.png"
    },
    {
        name: "Guardians of the Galaxy (2014)",
        type: "Película",
        lastUpdate: "16/11/2021",
        thumbURL: "guardians-of-the-galaxy.png"
    },
    {
        name: "Guardians of the Galaxy Vol. 2 (2017)",
        type: "Película",
        lastUpdate: "11/01/2022",
        thumbURL: "guardians-of-the-galaxy.png"
    },
    {
        name: "Daredevil Season 1 (2015)",
        type: "Serie",
        lastUpdate: "12/01/2022",
        thumbURL: "daredevil.png"
    },
    {
        name: "Jessica Jones Season 1 (2015)",
        type: "Serie",
        lastUpdate: "12/01/2022",
        thumbURL: "jessica-jones.png"
    },
    {
        name: "Avengers: Age of Ultron (2015)",
        type: "Película",
        lastUpdate: "12/01/2022",
        thumbURL: "avengers.png"
    },
    {
        name: "Agents of S.H.I.E.L.D. Season 2 (2015)",
        type: "Serie",
        lastUpdate: "12/01/2022",
        thumbURL: "agents-of-shield.png"
    },
    {
        name: "Ant-Man (2015)",
        type: "Película",
        lastUpdate: "12/01/2022",
        thumbURL: "ant-man.png"
    },
    {
        name: "Daredevil Season 2 (2016)",
        type: "Serie",
        lastUpdate: "12/01/2022",
        thumbURL: "daredevil.png"
    },
    {
        name: "Luke Cage Season 1 (2016)",
        type: "Serie",
        lastUpdate: "12/01/2022",
        thumbURL: "luke-cage.png"
    },
    {
        name: "Cloak and Dagger Season 1 (2018)",
        type: "Serie",
        lastUpdate: "12/01/2022",
        thumbURL: "cloak-and-dagger.png"
    },
    {
        name: "Cloak and Dagger Season 2 (2019)",
        type: "Serie",
        lastUpdate: "12/01/2022",
        thumbURL: "cloak-and-dagger.png"
    },
    {
        name: "Iron Fist Season 1 (2017)",
        type: "Serie",
        lastUpdate: "12/01/2022",
        thumbURL: "iron-fist.png"
    },
    {
        name: "Captain America: Civil War (2016)",
        type: "Película",
        lastUpdate: "12/01/2022",
        thumbURL: "captain-america.png"
    },
    {
        name: "Black Widow (2021)",
        type: "Película",
        lastUpdate: "19/12/2021",
        thumbURL: "black-widow.png"
    },
    {
        name: "Black Panther (2018)",
        type: "Película",
        lastUpdate: "12/01/2022",
        thumbURL: "black-panther.png"
    },
    {
        name: "Agents of S.H.I.E.L.D. Season 3 (2015)",
        type: "Serie",
        lastUpdate: "12/01/2022",
        thumbURL: "agents-of-shield.png"
    },
    {
        name: "Inhumans Season 1 (2017)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "inhumans.png"
    },
    {
        name: "The Defenders Season 1 (2017)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "the-defenders.png"
    },
    {
        name: "Spider-Man: Homecoming (2017)",
        type: "Película",
        lastUpdate: "13/01/2022",
        thumbURL: "spiderman.png"
    },
    {
        name: "The Punisher Season 1 (2017)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "the-punisher.png"
    },
    {
        name: "Jessica Jones Season 2 (2018)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "jessica-jones.png"
    },
    {
        name: "Luke Cage Season 2 (2018)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "luke-cage.png"
    },
    {
        name: "Runaways Season 1 (2017)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "runaways.png"
    },
    {
        name: "Runaways Season 2 (2018)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "runaways.png"
    },
    {
        name: "Iron Fist Season 2 (2018)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "iron-fist.png"
    },
    {
        name: "Daredevil Season 3 (2018)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "daredevil.png"
    },
    {
        name: "The Punisher Season 2 (2019)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "the-punisher.png"
    },
    {
        name: "Jessica Jones Season 3 (2019)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "jessica-jones.png"
    },
    {
        name: "Doctor Strange (2016)",
        type: "Película",
        lastUpdate: "13/01/2022",
        thumbURL: "doctor-strange.png"
    },
    {
        name: "Agents of S.H.I.E.L.D. Slingshot (2016)",
        type: "Miniserie",
        lastUpdate: "13/01/2022",
        thumbURL: "agents-of-shield.png"
    },
    {
        name: "Thor: Ragnarok (2017)",
        type: "Película",
        lastUpdate: "13/01/2022",
        thumbURL: "thor.png"
    },
    {
        name: "Ant-Man and the Wasp (2018)",
        type: "Película",
        lastUpdate: "16/11/2021",
        thumbURL: "ant-man.png"
    },
    {
        name: "Agents of S.H.I.E.L.D. Season 4 (2016)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "agents-of-shield.png"
    },
    {
        name: "Agents of S.H.I.E.L.D. Season 5 (2017)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "agents-of-shield.png"
    },
    {
        name: "Avengers: Infinity War (2018)",
        type: "Película",
        lastUpdate: "16/11/2021",
        thumbURL: "avengers.png"
    },
    {
        name: "Agents of S.H.I.E.L.D. Season 6 (2019)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "agents-of-shield.png"
    },
    {
        name: "Agents of S.H.I.E.L.D. Season 7 (2020)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "agents-of-shield.png"
    },
    {
        name: "Runaways Season 3 (2018)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "runaways.png"
    },
    {
        name: "Avengers: Endgame (2019)",
        type: "Película",
        lastUpdate: "16/11/2021",
        thumbURL: "avengers.png"
    },
    {
        name: "Eternals (2021)",
        type: "Película",
        lastUpdate: "13/01/2022",
        thumbURL: "eternals.png"
    },
    {
        name: "Loki Season 1 (2021)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "loki.png"
    },
    {
        name: "What If...? Season 1 (2021)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "what-if.png"
    },
    {
        name: "WandaVision Season 1 (2021)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "scarlet-witch.png"
    },
    {
        name: "The Falcon And The Winter Soldier Season 1 (2021)",
        type: "Serie",
        lastUpdate: "13/01/2022",
        thumbURL: "falcon.png"
    },
    {
        name: "Shang-Chi and the Legend of the Ten Rings (2021)",
        type: "Película",
        lastUpdate: "16/11/2021",
        thumbURL: "shang-chi.png"
    },
    {
        name: "Helstrom Season 1 (2020)",
        type: "Serie",
        lastUpdate: "14/01/2022",
        thumbURL: "helstrom.png"
    },
    {
        name: "Spider-Man (2002)",
        type: "Película",
        lastUpdate: "14/01/2022",
        thumbURL: "spiderman.png"
    },
    {
        name: "Spider-Man 2 (2004)",
        type: "Película",
        lastUpdate: "14/01/2022",
        thumbURL: "spiderman.png"
    },
    {
        name: "Spider-Man 3 (2007)",
        type: "Película",
        lastUpdate: "19/12/2021",
        thumbURL: "spiderman.png"
    },
    {
        name: "The Amazing Spider-Man (2012)",
        type: "Película",
        lastUpdate: "19/12/2021",
        thumbURL: "spiderman.png"
    },
    {
        name: "The Amazing Spider-Man 2 (2014)",
        type: "Película",
        lastUpdate: "19/12/2021",
        thumbURL: "spiderman.png"
    },
    {
        name: "Venom (2018)",
        type: "Película",
        lastUpdate: "19/12/2021",
        thumbURL: "venom.png"
    },
    {
        name: "Venom: Let There Be Carnage (2021)",
        type: "Película",
        lastUpdate: "19/12/2021",
        thumbURL: "venom.png"
    },
    {
        name: "Spider-Man: Far From Home (2019)",
        type: "Película",
        lastUpdate: "16/11/2021",
        thumbURL: "spiderman.png"
    },
    {
        name: "Spider-Man: No Way Home (2021)",
        type: "Película",
        lastUpdate: "13/03/2022",
        thumbURL: "spiderman.png"
    },
    {
        name: "Hawkeye Season 1 (2021)",
        type: "Serie",
        lastUpdate: "14/01/2022",
        thumbURL: "hawkeye.png"
    },
    {
        name: "Moon Knight Season 1 (2022)",
        type: "Serie",
        lastUpdate: "06/04/2022",
        thumbURL: "moon-knight.png"
    }
];

var mcuMovies;
var filters;
var birthdays;
var banned;
var sombraBans;
var lastDateChecked;
var reactionCollectorInfo;
var anniversaries;
var avatar;
var lastAction;
var playlists = { names: [], urls: [] };
var stats;
var counters = {};
var intervals = {};
var minutesUp = 0;

const fullToSeconds = (days, hours, minutes, seconds) => {
    return seconds + (minutes * 60) + (hours * 3600) + (days * 86400);
};

const secondsToFull = (seconds) => {
    // calculate (and subtract) whole days
    var days = Math.floor(seconds / 3600);
    seconds -= days * 86400;
    // calculate (and subtract) whole hours
    var hours = Math.floor(seconds / 3600) % 24;
    seconds -= hours * 3600;
    // calculate (and subtract) whole minutes
    var minutes = Math.floor(seconds / 60) % 60;
    seconds -= minutes * 60;
    seconds = seconds % 60;
    return { days, hours, minutes, seconds };
};

module.exports = {
    prefix: '-',

    categorySettings: [
        {
            name: 'General',
            emoji: '🎲'
        },
        {
            name: 'Juegos/Películas',
            emoji: '🎮'
        },
        {
            name: 'Música',
            emoji: '🎵'
        },
        {
            name: 'Moderación',
            emoji: '👮'
        },
        {
            name: 'Cotizaciones',
            emoji: '🪙'
        },
        {
            name: 'Ayuda',
            emoji: '❔'
        },
        {
            name: 'Privados',
            emoji: '🔒',
            hidden: true
        }
    ],

    ids: {
        users: {
            bot: "853113828501225502",
            stormer: "334409923389554699",
            darkness: "479521831267598336",
            sombra: '662237023540609044',
            jimmy: '360246288349921310'
        },
        roles: {
            banear: '872782064271917067',
            smurf: "872768314689060936",
            funcion: "875942757733122078"
        },
        guilds: {
            nckg: '479523718368854027'
        },
        channels: {
            anuncios: "881187176216395826",
            general: "703056370039128105",
            cartelera: "836043727616213012",
            welcome: !testing ? "817149994959110235" : "962233358237188156",
            afk: "585276720622338048",
            musica: [
                "703055406091468922",
                "859586260565229588",
                "853926878498521089"
            ]
        }
    },

    reminders: {
        everyone: [
            "estás re cogido amigo.",
            "sos muy wachin.",
            "te re tiembla pibe.",
            "te falta calle papi."
        ],
        sombra: [
            "tu nivel de nene down es 100%.",
            "no la ponés más.",
            "tu hermana alta puta.",
            "abandonaste un 1v1 ¡CAGÓN!"
        ]
    },

    texts: {
        movies: {
            description: "Hola <@%USER_ID%>, para obtener los links usá nuevamente el comando `%PREFIX%ucm` seguido de un espacio y el número del elemento que quieras descargar.\n\nPara descargar se recomienda utilizar el gestor de descargas JDownloader 2 (https://jdownloader.org/jdownloader2).\n\nLas películas (en orden cronológico) disponibles para descargar son:\n\n",
            footer: "Por cualquier error o links caídos, por favor avisar a @StormeR."
        },
        games: {
            description: "Hola <@%USER_ID%>, para obtener los links usá nuevamente el comando `%PREFIX%juegos` seguido de un espacio y el número del juego que quieras descargar.\n\nPara descargar se recomienda utilizar el gestor de descargas JDownloader 2 (https://jdownloader.org/jdownloader2).\n\nLos juegos disponibles para descargar son:",
            footer: "Si querés sugerir algún juego para agregar o querés saber si hay nuevas actualizaciones de los juegos actuales, no dudes en hablar con @StormeR."
        }
    },

    currencies: {
        slp: {
            id: "smooth-love-potion",
            color: [
                255,
                175,
                188
            ]
        },
        pvu: {
            id: "plant-vs-undead-token",
            color: [
                159,
                222,
                71
            ]
        },
        btc: {
            id: "bitcoin",
            color: [
                247,
                147,
                26
            ]
        },
        eth: {
            id: "ethereum",
            color: [
                138,
                146,
                178
            ]
        },
        doge: {
            id: "dogecoin",
            color: [
                186,
                159,
                51
            ]
        },
        bnb: {
            id: "binancecoin",
            color: [
                243,
                186,
                47
            ]
        }
    },

    smurf: {
        '4g': [
            "Elon Muskardo#p3te",
            "candebe",
            "enero2001"
        ],
        notsassy: [
            "Elon Muskardo#2840",
            "nottsassy",
            "enero2001"
        ],
        elon: [
            "Elon Musk#8938",
            "candeebe",
            "enero2001"
        ],
        cande: [
            "JoseCuchilloPaz#1337",
            "candeeebe",
            "enero2001"
        ],
        maria: [
            "MariaBecerra#7850",
            "mariabecerrapa",
            "enero2001"
        ],
        pou: [
            "pou#3228",
            "candeberru",
            "enero2001"
        ],
        marito: [
            "Marito#4090",
            "maritovl",
            "enero2001"
        ],
        pitufowilly: [
            "MonsterZeroUltra#6256",
            "pitufowilly",
            "valorant123*"
        ],
        pipeline: [
            "Pipeline Punch#8234",
            "punchpipe",
            "enero2001"
        ],
        monster: [
            "Monster Original#GOD",
            "monsteroriginalpa",
            "monsterpapi123"
        ],
        mango: [
            "MangoLoco#9935",
            "Karuchasmurf",
            "karucha123"
        ],
        stormy: [
            "StormY#7157",
            "StormeRSmurf",
            "stormersmurf97"
        ],
        stormersmurf: [
            "StormY#8935",
            "StormeRSmurf2",
            "stormersmurf2"
        ],
        ysya: [
            "Ysy A#11111",
            "R4zeMain",
            "valorant123"
        ]
    },

    welcome: [
        "<@%USER_ID%> está aquí.",
        "<@%USER_ID%> acaba de aterrizar.",
        "<@%USER_ID%> se ha unido al grupo.",
        "Hola, <@%USER_ID%>. ¡Saluda!",
        "¡Dad todos la bienvenida a <@%USER_ID%>!",
        "<@%USER_ID%> ha saltado al servidor.",
        "Te damos la bienvenida, <@%USER_ID%>. Esperamos que hayas traído pizza.",
        "Me alegra que estés aquí, <@%USER_ID%>.",
        "¡<@%USER_ID%> acaba de aparecer!",
        "<@%USER_ID%> acaba de dejarse caer en el servidor.",
        "Un <@%USER_ID%> salvaje apareció.",
        "¡Sííí, has llegado, <@%USER_ID%>!"
    ],

    goodbye: [
        "**%USERNAME%** se fue al pingo.",
        "**%USERNAME%** se tomó el palo.",
        "**%USERNAME%** se tomó el buque.",
        "**%USERNAME%** se fue al choto.",
        "**%USERNAME%** se fue a la verga.",
        "**%USERNAME%** se borró.",
        "**%USERNAME%** tiró la de humo.",
        "**%USERNAME%** se fue a comprar cigarrillos."
    ],

    bannedWithReason: [
        "**%USERNAME%** fue baneado del servidor. Razón: **'%REASON%'**.",
        "**%USERNAME%** fue baneado del servidor por **'%REASON%'**.",
        "Banearon a **%USERNAME%** por **'%REASON%'**.",
        "**%USERNAME%** se fue baneado por **'%REASON%'**.",
        "Cagaron baneando a **%USERNAME%** por **'%REASON%'**.",
        "Funaron a **%USERNAME%** por **'%REASON%'**."
    ],

    bannedWithoutReason: [
        "**%USERNAME%** fue baneado del servidor.",
        "Banearon a **%USERNAME%**.",
        "**%USERNAME%** se fue baneado.",
        "Cagaron baneando a **%USERNAME%**.",
        "Funaron a **%USERNAME%**."
    ],

    unbanned: [
        "**%USERNAME%** fue desbaneado del servidor.",
        "Desbanearon a **%USERNAME%**.",
        "Le aflojaron las esposas a **%USERNAME%**.",
        "Liberaron a **%USERNAME%**."
    ],

    musicActions: {
        adding: 'ADDING',
        addingNext: 'ADDING_NEXT',
        moving: 'MOVING_SONG',
        stopping: 'STOPPING',
        changingChannel: 'CHANGING_CHANNEL',
        leavingEmptyChannel: 'LEAVING_EMPTY_CHANNEL',
        beingKicked: 'BEING_KICKED',
        ending: 'ENDING',
        startingTrack: 'STARTING_TRACK'
    },

    getFilters: () => filters,
    updateFilters: async () => {
        await executeQuery('SELECT * FROM "mcuFilters";').then(async json => {
            var aux = json[0]
            filters = aux['mcuFilters_filters'];
            console.log('> Caché de filtros actualizado');
        }).catch(console.error);
        return filters;
    },

    getMcuMovies: () => mcuMovies,
    updateMcuMovies: (filters) => {
        if (filters.includes('all'))
            mcuMovies = mcu;
        else {
            var newArray = [];
            mcu.forEach(movie => {
                if (filters.includes(movie.type))
                    newArray.push(movie);
            });
            mcuMovies = newArray;
        }
        console.log('> Caché de UCM actualizado');
        return mcuMovies;
    },

    getBirthdays: () => birthdays,
    updateBirthdays: async () => {
        await executeQuery('SELECT * FROM "bdays" ORDER BY substring("bdays_date", 4, 5), substring("bdays_date", 1, 2);').then(async json => {
            birthdays = json;
            console.log('> Caché de cumpleaños actualizado');
        }).catch(console.error);
        return birthdays;
    },

    getBanned: () => banned,
    updateBanned: async () => {
        await executeQuery('SELECT * FROM "bans";').then(async json => {
            banned = json;
            console.log('> Caché de baneados actualizado');
        }).catch(console.error);
        return banned;
    },

    getSombraBans: () => sombraBans,
    updateSombraBans: async () => {
        await executeQuery('SELECT * FROM "sombraBans";').then(async json => {
            sombraBans = json;
            console.log('> Caché de baneos de Sombra actualizado');
        }).catch(console.error);
        return sombraBans;
    },

    getLastDateChecked: () => lastDateChecked,
    updateLastDateChecked: (newDate) => (lastDateChecked = newDate),

    getReactionCollectorInfo: () => reactionCollectorInfo,
    updateReactionCollectorInfo: async () => {
        await executeQuery('SELECT * FROM "collectorMessage";').then(async json => {
            reactionCollectorInfo = json;
            console.log('> Caché de recolector de reacciones actualizado');
        }).catch(console.error);
        return reactionCollectorInfo;
    },

    getAnniversaries: () => anniversaries,
    updateAnniversaries: async () => {
        await executeQuery('SELECT * FROM "anniversaries";').then(async json => {
            anniversaries = json;
            console.log('> Caché de aniversarios actualizado');
        }).catch(console.error);
        return anniversaries;
    },

    getAvatar: () => avatar,
    updateAvatar: async () => {
        await executeQuery(`SELECT * FROM "avatar";`).then(async json => {
            avatar = json;
            console.log('> Caché de avatar actualizado');
        }).catch(console.error);
        return avatar;
    },

    getLastAction: () => lastAction,
    updateLastAction: (action) => (lastAction = action),

    getPlaylists: () => playlists,
    updatePlaylists: async () => {
        await executeQuery('SELECT * FROM "playlists" ORDER BY "playlists_name";').then(async json => {
            var newNames = [];
            var newUrls = [];
            json.forEach(pl => {
                newNames.push(pl['playlists_name']);
                newUrls.push(pl['playlists_url']);
            });
            playlists.names = newNames;
            playlists.urls = newUrls;
            console.log('> Caché de playlists actualizado');
        }).catch(console.error);
        return playlists;
    },

    getStats: () => stats,
    updateStats: async () => {
        await executeQuery('SELECT * FROM "stats" ORDER BY "stats_days" DESC, "stats_hours" DESC, "stats_minutes" DESC, "stats_seconds" DESC;').then(async json => {
            stats = json;
            console.log('> Caché de estadísticas actualizado');
        }).catch(console.error);
        return stats;
    },
    getCounters: () => counters,
    updateCounter: (id, time) => {
        if (!time)
            counters[id] = 0;
        else
            counters[id] += time;
    },
    pushCounter: async (id) => {
        const { isListed } = require('./general')
        if (!isListed(id, stats, 'stats_id'))
            await addStat(id);
        stats.forEach(async stat => {
            if (stat['stats_id'] === id) {
                var totalTime = counters[id]
                    + fullToSeconds(stat['stats_days'], stat['stats_hours'], stat['stats_minutes'], stat['stats_seconds']);
                var { days, hours, minutes, seconds } = secondsToFull(totalTime);
                await updateStat(id, days, hours, minutes, seconds);
                return;
            }
        });
    },
    getIntervals: () => intervals,
    addInterval: (id, interval) => (intervals[id] = interval),

    getMinutesUp: () => minutesUp,
    addMinuteUp: () => minutesUp++
};
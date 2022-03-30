const { executeQuery } = require('./postgres');

const prefix = '+';

const categorySettings = [
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
]

const ids = {
    users: {
        bot: "955888796602335252",
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
        welcome: "817149994959110235",
        musica: [
            "703055406091468922",
            "859586260565229588",
            "853926878498521089"
        ]
    }
};

const reminders = {
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
};

const mcu = [
    {
        name: "Captain America: The First Avenger (2011)",
        type: "Película"
    },
    {
        name: "Agent Carter Season 1 (2015)",
        type: "Serie"
    },
    {
        name: "Agent Carter Season 2 (2016)",
        type: "Serie"
    },
    {
        name: "Marvel One-Shot: Agent Carter (2013)",
        type: "Cortometraje"
    },
    {
        name: "Captain Marvel (2019)",
        type: "Película"
    },
    {
        name: "Iron Man (2008)",
        type: "Película"
    },
    {
        name: "Iron Man 2 (2010)",
        type: "Película"
    },
    {
        name: "The Incredible Hulk (2008)",
        type: "Película"
    },
    {
        name: "Marvel One-Shot: The Consultant (2011)",
        type: "Cortometraje"
    },
    {
        name: "Marvel One-Shot: A Funny Thing Happened On The Way To Thor's Hammer (2011)",
        type: "Cortometraje"
    },
    {
        name: "Thor (2011)",
        type: "Película"
    },
    {
        name: "The Avengers (2012)",
        type: "Película"
    },
    {
        name: "Marvel One-Shot: Item 47 (2012)",
        type: "Cortometraje"
    },
    {
        name: "Thor: The Dark World (2013)",
        type: "Película"
    },
    {
        name: "Iron Man 3 (2013)",
        type: "Película"
    },
    {
        name: "Marvel One-Shot: All Hail The King (2014)",
        type: "Cortometraje"
    },
    {
        name: "Captain America: The Winter Soldier (2014)",
        type: "Película"
    },
    {
        name: "Agents of S.H.I.E.L.D. Season 1 (2013)",
        type: "Serie"
    },
    {
        name: "Guardians of the Galaxy (2014)",
        type: "Película"
    },
    {
        name: "Guardians of the Galaxy Vol. 2 (2017)",
        type: "Película"
    },
    {
        name: "Daredevil Season 1 (2015)",
        type: "Serie"
    },
    {
        name: "Jessica Jones Season 1 (2015)",
        type: "Serie"
    },
    {
        name: "Avengers: Age of Ultron (2015)",
        type: "Película"
    },
    {
        name: "Agents of S.H.I.E.L.D. Season 2 (2015)",
        type: "Serie"
    },
    {
        name: "Ant-Man (2015)",
        type: "Película"
    },
    {
        name: "Daredevil Season 2 (2016)",
        type: "Serie"
    },
    {
        name: "Luke Cage Season 1 (2016)",
        type: "Serie"
    },
    {
        name: "Cloak and Dagger Season 1 (2018)",
        type: "Serie"
    },
    {
        name: "Cloak and Dagger Season 2 (2019)",
        type: "Serie"
    },
    {
        name: "Iron Fist Season 1 (2017)",
        type: "Serie"
    },
    {
        name: "Captain America: Civil War (2016)",
        type: "Película"
    },
    {
        name: "Black Widow (2021)",
        type: "Película"
    },
    {
        name: "Black Panther (2018)",
        type: "Película"
    },
    {
        name: "Agents of S.H.I.E.L.D. Season 3 (2015)",
        type: "Serie"
    },
    {
        name: "Inhumans Season 1 (2017)",
        type: "Serie"
    },
    {
        name: "The Defenders Season 1 (2017)",
        type: "Serie"
    },
    {
        name: "Spider-Man: Homecoming (2017)",
        type: "Película"
    },
    {
        name: "The Punisher Season 1 (2017)",
        type: "Serie"
    },
    {
        name: "Jessica Jones Season 2 (2018)",
        type: "Serie"
    },
    {
        name: "Luke Cage Season 2 (2018)",
        type: "Serie"
    },
    {
        name: "Runaways Season 1 (2017)",
        type: "Serie"
    },
    {
        name: "Runaways Season 2 (2018)",
        type: "Serie"
    },
    {
        name: "Iron Fist Season 2 (2018)",
        type: "Serie"
    },
    {
        name: "Daredevil Season 3 (2018)",
        type: "Serie"
    },
    {
        name: "The Punisher Season 2 (2019)",
        type: "Serie"
    },
    {
        name: "Jessica Jones Season 3 (2019)",
        type: "Serie"
    },
    {
        name: "Doctor Strange (2016)",
        type: "Película"
    },
    {
        name: "Agents of S.H.I.E.L.D. Slingshot (2016)",
        type: "Miniserie"
    },
    {
        name: "Thor: Ragnarok (2017)",
        type: "Película"
    },
    {
        name: "Ant-Man and the Wasp (2018)",
        type: "Película"
    },
    {
        name: "Agents of S.H.I.E.L.D. Season 4 (2016)",
        type: "Serie"
    },
    {
        name: "Agents of S.H.I.E.L.D. Season 5 (2017)",
        type: "Serie"
    },
    {
        name: "Avengers: Infinity War (2018)",
        type: "Película"
    },
    {
        name: "Agents of S.H.I.E.L.D. Season 6 (2019)",
        type: "Serie"
    },
    {
        name: "Agents of S.H.I.E.L.D. Season 7 (2020)",
        type: "Serie"
    },
    {
        name: "Runaways Season 3 (2018)",
        type: "Serie"
    },
    {
        name: "Avengers: Endgame (2019)",
        type: "Película"
    },
    {
        name: "Eternals (2021)",
        type: "Película"
    },
    {
        name: "Loki Season 1 (2021)",
        type: "Serie"
    },
    {
        name: "What If...? Season 1 (2021)",
        type: "Serie"
    },
    {
        name: "WandaVision Season 1 (2021)",
        type: "Serie"
    },
    {
        name: "The Falcon And The Winter Soldier Season 1 (2021)",
        type: "Serie"
    },
    {
        name: "Shang-Chi and the Legend of the Ten Rings (2021)",
        type: "Película"
    },
    {
        name: "Helstrom Season 1 (2020)",
        type: "Serie"
    },
    {
        name: "Spider-Man (2002)",
        type: "Película"
    },
    {
        name: "Spider-Man 2 (2004)",
        type: "Película"
    },
    {
        name: "Spider-Man 3 (2007)",
        type: "Película"
    },
    {
        name: "The Amazing Spider-Man (2012)",
        type: "Película"
    },
    {
        name: "The Amazing Spider-Man 2 (2014)",
        type: "Película"
    },
    {
        name: "Venom (2018)",
        type: "Película"
    },
    {
        name: "Venom: Let There Be Carnage (2021)",
        type: "Película"
    },
    {
        name: "Spider-Man: Far From Home (2019)",
        type: "Película"
    },
    {
        name: "Spider-Man: No Way Home (2021)",
        type: "Película"
    },
    {
        name: "Hawkeye Season 1 (2021)",
        type: "Serie"
    }
];

const welcome = [
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
];

const goodbye = [
    "**%USERNAME%** se fue al pingo.",
    "**%USERNAME%** se tomó el palo.",
    "**%USERNAME%** se tomó el buque.",
    "**%USERNAME%** se fue al choto.",
    "**%USERNAME%** se fue a la verga.",
    "**%USERNAME%** se borró.",
    "**%USERNAME%** tiró la de humo.",
    "**%USERNAME%** se fue a comprar cigarrillos."
];

const bannedWithReason = [
    "**%USERNAME%** fue baneado del servidor. Razón: **'%REASON%'**.",
    "**%USERNAME%** fue baneado del servidor por **'%REASON%'**.",
    "Banearon a **%USERNAME%** por **'%REASON%'**.",
    "**%USERNAME%** se fue baneado por **'%REASON%'**.",
    "Cagaron baneando a **%USERNAME%** por **'%REASON%'**.",
    "Funaron a **%USERNAME%** por **'%REASON%'**."
];

const bannedWithoutReason = [
    "**%USERNAME%** fue baneado del servidor.",
    "Banearon a **%USERNAME%**.",
    "**%USERNAME%** se fue baneado.",
    "Cagaron baneando a **%USERNAME%**.",
    "Funaron a **%USERNAME%**."
];

const unbanned = [
    "**%USERNAME%** fue desbaneado del servidor.",
    "Desbanearon a **%USERNAME%**.",
    "Le aflojaron las esposas a **%USERNAME%**.",
    "Liberaron a **%USERNAME%**."
];

const texts = {
    movies: {
        description: "Hola <@%USER_ID%>, para obtener los links usá nuevamente el comando `%PREFIX%ucm` seguido de un espacio y el número del elemento que quieras descargar.\n\nPara descargar se recomienda utilizar el gestor de descargas JDownloader 2 (https://jdownloader.org/jdownloader2).\n\nLas películas (en orden cronológico) disponibles para descargar son:\n\n",
        footer: "Por cualquier error o links caídos, por favor avisar a @StormeR."
    },
    games: {
        description: "Hola <@%USER_ID%>, para obtener los links usá nuevamente el comando `%PREFIX%juegos` seguido de un espacio y el número del juego que quieras descargar.\n\nPara descargar se recomienda utilizar el gestor de descargas JDownloader 2 (https://jdownloader.org/jdownloader2).\n\nLos juegos disponibles para descargar son:",
        footer: "Si querés sugerir algún juego para agregar o querés saber si hay nuevas actualizaciones de los juegos actuales, no dudes en hablar con @StormeR."
    }
};

const currencies = {
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
};

const smurf = {
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
};

const musicActions = {
    adding: 'ADDING',
    addingNext: 'ADDING_NEXT',
    moving: 'MOVING_SONG',
    stopping: 'STOPPING'
}

var mcuMovies;

const getMcuMovies = () => mcuMovies;

const updateMcuMovies = (filters) => {
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
};

var birthdays;

const getBirthdays = () => birthdays;

const updateBirthdays = async () => {
    await executeQuery('SELECT * FROM "bdays" ORDER BY substring("bdays_date", 4, 5), substring("bdays_date", 1, 2);').then(async json => {
        birthdays = json;
        console.log('> Caché de cumpleaños actualizado');
    }).catch(console.error);
};

var banned;

const getBanned = () => banned;

const updateBanned = async () => {
    await executeQuery('SELECT * FROM "bans";').then(async json => {
        banned = json;
        console.log('> Caché de baneados actualizado');
    }).catch(console.error);
};

var sombraBans;

const getSombraBans = () => sombraBans;

const updateSombraBans = async () => {
    await executeQuery('SELECT * FROM "sombraBans";').then(async json => {
        sombraBans = json;
        console.log('> Caché de baneos de Sombra actualizado');
    }).catch(console.error);
};

var lastDateChecked;

const getLastDateChecked = () => lastDateChecked;

const updateLastDateChecked = (newDate) => (lastDateChecked = newDate);

var reactionCollectorInfo;

const getReactionCollectorInfo = () => reactionCollectorInfo;

const updateReactionCollectorInfo = async () => {
    await executeQuery('SELECT * FROM "collectorMessage";').then(async json => {
        reactionCollectorInfo = json;
        console.log('> Caché de recolector de reacciones actualizado');
    }).catch(console.error);
}

var anniversaries;

const getAnniversaries = () => anniversaries;

const updateAnniversaries = async () => {
    await executeQuery('SELECT * FROM "anniversaries";').then(async json => {
        anniversaries = json;
        console.log('> Caché de aniversarios actualizado');
    }).catch(console.error);
}

var avatar;

const getAvatar = () => avatar;

const updateAvatar = async () => {
    await executeQuery(`SELECT * FROM "avatar";`).then(async json => {
        avatar = json;
        console.log('> Caché de avatar actualizado');
    }).catch(console.error);
}

var lastAction;

const getLastAction = () => lastAction;

const updateLastAction = (action) => (lastAction = action);

var playlists = { names: [], urls: [] };

const getPlaylists = () => playlists;

const updatePlaylists = async () => {
    await executeQuery('SELECT * FROM "playlists";').then(async json => {
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
};

module.exports = {
    prefix, categorySettings, ids, reminders, mcu, texts, currencies, smurf, welcome, goodbye,
    bannedWithReason, bannedWithoutReason, unbanned, musicActions,
    getMcuMovies, updateMcuMovies, getBirthdays, updateBirthdays, getBanned, updateBanned, getSombraBans, updateSombraBans,
    getLastDateChecked, updateLastDateChecked, getReactionCollectorInfo, updateReactionCollectorInfo,
    getAnniversaries, updateAnniversaries, getAvatar, updateAvatar, getLastAction, updateLastAction, getPlaylists, updatePlaylists
}
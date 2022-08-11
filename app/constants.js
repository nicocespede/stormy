const testing = false;

module.exports = {
    prefix: '-',

    testing,

    ids: {
        users: {
            bot: !testing ? "967139569969528923" : "853113828501225502",
            stormer: "334409923389554699",
            darkness: "479521831267598336",
            sombra: '662237023540609044',
            jimmy: '360246288349921310'
        },
        roles: {
            banear: !testing ? '872782064271917067' : '1004802478522519685',
            smurf: !testing ? "872768314689060936" : '1004802478522519683',
            funcion: !testing ? "875942757733122078" : '1004802478522519684',
            juegos: !testing ? "981291002126012456" : '1004802478556069892',
            musica: !testing ? "981291168484708392" : '1004802478556069891',
            anunciosUcm: !testing ? "981291223522357298" : '1004802478556069890',
            anunciosJuegos: !testing ? "981291298310991872" : '1004802478556069889',
            cine: !testing ? "981291579769753660" : '1004802478556069888',
            familia: !testing ? "596591726991507466" : "1004802478556069896"
        },
        guilds: {
            default: !testing ? '479523718368854027' : '1004802478522519682'
        },
        channels: {
            anuncios: !testing ? "881187176216395826" : '1004802479935991831',
            autorol: !testing ? "981294118825230366" : '1004802479399108785',
            cartelera: !testing ? "836043727616213012" : '1004802480363806773',
            welcome: !testing ? "817149994959110235" : "1004802479399108784",
            members: !testing ? "980905383008804914" : "1004802479399108781",
            connectedMembers: !testing ? "981245429679259688" : "1004802479399108782",
            afk: "585276720622338048",
            musica: !testing ? [
                "703055406091468922", //musica
                "853926878498521089" //test
            ] : ['1004802479935991832']
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
            description: "Hola <@%USER_ID%>, para obtener los links usá nuevamente el comando `%PREFIX%ucm` seguido de un espacio y el número del elemento que quieras descargar.\n\nPara descargar se recomienda utilizar el gestor de descargas JDownloader 2 (https://jdownloader.org/jdownloader2).\n\nPor cualquier error o links caídos, por favor avisar a @StormeR.\n\nLas películas (en orden cronológico) disponibles para descargar son:\n\n"
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

    musicActions: {
        ADDING: 'ADDING',
        ADDING_NEXT: 'ADDING_NEXT',
        BEING_KICKED: 'BEING_KICKED',
        CHANGING_CHANNEL: 'CHANGING_CHANNEL',
        ENDING: 'ENDING',
        LEAVING_EMPTY_CHANNEL: 'LEAVING_EMPTY_CHANNEL',
        MOVING_SONG: 'MOVING_SONG',
        RESTARTING: 'RESTARTING',
        STARTING_TRACK: 'STARTING_TRACK',
        STOPPING: 'STOPPING'
    },

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

    relativeSpecialDays: {
        easter: 17
    },

    mcu: [
        {
            name: "Captain America: The First Avenger (2011)",
            type: "Película",
            lastUpdate: {
                '4K': "11/01/2022",
                '1080p': "11/01/2022"
            },
            thumbURL: "captain-america.png"
        },
        {
            name: "Agent Carter Season 1 (2015)",
            type: "Serie",
            lastUpdate: { '1080p': "11/01/2022" },
            thumbURL: "agent-carter.png"
        },
        {
            name: "Agent Carter Season 2 (2016)",
            type: "Serie",
            lastUpdate: { '1080p': "11/01/2022" },
            thumbURL: "agent-carter.png"
        },
        {
            name: "Agent Carter (2013)",
            type: "Cortometraje",
            lastUpdate: { '1080p': "01/03/2022" },
            thumbURL: "agent-carter.png"
        },
        {
            name: "Captain Marvel (2019)",
            type: "Película",
            lastUpdate: {
                '3D': "11/01/2022",
                '4K': "11/01/2022",
                '1080p': "11/01/2022"
            },
            thumbURL: "captain-marvel.png"
        },
        {
            name: "Iron Man (2008)",
            type: "Película",
            lastUpdate: {
                '4K': "11/01/2022",
                '1080p': "11/01/2022"
            },
            thumbURL: "iron-man.png"
        },
        {
            name: "Iron Man 2 (2010)",
            type: "Película",
            lastUpdate: {
                '4K': "12/01/2022",
                '1080p': "11/01/2022"
            },
            thumbURL: "iron-man.png"
        },
        {
            name: "The Incredible Hulk (2008)",
            type: "Película",
            lastUpdate: {
                '4K': "11/01/2022",
                '1080p': "11/01/2022"
            },
            thumbURL: "hulk.png"
        },
        {
            name: "The Consultant (2011)",
            type: "Cortometraje",
            lastUpdate: { '1080p': "01/03/2022" },
            thumbURL: "agents-of-shield.png"
        },
        {
            name: "A Funny Thing Happened On The Way To Thor's Hammer (2011)",
            type: "Cortometraje",
            lastUpdate: { '1080p': "01/03/2022" },
            thumbURL: "agents-of-shield.png"
        },
        {
            name: "Thor (2011)",
            type: "Película",
            lastUpdate: {
                '4K': "11/01/2022",
                '1080p': "11/01/2022"
            },
            thumbURL: "thor.png"
        },
        {
            name: "Avengers (2012)",
            type: "Película",
            lastUpdate: {
                '4K': "11/01/2022",
                '1080p': "11/01/2022"
            },
            thumbURL: "avengers.png"
        },
        {
            name: "Item 47 (2012)",
            type: "Cortometraje",
            lastUpdate: { '1080p': "01/03/2022" },
            thumbURL: "agents-of-shield.png"
        },
        {
            name: "Thor: The Dark World (2013)",
            type: "Película",
            lastUpdate: {
                '3D': "11/01/2022",
                '4K': "11/01/2022",
                '1080p': "11/01/2022"
            },
            thumbURL: "thor.png"
        },
        {
            name: "Iron Man 3 (2013)",
            type: "Película",
            lastUpdate: {
                '4K': "11/01/2022",
                '1080p': "11/01/2022"
            },
            thumbURL: "iron-man.png"
        },
        {
            name: "All Hail The King (2014)",
            type: "Cortometraje",
            lastUpdate: { '1080p': "01/03/2022" },
            thumbURL: "agents-of-shield.png"
        },
        {
            name: "Captain America: The Winter Soldier (2014)",
            type: "Película",
            lastUpdate: {
                '4K': "22/01/2022",
                '1080p': "11/01/2022"
            },
            thumbURL: "captain-america.png"
        },
        {
            name: "Agents of S.H.I.E.L.D. Season 1 (2013)",
            type: "Serie",
            lastUpdate: { '720p': "11/01/2022" },
            thumbURL: "agents-of-shield.png"
        },
        {
            name: "Guardians Of The Galaxy (2014)",
            type: "Película",
            lastUpdate: {
                '3D': "11/01/2022",
                '1080p': "11/01/2022"
            },
            thumbURL: "guardians-of-the-galaxy.png"
        },
        {
            name: "Guardians Of The Galaxy Vol. 2 (2017)",
            type: "Película",
            lastUpdate: {
                '3D': "11/01/2022",
                '4K': "11/01/2022",
                '1080p': "11/01/2022"
            },
            thumbURL: "guardians-of-the-galaxy.png"
        },
        {
            name: "I Am Groot (2022)",
            type: "Miniserie",
            lastUpdate: { '1080p': "11/08/2022" },
            thumbURL: "guardians-of-the-galaxy.png"
        },
        {
            name: "Daredevil Season 1 (2015)",
            type: "Serie",
            lastUpdate: { '720p': "12/01/2022" },
            thumbURL: "daredevil.png"
        },
        {
            name: "Jessica Jones Season 1 (2015)",
            type: "Serie",
            lastUpdate: { '720p': "12/01/2022" },
            thumbURL: "jessica-jones.png"
        },
        {
            name: "Avengers: Age Of Ultron (2015)",
            type: "Película",
            lastUpdate: {
                '3D': "12/01/2022",
                '4K': "12/01/2022",
                '1080p': "12/01/2022"
            },
            thumbURL: "avengers.png"
        },
        {
            name: "Agents of S.H.I.E.L.D. Season 2 (2015)",
            type: "Serie",
            lastUpdate: { '720p': "12/01/2022" },
            thumbURL: "agents-of-shield.png"
        },
        {
            name: "Ant-Man (2015)",
            type: "Película",
            lastUpdate: {
                '3D': "12/01/2022",
                '4K': "12/01/2022",
                '1080p': "12/01/2022"
            },
            thumbURL: "ant-man.png"
        },
        {
            name: "Daredevil Season 2 (2016)",
            type: "Serie",
            lastUpdate: { '720p': "12/01/2022" },
            thumbURL: "daredevil.png"
        },
        {
            name: "Luke Cage Season 1 (2016)",
            type: "Serie",
            lastUpdate: { '720p': "12/01/2022" },
            thumbURL: "luke-cage.png"
        },
        {
            name: "Cloak and Dagger Season 1 (2018)",
            type: "Serie",
            lastUpdate: { '720p': "12/01/2022" },
            thumbURL: "cloak-and-dagger.png"
        },
        {
            name: "Cloak and Dagger Season 2 (2019)",
            type: "Serie",
            lastUpdate: { '720p': "12/01/2022" },
            thumbURL: "cloak-and-dagger.png"
        },
        {
            name: "Iron Fist Season 1 (2017)",
            type: "Serie",
            lastUpdate: { '720p': "12/01/2022" },
            thumbURL: "iron-fist.png"
        },
        {
            name: "Captain America: Civil War (2016)",
            type: "Película",
            lastUpdate: {
                '3D': "12/01/2022",
                '4K': "22/01/2022",
                '1080p': "12/01/2022"
            },
            thumbURL: "captain-america.png"
        },
        {
            name: "Black Widow (2021)",
            type: "Película",
            lastUpdate: {
                '3D': "12/01/2022",
                '4K': "12/01/2022",
                '1080p': "12/01/2022"
            },
            thumbURL: "black-widow.png"
        },
        {
            name: "Black Panther (2018)",
            type: "Película",
            lastUpdate: {
                '3D': "12/01/2022",
                '4K': "12/01/2022",
                '1080p': "12/01/2022"
            },
            thumbURL: "black-panther.png"
        },
        {
            name: "Agents of S.H.I.E.L.D. Season 3 (2015)",
            type: "Serie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "agents-of-shield.png"
        },
        {
            name: "Inhumans Season 1 (2017)",
            type: "Serie",
            lastUpdate: { '1080p': "13/01/2022" },
            thumbURL: "inhumans.png"
        },
        {
            name: "The Defenders Season 1 (2017)",
            type: "Serie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "the-defenders.png"
        },
        {
            name: "Spider-Man: Homecoming (2017)",
            type: "Película",
            lastUpdate: {
                '3D': "13/01/2022",
                '4K': "13/01/2022",
                '1080p': "13/01/2022"
            },
            thumbURL: "spiderman.png"
        },
        {
            name: "The Punisher Season 1 (2017)",
            type: "Serie",
            lastUpdate: { '1080p': "13/01/2022" },
            thumbURL: "the-punisher.png"
        },
        {
            name: "Jessica Jones Season 2 (2018)",
            type: "Serie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "jessica-jones.png"
        },
        {
            name: "Luke Cage Season 2 (2018)",
            type: "Serie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "luke-cage.png"
        },
        {
            name: "Runaways Season 1 (2017)",
            type: "Serie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "runaways.png"
        },
        {
            name: "Runaways Season 2 (2018)",
            type: "Serie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "runaways.png"
        },
        {
            name: "Iron Fist Season 2 (2018)",
            type: "Serie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "iron-fist.png"
        },
        {
            name: "Daredevil Season 3 (2018)",
            type: "Serie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "daredevil.png"
        },
        {
            name: "The Punisher Season 2 (2019)",
            type: "Serie",
            lastUpdate: { '1080p': "13/01/2022" },
            thumbURL: "the-punisher.png"
        },
        {
            name: "Jessica Jones Season 3 (2019)",
            type: "Serie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "jessica-jones.png"
        },
        {
            name: "Doctor Strange (2016)",
            type: "Película",
            lastUpdate: {
                '3D': "13/01/2022",
                '4K': "13/01/2022",
                '1080p': "13/01/2022"
            },
            thumbURL: "doctor-strange.png"
        },
        {
            name: "Agents of S.H.I.E.L.D. Slingshot (2016)",
            type: "Miniserie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "agents-of-shield.png"
        },
        {
            name: "Thor: Ragnarok (2017)",
            type: "Película",
            lastUpdate: {
                '3D': "13/01/2022",
                '4K': "13/01/2022",
                '1080p': "13/01/2022"
            },
            thumbURL: "thor.png"
        },
        {
            name: "Ant-Man and the Wasp (2018)",
            type: "Película",
            lastUpdate: {
                '3D': "13/01/2022",
                '4K': "13/01/2022",
                '1080p': "13/01/2022"
            },
            thumbURL: "ant-man.png"
        },
        {
            name: "Agents of S.H.I.E.L.D. Season 4 (2016)",
            type: "Serie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "agents-of-shield.png"
        },
        {
            name: "Agents of S.H.I.E.L.D. Season 5 (2017)",
            type: "Serie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "agents-of-shield.png"
        },
        {
            name: "Avengers: Infinity War (2018)",
            type: "Película",
            lastUpdate: {
                '3D': "13/01/2022",
                '4K': "13/01/2022",
                '1080p': "13/01/2022"
            },
            thumbURL: "avengers.png"
        },
        {
            name: "Agents of S.H.I.E.L.D. Season 6 (2019)",
            type: "Serie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "agents-of-shield.png"
        },
        {
            name: "Agents of S.H.I.E.L.D. Season 7 (2020)",
            type: "Serie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "agents-of-shield.png"
        },
        {
            name: "Runaways Season 3 (2018)",
            type: "Serie",
            lastUpdate: { '720p': "13/01/2022" },
            thumbURL: "runaways.png"
        },
        {
            name: "Avengers: Endgame (2019)",
            type: "Película",
            lastUpdate: {
                '3D': "13/01/2022",
                '4K': "13/01/2022",
                '1080p': "13/01/2022"
            },
            thumbURL: "avengers.png"
        },
        {
            name: "Eternals (2021)",
            type: "Película",
            lastUpdate: {
                '4K': "13/01/2022",
                '1080p': "13/01/2022"
            },
            thumbURL: "eternals.png"
        },
        {
            name: "Loki Season 1 (2021)",
            type: "Serie",
            lastUpdate: {
                '4K': "13/01/2022",
                '1080p': "13/01/2022"
            },
            thumbURL: "loki.png"
        },
        {
            name: "What If...? Season 1 (2021)",
            type: "Serie",
            lastUpdate: {
                '4K': "13/01/2022",
                '1080p': "13/01/2022"
            },
            thumbURL: "what-if.png"
        },
        {
            name: "WandaVision Season 1 (2021)",
            type: "Serie",
            lastUpdate: { '1080p': "13/01/2022" },
            thumbURL: "scarlet-witch.png"
        },
        {
            name: "Shang-Chi and the Legend of the Ten Rings (2021)",
            type: "Película",
            lastUpdate: {
                '4K': "14/01/2022",
                '1080p': "14/01/2022"
            },
            thumbURL: "shang-chi.png"
        },
        {
            name: "The Falcon And The Winter Soldier Season 1 (2021)",
            type: "Serie",
            lastUpdate: { '1080p': "13/01/2022" },
            thumbURL: "falcon.png"
        },
        {
            name: "Helstrom Season 1 (2020)",
            type: "Serie",
            lastUpdate: { '1080p': "14/01/2022" },
            thumbURL: "helstrom.png"
        },
        {
            name: "Spider-Man (2002)",
            type: "Película",
            lastUpdate: {
                '4K': "14/01/2022",
                '1080p': "14/01/2022"
            },
            thumbURL: "spiderman.png"
        },
        {
            name: "Spider-Man 2 (2004)",
            type: "Película",
            lastUpdate: {
                '4K': "14/01/2022",
                '1080p': "14/01/2022"
            },
            thumbURL: "spiderman.png"
        },
        {
            name: "Spider-Man 3 (2007)",
            type: "Película",
            lastUpdate: {
                '4K': "14/01/2022",
                '1080p': "14/01/2022"
            },
            thumbURL: "spiderman.png"
        },
        {
            name: "The Amazing Spider-Man (2012)",
            type: "Película",
            lastUpdate: {
                '4K': "22/01/2022",
                '1080p': "14/01/2022"
            },
            thumbURL: "spiderman.png"
        },
        {
            name: "The Amazing Spider-Man 2 (2014)",
            type: "Película",
            lastUpdate: {
                '3D': "14/01/2022",
                '4K': "22/01/2022",
                '1080p': "14/01/2022"
            },
            thumbURL: "spiderman.png"
        },
        {
            name: "Venom (2018)",
            type: "Película",
            lastUpdate: {
                '3D': "14/01/2022",
                '4K': "14/01/2022",
                '1080p': "14/01/2022"
            },
            thumbURL: "venom.png"
        },
        {
            name: "Venom: Let There Be Carnage (2021)",
            type: "Película",
            lastUpdate: {
                '4K': "14/01/2022",
                '1080p': "14/01/2022"
            },
            thumbURL: "venom.png"
        },
        {
            name: "Spider-Man: Far From Home (2019)",
            type: "Película",
            lastUpdate: {
                '3D': "14/01/2022",
                '4K': "25/04/2022",
                '1080p': "14/01/2022"
            },
            thumbURL: "spiderman.png"
        },
        {
            name: "Spider-Man: No Way Home (2021)",
            type: "Película",
            lastUpdate: {
                '4K': "02/05/2022",
                '1080p': "12/03/2022"
            },
            thumbURL: "spiderman.png"
        },
        {
            name: "Morbius (2022)",
            type: "Película",
            lastUpdate: {
                '4K': "16/05/2022",
                '1080p': "04/07/2022"
            },
            thumbURL: "morbius.png"
        },
        {
            name: "Doctor Strange In The Multiverse Of Madness (2022)",
            type: "Película",
            lastUpdate: {
                '4K': "22/06/2022",
                '1080p': "22/06/2022"
            },
            thumbURL: "doctor-strange.png"
        },
        {
            name: "Hawkeye Season 1 (2021)",
            type: "Serie",
            lastUpdate: {
                '4K': "14/01/2022",
                '1080p': "14/01/2022"
            },
            thumbURL: "hawkeye.png"
        },
        {
            name: "Moon Knight Season 1 (2022)",
            type: "Serie",
            lastUpdate: {
                '4K': "13/05/2022",
                '1080p': "13/05/2022"
            },
            thumbURL: "moon-knight.png"
        },
        {
            name: "Ms. Marvel Season 1 (2022)",
            type: "Serie",
            lastUpdate: { '1080p': "10/08/2022" },
            updateInfo: "subida la serie completa",
            thumbURL: "ms-marvel.png"
        }
    ],

    quiz: [{
        question: '¿Cómo se llama el primer arma que empuñó _Thor_?',
        answers: ['mjolnir', 'mjølnir'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/7/79/Mavengersfilmstillsgh35.jpg'
    },
    {
        question: '¿Cómo se llama el arma de _Thor_ forjada en _Nidavellir_ en _Avengers: Infinity War_?',
        answers: ['rompetormentas', 'stormbreaker'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/1/17/Stormbreaker_-_IW.png'
    },
    {
        question: '¿Cómo se llama el objeto que contenía a la _Gema del Espacio_?',
        answers: ['teseracto'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/8/86/Tesseract_%282012%29.png'
    },
    {
        question: '¿Cómo se llama el objeto que contenía a la _Gema de la Mente_?',
        answers: ['cetro', 'cetro de loki'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/1/17/Scepter_Main.jpg'
    },
    {
        question: '¿Cómo se llama el objeto que contenía a la _Gema del Poder_?',
        answers: ['orbe'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/7/7d/Guardians_Of_The_Galaxy_NOM0910_comp_v037.1043.jpg'
    },
    {
        question: '¿Cómo se llama el objeto que contenía a la _Gema del Tiempo_?',
        answers: ['ojo de agamotto'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/e/ee/Eye_of_Agamotto_Hong_Kong.png'
    },
    {
        question: '¿Cómo se llama el fluido que contenía a la _Gema de la Realidad_?',
        answers: ['éter', 'eter'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/b/b5/Aether_AAoU.png'
    },
    {
        question: '¿Cómo se llama el planeta donde se encontraba la _Gema del Alma_?',
        answers: ['vormir'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/f/fb/Hawkeye_Soul_Stone_4.png'
    },
    {
        question: '¿Cuál es el apodo de villano de _Johann Schmidt_?',
        answers: ['red skull', 'craneo rojo', 'cráneo rojo'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/9/94/In_Hitler%27s_shadow.jpg'
    },
    {
        question: '¿Cómo se llama la organización enemiga de _S.H.I.E.L.D._ antes liderada por _Johann Schmidt_?',
        answers: ['hydra'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/8/82/Hydra_logo.png'
    },
    {
        question: '¿Cuál es el nombre real del _Capitán América_?',
        answers: ['steven rogers', 'steve rogers', 'steven grant rogers'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/0/04/VWtqiP0.jpg'
    },
    {
        question: '¿Cuál es el apellido de _Thor_?',
        answers: ['odinson'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/5/59/08054_thorcelebutopia_122_846lo.jpg'
    },
    {
        question: '¿Cuál es el nombre de pila de la agente _"Peggy" Carter_?',
        answers: ['margaret'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/2/28/Peggy_Hat_AC.png'
    },
    {
        question: '¿Quién es el padre de _Elizabeth "Betty" Ross_?',
        answers: ['thaddeus ross', 'general ross', 'secretario ross'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/9/95/RossFamilyStandOff.jpg'
    },
    {
        question: '¿Cómo se llama la ciudad que ataca _Ultrón_ en _Avengers: Age of Ultron_?',
        answers: ['sokovia'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/8/82/ShcKzBOU6-U-1-.jpg'
    },
    {
        question: '¿En qué distrito de la ciudad de Nueva York nació _Steve Rogers_?',
        answers: ['brooklyn'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/a/a5/1899560-the_chris_evans_blog_090711_028.jpg'
    },
    {
        question: '¿En qué distrito de la ciudad de Nueva York nació _Peter Parker_?',
        answers: ['queens'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/4/43/PeterParker-DiscussingPowers-CACW.jpg'
    },
    {
        question: '¿De qué planeta es originario _Loki_?',
        answers: ['jotunheim'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/2/20/LokiArrivesOnJotunheim.jpg'
    },
    {
        question: '¿Cómo se llamaba el reino que gobernaba el _Padre de Todo_, _Odín_?',
        answers: ['asgard'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/2/26/AsgardFull.jpg'
    },
    {
        question: '¿Cómo se llama el demonio responsable de la destrucción de _Asgard_ en _Thor: Ragnarok_?',
        answers: ['surtur'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/9/97/Surtur_Destroys_Asgard.png'
    },
    {
        question: '¿Cuál es el nombre de la especie que conformaba el ejército de _Loki_ en la invasión a Nueva York?',
        answers: ['chitauri'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/6/6c/Chitauri.png'
    },
    {
        question: '¿Cuál era el nombre de pila del hermano de _Wanda Maximoff_, muerto en la batalla de _Sokovia_?',
        answers: ['pietro'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/a/a0/Quicksilver-ScarletWitch-Church-AAoU.jpg'
    },
    {
        question: '¿Cuál era el nombre del padre de _Tony Stark_?',
        answers: ['howard stark', 'howard anthony walter stark'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/d/d9/1989_Howard_Stark.png'
    },
    {
        question: '¿Cuál es el apodo por el que se lo conoce a _Taneleer Tivan_?',
        answers: ['coleccionista', 'el coleccionista'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/d/d8/Normal_thor-darkworld_5351.jpg'
    },
    {
        question: '¿En qué año ocurre el evento denominado como _"Chasquido"_?',
        answers: ['2018'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/2/2e/ThanosSnaps.png'
    },
    {
        question: '¿En qué año ocurre el evento denominado como _"Blip"_?',
        answers: ['2023'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/4/42/HulkSnaps.png'
    },
    {
        question: '¿De qué especie es _Thanos_?',
        answers: ['titán', 'titan'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/9/9c/M0txz49p0kw01.jpg'
    },
    {
        question: '¿Cuál es el nombre del padre de _Peter Quill_?',
        answers: ['ego'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/9/96/Guardians2-movie-screencaps_com-9468.jpg'
    },
    {
        question: '¿Cómo se llama el celestial al que obedecían los _Eternos_?',
        answers: ['arishem'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/a/a5/The_Judge.jpg'
    },
    {
        question: '¿Cómo se llamaba la raza de criaturas que combatían los _Eternos_?',
        answers: ['desviantes', 'los desviantes'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/2/26/Eternals_Enkidu.png'
    },
    {
        question: '¿Cuál era el nombre de pila de la primogénita de _Odín_, conocida como la _Diosa de la Muerte_?',
        answers: ['hela'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/6/6a/HelaOdin-RulingNineRealms-Painting.jpg'
    },
    {
        question: "¿Cuál era el apodo de villano de _Erik Stevens (N'Jadaka)_, enemigo de _Pantera Negra_?",
        answers: ['killmonger'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/3/3d/BP_EW_12.jpg'
    },
    {
        question: "¿Cuál era el nombre del terrorista interpretado por _Trevor Slattery_?",
        answers: ['el mandarín', 'mandarín', 'el mandarin', 'mandarin'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/3/3b/Mandarin_big.jpg'
    },
    {
        question: "¿Cuál era el nombre de pila de _Tony Stark_?",
        answers: ['anthony'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/f/f4/TStark-Glasses-Shopping.jpg'
    },
    {
        question: "¿Quién es el responsable de la muerte del _agente Coulson_?",
        answers: ['loki'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/9/95/CoulsonOnlyMostlyDead-Avengers.png'
    },
    {
        question: "¿Cuántos fueron los _Eternos_ enviados a la Tierra?",
        answers: ['10', 'diez'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/2/26/Eternal_Endoskeletons.jpg'
    },
    {
        question: "¿De qué material está hecho el escudo del _Capitán América_?",
        answers: ['vibranio', 'vibranium'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/e/ed/Dropped_Shield.png'
    },
    {
        question: "¿Quién fue el responsable de la muerte del padre de _Tony Stark_?",
        answers: ['bucky', 'bucky barnes', 'soldado del invierno', 'winter soldier', 'el soldado del invierno'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/c/c8/WinterSoldier-AttackingStarkCar.jpg'
    },
    {
        question: "¿Cómo se llama la aldea ubicada en otra dimensión, protegida por la _Gran Protectora_?",
        answers: ['ta lo'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/3/38/TA_LO.png'
    },
    {
        question: "¿Cuál es el apodo de villano por el que se conoce a _Adrian Toomes_?",
        answers: ['buitre', 'el buitre'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/4/4c/AToomes-UpgradingSuit-SMH.jpg'
    },
    {
        question: "¿Cuál es el nombre real de la _Capitana Marvel_?",
        answers: ['carol danvers'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/9/92/Captain_Marvel_%28film%29_54.jpg'
    },
    {
        question: "¿Qué especie raptó a _Carol Danvers_ y la convirtió en su soldado?",
        answers: ['kree', 'los kree'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/8/8f/Captain_Marvel_%28film%29_61.jpg'
    },
    {
        question: "¿Cómo se llamaba el _Kree_ reclutado por _Thanos_ para obtener el _Orbe_?",
        answers: ['ronan', 'ronan el acusador'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/5/52/RonanAngry-GOTG.png'
    },
    {
        question: "¿A qué especie pertenecía _Ronan el Acusador_?",
        answers: ['kree'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/7/78/Ronan.jpg'
    },
    {
        question: "¿Cuál es el nombre de pila de la hermana adoptiva de _Natasha Romanoff_?",
        answers: ['yelena'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/5/5d/Natasha_and_Yelena_-_BlackWidow.jpg'
    },
    {
        question: "¿Bajo qué alias exterminaba organizaciones criminales _Clint Barton_?",
        answers: ['ronin'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/e/e5/58410836_420869452085371_3652356105884827001_n.jpg'
    },
    {
        question: "¿Cuántos eran los _Vengadores_ originales?",
        answers: ['6', 'seis'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/e/ee/%27%27Everyone_is_here%27%27.png'
    },
    {
        question: "¿Cuántas son las _Gemas del Infinito_?",
        answers: ['6', 'seis'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/2/23/Random_paperweights_with_no_importance.png'
    },
    {
        question: "¿Quién fue el responsable de que _Rhodey_ quedara casi parapléjico?",
        answers: ['vision', 'visión'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/1/19/Captain_America_Civil_War_76.png'
    },
    {
        question: '¿Bajo qué alias _"Bucky" Barnes_ completaba misiones para _HYDRA_?',
        answers: ['soldado del invierno', 'winter soldier'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/5/57/Captain_America_Civil_War_86.png'
    },
    {
        question: "¿Cómo se llama el reino de donde es originario _T'Challa (Pantera Negra)_?",
        answers: ['wakanda'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/1/11/Wakanda_CW_HD.png'
    },
    {
        question: "¿Qué tipo de radiación es la que dio origen a _Hulk_?",
        answers: ['radiacion gamma', 'radiación gamma', 'rayos gamma', 'gamma'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/f/fc/Bruce_transforms_TIH.jpg'
    },
    {
        question: "¿Cómo se llamaba el guardián del _Puente Bifrost_?",
        answers: ['heimdall'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/d/d1/HeimdallWatches_image.png'
    },
    {
        question: "¿Cómo se llamaba el líder de los _Elfos Oscuros_?",
        answers: ['malekith'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/4/4b/Malekith_white_face.jpg'
    },
    {
        question: "¿Cuál es el apodo de _Harold Hogan_, guardaespaldas y chofer de _Tony Stark_?",
        answers: ['happy'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/1/19/Filmz.ru_f_16815.jpg'
    },
    {
        question: "¿Cuál es el apodo de justiciero de _Matt Murdock_?",
        answers: ['daredevil'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/e/e0/Matt_Murdock_NWH.png'
    },
    {
        question: "¿Cuál es el nombre del padre de _Loki_?",
        answers: ['laufey'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/d/d7/Laufey-Loki-IAccept.jpg'
    },
    {
        question: '¿Cuál es el nombre de pila de _"Nick"_ Fury?',
        answers: ['nicholas'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/6/61/Photo6jl.jpg'
    },
    {
        question: '¿Cómo se llama la primer inteligencia artificial creada por _Tony Stark_?',
        answers: ['j.a.r.v.i.s.', 'jarvis'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/8/88/Ibelieveitsworthago.png'
    },
    {
        question: '¿Cómo se llama la exposición tecnológica creada por _Howard Stark_?',
        answers: ['stark expo'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/6/63/Stark_Expo.png'
    },
    {
        question: '¿Cuál es el apodo de _Virginia Potts_, pareja de _Tony Stark_?',
        answers: ['pepper'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/5/56/Infinity_War_207.jpg'
    },
    {
        question: '¿Cómo se llama el reino al que entra _Ant-Man_ cuando se hace subatómico?',
        answers: ['cuántico', 'cuantico', 'reino cuántico', 'reino cuantico'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/b/b1/Ant-Man_Quantum_Realm.png'
    },
    {
        question: '¿Cómo se llamaba lo que le inyectaban a los soldados de _A.I.M._ que luego los hacía explotar?',
        answers: ['extremis'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/6/60/Taggart.jpg'
    },
    {
        question: '¿Cómo se llama el monstruo en el que se convierte _Emil Blonsky_ luego de inyectarse la sangre de _Banner_?',
        answers: ['abominación', 'abominacion'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/c/c9/BlonskyTransformation-TIH.png'
    },
    {
        question: '¿En qué ciudad latinoamericana se esconde _Bruce Banner_ para evitar tener incidentes?',
        answers: ['río de janeiro', 'rio de janeiro'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/3/35/Meditating.jpg'
    },
    {
        question: '¿Qué construye _Tony Stark_ para mantener alejada la metralla de su corazón?',
        answers: ['reactor arc'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/f/f5/Stark_Vest.png'
    },
    {
        question: '¿Cómo se llama el grupo de androides creados por _Tony Stark_ para proteger a los civiles?',
        answers: ['la legión de hierro', 'la legion de hierro', 'legion de hierro', 'legión de hierro'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/b/bf/Iron_Legion_Bot_1.png'
    },
    {
        question: '¿Cuál es el apodo por el que se conoce a la armadura _Mark XLIV_ de _Iron Man_?',
        answers: ['hulkbuster'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/0/07/Hulk_and_Hulkbuster_Punch.jpg'
    },
    {
        question: '¿Cuál es el apodo de villano de _Quentin Beck_?',
        answers: ['mysterio', 'misterio'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/a/ac/QBeckSeesPParkerWithTheProjector.jpg'
    },
    {
        question: '¿Cómo se llamaba la inteligencia artificial que le deja _Tony Stark_ a _Peter Parker_ en un par de gafas?',
        answers: ['e.d.i.t.h.', 'edith'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/7/76/Far_From_Home_64.jpg'
    },
    {
        question: '¿Qué gema tiene _Visión_ en su frente?',
        answers: ['gema de la mente', 'mente', 'de la mente'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/6/60/Vision_%28Removing_the_Mind_Stone%29.png'
    },
    {
        question: '¿Quién fue la responsable de que _Thor_ perdiera un ojo?',
        answers: ['hela'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/5/56/Screen_Shot_2018-02-24_at_20.23.05.jpg'
    },
    {
        question: '¿Qué _Gema del infinito_ les otorgó los poderes a los hermanos _Maximoff_?',
        answers: ['mente', 'gema de la mente'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/7/73/Twins_AOU.jpg'
    },
    {
        question: '¿Qué _Gema del infinito_ tiene _Visión_ en su frente?',
        answers: ['mente', 'gema de la mente'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/6/64/-4XspK7MzJc-1-.jpg'
    },
    {
        question: '¿Por qué apodo se lo conoce a _Uatu_, quien observa el multiverso desde el _Nexo de Todas las Realidades_?',
        answers: ['el vigilante', 'vigilante'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/f/fa/Uatu_%28The_Watcher%29_watching_Phil_Coulson.jpg'
    },
    {
        question: '¿Cuál es el nombre de pila de la variante de _Loki_ que buscaba venganza contra la _AVT_?',
        answers: ['sylvie'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/b/b1/Sylvie_and_fire_1x1.png'
    },
    {
        question: '¿Qué significa la sigla _AVT_?',
        answers: ['autoridad de variacion temporal', 'autoridad de variación temporal'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/0/02/TimeVarianceAuthorityLogo.png'
    },
    {
        question: '¿Cuáles eran los nombres de pila de los hijos mellizos de _Wanda_ y _Visión_ dentro del _Hex_?',
        answers: ['tommy y billy', 'billy y tommy'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/5/5e/Tommy_%26_Billy_%28Age_10%29.png'
    },
    {
        question: '¿Quién fue el responsable de que _Quill_ se convirtiera en _Star-Lord_?',
        answers: ['yondu', 'yondu udonta'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/e/ea/Milano_on_Eath.png'
    },
    {
        question: '¿Con qué apodo se lo conoce al principal enemigo de _Daredevil_, también enfrentado por _Kate Bishop_ más tarde?',
        answers: ['kingpin'],
        file: 'https://static.wikia.nocookie.net/marvelcinematicuniverse/images/7/72/Rabbit_05.jpg'
    }],

    games: [{
        name: 'Beyond: Two Souls (2020)',
        version: '',
        lastUpdate: '27/03/2022',
        imageURL: 'https://cdn.cloudflare.steamstatic.com/steam/apps/960990/header.jpg'
    }, {
        name: 'Green Hell (2019)',
        version: 'V0.11.4',
        lastUpdate: '23/11/2021',
        imageURL: 'https://cdn.cloudflare.steamstatic.com/steam/apps/815370/header.jpg'
    }, {
        name: 'Grounded (2020)',
        version: '',
        lastUpdate: '23/11/2021',
        imageURL: 'https://cdn.cloudflare.steamstatic.com/steam/apps/962130/header.jpg'
    }, {
        name: 'Left 4 Dead 2 (2009)',
        version: 'V23.02.2022',
        lastUpdate: '30/05/2022',
        imageURL: 'https://cdn.cloudflare.steamstatic.com/steam/apps/550/header.jpg'
    }, {
        name: "Marvel's Avengers (2020)",
        version: 'V24.2206.160.0',
        lastUpdate: '13/07/2022',
        imageURL: 'https://cdn.cloudflare.steamstatic.com/steam/apps/997070/header.jpg'
    }, {
        name: 'Phasmophobia (2020)',
        version: 'V0.5.1.0',
        lastUpdate: '30/12/2021',
        imageURL: 'https://cdn.cloudflare.steamstatic.com/steam/apps/739630/header.jpg'
    }, {
        name: 'Pummel Party (2018)',
        version: 'V1.11.2f',
        lastUpdate: '23/11/2021',
        imageURL: 'https://cdn.cloudflare.steamstatic.com/steam/apps/880940/header.jpg'
    }, {
        name: 'Stranded Deep (2015)',
        version: 'V0.90.11',
        lastUpdate: '20/07/2022',
        imageURL: 'https://cdn.cloudflare.steamstatic.com/steam/apps/313120/header.jpg'
    }, {
        name: 'Stray (2022)',
        version: 'V1.4.227',
        lastUpdate: '04/08/2022',
        imageURL: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1332010/header.jpg'
    }, {
        name: 'Subsistence (2016)',
        version: 'ALPHA 57',
        lastUpdate: '03/11/2021',
        imageURL: 'https://cdn.cloudflare.steamstatic.com/steam/apps/418030/header.jpg'
    }, {
        name: 'SUPERHOT (2016)',
        version: 'V1.0.17_005 + L1.1.10 GOG',
        lastUpdate: '04/07/2022',
        imageURL: 'https://cdn.cloudflare.steamstatic.com/steam/apps/322500/header.jpg'
    }, {
        name: 'Superliminal (2020)',
        version: 'V24.11.2021',
        lastUpdate: '23/11/2021',
        imageURL: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1049410/header.jpg'
    }, {
        name: 'The Forest (2018)',
        version: 'V1.12',
        lastUpdate: '28/07/2021',
        imageURL: 'https://cdn.cloudflare.steamstatic.com/steam/apps/242760/header.jpg'
    }]
}
const { InteractionCollector, Message } = require("discord.js");

/** 
 * @typedef {{birth: String, club: String, goals?: Number, name: String, nationality: String, picture: String, position: String, rating: Number }} Player
 * @typedef {{color: Number[], emblem: String, flag: String, name: String, players: Number}} Team
 * 
 * @typedef {{[key: String]: Player}} PlayersData
 * @typedef {{[key: String]: Team}} TeamsData
 * @typedef {{[key: String]: String}} PositionsData
 * @typedef {{[key: String]: String}} AchievementsData
 * 
 * @typedef {{players: PlayersData, teams: TeamsData, positions: PositionsData, achievements: AchievementsData}} FWCData
 * 
 * @typedef {{_id: String, achievements: String[], trades: Number, lastOpened: {date: Date, content: String[]}, owned: String[], repeated: String[], timeout: Date}} Collector
 * @typedef {Collector[]} CollectorsData
 * 
 * @typedef {{[key: String]: Date}} TimestampsData
 * 
 * @typedef {{seconds: Number, minutes: Number, hours: Number, days: Number}} Stat
 * @typedef {{[key: String]: Stat}} StatsData
 * 
 * @typedef {{[key: String]: String, musica: String[]}} ChannelsIDsCategory
 * @typedef {{[key: String]: String, mcuCharacters: EmojisIDsCategory}} EmojisIDsCategory
 * @typedef {{[key: String]: String}} GuildsIDsCategory
 * @typedef {{[key: String]: String}} RolesIDsCategory
 * @typedef {{[key: String]: String}} UsersIDsCategory
 * @typedef {{channels: ChannelsIDsCategory, emojis: EmojisIDsCategory, guilds: GuildsIDsCategory, roles: RolesIDsCategory, users: UsersIDsCategory}} IDsData
 * 
 * @typedef {{color?: Number[], imageURL: String, lastUpdated?: Date, name: String, price?: Number}} Currency
 * @typedef {{color?: Number[], id?: String, image?: {large: String} localization?: {es: String}}} RawCurrency
 * @typedef {{[key: String]: RawCurrency}} RawCurrenciesData
 * 
 * @typedef {{ask: Number, bid?: Number, title: String, url: String}} USDollarVariant
 * @typedef {{[key: String]: USDollarVariant}} USDollarData
 * 
 * @typedef {{[key: String]: String}} BlacklistedSongsData
 * 
 * @typedef {{code: String, name: String, owner: String}} Crosshair
 * @typedef {{[key: String]: Crosshair}} CrosshairsData
 * 
 * @typedef {{date: Date, remaining?: String, score?: String, team1Name: String, team1Tag: String, team2Name: String, team2Tag: String, url: String}} ValorantMatch
 * @typedef {{completed: ValorantMatch[], upcoming: ValorantMatch[]}} ValorantMatchesData
 * 
 * @typedef {{collector: InteractionCollector, message: Message, page: Number?}} MusicPlayerItem
 * @typedef {{[key: String]: MusicPlayerItem}} MusicPlayerData
 * 
 * @typedef {{messageId: String, channelId: String, isActive: Boolean }} CollectorMessage
 * @typedef {{[key: String]: CollectorMessage}} CollectorMessagesData
 */

exports.unused = {};
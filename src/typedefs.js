const { Client, Message, CommandInteraction, Guild, GuildMember, User, Channel } = require("discord.js");
const { default: WOKCommands } = require("wokcommands");

/**
 * @typedef {{client: Client, instance: WOKCommands, message: Message, interaction: CommandInteraction, args: String, text: String, guild: Guild, member: GuildMember, user: User, channel: Channel}} CommandArgs
 * 
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
 * @typedef {{_id: String, achievements: String[], trades: Number, lastOpened: String[], owned: String[], repeated: String[], timeout: Date}} Collector
 * 
 * @typedef {{[key: String]: Collector}} CollectorsData
 */

exports.unused = {};
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function () { return m[k]; } });
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const { getGithubRawUrl } = require("../../src/cache");
const _get_first_embed_1 = __importDefault(require("./!get-first-embed"));
const _InteractionListener_1 = __importStar(require("./!InteractionListener"));
const sendHelpMenu = (messageOrInteraction, instance) => {
    const { embed, rows } = _get_first_embed_1.default(messageOrInteraction, instance);
    messageOrInteraction.reply({
        components: rows,
        embeds: [embed],
        ephemeral: true
    });
};
module.exports = {
    description: "Muestra los comandos de este bot.",
    category: 'Ayuda',
    aliases: ['comandos', 'help'],
    options: [{
        name: 'comando',
        description: 'El comando del que se quiere obtener ayuda.',
        required: false,
        type: discord_js_1.ApplicationCommandOptionType.String
    }],
    maxArgs: 1,
    expectedArgs: '[comando]',
    slash: 'both',
    guildOnly: true,
    init: (client, instance) => {
        client.on('interactionCreate', async interaction => {
            if (interaction.isButton())
                new _InteractionListener_1.default(instance, interaction);
        });
    },
    callback: async options => {
        const { message, channel, instance, args, interaction } = options;
        const { guild } = channel;
        if (guild && !guild.members.me?.permissions.has(discord_js_1.PermissionFlagsBits.SendMessages)) {
            console.warn(`WOKCommands > Could not send message due to no permissions in channel for ${guild.name}`);
            return;
        }
        // Typical "!help" syntax for the menu
        if (args.length === 0) {
            sendHelpMenu(message || interaction, instance);
            return;
        }
        // If the user is looking for info on a specific command
        // Ex: "!help prefix"
        const arg = message ? args.shift()?.toLowerCase() : interaction.options.getString('comando').toLowerCase();
        const command = instance.commandHandler.getICommand(arg);
        if (!command)
            return {
                custom: true,
                content: instance.messageHandler.get(guild, 'UNKNOWN_COMMAND', {
                    COMMAND: arg,
                })
            };
        const description = _InteractionListener_1.default.getHelp(command, instance, guild);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`${instance.displayName} ${instance.messageHandler.getEmbed(guild, 'HELP_MENU', 'TITLE')} - ${arg}`)
            .setDescription(description)
            .setThumbnail(await getGithubRawUrl('assets/thumbs/help.png'));
        if (instance.color)
            embed.setColor(instance.color);
        if (interaction) {
            await interaction.reply({ content: 'Desplegando menú de ayuda...', ephemeral: true });
            interaction.editReply({ content: null, embeds: [embed] });
            return;
        }
        return { custom: true, embeds: [embed] };
    },
};

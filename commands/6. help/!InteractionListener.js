"use strict";

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _get_first_embed_1 = __importDefault(require("./!get-first-embed"));
class InteractionHandler {
    instance;
    interaction;
    user;
    message;
    embed;
    guild = null;
    emojiName = '';
    emojiId = '';
    door = '🚪';
    pageLimit = 3;
    constructor(instance, interaction) {
        this.instance = instance;
        this.interaction = interaction;
        this.user = interaction.user;
        this.message = interaction.message;
        this.init();
    }
    init = async () => {
        const { embeds, guild } = this.message;
        if (this.user.bot || !embeds || embeds.length !== 1) {
            return;
        }
        this.embed = EmbedBuilder.from(embeds[0]);
        this.guild = guild;
        if (!this.canUserInteract()) {
            return;
        }
        this.emojiName = this.interaction.customId;
        this.emojiId = this.interaction.customId || '';
        this.handleButton();
    };
    /**
     * @returns If the user is allowed to interact with this help menu
     */
    canUserInteract = () => {
        // Check if the title of the embed is correct
        const displayName = this.instance.displayName ? this.instance.displayName + ' ' : '';
        const isSameTitle = this.embed.data.title === `${displayName}${this.instance.messageHandler.getEmbed(this.guild, 'HELP_MENU', 'TITLE')}`;
        if (!isSameTitle) {
            return false;
        }
        // Check if the user's ID is in the footer
        if (this.embed.data.footer) {
            const { text } = this.embed.data.footer;
            const id = text?.split('#')[1];
            if (id !== this.user.id) {
                this.interaction.deferUpdate();
                return false;
            }
        }
        return true;
    };
    /**
     * Invoked when the user returns to the main menu
     */
    returnToMainMenu = () => {
        const data = _get_first_embed_1.default(this.message, this.instance);
        const { rows } = data;
        let { embed: newEmbed } = data;
        newEmbed = EmbedBuilder.from(newEmbed).data;
        this.embed.setDescription(newEmbed.description || '');
        this.interaction.update({ components: rows, embeds: [this.embed.data] });
    };
    /**
     * @param commandLength How many commands are in the category
     * @returns An array of [page, maxPages]
     */
    getMaxPages = (commandLength) => {
        let page = 1;
        if (this.embed && this.embed.data.description) {
            const split = this.embed.data.description.split('\n');
            const lastLine = split[split.length - 1];
            if (lastLine.startsWith('Página ')) {
                page = parseInt(lastLine.split(' ')[1]);
            }
        }
        return [page, Math.ceil(commandLength / this.pageLimit)];
    };
    /**
     * @returns An object containing information regarding the commands
     */
    getCommands = () => {
        let category = this.instance.getCategory(this.emojiId || this.emojiName);
        const commandsString = this.instance.messageHandler.getEmbed(this.guild, 'HELP_MENU', 'COMMANDS');
        if (this.embed.data.description) {
            const split = this.embed.data.description.split('\n');
            const cmdStr = ' ' + commandsString;
            if (split[0].endsWith(cmdStr)) {
                category = split[0].replace(cmdStr, '');
            }
        }
        const commands = this.instance.commandHandler.getCommandsByCategory(category);
        return {
            length: commands.length,
            commands,
            commandsString,
            category,
        };
    };
    static getHelp = (command, instance, guild) => {
        const { description, syntax, names } = command;
        if (names === undefined) {
            console.error('WOKCommands > A command does not have a name assigned to it.');
            return '';
        }
        const mainName = typeof names === 'string' ? names : names.shift();
        let desc = `**${mainName}**${description ? ' - ' : ''}${description}`;
        if (names.length && typeof names !== 'string') {
            desc += `\n${instance.messageHandler.getEmbed(guild, 'HELP_MENU', 'ALIASES')}: "${names.join('", "')}"`;
        }
        desc += `\n${instance.messageHandler.getEmbed(guild, 'HELP_MENU', 'SYNTAX')}: "_**${instance.getPrefix(guild)}${mainName}**${syntax ? ' ' : ''}${syntax || ''}_"`;
        return desc;
    };
    /**
     * Generates the actual menu
     */
    generateMenu = (page, maxPages) => {
        const { length, commands, commandsString, category } = this.getCommands();
        const hasMultiplePages = length > this.pageLimit;
        let desc = `${category} ${commandsString}\n\n${this.instance.messageHandler.getEmbed(this.guild, 'HELP_MENU', 'DESCRIPTION_FIRST_LINE')}`;
        if (hasMultiplePages) {
            desc += `\n\n${this.instance.messageHandler.getEmbed(this.guild, 'HELP_MENU', 'DESCRIPTION_SECOND_LINE')}`;
        }
        const start = (page - 1) * this.pageLimit;
        for (let a = start, counter = a; a < commands.length && a < start + this.pageLimit; ++a) {
            const command = commands[a];
            let { hidden, category, names } = command;
            if (!hidden && category === category) {
                if (typeof names === 'string') {
                    // @ts-ignore
                    names = [...names];
                }
                desc += `\n\n${++counter}. ${InteractionHandler.getHelp(command, this.instance, this.guild)}`;
            }
        }
        desc += `\n\nPágina ${page} / ${maxPages}.`;
        this.embed.setDescription(desc);
        const buttons = hasMultiplePages ? [{ emoji: '⬅', label: 'Página anterior' }, { emoji: '➡', label: 'Página siguiente' }] : [];
        buttons.push({ emoji: '🚪', label: 'Menú principal' });
        const rows = [];
        let row = new ActionRowBuilder();
        for (let a = 0; a < buttons.length; ++a) {
            row.addComponents(new ButtonBuilder()
                .setCustomId(buttons[a].emoji)
                .setEmoji(buttons[a].emoji)
                .setLabel(buttons[a].label)
                .setStyle(ButtonStyle.Secondary));
            if (row.components.length === 5 || a === buttons.length - 1) {
                rows.push(row);
                row = new ActionRowBuilder();
            }
        }
        this.interaction.update({ components: rows, embeds: [this.embed.data] });
    };
    /**
     * Handles the input from the emoji
     */
    handleButton = () => {
        if (this.emojiName === this.door) {
            this.returnToMainMenu();
            return;
        }
        const { length } = this.getCommands();
        let [page, maxPages] = this.getMaxPages(length);
        if (this.emojiName === '⬅') {
            if (page <= 1) {
                this.interaction.deferUpdate();
                return;
            }
            --page;
        }
        else if (this.emojiName === '➡') {
            if (page >= maxPages) {
                this.interaction.deferUpdate();
                return;
            }
            ++page;
        }
        this.generateMenu(page, maxPages);
    };
}
exports.default = InteractionHandler;

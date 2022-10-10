"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const getFirstEmbed = (messageOrInteraction, instance) => {
    const { guild, member } = messageOrInteraction;
    const { commandHandler: { commands }, messageHandler, } = instance;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`${instance.displayName} ${messageHandler.getEmbed(guild, 'HELP_MENU', 'TITLE')}`)
        .setFooter({ text: `ID #${member.user.id}` });
    if (instance.color) {
        embed.setColor(instance.color);
    }
    const categories = {};
    const isAdmin = member && member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator);
    for (const { category, testOnly } of commands) {
        if (!category ||
            (testOnly && guild && !instance.testServers.includes(guild.id)) ||
            (!isAdmin && instance.hiddenCategories.includes(category))) {
            continue;
        }
        if (categories[category]) {
            ++categories[category].amount;
        } else {
            categories[category] = {
                amount: 1,
                emoji: instance.getEmoji(category),
            };
        }
    }
    const keys = Object.keys(categories);
    let desc = messageHandler.getEmbed(guild, 'HELP_MENU', 'SELECT_A_CATEGORY');
    const rows = [];
    let row = new discord_js_1.ActionRowBuilder();
    for (let a = 0; a < keys.length; ++a) {
        const key = keys[a];
        const { emoji } = categories[key];
        if (!emoji) {
            console.warn(`WOKCommands > Category "${key}" does not have an emoji icon.`);
            continue;
        }
        const visibleCommands = instance.commandHandler.getCommandsByCategory(key, true);
        const amount = visibleCommands.length;
        if (amount === 0) {
            continue;
        }
        desc += `\n\n**${emoji} - ${key}** - ${amount} comando${amount === 1 ? '' : 's'}`;
        row.addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(emoji)
            .setEmoji(emoji)
            .setLabel(key)
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        if (row.components.length === 5 || a === keys.length - 1) {
            rows.push(row);
            row = new discord_js_1.ActionRowBuilder();
        }
        embed.setThumbnail(instance.client.user.avatarURL());
    }
    embed.setDescription(desc);
    return {
        embed,
        rows
    };
};
exports.default = getFirstEmbed;

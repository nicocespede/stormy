const { ApplicationCommandOptionType } = require("discord.js");
const { updateIcon: updateIconCache, getIds, updateIds, getMode, updateMode: updateModeCache } = require("../../src/cache");
const { githubRawURL } = require("../../src/constants");
const { updateIcon, updateUsername } = require("../../src/general");
const { updateIconString, updateMode } = require("../../src/mongodb");
const { log } = require("../../src/util");

const choices = [
    { name: '🤟🏼 KRÜ', value: 'kru' },
    { name: '🇦🇷 Selección', value: 'afa' }
];

module.exports = {
    category: 'Privados',
    description: 'Activa/desactiva un modo.',

    options: [{
        name: 'modo',
        description: 'El nombre del modo.',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: choices
    }],

    slash: true,
    guildOnly: true,

    callback: async ({ client, user, guild, interaction }) => {
        const mode = interaction.options.getString('modo');
        const ids = getIds() || await updateIds();
        if (user.id !== ids.users.stormer && user.id !== ids.users.darkness)
            return {
                content: `⚠ Lo siento <@${user.id}>, este comando solo puede ser utilizado por los **Dueños de casa**.`,
                custom: true,
                ephemeral: true
            };

        const modesData = {
            afa: { name: 'Selección', username: 'StormY 🇦🇷', on: '¡VAMOS CARAJO! 🇦🇷' },
            kru: { name: 'KRÜ', role: 'kru', on: `¡Vamos KRÜ! <:kru:${ids.emojis.kru}>`, off: '¡GG!', username: 'KRÜ StormY 🤟🏼' }
        };

        interaction.deferReply({ ephemeral: true });

        const actualMode = getMode() || await updateModeCache();
        const { name, role: roleName, on, off, username } = modesData[mode];

        if (actualMode === mode) {
            await updateMode(null);
            await updateModeCache();
            await updateIcon(guild);
            await updateUsername(client);
            if (roleName) {
                const role = await guild.roles.fetch(ids.roles[roleName]).catch(console.error);
                role.members.each(async member => {
                    if (member.id !== ids.users.stormer)
                        await member.setNickname(``).catch(console.error);
                });
            }
            interaction.editReply({ content: `Modo **${name}** desactivado... ${off || ''}` }).catch(console.error);
            return;
        }

        const newIcon = `kgprime-${mode}`;
        await updateMode(mode);
        await updateModeCache();
        await guild.setIcon(`${githubRawURL}/assets/icons/${newIcon}.png`).catch(console.error);
        await updateIconString(newIcon).catch(console.error);
        await updateIconCache();
        await client.user.setUsername(username).catch(console.error);
        log('> Nombre de usuario actualizado', 'green');
        if (roleName) {
            const role = await guild.roles.fetch(ids.roles[roleName]).catch(console.error);
            role.members.each(async member => {
                if (member.id !== ids.users.stormer)
                    await member.setNickname(`${name} ${member.user.username}`).catch(console.error);
            });
        }
        interaction.editReply({ content: `Modo **${name}** activado... ${on}` }).catch(console.error);
        return;
    }
}
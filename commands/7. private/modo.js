const { ApplicationCommandOptionType } = require("discord.js");
const { updateIcon: updateIconCache, getIds, updateIds, getMode, updateMode: updateModeCache } = require("../../src/cache");
const { GITHUB_RAW_URL, Mode, CONSOLE_GREEN } = require("../../src/constants");
const { updateIcon, isOwner, updateGuildName } = require("../../src/common");
const { updateIconString, updateMode } = require("../../src/mongodb");
const { log } = require("../../src/util");

const choices = [
    { name: '🤟🏼 KRÜ', value: Mode.KRU },
    { name: '🇦🇷 Selección', value: Mode.AFA }
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
        if (!(await isOwner(user.id)))
            return {
                content: `⚠ Lo siento <@${user.id}>, este comando solo puede ser utilizado por los **Dueños de casa**.`,
                custom: true,
                ephemeral: true
            };

        const ids = getIds() || await updateIds();
        const modesData = {
            afa: { guildname: 'NCKG ⭐⭐⭐', name: 'Selección', username: 'AFA StormY ⭐⭐⭐', on: '¡VAMOS CARAJO! 🇦🇷' },
            kru: { guildname: 'NCKG 🤟🏼', name: 'KRÜ', role: 'kru', on: `¡Vamos KRÜ! <:kru:${ids.emojis.kru}>`, off: '¡GG!', username: 'KRÜ StormY 🤟🏼' }
        };

        const actualMode = getMode() || await updateModeCache();
        const mode = interaction.options.getString('modo');

        if (actualMode !== Mode.NORMAL && actualMode !== mode)
            return {
                content: `⚠ Primero debés desactivar el modo actual.`,
                custom: true,
                ephemeral: true
            };

        interaction.deferReply({ ephemeral: true });
        const { guildname, name, role: roleName, on, off, username } = modesData[mode];

        if (actualMode === mode) {
            await updateMode(Mode.NORMAL);
            await updateModeCache();
            await updateIcon(guild);
            await client.user.setUsername('StormY').catch(console.error);
            await updateGuildName(client);
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
        await guild.setIcon(`${GITHUB_RAW_URL}/assets/icons/${newIcon}.png`).catch(console.error);
        await updateIconString(newIcon).catch(console.error);
        await updateIconCache();
        await client.user.setUsername(username).catch(console.error);
        await guild.setName(guildname).catch(console.error);
        log('> Nombre de usuario actualizado', CONSOLE_GREEN);
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
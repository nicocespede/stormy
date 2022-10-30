const { getIcon, updateIcon, getIds, updateIds } = require("../../src/cache");
const { githubRawURL } = require("../../src/constants");
const general = require("../../src/general");
const { updateIconString } = require("../../src/mongodb");

module.exports = {
    category: 'Privados',
    description: 'Activa/desactiva el modo KRÜ.',
    aliases: ['modo-kru'],

    maxArgs: 0,
    slash: 'both',
    guildOnly: true,

    callback: async ({ client, user, guild }) => {
        const ids = getIds() || await updateIds();
        if (user.id != ids.users.stormer && user.id != ids.users.darkness)
            return {
                content: `Lo siento <@${user.id}>, este comando solo puede ser utilizado por los Dueños de casa.`,
                custom: true,
                ephemeral: true
            };
        else {
            const actualIcon = getIcon() || await updateIcon();
            const kruIcon = `kgprime-kru`;
            if (actualIcon === kruIcon) {
                await general.updateIcon(guild);
                await general.updateUsername(client);
                await guild.roles.fetch(ids.roles.kru).then(async role => {
                    role.members.each(async member => {
                        if (member.id != ids.users.stormer)
                            await member.setNickname(``).catch(console.error);
                    });
                }).catch(console.error);
                return {
                    content: `Modo KRÜ desactivado... ¡GG!`,
                    custom: true
                };
            } else {
                await guild.setIcon(`${githubRawURL}/assets/icons/${kruIcon}.png`).catch(console.error);
                await updateIconString(kruIcon).catch(console.error);
                await updateIcon();
                await client.user.setUsername('KRÜ StormY 🤟🏼').catch(console.error);
                await guild.roles.fetch(ids.roles.kru).then(async role => {
                    role.members.each(async member => {
                        if (member.id != ids.users.stormer)
                            await member.setNickname(`KRÜ ${member.user.username}`).catch(console.error);
                    });
                }).catch(console.error);
                return {
                    content: `Modo KRÜ activado... ¡Vamos KRÜ! <:kru:${ids.emojis.kru}>`,
                    custom: true
                };
            }
        }
    }
}
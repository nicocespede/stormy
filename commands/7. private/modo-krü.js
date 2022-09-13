const { getAvatar, updateAvatar } = require("../../app/cache");
const general = require("../../app/general");
const { ids } = require("../../app/constants");
const { updateAvatarString } = require("../../app/mongodb");
const kruAvatarUrl = './assets/kgprime-kru.png';

module.exports = {
    category: 'Privados',
    description: 'Activa/desactiva el modo KRÜ.',
    aliases: ['modo-kru'],

    maxArgs: 0,
    slash: 'both',
    guildOnly: true,

    callback: async ({ client, user, guild }) => {
        if (user.id != ids.users.stormer && user.id != ids.users.darkness)
            return {
                content: `Lo siento <@${user.id}>, este comando solo puede ser utilizado por los Dueños de casa.`,
                custom: true,
                ephemeral: true
            };
        else {
            const actualAvatar = !getAvatar() ? await updateAvatar() : getAvatar();
            if (actualAvatar === kruAvatarUrl) {
                await general.updateAvatar(client);
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
                await client.user.setAvatar(kruAvatarUrl).then(() => {
                    updateAvatarString(kruAvatarUrl).then(async _ => await updateAvatar()).catch(console.error);
                }).catch(console.error);
                await client.user.setUsername('KRÜ StormY 🤟🏼').catch(console.error);
                await guild.roles.fetch(ids.roles.kru).then(async role => {
                    role.members.each(async member => {
                        if (member.id != ids.users.stormer)
                            await member.setNickname(`KRÜ ${member.user.username}`).catch(console.error);
                    });
                }).catch(console.error);
                return {
                    content: `Modo KRÜ activado... ¡Vamos KRÜ! 🤟🏼`,
                    custom: true
                };
            }
        }
    }
}
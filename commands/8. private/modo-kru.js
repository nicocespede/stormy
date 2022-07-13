const { getAvatar, updateAvatar } = require("../../app/cache");
const general = require("../../app/general");
const { ids } = require("../../app/constants");
const { updateAvatarString } = require("../../app/postgres");
const kruAvatarUrl = './assets/kgprime-kru.png';

module.exports = {
    category: 'Privados',
    description: 'Activa/desactiva el modo KRÜ.',

    maxArgs: 0,
    slash: 'both',
    guildOnly: true,

    callback: async ({ client, user }) => {
        if (user.id != ids.users.stormer && user.id != ids.users.darkness)
            return {
                content: `Lo siento <@${user.id}>, este comando solo puede ser utilizado por los Dueños de casa.`,
                custom: true,
                ephemeral: true
            };
        else {
            var actualAvatar = !getAvatar() ? await updateAvatar() : getAvatar();
            actualAvatar = actualAvatar[0];
            if (actualAvatar['avatar_url'] === kruAvatarUrl) {
                await general.updateAvatar(client);
                await general.updateUsername(client);
                return {
                    content: `Modo KRÜ desactivado... ¡GG!`,
                    custom: true
                };
            } else {
                await client.user.setAvatar(kruAvatarUrl).then(() => {
                    updateAvatarString(kruAvatarUrl).catch(console.error);
                }).catch(console.error);
                await client.user.setUsername('KRÜ StormY 🤟🏼').catch(console.error);
                return {
                    content: `Modo KRÜ activado... ¡Vamos KRÜ! 🤟🏼`,
                    custom: true
                };
            }
        }
    }
}
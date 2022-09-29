const { updateAvatar: updateAvatarCache, getAvatar, timeouts } = require('../app/cache');
const { convertTZ, updateAvatar, updateUsername } = require('../app/general');

module.exports = client => {
    let lastDateChecked = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
    lastDateChecked.setDate(lastDateChecked.getDate() - 1);

    const check = async () => {
        const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');

        if (lastDateChecked.getDate() != today.getDate()) {
            const actualAvatar = getAvatar() || await updateAvatarCache();
            if (actualAvatar != `./assets/kgprime-kru.png` && client.user.username != 'KRÜ StormY 🤟🏼') {
                updateAvatar(client);
                updateUsername(client);
            }

            lastDateChecked = today;
        }

        timeouts['avatar-and-username-updater'] = setTimeout(check, 1000 * 60);
    };
    check();
};

module.exports.config = {
    displayName: 'Actualizador de avatar y nombre de usuario',
    dbName: 'AVATAR_AND_USERNAME_UPDATER'
};
const { updateIcon: updateIconCache, getIcon, timeouts, getIds, updateIds } = require('../app/cache');
const { convertTZ, updateIcon, updateUsername } = require('../app/general');

module.exports = client => {
    let lastDateChecked = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
    lastDateChecked.setDate(lastDateChecked.getDate() - 1);

    const check = async () => {
        const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');

        if (lastDateChecked.getDate() != today.getDate()) {
            const actualIcon = getIcon() || await updateIconCache();
            if (actualIcon != `kgprime-kru` && client.user.username != 'KRÜ StormY 🤟🏼') {
                const ids = getIds() || await updateIds();
                const guild = await client.guilds.fetch(ids.guilds.default).catch(console.error);
                updateIcon(guild);
                updateUsername(client);
            }

            lastDateChecked = today;
        }

        timeouts['icon-and-username-updater'] = setTimeout(check, 1000 * 60);
    };
    check();
};

module.exports.config = {
    displayName: 'Actualizador de ícono y nombre de usuario',
    dbName: 'ICON_AND_USERNAME_UPDATER'
};
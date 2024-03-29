const { timeouts, getIds, getMode } = require('../src/cache');
const { Mode } = require('../src/constants');
const { updateIcon, updateGuildName } = require('../src/common');
const { convertTZ } = require('../src/util');

module.exports = client => {
    let lastDateChecked = convertTZ(new Date());
    lastDateChecked.setDate(lastDateChecked.getDate() - 1);

    const check = async () => {
        const today = convertTZ(new Date());

        if (lastDateChecked.getDate() !== today.getDate()) {
            const actualMode = await getMode();
            if (actualMode === Mode.NORMAL) {
                const ids = await getIds();
                const guild = await client.guilds.fetch(ids.guilds.default).catch(console.error);
                updateIcon(guild);
                updateGuildName(client);
            }

            lastDateChecked = today;
        }

        timeouts['icon-and-guild-name-updater'] = setTimeout(check, 1000 * 60);
    };
    check();
};

module.exports.config = {
    displayName: 'Actualizador de ícono y nombre de servidor',
    dbName: 'ICON_AND_GUILD_NAME_UPDATER'
};
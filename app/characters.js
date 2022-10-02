const { getCharacters, updateCharacters } = require("./cache");
const { githubRawURL } = require("./constants");

const voicelessCharacters = ['blackbolt', 'echo1'];

module.exports = {
    getBannedMemberEmbedInfo: async (tag, reason) => {
        const { info, situations } = getCharacters() || await updateCharacters();
        const lines = situations["BANNED_MEMBER"];
        const keys = Object.keys(lines);
        const characterName = keys[Math.floor(Math.random() * keys.length)];
        //const characterName = 'blackbolt';
        const isVoiceless = voicelessCharacters.includes(characterName);
        const line = !isVoiceless ? `"${lines[characterName]}"` : `\\*${lines[characterName]}\\*`;
        return {
            color: info[characterName].color,
            description: line.replace('{TAG}', tag).replace('{REASON}', reason ? ` por **${reason}**` : ''),
            title: `${info[characterName].name}:`,
            thumbnail: `${githubRawURL}/assets/characters/${characterName}.png`
        }
    }
}
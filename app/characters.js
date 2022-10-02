const { getCharacters, updateCharacters } = require("./cache");
const { githubRawURL } = require("./constants");

const voicelessCharacters = ['blackbolt', 'echo1'];

module.exports = {
    getBannedMemberEmbedInfo: async (tag, reason) => {
        const { info, situations } = getCharacters() || await updateCharacters();
        const lines = situations["BANNED_MEMBER"];
        const keys = Object.keys(lines);
        const characterName = keys[Math.floor(Math.random() * keys.length)];
        const character = (Object.entries(info).filter(([_, names]) => Object.keys(names).includes(characterName)))[0];
        const line = !voicelessCharacters.includes(characterName) ? `"${lines[characterName]}"` : `\\*${lines[characterName]}\\*`;
        return {
            color: (character[1])[characterName],
            description: line.replace('{TAG}', tag).replace('{REASON}', reason ? ` por **${reason}**` : ''),
            title: `${character[0]}:`,
            thumbnail: `${githubRawURL}/assets/characters/${characterName}.png`
        }
    },

    getMemberLeaveEmbedInfo: async tag => {
        const { info, situations } = getCharacters() || await updateCharacters();
        const lines = situations["GONE_MEMBER"];
        const keys = Object.keys(lines);
        const characterName = keys[Math.floor(Math.random() * keys.length)];
        const character = (Object.entries(info).filter(([_, names]) => Object.keys(names).includes(characterName)))[0];
        const line = !voicelessCharacters.includes(characterName) ? `"${lines[characterName]}"` : `\\*${lines[characterName]}\\*`;
        return {
            color: (character[1])[characterName],
            description: line.replace('{TAG}', tag),
            title: `${character[0]}:`,
            thumbnail: `${githubRawURL}/assets/characters/${characterName}.png`
        }
    }
}
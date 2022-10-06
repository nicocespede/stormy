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
            character: characterName,
            description: line.replace('{TAG}', tag).replace('{REASON}', reason ? ` por **${reason}**` : ''),
            title: `${character[0]}:`,
            thumbnail: `${githubRawURL}/assets/characters/${characterName}.png`
        }
    },

    getUnbannedMemberEmbedInfo: async (tag, bannerCharacter) => {
        const { info, situations } = getCharacters() || await updateCharacters();
        const lines = situations["UNBANNED_MEMBER"];
        const possibleCharacters = Object.entries(lines).filter(([_, lines]) => {
            const found = Object.entries(lines).filter(([_, characters]) => characters.includes(bannerCharacter));
            return found.length > 0;
        });
        const selectedCharacter = possibleCharacters[Math.floor(Math.random() * possibleCharacters.length)];
        const characterName = selectedCharacter[0];
        const character = (Object.entries(info).filter(([_, names]) => Object.keys(names).includes(characterName)))[0];
        let line = (Object.entries(selectedCharacter[1]).filter(([_, characters]) => characters.includes(bannerCharacter)))[0];
        line = !voicelessCharacters.includes(characterName) ? `"${line[0]}"` : `\\*${line[0]}\\*`;
        return {
            color: (character[1])[characterName],
            description: line.replace('{TAG}', tag),
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
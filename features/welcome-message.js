const { default: WOKCommands } = require("wokcommands");
const { Client, AttachmentBuilder, User } = require("discord.js");
const { createCanvas, loadImage } = require('canvas');
const { getIds, getGithubRawUrl, getMode } = require("../src/cache");
const { countMembers, applyText, getImageType } = require("../src/common");
const { logToFileError, consoleLogError, getUserTag } = require("../src/util");
const { Mode } = require("../src/constants");

const MODULE_NAME = 'features.welcome-message';

const FONT_NAME = 'Titillium Web';
const AFA_FONT_NAME = 'ADIDAS Qatar 2022';

/**
 * Generates the welcome image for a user.
 * 
 * @param {User} user The user to generate the image.
 * @returns The welcome image.
 */
const generateWelcomeImage = async user => {
    const canvas = createCanvas(1170, 720);
    const context = canvas.getContext('2d');
    const background = await loadImage(await getGithubRawUrl(`assets/welcome${await getImageType()}.png`));
    const avatarWidth = 250;
    const avatarHeight = avatarWidth;
    const avatarX = (canvas.width / 2) - (canvas.width / 4);
    const avatarY = 275;
    context.strokeStyle = '#151515';
    context.lineWidth = 2;
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    const { discriminator, username } = user;
    // Select the font size and type from one of the natively available fonts
    context.font = applyText(canvas, username, `${FONT_NAME} bold`);
    // Select the style that will be used to fill the text in
    context.fillStyle = '#ffffff';

    // Actually fill the text with a solid color
    const usernameX = (canvas.width / 2);
    const usernameY = canvas.height / (discriminator !== '0' ? 1.875 : 1.75);
    context.fillText(username, usernameX, usernameY);
    context.strokeText(username, usernameX, usernameY);
    if (discriminator !== '0') {
        // Slightly smaller text placed above the member's display name
        context.font = `75px ${FONT_NAME}`;
        context.fillStyle = '#ffffff';
        context.fillText(`#${discriminator}`, usernameX, 460);
        context.strokeText(`#${discriminator}`, usernameX, 460);
    }

    // Pick up the pen
    context.beginPath();
    // Start the arc to form a circle
    context.arc(avatarX + (avatarWidth / 2), avatarY + (avatarHeight / 2), avatarWidth / 2, 0, Math.PI * 2, true);
    // Put the pen down
    context.closePath();
    // Clip off the region you drew on
    context.clip();
    const avatar = await loadImage(user.displayAvatarURL().replace('.webp', '.jpg'));
    // Draw a shape onto the main canvas
    context.drawImage(avatar, avatarX, avatarY, avatarWidth, avatarHeight);
    return new AttachmentBuilder(canvas.toBuffer());
};

const generateAfaWelcomeImage = async user => {
    const canvas = createCanvas(1170, 720);
    const context = canvas.getContext('2d');
    const background = await loadImage(await getGithubRawUrl(`assets/welcome${await getImageType()}.png`));
    const avatarWidth = 89;
    const avatarHeight = avatarWidth;
    const avatarX = (canvas.width / 2) - (avatarWidth / 2);
    const avatarY = 263;
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    const username = getUserTag(user).toUpperCase();
    // Select the font size and type from one of the natively available fonts
    context.font = `14px ${AFA_FONT_NAME}`;
    // Select the style that will be used to fill the text in
    context.fillStyle = '#000000';

    // Actually fill the text with a solid color
    const usernameX = (canvas.width / 2) - (context.measureText(username).width / 2);
    const usernameY = 241;
    context.fillText(username, usernameX, usernameY);

    // Pick up the pen
    context.beginPath();
    // Start the arc to form a circle
    context.arc(avatarX + (avatarWidth / 2), avatarY + (avatarHeight / 2), avatarWidth / 2, 0, Math.PI * 2, true);
    // Put the pen down
    context.closePath();
    // Clip off the region you drew on
    context.clip();
    const avatar = await loadImage(user.displayAvatarURL().replace('.webp', '.jpg'));
    // Draw a shape onto the main canvas
    context.drawImage(avatar, avatarX, avatarY, avatarWidth, avatarHeight);
    return new AttachmentBuilder(canvas.toBuffer());
};

/**
 * @param {Client} client 
 * @param {WOKCommands} instance 
 */
module.exports = (client, instance) => {
    client.on('guildMemberAdd', async member => {
        const ids = await getIds();

        const { guild, user } = member;
        try {
            const channel = await client.channels.fetch(ids.channels.welcome);
            const mode = await getMode();
            const attachment = mode !== Mode.AFA ? await generateWelcomeImage(user) : await generateAfaWelcomeImage(user);
            const welcomeMessages = instance.messageHandler.getEmbed(guild, 'GREETINGS', 'WELCOME');
            const random = Math.floor(Math.random() * (welcomeMessages.length));
            await channel.send({ content: `${welcomeMessages[random].replace('{ID}', user.id)}`, files: [attachment] });
            const m = await channel.send({
                content: instance.messageHandler.get(guild, 'AUTOROLE_ADVICE', {
                    USER_ID: user.id,
                    CHANNEL_ID: ids.channels.autorol
                })
            });
            countMembers(client);

            await new Promise(res => setTimeout(res, 5 * 60 * 1000));
            m.delete();
        } catch (error) {
            logToFileError(MODULE_NAME, error);
            consoleLogError('> Error al enviar mensaje de bienvenida para ' + getUserTag(user));
        }
    });
};

module.exports.config = {
    displayName: 'Mensaje de bienvenida',
    dbName: 'WELCOME_MESSAGE'
}
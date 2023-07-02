const { default: WOKCommands } = require("wokcommands");
const { Client, AttachmentBuilder, User } = require("discord.js");
const Canvas = require('canvas');
const { getIds, getGithubRawUrl } = require("../src/cache");
const { countMembers, applyText, getImageType } = require("../src/common");
const { logToFileError, consoleLogError, getUserTag } = require("../src/util");

const MODULE_NAME = 'features.welcome-message';

/**
 * Generates the welcome image for a user.
 * 
 * @param {User} user The user to generate the image.
 * @returns The welcome image.
 */
const generateWelcomeImage = async user => {
    const canvas = Canvas.createCanvas(1170, 720);
    const context = canvas.getContext('2d');
    const background = await Canvas.loadImage(await getGithubRawUrl(`assets/welcome${await getImageType()}.png`));
    const avatarWidth = 250;
    const avatarHeight = avatarWidth;
    const avatarX = 450;
    const avatarY = 275;
    context.strokeStyle = '#151515';
    context.lineWidth = 2;
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    const { discriminator, username } = user;
    // Select the font size and type from one of the natively available fonts
    context.font = applyText(canvas, username);
    // Select the style that will be used to fill the text in
    context.fillStyle = '#ffffff';

    // Actually fill the text with a solid color
    const usernameY = canvas.height / (discriminator !== '0' ? 1.875 : 1.75);
    context.fillText(username, 725, usernameY);
    context.strokeText(username, 725, usernameY);
    if (discriminator !== '0') {
        // Slightly smaller text placed above the member's display name
        context.font = '75px Titillium Web';
        context.fillStyle = '#ffffff';
        context.fillText(`#${discriminator}`, 725, 460);
        context.strokeText(`#${discriminator}`, 725, 460);
    }

    // Pick up the pen
    context.beginPath();
    // Start the arc to form a circle
    context.arc(avatarX + (avatarWidth / 2), avatarY + (avatarHeight / 2), avatarWidth / 2, 0, Math.PI * 2, true);
    // Put the pen down
    context.closePath();
    // Clip off the region you drew on
    context.clip();
    const avatar = await Canvas.loadImage(user.displayAvatarURL().replace('.webp', '.jpg'));
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
            const attachment = await generateWelcomeImage(user);
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
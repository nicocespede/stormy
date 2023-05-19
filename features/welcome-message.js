const { AttachmentBuilder } = require("discord.js");
const Canvas = require('canvas');
const { getIds } = require("../src/cache");
const { countMembers, applyText, getImageType } = require("../src/common");
const { GITHUB_RAW_URL } = require("../src/constants");

const generateWelcomeImage = async user => {
    const canvas = Canvas.createCanvas(1170, 720);
    const context = canvas.getContext('2d');
    const background = await Canvas.loadImage(`${GITHUB_RAW_URL}/assets/welcome${await getImageType()}.png`);
    const avatarWidth = 250;
    const avatarHeight = avatarWidth
    const avatarX = 450;
    const avatarY = 275;
    context.strokeStyle = '#151515';
    context.lineWidth = 2;
    context.drawImage(background, 0, 0, canvas.width, canvas.height);
    // Select the font size and type from one of the natively available fonts
    context.font = applyText(canvas, user.username);
    // Select the style that will be used to fill the text in
    context.fillStyle = '#ffffff';
    // Actually fill the text with a solid color
    context.fillText(user.username, 725, canvas.height / 1.875);
    context.strokeText(user.username, 725, canvas.height / 1.875);
    // Slightly smaller text placed above the member's display name
    context.font = '75px Titillium Web';
    context.fillStyle = '#ffffff';
    context.fillText(`#${user.discriminator}`, 725, 460);
    context.strokeText(`#${user.discriminator}`, 725, 460);
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

module.exports = (client, instance) => {
    client.on('guildMemberAdd', async member => {
        const ids = await getIds();
        client.channels.fetch(ids.channels.welcome).then(channel => {
            generateWelcomeImage(member.user).then(attachment => {
                const { guild } = member;
                const welcomeMessages = instance.messageHandler.getEmbed(guild, 'GREETINGS', 'WELCOME');
                var random = Math.floor(Math.random() * (welcomeMessages.length));
                channel.send({ content: `${welcomeMessages[random].replace('{ID}', member.user.id)}`, files: [attachment] }).then(_ => {
                    channel.send({
                        content: instance.messageHandler.get(guild, 'AUTOROLE_ADVICE', {
                            USER_ID: member.user.id,
                            CHANNEL_ID: ids.channels.autorol
                        })
                    }).then(m => {
                        new Promise(res => setTimeout(res, 5 * 60 * 1000)).then(() => {
                            m.delete();
                        });
                    });
                });
                countMembers(client);
            }).catch(console.error);
        }).catch(console.error);
    });
};

module.exports.config = {
    displayName: 'Mensaje de bienvenida',
    dbName: 'WELCOME_MESSAGE'
}
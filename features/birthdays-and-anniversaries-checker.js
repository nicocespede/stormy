const { AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');
const chalk = require('chalk');
chalk.level = 1;
const { getIds, updateIds, getBirthdays, updateBirthdays, getAnniversaries, updateAnniversaries } = require('../app/cache');
const { convertTZ, applyText } = require('../app/general');
const { deleteBirthday, updateBirthday, updateAnniversary } = require('../app/mongodb');

const getToday = () => {
    const today = convertTZ(new Date(), 'America/Argentina/Buenos_Aires');
    let dd = today.getDate();
    let mm = today.getMonth() + 1;
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    return `${dd}/${mm}`;
};

const generateBirthdayImage = async user => {
    const canvas = Canvas.createCanvas(1170, 720);
    const context = canvas.getContext('2d');
    const background = await Canvas.loadImage('./assets/happy-bday.png');
    const avatarWidth = 300;
    const avatarHeight = avatarWidth;
    const avatarX = (background.width / 2) - (avatarWidth / 2);
    const avatarY = (background.height / 2) - (avatarHeight / 2);
    context.strokeStyle = '#151515';
    context.lineWidth = 2;
    context.drawImage(background, 0, 0, canvas.width, canvas.height);
    // Select the font size and type from one of the natively available fonts
    context.font = applyText(canvas, user.username);
    // Select the style that will be used to fill the text in
    context.fillStyle = '#ffffff';
    const usernameWidth = context.measureText(user.username).width;
    const ids = getIds() || await updateIds();
    if (user.id === ids.users.stormer || user.id === ids.users.darkness) {
        const crownWidth = 60;
        const gapWidth = 5;
        const crown = await Canvas.loadImage('./assets/crown.png');
        // Actually fill the text with a solid color
        context.fillText(user.username, (background.width / 2) - ((usernameWidth - gapWidth - crownWidth) / 2), canvas.height / (6 / 5) - 10);
        context.strokeText(user.username, (background.width / 2) - ((usernameWidth - gapWidth - crownWidth) / 2), canvas.height / (6 / 5) - 10);
        context.drawImage(crown, (background.width / 2) - ((usernameWidth + crownWidth + gapWidth) / 2), canvas.height / (6 / 5) - 74, crownWidth, 64);
    } else {
        // Actually fill the text with a solid color
        context.fillText(user.username, (background.width / 2) - (usernameWidth / 2), canvas.height / (6 / 5) - 10);
        context.strokeText(user.username, (background.width / 2) - (usernameWidth / 2), canvas.height / (6 / 5) - 10);
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

module.exports = client => {
    const check = async () => {
        const ids = getIds() || await updateIds();
        const channel = await client.channels.fetch(ids.channels.anuncios).catch(console.error);
        const guild = await client.guilds.fetch(ids.guilds.default).catch(console.error);

        const birthdays = getBirthdays() || await updateBirthdays();
        const birthdaysArray = Object.entries(birthdays);
        const todayBirthdays = birthdaysArray.filter(([_, value]) => `${value.day}/${value.month}` === getToday() && !value.flag);
        const pastBirthdays = birthdaysArray.filter(([_, value]) => `${value.day}/${value.month}` !== getToday() && value.flag);


        for (const [id, bday] of todayBirthdays) {
            const member = await guild.members.fetch(id).catch(async _ => {
                await deleteBirthday(id);
                await updateBirthdays();
                channel.send({ content: `⚠ Se eliminó el cumpleaños de **${bday.user}** (**Hoy**) ya que el usuario no está más en el servidor.` });
            });
            const attachment = await generateBirthdayImage(member.user).catch(console.error);
            const msg = id === ids.users.bot ? `@everyone\n\n¡Hoy es mi cumpleaños!`
                : `@everyone\n\nHoy es el cumpleaños de <@${id}>, ¡feliz cumpleaños!`;
            const m = await channel.send({ content: msg, files: [attachment] }).catch(console.error);
            for (const emoji of ['🎈', '🥳', '🎉', '🎂'])
                await m.react(emoji);
            await updateBirthday(id, true).catch(console.error);
            await updateBirthdays();
        }

        for (const [id, _] of pastBirthdays) {
            await updateBirthday(id, false).catch(console.error);
            await updateBirthdays();
        }

        const anniversaries = getAnniversaries() || await updateAnniversaries();
        const todayAnniversaries = anniversaries.filter(a => a.date.substring(0, 5) === getToday() && !a.flag);
        const pastAnniversaries = anniversaries.filter(a => a.date.substring(0, 5) !== getToday() && a.flag);

        for (const anniversary of todayAnniversaries) {
            const member1 = await guild.members.fetch(anniversary.id1).catch(console.error);
            const member2 = await guild.members.fetch(anniversary.id2).catch(console.error);
            const years = convertTZ(new Date(), 'America/Argentina/Buenos_Aires').getFullYear() - parseInt(anniversary.date.substring(6));
            const m = await channel.send({ content: `@everyone\n\nHoy <@${member1.user.id}> y <@${member2.user.id}> cumplen ${years} años de novios, ¡feliz aniversario! 💑` }).catch(console.error);
            for (const emoji of ['🥰', '😍', '💏'])
                await m.react(emoji);
            await updateAnniversary(anniversary.id1, anniversary.id2, true).catch(console.error);
            await updateAnniversaries();
        }

        for (const anniversary of pastAnniversaries) {
            await updateAnniversary(anniversary.id1, anniversary.id2, false).catch(console.error);
            await updateAnniversaries();
        }

        setTimeout(check, 1000 * 60);
    };
    check();
};

module.exports.config = {
    displayName: 'Verificador de cumpleaños y aniversarios',
    dbName: 'BIRTHDAYS_AND_ANNIVERSARIES_CHECKER'
};
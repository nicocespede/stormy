const { AttachmentBuilder, User, Client } = require('discord.js');
const Canvas = require('canvas');
const { getIds, updateBirthdays, timeouts, getGithubRawUrl } = require('../src/cache');
const { applyText, isOwner } = require('../src/common');
const { consoleLog, convertTZ } = require('../src/util');
const { updateBirthday, updateAnniversary } = require('../src/mongodb');
const { relativeSpecialDays, CONSOLE_YELLOW } = require('../src/constants');
const anniversarySchema = require('../models/anniversary-schema');
const birthdaySchema = require('../models/birthday-schema');

/**
 * Generates the birthday greeting image for a user.
 * 
 * @param {User} user The user to generate the image.
 * @returns The birthday greeting image
 */
const generateBirthdayImage = async user => {
    const canvas = Canvas.createCanvas(1170, 720);
    const context = canvas.getContext('2d');
    const background = await Canvas.loadImage(await getGithubRawUrl('assets/happy-bday.png'));
    const avatarWidth = 300;
    const avatarHeight = avatarWidth;
    const avatarX = (background.width / 2) - (avatarWidth / 2);
    const avatarY = (background.height / 2) - (avatarHeight / 2);
    context.strokeStyle = '#151515';
    context.lineWidth = 2;
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    const { username } = user;
    // Select the font size and type from one of the natively available fonts
    context.font = applyText(canvas, username);
    // Select the style that will be used to fill the text in
    context.fillStyle = '#ffffff';
    const usernameWidth = context.measureText(username).width;
    if (await isOwner(user.id)) {
        const crownWidth = 60;
        const gapWidth = 5;
        const crown = await Canvas.loadImage('./assets/crown.png');
        // Actually fill the text with a solid color
        context.fillText(username, (background.width / 2) - ((usernameWidth - gapWidth - crownWidth) / 2), canvas.height / (6 / 5) - 10);
        context.strokeText(username, (background.width / 2) - ((usernameWidth - gapWidth - crownWidth) / 2), canvas.height / (6 / 5) - 10);
        context.drawImage(crown, (background.width / 2) - ((usernameWidth + crownWidth + gapWidth) / 2), canvas.height / (6 / 5) - 74, crownWidth, 64);
    } else {
        // Actually fill the text with a solid color
        context.fillText(username, (background.width / 2) - (usernameWidth / 2), canvas.height / (6 / 5) - 10);
        context.strokeText(username, (background.width / 2) - (usernameWidth / 2), canvas.height / (6 / 5) - 10);
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
 * Gets the day of the year.
 * 
 * @param {Date} today The today date.
 * @returns The day of the year which is in range [1, 365/366] depending on leap year or not.
 */
const getDayOfTheYear = today => {
    const startOfYear = convertTZ(new Date(today.getFullYear(), 0, 0));
    const diff = today - startOfYear;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
};

/** @param {Client} client */
module.exports = async client => {
    const ids = await getIds();
    const channel = await client.channels.fetch(ids.channels.anuncios).catch(console.error);
    const guild = await client.guilds.fetch(ids.guilds.default).catch(console.error);

    const check = async () => {
        const today = new Date();

        const birthdays = await birthdaySchema.find({ date: { $lt: today } });

        let members;
        let membersIds = [...new Set(birthdays.map(({ _id }) => _id))];

        if (membersIds.length > 0) {
            members = await guild.members.fetch(membersIds).catch(console.error);

            for (const birthday of birthdays) {
                const { _id, date, username } = birthday;

                const member = members.get(_id);

                if (!member) {
                    if (today.getDate() !== date.getDate()) {
                        consoleLog(`> El usuario ${username} ya no está en el servidor, omitiendo saludo de cumpleaños`, CONSOLE_YELLOW);
                        await updateBirthday(_id, date.setYear(date.getFullYear() + 1)).catch(console.error);
                        await updateBirthdays();
                    }
                    continue;
                }

                const attachment = await generateBirthdayImage(member.user).catch(console.error);
                const msg = _id === ids.users.bot ? `@everyone\n\n¡Hoy es mi cumpleaños!`
                    : `@everyone\n\nHoy es el cumpleaños de <@${_id}>, ¡feliz cumpleaños!`;
                const m = await channel.send({ content: msg, files: [attachment] }).catch(console.error);
                for (const emoji of ['🎈', '🥳', '🎉', '🎂']) {
                    await m.react(emoji);
                    await new Promise(res => setTimeout(res, 1000 * 0.5));
                }
                await updateBirthday(_id, date.setYear(date.getFullYear() + 1)).catch(console.error);
                await updateBirthdays();
            }
        }

        const anniversaries = await anniversarySchema.find({ date: { $lt: today } });

        const membersIds1 = [...new Set(anniversaries.map(({ id1 }) => id1))];
        const membersIds2 = [...new Set(anniversaries.map(({ id2 }) => id2))];
        membersIds = membersIds1.concat(membersIds2);

        if (membersIds.length > 0) {
            members = await guild.members.fetch(membersIds).catch(console.error);

            for (const anniversary of anniversaries) {
                const { id1, id2, date, year } = anniversary;

                const member1 = members.get(id1);
                const member2 = members.get(id2);

                if (!member1 || !member2) {
                    if (today.getDate() !== date.getDate()) {
                        consoleLog(`> El usuario con ID ${!member1 ? id1 : id2} ya no está en el servidor, omitiendo saludo de aniversario`, CONSOLE_YELLOW);
                        await updateAnniversary(id1, id2, date.setYear(date.getFullYear() + 1)).catch(console.error);
                    }
                    continue;
                }

                const years = today.getFullYear() - year;
                const m = await channel.send({ content: `@everyone\n\nHoy <@${member1.user.id}> y <@${member2.user.id}> cumplen ${years} años de novios, **¡feliz aniversario!** 💑` }).catch(console.error);
                for (const emoji of ['🥰', '😍', '💏']) {
                    await m.react(emoji);
                    await new Promise(res => setTimeout(res, 1000 * 0.5));
                }
                await updateAnniversary(id1, id2, date.setYear(date.getFullYear() + 1)).catch(console.error);
            }
        }

        const convertedToday = convertTZ(today);
        if (convertedToday.getHours() === 0 && convertedToday.getMinutes() === 0) {
            const date = convertedToday.getDate();
            const month = convertedToday.getMonth() + 1;
            let msg;
            let emojis = [];
            if (getDayOfTheYear(convertedToday) === 256) {
                msg = `@everyone\n\n¡Los dueños de **NCKG** les desean un muy **felíz día del programador** a todos los programadores del servidor! 💻🧠`;
                emojis = ['💻', '🧠', '🤓'];
            }

            if (date === 1 && month === 1) {
                msg = `@everyone\n\n¡Los dueños de **NCKG** les desean un muy **felíz año nuevo** a todos los miembros del servidor! 🥂🌠`;
                emojis = ['🥂', '🌠', '🎆'];
            } else if (date === 14 && month === 2) {
                msg = `@everyone\n\n¡Los dueños de **NCKG** les desean un **felíz día de los enamorados** a todas las parejas del servidor! 💘😍`;
                emojis = ['💘', '😍', '💏'];
            } else if (date === relativeSpecialDays.easter && month === 4) {
                msg = `@everyone\n\n¡Los dueños de **NCKG** les desean unas **felices pascuas** a todos los miembros del servidor! 🐇🥚`;
                emojis = ['🐰', '🥚'];
            } else if (date === 25 && month === 12) {
                msg = `@everyone\n\n¡Los dueños de **NCKG** les desean una **muy felíz navidad** a todos los miembros del servidor! 🎅🏻🎄`;
                emojis = ['🎅🏻', '🎄', '🎁'];
            }

            if (msg) {
                const m = await channel.send(msg);
                for (const emoji of emojis) {
                    await m.react(emoji);
                    await new Promise(res => setTimeout(res, 1000 * 0.5));
                }
            }
        }

        timeouts['alerts-checker'] = setTimeout(check, 1000 * 60);
    };
    check();
};

module.exports.config = {
    displayName: 'Verificador de alertas',
    dbName: 'ALERTS_CHECKER'
};
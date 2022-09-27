const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const chalk = require('chalk');
const { githubRawURL } = require('../../app/constants');
chalk.level = 1;

module.exports = {
    category: 'Cotizaciones',
    description: 'Responde con la cotización del dólar (tomada de DolarHoy).',
    aliases: ['dólar', 'usd'],

    maxArgs: 0,
    slash: 'both',

    callback: async ({ user, message, interaction }) => {
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });
        const urlBase = 'https://dolarhoy.com';
        const variants = {
            oficial: { title: 'Dólar oficial promedio', url: '/cotizaciondolaroficial' },
            blue: { title: 'Dólar Blue', url: '/cotizaciondolarblue' },
            solidario: { title: 'Dólar Solidario', url: '/cotizaciondolarsolidario' }
        };
        let error = false;
        try {
            for (const variant in variants)
                if (Object.hasOwnProperty.call(variants, variant)) {
                    const element = variants[variant];
                    const url = urlBase + element.url;
                    const { data } = await axios.get(url);
                    const $ = cheerio.load(data);
                    const values = $('.tile.is-parent.is-8');
                    for (const child of values.children())
                        if ($(child).children('.topic').text() === 'Compra')
                            element.bid = $(child).children('.value').text().replace('.', ',');
                        else
                            element.ask = $(child).children('.value').text().replace('.', ',');
                }
        } catch (e) {
            error = true;
            console.log(chalk.red(e));
        }

        const reply = {};

        if (error)
            reply.content = `❌ Lo siento <@${user.id}>, pero algo salió mal.`;
        else {
            const variantsField = { name: 'Variante', value: '', inline: true };
            const bidField = { name: 'COMPRA', value: ``, inline: true };
            const askField = { name: 'VENTA', value: ``, inline: true };

            for (const variant in variants)
                if (Object.hasOwnProperty.call(variants, variant)) {
                    const element = variants[variant];
                    variantsField.value += element.title + '\n\n';
                    bidField.value += element.bid ? `ARS${element.bid}\n\n` : '-\n\n';
                    askField.value += `ARS${element.ask}\n\n`;
                }

            reply.embeds = [new EmbedBuilder()
                .setTitle(`**COTIZACIÓN DEL DÓLAR**`)
                .setDescription(`Hola <@${user.id}>, la cotización del dólar es:`)
                .setColor([76, 175, 80])
                .addFields([variantsField, bidField, askField])
                .setThumbnail(`attachment://dolar.png`)
                .setFooter({ text: 'Información obtenida de DolarHoy.' })]
            reply.files = [`${githubRawURL}/assets/thumbs/dolar.png`];
            reply.content = null;
        }

        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const { GITHUB_RAW_URL, CONSOLE_RED } = require('../../src/constants');
const { log } = require('../../src/util');

module.exports = {
    category: 'Cotizaciones',
    description: 'Responde con la cotización del dólar (tomada de DolarHoy).',
    aliases: ['dólar', 'usd'],

    maxArgs: 0,
    slash: 'both',

    callback: async ({ user, message, interaction, instance }) => {
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });
        const urlBase = 'https://dolarhoy.com';
        const variants = {
            oficial: { title: 'Dólar oficial promedio', url: '/cotizaciondolaroficial' },
            blue: { title: 'Dólar Blue', url: '/cotizaciondolarblue' },
            solidario: { title: 'Dólar Solidario', url: '/cotizaciondolarsolidario' }
        };
        let error = false;
        try {
            for (const variant in variants) if (Object.hasOwnProperty.call(variants, variant)) {
                const element = variants[variant];
                const { data } = await axios.get(urlBase + element.url);
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
            log(e, CONSOLE_RED);
        }

        const reply = {};

        if (error)
            reply.content = `❌ Lo siento <@${user.id}>, pero algo salió mal.`;
        else {
            const variantsField = { name: 'Variante', value: '', inline: true };
            const bidField = { name: 'COMPRA', value: ``, inline: true };
            const askField = { name: 'VENTA', value: ``, inline: true };

            for (const variant in variants) if (Object.hasOwnProperty.call(variants, variant)) {
                const { ask, bid, title } = variants[variant];
                variantsField.value += title + '\n\n';
                bidField.value += bid ? `${bid}\n\n` : '-\n\n';
                askField.value += `${ask}\n\n`;
            }

            reply.embeds = [new EmbedBuilder()
                .setTitle(`**COTIZACIÓN DEL DÓLAR**`)
                .setDescription(`Hola <@${user.id}>, la cotización del dólar es:`)
                .setColor(instance.color)
                .addFields([variantsField, bidField, askField])
                .setThumbnail(`${GITHUB_RAW_URL}/assets/thumbs/us-dollar-circled.png`)
                .setFooter({ text: 'Información obtenida de DolarHoy.' })]
            reply.content = null;
        }

        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
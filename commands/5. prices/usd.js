const { ICallbackObject } = require('wokcommands');
const { EmbedBuilder } = require('discord.js');
const { ARGENTINA_TZ_STRING, ARGENTINA_LOCALE_STRING } = require('../../src/constants');
const { getCurrencies } = require('../../src/cache');
const { getCurrencyData, USD_CODE, ARS_CODE, getUSDollarPrices } = require('../../src/currencies');
const { logToFileCommandUsage, formatNumber } = require('../../src/util');

const availableCurrencies = Object.keys(getCurrencies());
availableCurrencies.splice(availableCurrencies.indexOf('usd'), 1);

module.exports = {
    category: 'Cotizaciones',
    description: 'Responde con la cotización del dólar o la de otra moneda que aparezca en los alias.',
    aliases: availableCurrencies,

    maxArgs: 0,
    slash: false,

    /**@param {ICallbackObject} */
    callback: async ({ instance, message, user }) => {
        const cmd = message.content.toLowerCase().split(' ')[0].substring(1);

        logToFileCommandUsage(cmd, null, null, user);

        const reply = { content: '⏳ Procesando acción...' };
        const deferringMessage = await message.reply(reply);

        const { color, imageURL, lastUpdated, name, price } = await getCurrencyData(cmd);
        const embed = new EmbedBuilder();

        let description = `Hola <@${user.id}>, la cotización del **${name}** es`;
        if (cmd === 'usd') {
            description += `:`;

            const dollarData = await getUSDollarPrices();

            if (!dollarData) {
                reply.content = `❌ Lo siento <@${user.id}>, pero algo salió mal.`;
                deferringMessage.edit(reply);
                return;
            }

            const variantsField = { name: 'Variante', value: '', inline: true };
            const bidField = { name: 'COMPRA', value: ``, inline: true };
            const askField = { name: 'VENTA', value: ``, inline: true };

            for (const key in dollarData) if (Object.hasOwnProperty.call(dollarData, key)) {
                const { ask, bid, title } = dollarData[key];
                variantsField.value += title + '\n\n';
                bidField.value += bid ? `**${formatNumber(bid, 2, ARS_CODE)}**\n\n` : '-\n\n';
                askField.value += `**${formatNumber(ask, 2, ARS_CODE)}**\n\n`;
            }

            embed.addFields([variantsField, bidField, askField])
                .setFooter({ text: 'Información obtenida de DolarHoy.' })
        } else {
            const formattedPrice = formatNumber(price, 20, USD_CODE);
            const formattedDate = lastUpdated.toLocaleString(ARGENTINA_LOCALE_STRING, { timeZone: ARGENTINA_TZ_STRING });
            description += ` **${formattedPrice}**.\n\n*Actualizado por última vez el ${formattedDate}.*`;
        }

        reply.content = null;
        reply.embeds = [embed.setTitle(name)
            .setDescription(description)
            .setColor(color || instance.color)
            .setThumbnail(imageURL)];

        deferringMessage.edit(reply);
        return;
    }
}
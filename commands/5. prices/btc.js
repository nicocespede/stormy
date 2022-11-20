const { EmbedBuilder } = require('discord.js');
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();
const { currencies } = require('../../src/constants');

const availableCurrencies = Object.keys(currencies);
availableCurrencies.splice(availableCurrencies.indexOf('btc'), 1);

module.exports = {
    category: 'Cotizaciones',
    description: 'Responde con la cotización del Bitcoin (tomada de CoinGecko) o la de otra moneda que aparezca en los alias.',
    aliases: availableCurrencies,

    maxArgs: 0,
    slash: false,

    callback: async ({ user, message }) => {
        const cmd = message.content.toLowerCase().split(' ')[0].substring(1);
        const coinID = currencies[cmd].id;
        const color = currencies[cmd].color;
        const { data } = await CoinGeckoClient.coins.fetch(coinID, {});
        const currency = data.localization.es;
        const imageURL = data.image.large;
        const { market_data } = data;
        const price = market_data.current_price.usd;
        const date = new Date(market_data.last_updated);
        return {
            custom: true,
            embeds: [new EmbedBuilder()
                .setTitle(`**${currency}**`)
                .setDescription(`Hola <@${user.id}>, la cotización del **${currency}** es **${price.toLocaleString('es-AR', { currency: 'USD', style: "currency", maximumFractionDigits: 20 })}**.\n\n*Actualizado por última vez el ${date.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}.*`)
                .setColor(color)
                .setThumbnail(imageURL)]
        };
    }
}
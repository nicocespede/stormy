const { EmbedBuilder } = require('discord.js');
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();
const { currencies } = require('../../app/constants');
const { getAvailableCurrencies } = require('../../app/general');

const availableCurrencies = getAvailableCurrencies();
availableCurrencies.splice(availableCurrencies.indexOf('btc'), 1)

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
        let data = await CoinGeckoClient.coins.fetch(coinID, {});
        data = data.data;
        const currency = data.localization.es;
        const imageURL = data.image.large;
        data = data.market_data;
        const price = data.current_price.usd;
        const date = new Date(data.last_updated);
        return {
            custom: true,
            embeds: [new EmbedBuilder()
                .setTitle(`**${currency}**`)
                .setDescription(`Hola <@${user.id}>, la cotización del **${currency}** es **US$ ${price}**.\n\n*Actualizado por última vez el ${date.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}.*`)
                .setColor(color)
                .setThumbnail(imageURL)]
        };
    }
}
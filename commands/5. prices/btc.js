const { MessageEmbed } = require('discord.js');
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();
const { currencies } = require('../../app/cache');

module.exports = {
    category: 'Cotizaciones',
    description: 'Responde con la cotización del Bitcoin (tomada de CoinGecko) o la de otra moneda que aparezca en los alias.',
    aliases: ['doge', 'eth', 'pvu', 'slp', 'bnb'],

    maxArgs: 0,
    slash: false,

    callback: async ({ user, message }) => {
        var cmd = message.content.split(' ')[0].substring(1);
        var coinID = currencies[cmd].id;
        var color = currencies[cmd].color;
        let data = await CoinGeckoClient.coins.fetch(coinID, {});
        data = data.data;
        var currency = data.localization.es;
        var imageURL = data.image.large;
        data = data.market_data;
        var price = data.current_price.usd;
        var date = new Date(data.last_updated);
        message.reply({
            embeds: [new MessageEmbed()
                .setTitle(`**${currency}**`)
                .setDescription(`Hola <@${user.id}>, la cotización del **${currency}** es **US$ ${price}**.\n\n*Actualizado por última vez el ${date.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}.*`)
                .setColor(color)
                .setThumbnail(imageURL)],
            ephemeral: true
        });
        return;
    }
}
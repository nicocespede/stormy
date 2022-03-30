const { MessageEmbed, MessageAttachment } = require('discord.js');
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();
const { currencies } = require('../../app/cache');
const convert = require('xml-js');
const axios = require('axios');
const Canvas = require('canvas');

function formatNumber(value, decimalPlaces) {
    let decimals = decimalPlaces || 2;
    let convertedValue = parseFloat(value.replace('.', '').replace(',', '.'));
    return !isNaN(convertedValue) ? convertedValue.toFixed(decimals) : 'No cotiza';
}

module.exports = {
    category: 'Cotizaciones',
    description: 'Responde con la conversión de la moneda correspondiente a pesos argentinos.',

    options: [
        {
            name: 'moneda',
            description: 'La moneda desde la que se quiere convertir a pesos argentinos.',
            required: true,
            type: 'STRING'
        }, {
            name: 'cantidad',
            description: 'La cantidad que se quiere convertir a pesos argentinos.',
            required: true,
            type: 'NUMBER'
        }],

    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '<moneda> <cantidad>',
    slash: 'both',

    callback: async ({ client, args, user, message, interaction }) => {
        if (message) var messageOrInteraction = message;
        else if (interaction) var messageOrInteraction = interaction;
        var quantity = parseFloat(args[1]);
        if (!Object.keys(currencies).includes(args[0]) && args[0] != 'dolar' && args[0] != 'usd') {
            messageOrInteraction.reply({ content: `¡Uso incorrecto! La moneda seleccionada es inválida.\n\nLas monedas disponibles son: _usd, ${Object.keys(currencies).join(', ')}_.`, ephemeral: true });
            return;
        } else if (isNaN(quantity)) {
            messageOrInteraction.reply({ content: `¡Uso incorrecto! La cantidad ingresada es inválida.`, ephemeral: true });
            return;
        } else {
            const canvas = Canvas.createCanvas(500, 250);
            const context = canvas.getContext('2d');
            const dataDolar = await axios.get("https://www.dolarsi.com/api/dolarSiInfo.xml")
            const json = convert.xml2json(dataDolar.data, { compact: true, spaces: 4 });
            const jsonParsed = JSON.parse(json);
            var swapImage = await Canvas.loadImage(`./assets/custom/swap.png`);
            var pesoImage = await Canvas.loadImage(`./assets/custom/peso.png`);

            var usdPrice = formatNumber(jsonParsed.cotiza.Dolar.casa380.venta._text);
            if (args[0] != 'dolar' && args[0] != 'usd') {
                var coinID = currencies[args[0]].id;
                var color = currencies[args[0]].color;
                let data = await CoinGeckoClient.coins.fetch(coinID, {});
                data = data.data;
                var currency = data.localization.es;
                var imageURL = data.image.large;
                data = data.market_data;
                var coinPrice = data.current_price.usd;
                var finalPrice = (coinPrice * usdPrice * quantity).toFixed(2);
            } else {
                var currency = 'Dólares';
                var color = [76, 175, 80];
                var imageURL = './assets/thumbs/dolar.png';
                var finalPrice = (usdPrice * quantity).toFixed(2);
            }
            var coinImage = await Canvas.loadImage(imageURL);

            context.drawImage(swapImage, (canvas.width / 2) - 50, (canvas.height / 2) - 50, 100, 100);
            context.drawImage(pesoImage, canvas.width - 175, (canvas.height / 2) - 75, 150, 150);
            context.drawImage(coinImage, 25, (canvas.height / 2) - 75, 150, 150);

            messageOrInteraction.reply({
                embeds: [new MessageEmbed()
                    .setTitle(`Conversión de ${currency} a Pesos Argentinos`)
                    .setDescription(`Hola <@${user.id}>, la conversión de **${args[1]} ${currency}** a Pesos Argentinos es: **ARS$ ${finalPrice}**.\n\nValores tomados en cuenta:\n\n${coinID ? '**• ' + currency + ':** USD$ ' + coinPrice + '\n' : ''}**• Dólar blue (venta):** ARS$ ${usdPrice}`)
                    .setColor(color)
                    .setImage('attachment://image.png')
                    .setThumbnail(client.user.avatarURL())],
                files: [new MessageAttachment(canvas.toBuffer('image/png'), 'image.png')],
                ephemeral: true
            });
        }
        return;
    }
}
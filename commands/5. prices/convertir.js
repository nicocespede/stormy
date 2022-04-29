const { MessageEmbed, MessageAttachment, Constants } = require('discord.js');
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();
const { currencies } = require('../../app/constants');
const convert = require('xml-js');
const axios = require('axios');
const Canvas = require('canvas');
const { getAvailableCurrencies } = require('../../app/general');

const availableCurrencies = ['usd'].concat(getAvailableCurrencies());

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
            type: Constants.ApplicationCommandOptionTypes.STRING,
            choices: availableCurrencies.map(currency => ({ name: currency, value: currency }))
        }, {
            name: 'cantidad',
            description: 'La cantidad que se quiere convertir a pesos argentinos.',
            required: true,
            type: Constants.ApplicationCommandOptionTypes.NUMBER
        }],

    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '<moneda> <cantidad>',
    slash: 'both',

    callback: async ({ client, args, user, message, interaction }) => {
        const argsCurrency = message ? args[0] : interaction.options.getString('moneda');
        const quantity = message ? parseFloat(args[1]) : interaction.options.getNumber('cantidad');
        var reply = { custom: true, ephemeral: true };
        if (!availableCurrencies.includes(argsCurrency))
            reply.content = `¡Uso incorrecto! La moneda seleccionada es inválida.\n\nLas monedas disponibles son: _${availableCurrencies.join(', ')}_. Si querés la cotización de otra moneda, no dudes en pedirla.`;
        else if (isNaN(quantity) || quantity < 0)
            reply.content = `¡Uso incorrecto! La cantidad ingresada es inválida.`;
        else {
            const canvas = Canvas.createCanvas(500, 250);
            const context = canvas.getContext('2d');
            const dataDolar = await axios.get("https://www.dolarsi.com/api/dolarSiInfo.xml")
            const json = convert.xml2json(dataDolar.data, { compact: true, spaces: 4 });
            const jsonParsed = JSON.parse(json);
            const swapImage = await Canvas.loadImage(`./assets/swap.png`);
            const pesoImage = await Canvas.loadImage(`./assets/peso.png`);

            var usdPrice = formatNumber(jsonParsed.cotiza.Dolar.casa380.venta._text);
            if (argsCurrency != 'usd') {
                var coinID = currencies[argsCurrency].id;
                var color = currencies[argsCurrency].color;
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
            const coinImage = await Canvas.loadImage(imageURL);

            context.drawImage(swapImage, (canvas.width / 2) - 50, (canvas.height / 2) - 50, 100, 100);
            context.drawImage(pesoImage, canvas.width - 175, (canvas.height / 2) - 75, 150, 150);
            context.drawImage(coinImage, 25, (canvas.height / 2) - 75, 150, 150);

            reply.embeds = [new MessageEmbed()
                .setTitle(`Conversión de ${currency} a Pesos Argentinos`)
                .setDescription(`Hola <@${user.id}>, la conversión de **${quantity} ${currency}** a Pesos Argentinos es: **ARS$ ${finalPrice}**.\n\nValores tomados en cuenta:\n\n${coinID ? '**• ' + currency + ':** USD$ ' + coinPrice + '\n' : ''}**• Dólar blue (venta):** ARS$ ${usdPrice}`)
                .setColor(color)
                .setImage('attachment://image.png')
                .setThumbnail(client.user.avatarURL())];
            reply.files = [new MessageAttachment(canvas.toBuffer('image/png'), 'image.png')];
        }
        return reply;
    }
}
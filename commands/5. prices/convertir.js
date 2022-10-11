const { EmbedBuilder, AttachmentBuilder, ApplicationCommandOptionType } = require('discord.js');
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();
const axios = require('axios');
const cheerio = require('cheerio');
const Canvas = require('canvas');
const chalk = require('chalk');
chalk.level = 1;
const { currencies, githubRawURL } = require('../../app/constants');
const { getIds, updateIds } = require('../../app/cache');

const availableCurrencies = ['usd'].concat(Object.keys(currencies));

const formatNumber = (value, decimalPlaces) => value.toLocaleString('es-AR', { maximumFractionDigits: decimalPlaces });

module.exports = {
    category: 'Cotizaciones',
    description: 'Responde con la conversión de la moneda correspondiente a pesos argentinos.',

    options: [
        {
            name: 'moneda',
            description: 'La moneda desde la que se quiere convertir a pesos argentinos.',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: availableCurrencies.map(currency => ({ name: currency, value: currency }))
        }, {
            name: 'cantidad',
            description: 'La cantidad que se quiere convertir a pesos argentinos.',
            required: true,
            type: ApplicationCommandOptionType.Number
        }],

    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '<moneda> <cantidad>',
    slash: 'both',

    callback: async ({ client, args, user, message, interaction, instance, guild }) => {
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });
        const argsCurrency = message ? args[0] : interaction.options.getString('moneda');
        const quantity = message ? parseFloat(args[1]) : interaction.options.getNumber('cantidad');
        const reply = {};
        if (!availableCurrencies.includes(argsCurrency)) {
            const ids = getIds() || await updateIds();
            reply.content = instance.messageHandler.get(guild, 'INVALID_CURRENCY', {
                CURRENCIES: availableCurrencies.join(', '),
                ID: ids.users.stormer
            });
        } else if (isNaN(quantity) || quantity < 0)
            reply.content = `⚠ La cantidad ingresada es inválida.`;
        else {
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
                        const values = $('.tile.is-parent.is-8').children();
                        const filtered = values.filter((_, child) => $(child).children('.topic').text() === 'Venta')[0];
                        element.ask = parseFloat($(filtered).children('.value').text().substring(1));
                    }
            } catch (e) {
                error = true;
                console.log(chalk.red(e));
            }

            if (error)
                reply.content = `❌ Lo siento <@${user.id}>, pero algo salió mal.`;
            else {
                const canvas = Canvas.createCanvas(500, 250);
                const context = canvas.getContext('2d');
                const swapImage = await Canvas.loadImage(`${githubRawURL}/assets/currencies/sorting-arrows-horizontal.png`);
                const pesoImage = await Canvas.loadImage(`${githubRawURL}/assets/currencies/peso.png`);

                const variantsField = { name: 'Variante', value: '', inline: true };
                const valuesField = { name: 'Conversión', value: ``, inline: true };
                const pricesField = { name: 'Valores tomados en cuenta:', value: `` };
                let coinID;
                let currency = 'Dólares';
                let imageURL = `${githubRawURL}/assets/thumbs/us-dollar-circled.png`;
                let coinPrice;

                if (argsCurrency != 'usd') {
                    coinID = currencies[argsCurrency].id;
                    let data = await CoinGeckoClient.coins.fetch(coinID, {});
                    data = data.data;
                    currency = data.localization.es;
                    imageURL = data.image.large;
                    data = data.market_data;
                    coinPrice = data.current_price.usd;
                    pricesField.value += '• ' + currency + ': **USD$ ' + formatNumber(coinPrice, 4) + '**\n\n';
                }
                const coinImage = await Canvas.loadImage(imageURL);

                context.drawImage(swapImage, (canvas.width / 2) - 50, (canvas.height / 2) - 50, 100, 100);
                context.drawImage(pesoImage, canvas.width - 175, (canvas.height / 2) - 75, 150, 150);
                context.drawImage(coinImage, 25, (canvas.height / 2) - 75, 150, 150);

                for (const variant in variants)
                    if (Object.hasOwnProperty.call(variants, variant)) {
                        const element = variants[variant];
                        const finalPrice = coinID ? coinPrice * element.ask * quantity : element.ask * quantity;
                        variantsField.value += element.title + '\n\n';
                        valuesField.value += `**ARS$ ` + formatNumber(finalPrice, 2) + `**\n\n`;
                        pricesField.value += `• ${element.title} (venta): **ARS$ ${formatNumber(element.ask, 2)}**\n\n`;
                    }

                reply.embeds = [new EmbedBuilder()
                    .setTitle(`Conversión de ${currency} a Pesos Argentinos`)
                    .setDescription(`Hola <@${user.id}>, la conversión de **${quantity} ${currency}** a Pesos Argentinos es:`)
                    .setFields([variantsField, valuesField, pricesField])
                    .setColor(instance.color)
                    .setImage('attachment://image.png')
                    .setThumbnail(`${githubRawURL}/assets/thumbs/exchange.png`)
                    .setFooter({ text: 'Cotización del dólar obtenida de DolarHoy.' })];
                reply.files = [new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'image.png' })];
                reply.content = null;
            }
        }
        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
        return;
    }
}
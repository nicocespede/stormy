const { EmbedBuilder, AttachmentBuilder, ApplicationCommandOptionType } = require('discord.js');
const { ICallbackObject } = require('wokcommands');
const Canvas = require('canvas');
const { ARGENTINA_LOCALE_STRING } = require('../../src/constants');
const { getIds, getGithubRawUrl, getCurrencies } = require('../../src/cache');
const { getCurrencyData, getUSDollarPrices, USD_CODE, ARS_CODE } = require('../../src/currencies');
const { formatNumber } = require('../../src/util');

const currencies = getCurrencies();
const availableCurrencies = Object.keys(currencies);

module.exports = {
    category: 'Cotizaciones',
    description: 'Responde con la conversión de la moneda correspondiente a pesos argentinos.',

    options: [
        {
            name: 'moneda',
            description: 'La moneda desde la que se quiere convertir a pesos argentinos.',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: availableCurrencies.map(currency => ({ name: currency.toUpperCase(), value: currency }))
        }, {
            name: 'cantidad',
            description: 'La cantidad que se quiere convertir a pesos argentinos.',
            required: true,
            type: ApplicationCommandOptionType.String
        }],

    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '<moneda> <cantidad>',
    slash: 'both',

    /**@param {ICallbackObject} */
    callback: async ({ args, user, message, interaction, instance, guild }) => {
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });
        const argsCurrency = message ? args[0] : interaction.options.getString('moneda');
        const quantity = parseFloat((message ? args[1] : interaction.options.getString('cantidad')).replace(',', '.'));
        const reply = {};

        if (!availableCurrencies.includes(argsCurrency)) {
            const ids = await getIds();
            reply.content = instance.messageHandler.get(guild, 'INVALID_CURRENCY', {
                CURRENCIES: availableCurrencies.join(', '),
                ID: ids.users.stormer
            });
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }

        if (isNaN(quantity) || quantity < 0) {
            reply.content = `⚠ La cantidad ingresada es inválida.`;
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }

        const dollarData = await getUSDollarPrices();

        if (!dollarData) {
            reply.content = `❌ Lo siento <@${user.id}>, pero algo salió mal.`;
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
            return;
        }

        const variantsField = { name: 'Variante', value: '', inline: true };
        const valuesField = { name: 'Conversión', value: ``, inline: true };
        const pricesField = { name: 'Valores tomados en cuenta:', value: `` };

        const { imageURL, name, price } = await getCurrencyData(argsCurrency);
        if (price)
            pricesField.value += `• ${name}: **${formatNumber(price, 4, USD_CODE)}**\n\n`;

        for (const key in dollarData) if (Object.hasOwnProperty.call(dollarData, key)) {
            const { ask, title } = dollarData[key];
            const finalPrice = price ? price * ask * quantity : ask * quantity;
            variantsField.value += title + '\n\n';
            valuesField.value += `**${formatNumber(finalPrice, 2, ARS_CODE)}**\n\n`;
            pricesField.value += `• ${title} (venta): **${formatNumber(ask, 2, ARS_CODE)}**\n\n`;
        }

        const swapImage = await Canvas.loadImage(await getGithubRawUrl(`assets/currencies/sorting-arrows-horizontal.png`));
        const pesoImage = await Canvas.loadImage(await getGithubRawUrl(`assets/currencies/peso.png`));
        const coinImage = await Canvas.loadImage(imageURL);

        const canvas = Canvas.createCanvas(500, 250);
        const context = canvas.getContext('2d');
        const halfHeight = canvas.height / 2;
        context.drawImage(swapImage, (canvas.width / 2) - 50, halfHeight - 50, 100, 100);
        context.drawImage(pesoImage, canvas.width - 175, halfHeight - 75, 150, 150);
        context.drawImage(coinImage, 25, halfHeight - 75, 150, 150);

        reply.embeds = [new EmbedBuilder()
            .setTitle(`Conversión de ${name} a Pesos Argentinos`)
            .setDescription(`Hola <@${user.id}>, la conversión de **${quantity.toLocaleString(ARGENTINA_LOCALE_STRING)} ${name}** a Pesos Argentinos es:`)
            .setFields([variantsField, valuesField, pricesField])
            .setColor(instance.color)
            .setImage('attachment://image.png')
            .setThumbnail(await getGithubRawUrl(`assets/thumbs/exchange.png`))
            .setFooter({ text: 'Cotización del dólar obtenida de DolarHoy.' })];
        reply.files = [new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'image.png' })];
        reply.content = null;

        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
    }
}
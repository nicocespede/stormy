const { EmbedBuilder } = require('discord.js');
const convert = require('xml-js');
const axios = require('axios');
const chalk = require('chalk');

function formatNumber(value, decimalPlaces) {
    let decimals = decimalPlaces || 2;
    let convertedValue = parseFloat(value.replace('.', '').replace(',', '.'));
    return !isNaN(convertedValue) ? convertedValue.toFixed(decimals) : 'No cotiza';
}

module.exports = {
    category: 'Cotizaciones',
    description: 'Responde con la cotización del dólar (tomada de DolarHoy).',
    aliases: ['dólar', 'usd'],

    maxArgs: 0,
    slash: 'both',

    callback: async ({ user }) => {
        var reply = { custom: true, ephemeral: true };
        try {
            const dataDolar = await axios.get("https://www.dolarsi.com/api/dolarSiInfo.xml")
            const json = convert.xml2json(dataDolar.data, { compact: true, spaces: 4 });
            const jsonParsed = JSON.parse(json);
            const ofBidPrice = formatNumber(jsonParsed.cotiza.Dolar.casa344.compra._text);
            const ofAskPrice = formatNumber(jsonParsed.cotiza.Dolar.casa344.venta._text);
            const blBidPrice = formatNumber(jsonParsed.cotiza.Dolar.casa380.compra._text);
            const blAskPrice = formatNumber(jsonParsed.cotiza.Dolar.casa380.venta._text);
            const fields = [
                { name: 'Variante', value: '🟢 Dólar oficial:\n\n🔵 Dólar blue:', inline: true },
                { name: 'COMPRA', value: `ARS$ ${ofBidPrice}\n\nARS$ ${blBidPrice}`, inline: true },
                { name: 'VENTA', value: `ARS$ ${ofAskPrice}\n\nARS$ ${blAskPrice}`, inline: true }
            ];
            reply.embeds = [new EmbedBuilder()
                .setTitle(`**COTIZACIÓN DEL DÓLAR**`)
                .setDescription(`Hola <@${user.id}>, la cotización del dólar es:`)
                .setColor([76, 175, 80])
                .addFields(fields)
                .setThumbnail(`attachment://dolar.png`)];
            reply.files = [`assets/thumbs/dolar.png`];
        } catch (e) {
            reply.content = `Lo siento <@${user.id}>, pero algo salió mal.`;
            console.log(chalk.red(e));
        }
        return reply;
    }
}
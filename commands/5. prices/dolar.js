const { EmbedBuilder } = require('discord.js');
const { getGithubRawUrl } = require('../../src/cache');
const { getUSDollarPrices, ARS_CODE } = require('../../src/currencies');
const { formatNumber } = require('../../src/util');

module.exports = {
    category: 'Cotizaciones',
    description: 'Responde con la cotización del dólar (tomada de DolarHoy).',
    aliases: ['dólar', 'usd'],

    maxArgs: 0,
    slash: 'both',

    callback: async ({ user, message, interaction, instance }) => {
        const deferringMessage = message ? await message.reply({ content: 'Procesando acción...' }) : await interaction.deferReply({ ephemeral: true });
        const reply = {};

        const dollarData = await getUSDollarPrices();

        if (!dollarData) {
            reply.content = `❌ Lo siento <@${user.id}>, pero algo salió mal.`;
            message ? deferringMessage.edit(reply) : interaction.editReply(reply);
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

        reply.embeds = [new EmbedBuilder()
            .setTitle(`**COTIZACIÓN DEL DÓLAR**`)
            .setDescription(`Hola <@${user.id}>, la cotización del dólar es:`)
            .setColor(instance.color)
            .addFields([variantsField, bidField, askField])
            .setThumbnail(await getGithubRawUrl('assets/thumbs/us-dollar-circled.png'))
            .setFooter({ text: 'Información obtenida de DolarHoy.' })]
        reply.content = null;

        message ? deferringMessage.edit(reply) : interaction.editReply(reply);
    }
}
const { Currency, USDollarData } = require('./typedefs');
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();
const axios = require('axios');
const cheerio = require('cheerio');
const { getCurrencies, getGithubRawUrl } = require("./cache");
const { consoleLogError, logToFileError } = require('./util');

const MODULE_NAME = 'src.currencies';
const DOLAR_HOY_BASE_URL = 'https://dolarhoy.com';

/**
 * Gets the ask and bid prices of a currency from Dolar Hoy.
 * 
 * @param {String} url The URL to retrieve the data from.
 * @returns The ask and bid prices of a currency.
 */
const getAskAndBid = async url => {
    const ret = {};
    try {
        const { data } = await axios.get(DOLAR_HOY_BASE_URL + url);
        const $ = cheerio.load(data);

        const values = $('.tile.is-parent.is-8');
        for (const child of values.children())
            if ($(child).children('.topic').text() === 'Compra')
                ret.bid = parseFloat($(child).children('.value').text().substring(1));
            else
                ret.ask = parseFloat($(child).children('.value').text().substring(1));

        return ret;
    } catch (e) {
        consoleLogError('> Error al obtener cotizaciones de ' + DOLAR_HOY_BASE_URL + url);
        logToFileError(MODULE_NAME + '.getAskAndBid', e);
        return null;
    }
};

module.exports = {

    ARS_CODE: 'ARS',
    ARS_NAME: 'Peso argentino',
    USD_CODE: 'USD',

    /**
     * Gets or retrieves the data of a currency.
     * 
     * @param {String} currencyId The ID of the currency.
     * @returns The currency data object.
     */
    getCurrencyData: async currencyId => {
        const currencies = getCurrencies();
        const { color, id } = currencies[currencyId];

        /**@type {Currency}*/
        const ret = { color };

        if (id) {
            const { data } = await CoinGeckoClient.coins.fetch(id, {});
            ret.name = data.localization.es;
            ret.imageURL = data.image.large;
            const { market_data } = data;
            ret.price = market_data.current_price.usd;
            ret.lastUpdated = new Date(market_data.last_updated);
        } else {
            const { image, localization } = currencies[currencyId];
            ret.name = localization.es;
            ret.imageURL = await getGithubRawUrl(image.large);
        }

        return ret;
    },

    /**
     * Gets the prices of the different US Dollar variants in Argentina.
     * 
     * @returns The prices object.
     */
    getUSDollarPrices: async () => {
        /**@type {USDollarData}*/
        const variants = {
            oficial: { title: 'Dólar oficial promedio', url: '/cotizaciondolaroficial' },
            blue: { title: 'Dólar Blue', url: '/cotizaciondolarblue' },
            solidario: { title: 'Dólar Solidario', url: '/cotizaciondolarsolidario' }
        };

        for (const key in variants) if (Object.hasOwnProperty.call(variants, key)) {
            const variant = variants[key];

            const askAndBid = await getAskAndBid(variant.url);

            if (!askAndBid)
                return null;

            const { ask, bid } = askAndBid;

            variant.ask = ask;
            variant.bid = bid;
        }

        return variants;
    },

    /**
     * Gets the prices of the Euro.
     * 
     * @returns The prices object.
     */
    getEuroPrices: async () => {
        const askAndBid = await getAskAndBid('/cotizacion-euro');

        if (!askAndBid)
            return null;

        return askAndBid;
    }
}
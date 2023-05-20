const { Currency, USDollarData } = require('./typedefs');
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();
const axios = require('axios');
const cheerio = require('cheerio');
const { getCurrencies, getGithubRawUrl } = require("./cache");
const { consoleLogError, logToFileError } = require('./util');

const MODULE_NAME = 'src.currencies';
const DOLAR_HOY_BASE_URL = 'https://dolarhoy.com';

module.exports = {

    ARS_CODE: 'ARS',
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

        try {
            for (const key in variants) if (Object.hasOwnProperty.call(variants, key)) {
                const variant = variants[key];

                const { data } = await axios.get(DOLAR_HOY_BASE_URL + variant.url);
                const $ = cheerio.load(data);

                const values = $('.tile.is-parent.is-8');
                for (const child of values.children())
                    if ($(child).children('.topic').text() === 'Compra')
                        variant.bid = parseFloat($(child).children('.value').text().substring(1));
                    else
                        variant.ask = parseFloat($(child).children('.value').text().substring(1));
            }

            return variants;
        } catch (e) {
            consoleLogError('> Error al obtener cotizaciones del dólar');
            logToFileError(MODULE_NAME + '.getUSDollarPrices', e);
            return null;
        }
    }
}
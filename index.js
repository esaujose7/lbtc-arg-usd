const cheerio = require("cheerio");
const fetch = require("node-fetch");
const LOCALBITCOINS_ENDPOINT =
  "https://localbitcoins.com/buy-bitcoins-online/ars/c/bank-transfers/";
const BITCOIN_PRICE_ENDPOINT = "https://api.coinbase.com/v2/prices/BTC-USD/buy";

// TODO: Handle bad requests
const getHTMLfromSource = async () => {
  const request = await fetch(LOCALBITCOINS_ENDPOINT);
  const html = await request.text();
  return html;
};

const getBitcoinPriceInUSD = async () => {
  const request = await fetch(BITCOIN_PRICE_ENDPOINT);
  const response = await request.json();
  const {
    data: { amount }
  } = response;
  return amount;
};

const parseTopPricesFromSource = async () => {
  const $ = cheerio.load(await getHTMLfromSource());
  const nodes = [];
  $("tr.clickable > td.column-price").each(function(i, elem) {
    nodes[i] = parseInt(
      $(this)
        .html()
        .trim()
        .replace("ARS", "")
        .trim()
        .replace(",", ".")
        .replace(".", "")
    );
  });
  return nodes;
};

const getAveragePriceFromTopPrices = async limit => {
  const prices = await parseTopPricesFromSource();
  const pricesLimitted = prices.slice(0, limit);
  return parseFloat(
    pricesLimitted.reduce((previous, current) => previous + current, 0) /
      pricesLimitted.length
  ).toFixed(2);
};

const getPrice = async limit => {
  const btcPrice = await getBitcoinPriceInUSD();
  console.log(
    ((await getAveragePriceFromTopPrices(limit)) / btcPrice).toFixed(2)
  );
};

getPrice(process.argv[2] || 10);

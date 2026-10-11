'use strict';

/** Simple symbol → CoinGecko id map for MVP demos. */
const COINGECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  USDT: 'tether',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  TON: 'the-open-network',
  XRP: 'ripple',
  DOGE: 'dogecoin',
};

async function getCryptoQuote({ symbol, vs = 'usd' }) {
  const id = COINGECKO_IDS[symbol.toUpperCase()];
  if (!id) {
    const err = new Error(
      `Unsupported symbol "${symbol}". Supported: ${Object.keys(COINGECKO_IDS).join(', ')}`
    );
    err.status = 400;
    throw err;
  }

  const vsCurrency = vs.toLowerCase();
  const url = new URL('https://api.coingecko.com/api/v3/simple/price');
  url.searchParams.set('ids', id);
  url.searchParams.set('vs_currencies', vsCurrency);

  const response = await fetch(url);
  if (!response.ok) {
    const err = new Error(`Crypto upstream error: ${response.status}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  const price = data?.[id]?.[vsCurrency];
  if (price == null) {
    const err = new Error(`No price for ${symbol}/${vsCurrency}`);
    err.status = 502;
    throw err;
  }

  return {
    symbol: symbol.toUpperCase(),
    vs: vsCurrency.toUpperCase(),
    price,
    source: 'coingecko',
    timestamp: new Date().toISOString(),
    disclaimer:
      'Reference price only. Not a trading signal. Markets are volatile; you can lose money.',
  };
}

module.exports = { getCryptoQuote, COINGECKO_IDS };

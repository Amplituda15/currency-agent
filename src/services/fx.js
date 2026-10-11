'use strict';

async function convertFiat({ from, to, amount }) {
  const url = new URL('https://api.frankfurter.app/latest');
  url.searchParams.set('from', from.toUpperCase());
  url.searchParams.set('to', to.toUpperCase());

  const response = await fetch(url);
  if (!response.ok) {
    const err = new Error(`FX upstream error: ${response.status}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  const rate = data.rates?.[to.toUpperCase()];
  if (rate == null) {
    const err = new Error(`Unknown or unsupported currency pair: ${from}/${to}`);
    err.status = 400;
    throw err;
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    const err = new Error('amount must be a non-negative number');
    err.status = 400;
    throw err;
  }

  return {
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    amount: numericAmount,
    rate,
    converted: Number((numericAmount * rate).toFixed(6)),
    source: 'frankfurter',
    asOf: data.date || null,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { convertFiat };

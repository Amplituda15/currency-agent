'use strict';

const express = require('express');
const { config } = require('./config');
const { router } = require('./routes/api');
const { startAlertLoop } = require('./services/alerts');

const app = express();
app.use(express.json());
app.use(router);

app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found',
    hint: 'GET /health for available endpoints',
  });
});

const server = app.listen(config.port, () => {
  console.log(`AgentFX listening on http://localhost:${config.port}`);
  console.log(`Health:   GET  /health`);
  console.log(`Fiat:     GET  /convert?from=USD&to=EUR&amount=100`);
  console.log(`Crypto:   GET  /crypto?symbol=BTC&vs=usd`);
  console.log(`Alerts:   POST /alerts  { "symbol":"BTC","op":"gte","threshold":100000 }`);
  if (config.x402DevBypass) {
    console.log('x402: DEV BYPASS enabled (X402_DEV_BYPASS=1) — do not use in production');
  } else {
    console.log(`x402: pay-to ${config.paymentWallet} (${config.priceAtomic} atomic USDC / request)`);
  }
  startAlertLoop();
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

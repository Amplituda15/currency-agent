'use strict';

const express = require('express');
const { requirePayment } = require('../middleware/x402');
const { convertFiat } = require('../services/fx');
const { getCryptoQuote, COINGECKO_IDS } = require('../services/cryptoPrices');
const {
  listAlerts,
  listFirings,
  createAlert,
  deleteAlert,
  checkAlertsOnce,
} = require('../services/alerts');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    name: 'AgentFX',
    version: '0.1.0',
    product:
      'Micropayment FX & crypto rate agent with price-alert tooling (not a trading bot).',
    endpoints: [
      'GET /health',
      'GET /convert?from=&to=&amount=',
      'GET /crypto?symbol=&vs=',
      'GET /alerts',
      'POST /alerts',
      'DELETE /alerts/:id',
      'GET /alerts/firings',
      'POST /alerts/check',
    ],
  });
});

router.get('/convert', requirePayment('AgentFX fiat conversion — one request'), async (req, res) => {
  const { from, to, amount } = req.query;
  if (!from || !to || amount == null) {
    return res.status(400).json({
      error: 'Missing parameters. Use: /convert?from=USD&to=EUR&amount=100',
    });
  }

  try {
    const result = await convertFiat({ from, to, amount });
    res.json({
      ...result,
      payment: req.payment,
      disclaimer: 'Reference FX rate only. Not financial advice.',
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Conversion failed' });
  }
});

router.get('/crypto', requirePayment('AgentFX crypto quote — one request'), async (req, res) => {
  const symbol = req.query.symbol || req.query.from;
  const vs = req.query.vs || 'usd';
  if (!symbol) {
    return res.status(400).json({
      error: 'Missing symbol. Use: /crypto?symbol=BTC&vs=usd',
      supported: Object.keys(COINGECKO_IDS),
    });
  }

  try {
    const quote = await getCryptoQuote({ symbol, vs });
    res.json({ ...quote, payment: req.payment });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Quote failed' });
  }
});

router.get('/alerts', (_req, res) => {
  res.json({
    alerts: listAlerts(),
    freeTierLimitNote: 'MVP stores alerts in memory; paid subscription planned for higher limits.',
  });
});

router.get('/alerts/firings', (_req, res) => {
  res.json({ firings: listFirings() });
});

router.post('/alerts', (req, res) => {
  try {
    const alert = createAlert({
      symbol: req.body.symbol,
      op: req.body.op,
      threshold: req.body.threshold,
      webhookUrl: req.body.webhookUrl,
    });
    res.status(201).json({
      alert,
      disclaimer:
        'Alerts are tooling/notifications only. No guaranteed returns. You can lose money trading crypto.',
    });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || 'Could not create alert',
      code: err.code,
    });
  }
});

router.delete('/alerts/:id', (req, res) => {
  const ok = deleteAlert(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Alert not found' });
  res.json({ deleted: true, id: req.params.id });
});

router.post('/alerts/check', async (_req, res) => {
  try {
    const fired = await checkAlertsOnce();
    res.json({ checked: true, fired });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Check failed' });
  }
});

module.exports = { router };

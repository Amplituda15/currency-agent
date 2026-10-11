'use strict';

const { randomUUID } = require('crypto');
const { config } = require('../config');
const { getCryptoQuote } = require('./cryptoPrices');

/** @type {Map<string, object>} */
const alerts = new Map();
/** @type {object[]} */
const firings = [];

function listAlerts() {
  return [...alerts.values()];
}

function listFirings(limit = 20) {
  return firings.slice(-limit).reverse();
}

function createAlert({ symbol, op, threshold, webhookUrl }) {
  if (alerts.size >= config.freeAlertLimit) {
    const err = new Error(
      `Free tier limit reached (${config.freeAlertLimit} alerts). Upgrade path: paid subscription (planned).`
    );
    err.status = 402;
    err.code = 'ALERT_LIMIT';
    throw err;
  }

  const normalizedOp = op === 'lte' || op === '<=' ? 'lte' : 'gte';
  const value = Number(threshold);
  if (!Number.isFinite(value) || value <= 0) {
    const err = new Error('threshold must be a positive number');
    err.status = 400;
    throw err;
  }

  const alert = {
    id: randomUUID(),
    symbol: String(symbol).toUpperCase(),
    op: normalizedOp,
    threshold: value,
    webhookUrl: webhookUrl || null,
    active: true,
    createdAt: new Date().toISOString(),
    lastCheckedAt: null,
    lastPrice: null,
    triggeredAt: null,
  };

  alerts.set(alert.id, alert);
  return alert;
}

function deleteAlert(id) {
  return alerts.delete(id);
}

function conditionMet(alert, price) {
  return alert.op === 'gte' ? price >= alert.threshold : price <= alert.threshold;
}

async function checkAlertsOnce() {
  const active = [...alerts.values()].filter((a) => a.active);
  const bySymbol = new Map();
  for (const alert of active) {
    if (!bySymbol.has(alert.symbol)) bySymbol.set(alert.symbol, []);
    bySymbol.get(alert.symbol).push(alert);
  }

  const results = [];
  for (const [symbol, group] of bySymbol) {
    try {
      const quote = await getCryptoQuote({ symbol, vs: 'usd' });
      for (const alert of group) {
        alert.lastCheckedAt = quote.timestamp;
        alert.lastPrice = quote.price;
        if (conditionMet(alert, quote.price)) {
          alert.active = false;
          alert.triggeredAt = quote.timestamp;
          const event = {
            alertId: alert.id,
            symbol: alert.symbol,
            op: alert.op,
            threshold: alert.threshold,
            price: quote.price,
            at: quote.timestamp,
            note: 'Alert tooling only — not financial advice.',
          };
          firings.push(event);
          results.push(event);

          if (alert.webhookUrl) {
            // Best-effort webhook; failures are logged, not thrown.
            fetch(alert.webhookUrl, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(event),
            }).catch((err) => {
              console.warn(`[alerts] webhook failed for ${alert.id}:`, err.message);
            });
          }
        }
      }
    } catch (err) {
      console.warn(`[alerts] check failed for ${symbol}:`, err.message);
    }
  }
  return results;
}

function startAlertLoop() {
  const tick = () => {
    checkAlertsOnce().catch((err) => console.warn('[alerts] loop error:', err.message));
  };
  tick();
  return setInterval(tick, config.alertPollMs);
}

module.exports = {
  listAlerts,
  listFirings,
  createAlert,
  deleteAlert,
  checkAlertsOnce,
  startAlertLoop,
};

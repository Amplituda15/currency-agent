'use strict';

const { config } = require('../config');

/**
 * Minimal x402 gate for MVP.
 * - Missing payment header → HTTP 402 with accept conditions.
 * - Present header → allow (full on-chain verification is a next step).
 * - X402_DEV_BYPASS=1 → allow without payment (local demo only).
 */
function requirePayment(description) {
  return function checkPayment(req, res, next) {
    if (config.x402DevBypass) {
      req.payment = { mode: 'dev-bypass' };
      return next();
    }

    const paymentHeader = req.headers['x-payment'];
    if (paymentHeader) {
      // MVP stub: accept any non-empty proof header.
      // Production must verify the x402 payload / on-chain settlement.
      req.payment = { mode: 'header-present', raw: String(paymentHeader).slice(0, 64) };
      return next();
    }

    return res.status(402).json({
      x402Version: 1,
      accepts: [
        {
          scheme: 'exact',
          network: config.network,
          maxAmountRequired: config.priceAtomic,
          payTo: config.paymentWallet,
          asset: config.usdcBase,
          description,
        },
      ],
      disclaimer:
        'AgentFX sells market data access, not investment advice or guaranteed returns.',
    });
  };
}

module.exports = { requirePayment };

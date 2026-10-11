'use strict';

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const config = {
  port: Number(process.env.PORT) || 3000,
  paymentWallet:
    process.env.PAYMENT_WALLET ||
    '0x2585D2B16Bda2dBd183F2C3F0dA9D38917b0A32A',
  priceAtomic: process.env.PRICE_ATOMIC || '10000',
  usdcBase: USDC_BASE,
  network: 'base-mainnet',
  x402DevBypass: process.env.X402_DEV_BYPASS === '1',
  freeAlertLimit: 3,
  alertPollMs: Number(process.env.ALERT_POLL_MS) || 60_000,
};

module.exports = { config };

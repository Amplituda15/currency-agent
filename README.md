# AgentFX

Micropayment **FX + crypto rate agent** with simple **price-alert tooling**.

Part of project **«Деньги 1.0»**. This is **data / alerts infrastructure**, not an autotrader and not a promise of profit.

## Why it exists

- Developers and other agents need FX/crypto quotes without heavy signup flows.
- **x402** (USDC on Base) enables pay-per-request usage fees.
- Optional alerts are a path to later subscription revenue — framed as tooling, not “alpha”.

## Quick start

```bash
npm install
cp .env.example .env
# Local demo without paying:
export X402_DEV_BYPASS=1
npm start
```

Server defaults to `http://localhost:3000`.

### Smoke checks

```bash
curl -s http://localhost:3000/health | jq .

# With bypass or a non-empty X-Payment header:
curl -s 'http://localhost:3000/convert?from=USD&to=EUR&amount=100' \
  -H 'X-Payment: demo' | jq .

curl -s 'http://localhost:3000/crypto?symbol=BTC&vs=usd' \
  -H 'X-Payment: demo' | jq .

curl -s -X POST http://localhost:3000/alerts \
  -H 'content-type: application/json' \
  -d '{"symbol":"BTC","op":"gte","threshold":100000}' | jq .
```

Without `X-Payment` (and without `X402_DEV_BYPASS=1`), paid routes respond with **HTTP 402** and x402 accept terms.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | free | Liveness + endpoint list |
| GET | `/convert?from&to&amount` | x402 | Fiat conversion (Frankfurter) |
| GET | `/crypto?symbol&vs` | x402 | Crypto reference price (CoinGecko) |
| GET | `/alerts` | free | List in-memory alerts |
| POST | `/alerts` | free (limited) | Create price alert |
| DELETE | `/alerts/:id` | free | Remove alert |
| GET | `/alerts/firings` | free | Recent trigger events |
| POST | `/alerts/check` | free | Force one alert evaluation |

## Monetization (MVP)

1. **Usage fees:** x402 USDC micropayments per `/convert` and `/crypto` call.
2. **Subscription (planned):** raise alert limits, Telegram delivery, longer retention.

MVP payment check is intentionally thin: missing header → 402; present header → allow. Real on-chain verification is a next step.

## Config

See `.env.example`:

- `PAYMENT_WALLET` — Base address receiving USDC
- `PRICE_ATOMIC` — amount in USDC atomic units (6 decimals)
- `X402_DEV_BYPASS=1` — local-only skip of the payment gate
- `ALERT_POLL_MS` — background alert poll interval (default 60000)

## Disclaimer

AgentFX provides **reference rates and notification tooling only**. It is **not** financial advice, not a signal service, and **does not guarantee returns**. Crypto and FX markets are risky; you can lose money.

## Project layout

```
src/
  index.js              # HTTP server
  config.js
  middleware/x402.js    # 402 gate
  routes/api.js
  services/
    fx.js
    cryptoPrices.js
    alerts.js
```

## Next steps

- Verify x402 payloads / settlement for real.
- Telegram delivery for fired alerts.
- Persist alerts (SQLite/Postgres) instead of memory.
- Free vs Pro limits + simple billing page.

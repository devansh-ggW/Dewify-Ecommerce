# THE ECOM GAMBIT — secure Paddle fulfillment

This Worker is the server-side part of the GitHub Pages storefront. It verifies Paddle notifications and streams the PDF from a **private** Cloudflare R2 bucket. It does not publish the PDF in the Git repository.

## What it does

- Verifies the exact, unmodified webhook request body using the Paddle `Paddle-Signature` HMAC-SHA256 scheme and a five-second timestamp tolerance.
- Accepts only signed `transaction.completed` events for the configured product and price, with exactly one item and the transaction custom-data nonce.
- Stores the transaction entitlement and a SHA-256 hash of the nonce in D1. It does not store the raw nonce or customer billing details.
- Requires the transaction ID and nonce for a download request, then streams the private R2 object without exposing an R2 URL.
- Limits a verified order to five download attempts by default.
- Serves the public cover image through `GET /cover`; only the PDF remains private.

A browser checkout event never grants access. The only entitlement writer is the signed server-side webhook handler.

## Required Cloudflare resources

Create these resources in the Cloudflare account that will own the Worker:

1. **D1 database** named `dewify-paddle-orders`.
2. **Private R2 bucket** named `dewify-private-downloads`. Do not enable public bucket access.
3. Worker bindings:
   - `DB` → the D1 database.
   - `BOOK_FILES` → the private R2 bucket.

Upload the supplied files into R2 with these exact object keys:

| Object key | Content type | Access |
| --- | --- | --- |
| `the-ecom-gambit-structure-edition.pdf` | `application/pdf` | Private, Worker only |
| `the-ecom-gambit-cover.jpg` | `image/jpeg` | Served by the Worker's public `/cover` route |

Apply `migrations/0001_orders.sql` to the D1 database before accepting webhooks.

## Worker variables and secret

The production defaults in `wrangler.toml` include the known Paddle product and price IDs. Replace the D1 placeholder with the database ID from Cloudflare. Set:

- `STORE_ORIGIN`: exact storefront origin, currently `https://dewify.shop`.
- `PADDLE_ENVIRONMENT`: `production`.
- `PADDLE_PRODUCT_ID` and `PADDLE_PRICE_ID`: the matching live IDs.
- `PRODUCT_OBJECT_KEY` and `BOOK_COVER_OBJECT_KEY`: the exact R2 object keys.
- `MAX_DOWNLOADS`: defaults to `5`.

Add `PADDLE_WEBHOOK_SECRET` as a **Worker secret**, not a variable committed to Git. Copy the endpoint secret from the matching Paddle notification destination.

## Paddle notification destination

Create a URL notification destination in the live Paddle dashboard:

- URL: `https://YOUR-WORKER-HOST/webhooks/paddle`
- Event: `transaction.completed`

Copy that destination's endpoint secret key to the Worker's `PADDLE_WEBHOOK_SECRET`. Each Paddle notification destination has its own secret. Do not reuse a sandbox secret for live events.

## Frontend connection

Set `PADDLE_FULFILLMENT_API_URL` in the root `config.js` to the deployed Worker's base URL, with no trailing slash. The value is a public endpoint URL, not a secret. Checkout remains disabled while it is empty.

The page uses the existing live client-side token for production. Client-side tokens are designed to be public; Paddle API keys and webhook destination secrets are not.

## Sandbox process

Sandbox requires its own Paddle sandbox client-side token, product ID, price ID, notification destination, endpoint secret, and D1 database. The sandbox values in the root `config.js` are blank by design.

The optional Wrangler `sandbox` environment is a template. Replace its D1 database placeholder, then set its own `PADDLE_PRODUCT_ID`, `PADDLE_PRICE_ID`, and `PADDLE_WEBHOOK_SECRET`. It can use the same R2 bucket for the same PDF file, but must use a separate D1 database so test orders never create production entitlements.

For a sandbox browser test:
1. Set `PADDLE_ENVIRONMENT` to `sandbox` in `config.js`.
2. Populate `PADDLE_SANDBOX_CLIENT_TOKEN`, `PADDLE_SANDBOX_PRODUCT_ID`, and `PADDLE_SANDBOX_PRICE_ID` with values from the Paddle sandbox account.
3. Point `PADDLE_FULFILLMENT_API_URL` at the deployed sandbox Worker.
4. Configure the sandbox notification destination for `transaction.completed` and store its unique endpoint secret in the sandbox Worker.
5. Complete a sandbox purchase, confirm the matching D1 row appears only after the signed webhook, and verify the PDF is returned only with the same transaction ID and delivery nonce.
6. Restore `PADDLE_ENVIRONMENT` to `production` and confirm the live endpoint and live values before enabling production checkout.

Do not use a live client token with sandbox prices or a sandbox client token with live prices.

## Run tests

From this directory:

```sh
npm test
```

These automated tests cover signature validation and transaction filtering. A real sandbox purchase is still required to verify Paddle account configuration, webhook delivery, D1 persistence, R2 file delivery, and browser behavior end to end.

## Cloudflare Git deployment

Cloudflare Workers Builds supports GitHub repository connections. Connect this repository, set the Worker root directory to `cloudflare`, and configure the build/deploy commands to run the tests and deploy the Wrangler project. Preview builds should use non-production secrets and bindings.

The repository has no Cloudflare account access in this session, so the D1/R2 resources, secret, webhook destination, and deployment URL still need to be configured in the account dashboard.

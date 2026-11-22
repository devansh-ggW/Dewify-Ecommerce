# Paddle checkout and digital fulfillment

## Current DEWIFY hosting

The storefront is a static GitHub Pages site on `dewify.shop`. GitHub Pages serves the HTML, CSS, and browser JavaScript. It does not run a server process, accept Paddle webhooks, keep a private order database, or securely deliver private files.

**No Cloudflare service is used or required by this repository.** The fulfillment API host has not yet been selected. Until a backend is deployed and tested, THE ECOM GAMBIT checkout remains disabled.

## Existing Paddle frontend configuration

The live Paddle client-side token and the THE ECOM GAMBIT product and price IDs are configured in `config.js`. Paddle client-side tokens are intended for browser use. Never put a Paddle API key or notification destination secret in `config.js`, HTML, or browser JavaScript.

The `PADDLE_FULFILLMENT_API_URL` setting is intentionally blank. It is a provider-neutral base URL for the future fulfillment API, not a Cloudflare URL and not a secret.

## Required backend contract

The chosen backend can be hosted on a provider that supports server-side code, a persistent order store, and private file storage. It must implement both routes below before checkout is enabled.

### 1. Paddle webhook

`POST /webhooks/paddle`

The server must:

- Verify the Paddle `Paddle-Signature` against the exact raw request body using the notification destination's secret.
- Enforce a timestamp tolerance and reject invalid signatures.
- Fulfil only the signed `transaction.completed` event for the configured THE ECOM GAMBIT product and price, with the expected quantity and the matching `sku` and one-time `delivery_nonce` in transaction custom data.
- Persist the entitlement idempotently so webhook retries cannot create duplicate grants.
- Store only a hash of the delivery nonce where practical. Keep the webhook secret server-side.

### 2. Private PDF delivery

`POST /api/download`

The browser sends JSON containing `transaction_id` and `delivery_nonce`. The server must verify that both match an entitlement previously created by the signed webhook, enforce a reasonable download limit, and stream the PDF from private storage. Do not put the PDF in the public GitHub Pages repository or return a public storage URL.

The browser's Paddle `checkout.completed` event is only a user-interface signal. It must never create an entitlement or unlock the PDF by itself.

## Connect the frontend after deployment

1. Choose and deploy the non-Cloudflare backend host.
2. Configure its private database/storage and server-side Paddle notification destination secret.
3. Point the Paddle notification destination at `https://YOUR-API-HOST/webhooks/paddle` and subscribe to `transaction.completed`.
4. Set `PADDLE_FULFILLMENT_API_URL` in `config.js` to the deployed API's base URL, without a trailing slash.
5. Configure separate Paddle sandbox credentials, product/price IDs, webhook destination, and test data.
6. Complete a real sandbox checkout and verify that the PDF is unavailable before the signed webhook, available only to the matching transaction and nonce after it, and never served from a public URL.
7. Enable production checkout only after the complete sandbox flow has passed.

The sandbox token, product ID, and price ID fields are intentionally blank until matching sandbox values exist. Never mix sandbox and production credentials.

## Existing legacy downloads

Older DEWIFY products still use public static download files and browser-side checkout callbacks. Those links are not protected against copying or sharing and are separate from THE ECOM GAMBIT flow. Do not copy that legacy pattern into new private digital-product fulfilment.

## Product accuracy

The supplied THE ECOM GAMBIT PDF is the **39-page Structure Edition**. Page 2 describes it as a proposed master structure and states that chapter prose has not yet been drafted. The product page must continue to describe the file accurately as a structure and planning edition, not a completed 80-chapter manuscript.

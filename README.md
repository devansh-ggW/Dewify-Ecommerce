# DEWIFY Digital Store

The DEWIFY storefront is now focused on digital products and lightweight software.

## Current product

- **DEWIFY DevCore** — V1.0.0
- Type: one-time digital purchase
- Platform: Windows
- Delivery: digital access after successful checkout

## Paddle setup

1. Create a Paddle client-side token.
2. Create the Paddle product and price for each DEWIFY product.
3. Put the client-side token in `config.js` as `PADDLE_CLIENT_TOKEN`.
4. Put the corresponding `pri_...` price ID into the product's `priceId`.
5. Keep Paddle API keys off the frontend.

Paddle.js is initialized in `index.html`, and purchases are opened with `Paddle.Checkout.open()`.

## Hosting

This is a static GitHub Pages site. The custom domain is configured as `dewify.shop`.

No physical shipping/order workflow is used by the current storefront.


## DEWIFY Ecommerce Seller Dashboard Notion template

The Seller Dashboard is currently released in free testing mode. Its Notion duplication URL and release mode are configured in `config.js` under `notionTemplates.sellerDashboard`.

### Switch to a paid checkout later

1. Create the Notion template product and one-time price in the guardian-managed Paddle account.
2. Copy the Paddle Price ID, which begins with `pri_`.
3. In `config.js`, change `releaseMode: "free"` to `releaseMode: "paid"`.
4. Paste the Price ID into the Seller Dashboard `priceId` field.
5. Keep the Paddle client-side token in `PADDLE_CLIENT_TOKEN`. The current storefront already has this setting.
6. Never put a Paddle API secret or webhook secret in `config.js` or any browser JavaScript.

The page loads Paddle checkout only when its release mode is set to `paid`. In free mode, the button opens the configured Notion URL directly.

**Paid delivery limitation:** this is a static GitHub Pages site. A browser-only Paddle callback is not server-side payment verification, and a public Notion duplication URL can be copied and shared. Before charging customers, add a backend that verifies Paddle webhooks and design the delivery flow around that limitation. Do not treat the frontend switch as access protection.


## THE ECOM GAMBIT payment and delivery

THE ECOM GAMBIT keeps its own Paddle product and price configuration in `config.js`. Its browser checkout flow is provider-neutral and expects a separate server-side fulfillment API.

The DEWIFY storefront is hosted as a static GitHub Pages site. GitHub Pages cannot receive Paddle webhooks, verify payment signatures, maintain private purchase entitlements, or securely stream a private PDF. Therefore **THE ECOM GAMBIT checkout stays disabled** while no non-Cloudflare fulfillment host has been selected and deployed.

The frontend expects:
- `POST /webhooks/paddle` to receive and verify signed `transaction.completed` notifications.
- `POST /api/download` to verify a transaction ID and one-time delivery nonce against a server-side entitlement, then stream the PDF from private storage.

Set `PADDLE_FULFILLMENT_API_URL` only after that backend is deployed and tested. Keep the PDF, Paddle API keys, and webhook destination secret off GitHub Pages and out of browser code. A browser `checkout.completed` callback is not proof of payment.

See [PADDLE-SETUP.md](PADDLE-SETUP.md) for the provider-neutral backend contract and release checklist. No Cloudflare deployment or account is required by this repository.

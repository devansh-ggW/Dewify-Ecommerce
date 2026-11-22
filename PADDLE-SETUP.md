# Paddle setup for DEWIFY

## Existing storefront

This repository is a static GitHub Pages site on `dewify.shop`. The public Paddle client-side token already exists in `config.js`. A client-side token is designed to be used by Paddle.js in the browser. Never place a Paddle API key or notification destination secret in `config.js`, HTML, or browser JavaScript.

The existing legacy products still use public static download files and browser-side completion callbacks. Those downloads are not protected against link sharing and are not server-verified. Do not use that pattern for THE ECOM GAMBIT.

## THE ECOM GAMBIT

The product and price identifiers are configured in `config.js`. The dedicated checkout page is `ecom-gambit.html`; its server-side fulfillment code is in `cloudflare/`.

The new flow is:

1. Paddle.js opens a checkout for the configured price.
2. The browser attaches a random, one-time delivery nonce as Paddle transaction custom data.
3. Paddle sends `transaction.completed` to the Worker.
4. The Worker verifies the raw-body `Paddle-Signature` against its secret, checks the exact product and price, and records the entitlement in D1.
5. The buyer submits their transaction ID and nonce. The Worker compares the nonce hash and streams the PDF from a private R2 bucket.
6. The browser never receives an R2 object URL. The Worker limits repeat downloads.

A browser `checkout.completed` event is only a user-interface signal. It does not grant access.

## Deployment blockers

The repository does not contain Cloudflare account resources or secrets. Before checkout can be enabled:

- Create a D1 database and apply `cloudflare/migrations/0001_orders.sql`.
- Create a private R2 bucket and upload the PDF as `the-ecom-gambit-structure-edition.pdf`.
- Upload the supplied cover image as `the-ecom-gambit-cover.jpg` to the same bucket.
- Bind D1 as `DB` and R2 as `BOOK_FILES` in the Worker.
- Set the Worker secret `PADDLE_WEBHOOK_SECRET` from the Paddle notification destination.
- Configure the Paddle webhook URL as `https://YOUR-WORKER-HOST/webhooks/paddle` and subscribe to `transaction.completed`.
- Set `PADDLE_FULFILLMENT_API_URL` in `config.js` to the deployed Worker URL.
- Confirm `STORE_ORIGIN` exactly matches `https://dewify.shop`.

Use the Cloudflare dashboard to connect the `cloudflare/` directory to this GitHub repository through Workers Builds, or use Wrangler from a trusted development environment. The code is not live until the Worker and its bindings are deployed.

## Sandbox

Sandbox uses a separate Paddle client-side token, sandbox product and price IDs, notification destination secret, and D1 database. Sandbox and production values must not be mixed.

The sandbox fields in `config.js` are intentionally empty. Add the sandbox client token and sandbox product/price IDs only after creating them in Paddle's sandbox environment. Configure the Worker sandbox environment with those matching product/price IDs and its own notification destination secret. Set `PADDLE_ENVIRONMENT` to `sandbox` only during sandbox testing, then restore `production`.

Run `npm test` in this directory before deployment. The automated tests cover webhook signature verification and transaction validation; they do not replace an end-to-end sandbox purchase.

## International checkout and promotions

The product page uses Paddle price preview for localized price display and lets Paddle Checkout determine the available buyer payment methods and final tax/currency details. Country-specific promotions are not fabricated in code: create the discount in Paddle and configure its eligible countries/regions in Paddle's dashboard. A global optional code can be supplied through `ECOM_GAMBIT_PROMO_CODE`.

## PDF accuracy

The supplied `THE ECOM GAMBIT.pdf` says on page 2 that it is a proposed master structure and not the finished manuscript. The store calls it **Structure Edition** and states that it contains chapter plans rather than full chapter prose.

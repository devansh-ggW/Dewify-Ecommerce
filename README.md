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


## THE ECOM GAMBIT checkout and download

THE ECOM GAMBIT uses the same browser-side Paddle checkout and public static download pattern as the existing DEWIFY products. Its Paddle product and price IDs and download URL are stored in `config.js`.

The product page checks that `THE ECOM GAMBIT.pdf` exists at the site root before enabling checkout. Upload the PDF with that exact filename to the repository root before accepting purchases.

After Paddle emits `checkout.completed` in the browser, the page reveals the download link and saves the ready state in local storage. The page also avoids unlocking the file while Paddle reports a deferred UPI payment as pending.

**Delivery limitation:** this is the legacy DEWIFY delivery model. The PDF is a public GitHub Pages file, and its URL can be used directly by anyone who discovers it. A browser callback and local storage flag are not server-side payment verification. Do not describe this as private or protected fulfilment.

Never put a Paddle API key or notification destination secret in frontend code. A secure private download flow would need a separate webhook-verifying backend, which is not part of this setup.

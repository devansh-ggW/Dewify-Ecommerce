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


## THE ECOM GAMBIT checkout and download

THE ECOM GAMBIT uses the same browser-side Paddle checkout and public static download pattern as the existing DEWIFY products. Its Paddle product and price IDs and download URL are stored in `config.js`.

The product page checks that `THE ECOM GAMBIT.pdf` exists at the site root before enabling checkout. Upload the PDF with that exact filename to the repository root before accepting purchases.

After Paddle emits `checkout.completed` in the browser, the page reveals the download link and saves the ready state in local storage. The page also avoids unlocking the file while Paddle reports a deferred UPI payment as pending.

**Delivery limitation:** this is the legacy DEWIFY delivery model. The PDF is a public GitHub Pages file, and its URL can be used directly by anyone who discovers it. A browser callback and local storage flag are not server-side payment verification. Do not describe this as private or protected fulfilment.

Never put a Paddle API key or notification destination secret in frontend code. A secure private download flow would need a separate webhook-verifying backend, which is not part of this setup.

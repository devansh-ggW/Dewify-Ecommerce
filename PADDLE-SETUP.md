# DEWIFY Paddle checkout and digital downloads

## Hosting

DEWIFY is a static GitHub Pages storefront on `dewify.shop`. Product pages load Paddle.js v2 in the browser and use the same checkout and download pattern as the existing products.

No Cloudflare service, Worker, database, or private object storage is used by this flow.

## Product configuration

Each product entry in `config.js` contains its Paddle Price ID and a `downloadUrl` pointing to a static file served by the DEWIFY site.

THE ECOM GAMBIT uses:

- Product ID: `pro_01m81azb8jnb4ejrhbmxnyedfv`
- Price ID: `pri_01m81b57jng4gsnnbnv2fte0cz`
- Download file: `THE ECOM GAMBIT.pdf` at the repository root

The product page checks that the configured download file exists before enabling the Buy button. Upload the PDF with that exact filename to the repository root before checkout can be used.

## Checkout and delivery behavior

1. Paddle.js initializes with the public client-side token in `config.js`.
2. The page previews the localized price using `Paddle.PricePreview`.
3. The Buy button opens Paddle Checkout for the configured Price ID.
4. On Paddle's `checkout.completed` browser event, the page reveals the configured download link and records the ready state in local storage.
5. The page checks for deferred UPI payment status and does not unlock the file while Paddle still reports the payment as pending.

This matches the existing AI MONEY ARC, EBOOX, WEBBLE, and Creator Pack product pages.

## Important limitation

This is the existing DEWIFY legacy delivery model, not secure paid-file access. The PDF is a public static file on GitHub Pages. Anyone who knows or discovers its URL can download it without completing checkout. Hiding the link in the page and saving a local browser flag are user-interface behavior only; they do not prove payment to a server.

A browser `checkout.completed` event is not a server-verified entitlement. Do not describe this setup as private, protected, or fraud-proof. A secure download system would require a separate backend that verifies signed Paddle webhooks and releases files from private storage. That is not part of this implementation.

Never place a Paddle API key or notification destination secret in `config.js` or browser JavaScript. The client-side token is intended for the browser.

## Product accuracy

THE ECOM GAMBIT is the 39-page **Structure Edition**. It is a planning document for an 80-chapter book, not the completed 80-chapter manuscript. The product page must keep that distinction clear.

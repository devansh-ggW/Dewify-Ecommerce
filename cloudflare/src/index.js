import { sha256Hex, validateCompletedTransaction, verifyPaddleSignature } from "./security.js";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...headers }
  });
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function isAllowedStoreOrigin(request, env) {
  return Boolean(env.STORE_ORIGIN && request.headers.get("Origin") === env.STORE_ORIGIN);
}

async function readSmallJson(request, maxBytes = 4096) {
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error("body_too_large");
  return JSON.parse(text);
}

async function handleWebhook(request, env) {
  if (!env.PADDLE_WEBHOOK_SECRET || !env.PADDLE_PRODUCT_ID || !env.PADDLE_PRICE_ID || !env.DB) {
    return new Response("Webhook service is not configured.", { status: 503 });
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 1_000_000) {
    return new Response("Payload too large.", { status: 413 });
  }

  const validSignature = await verifyPaddleSignature(
    rawBody,
    request.headers.get("Paddle-Signature"),
    env.PADDLE_WEBHOOK_SECRET
  );
  if (!validSignature) return new Response("Invalid Paddle signature.", { status: 401 });

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON.", { status: 400 });
  }

  if (event?.event_type !== "transaction.completed") {
    return json({ received: true, ignored: true });
  }

  const entitlement = validateCompletedTransaction(event, env.PADDLE_PRODUCT_ID, env.PADDLE_PRICE_ID);
  if (!entitlement) {
    // Validly signed events for other products or non-matching transactions are acknowledged, not fulfilled.
    return json({ received: true, fulfilled: false });
  }

  const claimHash = await sha256Hex(entitlement.nonce);
  const receivedAt = new Date().toISOString();

  try {
    await env.DB.batch([
      env.DB.prepare(
        "INSERT OR IGNORE INTO webhook_events (event_id, event_type, received_at) VALUES (?, ?, ?)"
      ).bind(entitlement.eventId, event.event_type, receivedAt),
      env.DB.prepare(
        `INSERT OR IGNORE INTO orders
          (transaction_id, event_id, product_id, price_id, claim_hash, currency_code, total_amount, created_at, download_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`
      ).bind(
        entitlement.transactionId,
        entitlement.eventId,
        entitlement.productId,
        entitlement.priceId,
        claimHash,
        entitlement.currencyCode,
        entitlement.totalAmount,
        entitlement.occurredAt
      )
    ]);
  } catch (error) {
    console.error("Paddle webhook persistence failed:", error?.message || "database_error");
    return new Response("Webhook persistence failed.", { status: 500 });
  }

  return json({ received: true, fulfilled: true });
}

async function handleDownload(request, env) {
  if (!isAllowedStoreOrigin(request, env)) {
    return json({ error: "origin_not_allowed" }, 403);
  }
  if (!env.DB || !env.BOOK_FILES || !env.PRODUCT_OBJECT_KEY || !env.PADDLE_PRODUCT_ID || !env.PADDLE_PRICE_ID) {
    return json({ error: "fulfillment_not_configured" }, 503, corsHeaders(env.STORE_ORIGIN));
  }

  let body;
  try {
    body = await readSmallJson(request);
  } catch {
    return json({ error: "invalid_request" }, 400, corsHeaders(env.STORE_ORIGIN));
  }

  const transactionId = typeof body?.transaction_id === "string" ? body.transaction_id : "";
  const nonce = typeof body?.delivery_nonce === "string" ? body.delivery_nonce : "";
  if (!/^txn_[a-z0-9]{26}$/.test(transactionId) || !/^[A-Za-z0-9_-]{43}$/.test(nonce)) {
    return json({ error: "invalid_claim" }, 400, corsHeaders(env.STORE_ORIGIN));
  }

  let claimHash;
  try {
    claimHash = await sha256Hex(nonce);
  } catch {
    return json({ error: "verification_unavailable" }, 503, corsHeaders(env.STORE_ORIGIN));
  }

  const order = await env.DB.prepare(
    "SELECT transaction_id FROM orders WHERE transaction_id = ? AND claim_hash = ? AND product_id = ? AND price_id = ?"
  ).bind(transactionId, claimHash, env.PADDLE_PRODUCT_ID, env.PADDLE_PRICE_ID).first();

  if (!order) {
    return json({ error: "payment_not_verified_yet" }, 404, corsHeaders(env.STORE_ORIGIN));
  }

  // Fetch the private R2 object before consuming a download attempt.
  const pdf = await env.BOOK_FILES.get(env.PRODUCT_OBJECT_KEY);
  if (!pdf) {
    return json({ error: "digital_file_not_uploaded" }, 503, corsHeaders(env.STORE_ORIGIN));
  }

  const maxDownloads = Math.max(1, Math.min(10, Number.parseInt(env.MAX_DOWNLOADS || "5", 10) || 5));
  const claim = await env.DB.prepare(
    `UPDATE orders
       SET download_count = download_count + 1
     WHERE transaction_id = ? AND claim_hash = ? AND download_count < ?
     RETURNING download_count`
  ).bind(transactionId, claimHash, maxDownloads).first();

  if (!claim) {
    return json({ error: "download_limit_reached" }, 429, corsHeaders(env.STORE_ORIGIN));
  }

  const headers = new Headers();
  pdf.writeHttpMetadata(headers);
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", 'attachment; filename="The-Ecom-Gambit-Structure-Edition.pdf"');
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Access-Control-Allow-Origin", env.STORE_ORIGIN);
  headers.set("Vary", "Origin");

  return new Response(pdf.body, { status: 200, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path === "/health" && request.method === "GET") {
      return json({ status: "ok", service: "dewify-paddle-fulfillment" });
    }

    if (path === "/webhooks/paddle" && request.method === "POST") {
      return handleWebhook(request, env);
    }

    if (path === "/api/download" && request.method === "OPTIONS") {
      if (!isAllowedStoreOrigin(request, env)) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(env.STORE_ORIGIN) });
    }

    if (path === "/api/download" && request.method === "POST") {
      return handleDownload(request, env);
    }

    return json({ error: "not_found" }, 404);
  }
};

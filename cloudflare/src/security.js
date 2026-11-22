const encoder = new TextEncoder();

function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return mismatch === 0;
}

export async function sha256Hex(value, cryptoImpl = globalThis.crypto) {
  const digest = await cryptoImpl.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyPaddleSignature(rawBody, signatureHeader, secret, nowMs = Date.now(), cryptoImpl = globalThis.crypto) {
  if (!rawBody || !signatureHeader || !secret || !cryptoImpl?.subtle) return false;

  let timestamp = "";
  const signatures = [];
  for (const segment of String(signatureHeader).split(";")) {
    const separator = segment.indexOf("=");
    if (separator < 1) continue;
    const key = segment.slice(0, separator).trim();
    const value = segment.slice(separator + 1).trim();
    if (key === "ts") timestamp = value;
    if (key === "h1" && /^[a-f0-9]{64}$/i.test(value)) signatures.push(value.toLowerCase());
  }

  if (!/^\d{1,12}$/.test(timestamp) || signatures.length === 0) return false;
  const timestampSeconds = Number(timestamp);
  if (!Number.isSafeInteger(timestampSeconds) || Math.abs(Math.floor(nowMs / 1000) - timestampSeconds) > 5) return false;

  const key = await cryptoImpl.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signedPayload = encoder.encode(`${timestamp}:${rawBody}`);
  const digest = await cryptoImpl.subtle.sign("HMAC", key, signedPayload);
  const expected = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");

  return signatures.some(signature => constantTimeEqual(expected, signature));
}

export function validateCompletedTransaction(event, expectedProductId, expectedPriceId) {
  if (!event || event.event_type !== "transaction.completed") return null;

  const transaction = event.data;
  if (!transaction || transaction.status !== "completed" || transaction.origin !== "web") return null;
  if (transaction.collection_mode !== "automatic") return null;

  const items = Array.isArray(transaction.items) ? transaction.items : [];
  if (items.length !== 1) return null;

  const item = items[0];
  if (item?.quantity !== 1) return null;
  if (item?.price?.id !== expectedPriceId || item?.price?.product_id !== expectedProductId) return null;

  const nonce = transaction.custom_data?.delivery_nonce;
  if (typeof nonce !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(nonce)) return null;
  if (transaction.custom_data?.sku !== "the-ecom-gambit") return null;

  return {
    transactionId: transaction.id,
    eventId: event.event_id,
    productId: item.price.product_id,
    priceId: item.price.id,
    nonce,
    currencyCode: typeof transaction.currency_code === "string" ? transaction.currency_code : null,
    totalAmount: typeof transaction.details?.totals?.total === "string" ? transaction.details.totals.total : null,
    occurredAt: typeof event.occurred_at === "string" ? event.occurred_at : new Date().toISOString()
  };
}

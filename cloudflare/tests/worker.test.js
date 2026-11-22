import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, webcrypto } from "node:crypto";
import { validateCompletedTransaction, verifyPaddleSignature } from "../src/security.js";

const secret = "pdl_ntfset_unit_test_secret";
const productId = "pro_01m81azb8jnb4ejrhbmxnyedfv";
const priceId = "pri_01m81b57jng4gsnnbnv2fte0cz";
const nonce = "A".repeat(43);

function makeEvent(overrides = {}) {
  return {
    event_id: "evt_01aaaaaaaaaaaaaaaaaaaaaaaaaa",
    event_type: "transaction.completed",
    occurred_at: "2026-11-22T00:00:00.000Z",
    data: {
      id: "txn_01aaaaaaaaaaaaaaaaaaaaaaaaaa",
      status: "completed",
      origin: "web",
      collection_mode: "automatic",
      currency_code: "USD",
      details: { totals: { total: "999" } },
      custom_data: { sku: "the-ecom-gambit", delivery_nonce: nonce },
      items: [{ quantity: 1, price: { id: priceId, product_id: productId } }]
    },
    ...overrides
  };
}

test("accepts a valid Paddle HMAC signature", async () => {
  const now = 1_800_000_000_000;
  const ts = String(Math.floor(now / 1000));
  const raw = '{"event_type":"transaction.completed"}';
  const signature = createHmac("sha256", secret).update(`${ts}:${raw}`).digest("hex");
  assert.equal(
    await verifyPaddleSignature(raw, `ts=${ts};h1=${signature}`, secret, now, webcrypto),
    true
  );
});

test("rejects an incorrect signature and an expired timestamp", async () => {
  const now = 1_800_000_000_000;
  const ts = String(Math.floor(now / 1000));
  assert.equal(await verifyPaddleSignature("{}", `ts=${ts};h1=${"0".repeat(64)}`, secret, now, webcrypto), false);
  const oldTs = String(Number(ts) - 6);
  const oldSignature = createHmac("sha256", secret).update(`${oldTs}:{}`).digest("hex");
  assert.equal(await verifyPaddleSignature("{}", `ts=${oldTs};h1=${oldSignature}`, secret, now, webcrypto), false);
});

test("accepts only a completed web transaction for the exact product and price", () => {
  const accepted = validateCompletedTransaction(makeEvent(), productId, priceId);
  assert.ok(accepted);
  assert.equal(accepted.transactionId, "txn_01aaaaaaaaaaaaaaaaaaaaaaaaaa");
  assert.equal(accepted.currencyCode, "USD");
  assert.equal(accepted.totalAmount, "999");

  assert.equal(validateCompletedTransaction(makeEvent({ event_type: "transaction.paid" }), productId, priceId), null);
  assert.equal(validateCompletedTransaction(makeEvent({ data: { ...makeEvent().data, status: "paid" } }), productId, priceId), null);
  assert.equal(
    validateCompletedTransaction(
      makeEvent({ data: { ...makeEvent().data, items: [{ quantity: 1, price: { id: "pri_wrong", product_id: productId } }] } }),
      productId,
      priceId
    ),
    null
  );
  assert.equal(
    validateCompletedTransaction(
      makeEvent({ data: { ...makeEvent().data, items: [{ quantity: 2, price: { id: priceId, product_id: productId } }] } }),
      productId,
      priceId
    ),
    null
  );
});

test("rejects transactions without the one-time delivery nonce", () => {
  const event = makeEvent({
    data: {
      ...makeEvent().data,
      custom_data: { sku: "the-ecom-gambit", delivery_nonce: "not-a-valid-nonce" }
    }
  });
  assert.equal(validateCompletedTransaction(event, productId, priceId), null);
});

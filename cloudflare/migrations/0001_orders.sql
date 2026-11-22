CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY NOT NULL,
  event_type TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  transaction_id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  claim_hash TEXT NOT NULL,
  currency_code TEXT,
  total_amount TEXT,
  created_at TEXT NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0 CHECK (download_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

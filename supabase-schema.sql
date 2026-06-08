-- ===== SUPABASE SCHEMA FOR STOCK LEDGER =====
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Transactions table (main data)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  date TEXT,
  transaction_type TEXT,
  customer_vendor TEXT,
  marks TEXT,
  item_name TEXT,
  storage TEXT,
  specs TEXT,
  color TEXT,
  quantity TEXT,
  transaction_status TEXT,
  logistics TEXT,
  do_number TEXT,
  unit_price TEXT,
  total_amount TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users table (login)
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password TEXT,
  role TEXT,
  name TEXT
);

-- 3. Pricing pending (DO submissions)
CREATE TABLE IF NOT EXISTS pricing_pending (
  id TEXT PRIMARY KEY,
  customer TEXT,
  week TEXT,
  status TEXT,
  date TEXT,
  logistics TEXT,
  marks TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  completed BOOLEAN DEFAULT false,
  approved BOOLEAN,
  warehouse_packed BOOLEAN DEFAULT false,
  cash_released BOOLEAN DEFAULT false,
  pricing JSONB DEFAULT '[]'::jsonb,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pricing submitted keys
CREATE TABLE IF NOT EXISTS pricing_submitted_keys (
  key TEXT PRIMARY KEY,
  qty INTEGER DEFAULT 0
);

-- 5. Auto-set updated_at on transactions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security (optional, for now allow all)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_submitted_keys ENABLE ROW LEVEL SECURITY;

-- Allow public access (since we use anon key)
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pricing_pending" ON pricing_pending FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pricing_submitted_keys" ON pricing_submitted_keys FOR ALL USING (true) WITH CHECK (true);

-- ===== SEED DEFAULT USERS =====
INSERT INTO users (username, password, role, name) VALUES
  ('admin', 'admin123', 'admin', 'Administrator'),
  ('data', 'data123', 'data', 'Data Entry'),
  ('invoice', 'inv123', 'invoice_reports', 'Invoice+Reports'),
  ('pricing', 'price123', 'pricing', 'Pricing'),
  ('approval', 'appr123', 'approval', 'DO Approval'),
  ('warehouse', 'wh123', 'warehouse', 'Warehouse'),
  ('invonly', 'inv123', 'invoice', 'Invoice Only')
ON CONFLICT (username) DO NOTHING;

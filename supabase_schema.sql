-- Supabase Schema for Chems Root Catalog

-- 1. Create Products Table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  composition TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  labels TEXT[] DEFAULT '{}',
  image TEXT,
  badge TEXT,
  packaging TEXT
);

-- 2. Create Orders Table
CREATE TABLE orders (
  order_id TEXT PRIMARY KEY,
  customer JSONB NOT NULL,
  items JSONB NOT NULL,
  total_boxes INTEGER NOT NULL,
  item_count INTEGER NOT NULL,
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);

-- 3. Row Level Security (RLS) Policies
-- Allow anyone to read products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);

-- Allow admins to insert/update/delete products (Requires setting up an admin authenticated user)
-- For a purely anon frontend, if you want anyone to have full access (NOT RECOMMENDED for production):
CREATE POLICY "Enable insert for all" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all" ON products FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all" ON products FOR DELETE USING (true);

-- Allow anyone to insert orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert orders for all" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read orders for all" ON orders FOR SELECT USING (true);

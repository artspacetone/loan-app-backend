-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  unit VARCHAR(50) DEFAULT 'pcs',
  price DECIMAL(12,2) DEFAULT 0.0,
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'available',
  barcode VARCHAR(255),
  supplier VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  item_id INTEGER REFERENCES inventory_items(id),
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  requested_by VARCHAR(255) NOT NULL,
  approved_by VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  reason TEXT,
  notes TEXT,
  priority VARCHAR(50) DEFAULT 'normal',
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approval_date TIMESTAMP,
  completed_date TIMESTAMP
);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (you can make this more restrictive)
CREATE POLICY "Allow all for authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON inventory_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON transactions FOR ALL USING (auth.role() = 'authenticated');

-- Create functions for table creation (for backwards compatibility)
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS void AS $$
BEGIN
  -- Table already created above
  RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_inventory_table()
RETURNS void AS $$
BEGIN
  -- Table already created above
  RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_transactions_table()
RETURNS void AS $$
BEGIN
  -- Table already created above
  RETURN;
END;
$$ LANGUAGE plpgsql;

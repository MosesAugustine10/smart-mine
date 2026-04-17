-- ============================================================
-- SMART MINE — MEDIUM SCALE RBAC & SECURITY MIGRATION
-- ============================================================

-- 1. TABLES FOR RBAC & DEVICE LOCKDOWN
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL, -- INVESTOR, MANAGER, etc.
    description TEXT
);

CREATE TABLE IF NOT EXISTS medium_scale_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, 
    allowed_device_signature TEXT, -- For Accountant Lockdown
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure user_profiles has the role column if we use it instead
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT;

-- 2. INVENTORY CATEGORIES & PPE
CREATE TABLE IF NOT EXISTS inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO inventory_categories (name, description) 
VALUES ('PPE & General', 'Nguo za Kinga na Vifaa vya Jumla')
ON CONFLICT (name) DO NOTHING;

-- Insert PPE Items
INSERT INTO inventory_items (item_name, category, unit, current_stock, minimum_stock_level)
VALUES 
('Gloves', 'PPE & General', 'pairs', 100, 20),
('Helmets', 'PPE & General', 'pcs', 50, 10),
('Safety Boots', 'PPE & General', 'pairs', 30, 5),
('Goggles', 'PPE & General', 'pcs', 40, 5),
('Overalls', 'PPE & General', 'pcs', 60, 10)
ON CONFLICT (item_name) DO NOTHING;

-- 3. INVENTORY REQUESTS TABLE
CREATE TABLE IF NOT EXISTS inventory_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    item_id UUID REFERENCES inventory_items(id),
    quantity NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on core tables
ALTER TABLE blasting_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE drilling_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_requests ENABLE ROW LEVEL SECURITY;

-- Helper Function to get user role
CREATE OR REPLACE FUNCTION get_my_role() 
RETURNS TEXT AS $$
  SELECT role FROM medium_scale_users WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Representative Policies based on the Matrix

-- BLASTING
CREATE POLICY "Blasting: Full Access for Admin" ON blasting_operations
    FOR ALL USING (get_my_role() IN ('Investor', 'Manager'));

CREATE POLICY "Blasting: Form Only for Blaster" ON blasting_operations
    FOR INSERT WITH CHECK (get_my_role() = 'Blaster');

CREATE POLICY "Blasting: Form Only for Supervisor" ON blasting_operations
    FOR INSERT WITH CHECK (get_my_role() = 'Supervisor');

-- DRILLING
CREATE POLICY "Drilling: Full Access for Admin" ON drilling_operations
    FOR ALL USING (get_my_role() IN ('Investor', 'Manager'));

CREATE POLICY "Drilling: View Only for Geologist" ON drilling_operations
    FOR SELECT USING (get_my_role() = 'Geologist');

CREATE POLICY "Drilling: Form Only for Driller" ON drilling_operations
    FOR INSERT WITH CHECK (get_my_role() = 'Driller');

-- INVENTORY
CREATE POLICY "Inventory: Full Access for Stock Keeper" ON inventory_items
    FOR ALL USING (get_my_role() IN ('Stock Keeper', 'Manager', 'Investor'));

CREATE POLICY "Inventory: Request Only (View Stock)" ON inventory_items
    FOR SELECT USING (TRUE); -- Everyone can see stock levels to request

-- INVENTORY REQUESTS
CREATE POLICY "Inventory Request: Users can submit" ON inventory_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Inventory Request: Stock Keeper can view all" ON inventory_requests
    FOR SELECT USING (get_my_role() = 'Stock Keeper');

-- FINANCE
CREATE POLICY "Finance: Full Access for Accountant/Investor" ON expenses
    FOR ALL USING (get_my_role() IN ('Accountant', 'Investor'));

CREATE POLICY "Finance: View Only for Manager" ON expenses
    FOR SELECT USING (get_my_role() = 'Manager');

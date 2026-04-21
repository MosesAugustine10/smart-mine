-- Migration to support SMART MINE Unified Changes
-- Created: 2024-04-21

-- PART 1: Create contact_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    company_name TEXT,
    business_type TEXT,
    modules_needed TEXT, -- Can be comma separated if needed
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- PART 2: Update company_subscriptions to support granular inventory control
-- We'll use a JSONB field for enabled_modules to allow nesting
-- If it already exists, we ensure it's JSONB (Supabase usually makes it JSONB)

-- No changes needed to the schema if enabled_modules is already JSONB,
-- but we should ensure existing data is migrated to the new structure if necessary.
-- Example of new structure for enabled_modules:
-- {
--   "blasting": true,
--   "inventory": {
--     "blasting": true,
--     "drilling": false,
--     "diamond_drilling": true,
--     "spare_parts": true
--   }
-- }

-- Alternatively, we can create a separate table for inventory access
CREATE TABLE IF NOT EXISTS company_inventory_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'blasting', 'drilling', 'diamond_drilling', 'spare_parts'
    has_access BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, category)
);

-- Migration for existing companies: If they have 'inventory' module enabled, 
-- they get access to all 4 categories by default.
INSERT INTO company_inventory_access (company_id, category, has_access)
SELECT company_id, cat, TRUE
FROM company_subscriptions, 
     unnest(ARRAY['blasting', 'drilling', 'diamond_drilling', 'spare_parts']) AS cat
WHERE enabled_modules ? 'inventory'
ON CONFLICT (company_id, category) DO NOTHING;

-- PART 3: Disable Consultant Pricing Flag by default if it exists
UPDATE system_flags SET is_enabled = FALSE WHERE flag_name = 'show_consultant_pricing';

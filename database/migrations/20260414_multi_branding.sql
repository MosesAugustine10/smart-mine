-- ============================================================
-- SMART MINE — MULTI-BRANDING (WHITE LABELING) MIGRATION
-- Purpose: Support multiple front brands per company for reports.
-- ============================================================

-- 1. Create company_brands table
CREATE TABLE IF NOT EXISTS company_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL, -- Display name on reports
    logo_url TEXT, -- URL to brand logo image
    is_default BOOLEAN DEFAULT false, -- The default brand
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_company_brands_company_id ON company_brands(company_id);

-- 3. MIGRATION: Auto-generate a default brand for every existing company
INSERT INTO company_brands (company_id, brand_name, is_default)
SELECT id, name, true FROM companies
ON CONFLICT DO NOTHING;

-- 4. TRIGGER: Update updated_at on change
CREATE OR REPLACE FUNCTION update_brand_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_brand_updated_at
BEFORE UPDATE ON company_brands
FOR EACH ROW
EXECUTE FUNCTION update_brand_updated_at();

-- 5. FUNCTION: Ensure only one default brand per company
CREATE OR REPLACE FUNCTION ensure_single_default_brand()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE company_brands 
        SET is_default = false 
        WHERE company_id = NEW.company_id AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_brand
BEFORE INSERT OR UPDATE ON company_brands
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_brand();

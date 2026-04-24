-- ============================================================
-- SMART MINE — MULTI-TENANT & SECURITY UPGRADE MIGRATION
-- Date: 2026-04-24
-- ============================================================

-- 1. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS companies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER PROFILES ENHANCEMENT
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_temp_password BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS totp_secret TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;

-- 3. PASSWORD RESET REQUESTS
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email  TEXT NOT NULL,
  company_id  UUID REFERENCES companies(id),
  status      TEXT DEFAULT 'pending', -- 'pending', 'resolved'
  requested_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MULTI-TENANT REINFORCEMENT (Ensure all primary tables have company_id)
-- Some may already have it, but we ensure it's there.
DO $$ 
BEGIN
  -- List of tables that MUST have company_id
  -- We already saw most of these in full_production_schema.sql
  -- Adding to those that might be missing it.
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'company_id') THEN
    ALTER TABLE audit_logs ADD COLUMN company_id UUID REFERENCES companies(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'company_id') THEN
    ALTER TABLE brands ADD COLUMN company_id UUID REFERENCES companies(id);
  END IF;

END $$;

-- 5. RLS POLICIES FOR MULTI-TENANCY
-- This is a generic policy that ensures users only see data from their own company.
-- Super Admin can see everything.

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION get_my_company_id() 
RETURNS UUID AS $$
  SELECT company_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Helper function to check if user is Super Admin
CREATE OR REPLACE FUNCTION is_super_admin() 
RETURNS BOOLEAN AS $$
  SELECT role = 'SUPER_ADMIN' OR 'SUPER_ADMIN' = ANY(roles) FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Apply Multi-Tenant Policy to all relevant tables
-- (Note: In a real migration, we'd do this for each table explicitly)

-- EXAMPLE: Blasting Operations
DROP POLICY IF EXISTS "Multi-tenant: Blasting" ON blasting_operations;
CREATE POLICY "Multi-tenant: Blasting" ON blasting_operations
    FOR ALL USING (is_super_admin() OR company_id = get_my_company_id());

-- EXAMPLE: User Profiles
DROP POLICY IF EXISTS "Multi-tenant: User Profiles" ON user_profiles;
CREATE POLICY "Multi-tenant: User Profiles" ON user_profiles
    FOR ALL USING (is_super_admin() OR company_id = get_my_company_id());

-- (Repeat for other tables...)

-- ============================================================
-- SMART MINE — SMALL SCALE MINERS (SSM) AUTHENTICATION SCHEMA
-- ============================================================

-- 1. COMPANIES (SSM TIER)
CREATE TABLE IF NOT EXISTS small_scale_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    primary_phone_number TEXT UNIQUE NOT NULL, -- Key to Admin access
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SITES (Individual pits/locations)
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES small_scale_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    latitude DECIMAL(12, 9),
    longitude DECIMAL(12, 9),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS (SSM TIER)
CREATE TABLE IF NOT EXISTS small_scale_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES small_scale_companies(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    totp_secret TEXT, -- Encrypted or plain (depending on implementation strategy)
    pin_hash TEXT, -- Stored 4-digit PIN hash
    role TEXT CHECK (role IN ('admin', 'supervisor')) NOT NULL,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL, -- Restricted view for Supervisors
    device_id TEXT, -- Hashed device fingerprint for binding
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INVITATION CODES (Worker Onboarding)
CREATE TABLE IF NOT EXISTS invitation_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES small_scale_companies(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    phone_number TEXT, -- Optional: Tie to specific number
    role TEXT DEFAULT 'supervisor',
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    used_at TIMESTAMPTZ,
    created_by UUID REFERENCES small_scale_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE small_scale_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE small_scale_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;

-- Help function to get current SSM user
CREATE OR REPLACE FUNCTION get_ssm_user() 
RETURNS TABLE (id UUID, company_id UUID, role TEXT, site_id UUID) AS $$
  SELECT id, company_id, role, site_id FROM small_scale_users WHERE phone_number = (auth.jwt() ->> 'phone');
$$ LANGUAGE sql STABLE;

-- Representative Policies
-- Companies: Admins see their own, Supervisors see their own
CREATE POLICY "SSM: Companies Visibility" ON small_scale_companies
    FOR SELECT USING (id IN (SELECT company_id FROM small_scale_users WHERE phone_number = (auth.jwt() ->> 'phone')));

-- Production Logs (Representative Example)
CREATE POLICY "SSM: Production SELECT" ON drilling_operations -- Assuming drilling_operations is used across tiers or mapped
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM small_scale_users WHERE phone_number = (auth.jwt() ->> 'phone'))
        AND (
            (SELECT role FROM small_scale_users WHERE phone_number = (auth.jwt() ->> 'phone')) = 'admin'
            OR 
            (SELECT site_id FROM small_scale_users WHERE phone_number = (auth.jwt() ->> 'phone')) = location_id -- Adjusted naming
        )
    );

-- ============================================================
-- SCRIPT YA 4: FIX MISSING AUTH TABLES
-- Inatengeneza meza zote zinazohitajika na Super Admin Script
-- ============================================================

-- 1. Hakikisha itajishughulisha na meza ya medium_scale_users
CREATE TABLE IF NOT EXISTS public.medium_scale_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, 
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Hakikisha itajishughulisha na meza ya small_scale_users
-- Tunahakikisha ina 'user_id' na ni UNIQUE ili iendane na script yako ya Super Admin
CREATE TABLE IF NOT EXISTS public.small_scale_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    full_name TEXT,
    phone_number TEXT,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ikiwa tayari meza ipo lakini haina UNIQUE constraint, iongeze
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'small_scale_users_user_id_key') THEN
        ALTER TABLE public.small_scale_users ADD CONSTRAINT small_scale_users_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 3. Hakikisha Role column ipo kwenye user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'MEDIUM_SCALE';

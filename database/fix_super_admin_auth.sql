-- ============================================================
-- SMART MINE — EMERGENCY AUTH & SCHEMA FIX
-- Purpose: Fixes the missing 'enabled_modules' column and 
-- ensures Super Admin has absolute read authority (RLS).
-- ============================================================

-- 1. ADD MISSING COLUMNS
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS enabled_modules TEXT[] DEFAULT '{}';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'MEDIUM_SCALE';

-- 2. CREATE HELPER TO CHECK IF USER IS SUPER ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FIX RLS FOR SUPER ADMIN (Allow read access to everything)
-- We add an 'OR public.is_super_admin()' to existing policies 
-- or create new ones for core tables.

DROP POLICY IF EXISTS "Super Admin Full Access on profiles" ON public.user_profiles;
CREATE POLICY "Super Admin Full Access on profiles" ON public.user_profiles 
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super Admin Full Access on companies" ON public.companies;
CREATE POLICY "Super Admin Full Access on companies" ON public.companies 
    FOR ALL USING (public.is_super_admin());

-- 4. ENSURE USER PROFILES HAS ROLE COLUMN
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'OPERATOR';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 5. RE-INSERT/UPDATE THE SUPER ADMIN RECORD
-- Replace 'REPLACE_WITH_YOUR_UUID' with your actual Supabase User ID (from Auth table)
-- DO THIS: INSERT INTO public.user_profiles (id, role, position, status) VALUES ('...', 'SUPER_ADMIN', 'SYSTEM_OWNER', 'active') ON CONFLICT (id) DO UPDATE SET role = 'SUPER_ADMIN';

-- ============================================================
-- FIX RLS INFINITE RECURSION ON USER_PROFILES
-- Hii inasafisha RLS policy zote zilizochemkana kwenye read access.
-- Badala ya database kujizungusha kujua kama wewe ni super admin, 
-- tunafungua Select Access (Read-only) kwa watumiaji wote 
-- walioingia kwenye mfumo (Authenticated).
-- ============================================================

-- 1. Hakikisha RLS imewashwa
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Futa Policy zote kwenye user_profiles zinazosababisha migongano
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', pol.policyname);
    END LOOP;
END $$;

-- 3. Weka Pollicy Mpya - Kusoma: Watumiaji wote wanaoaminika wanaweza kusoma majina na vyeo
CREATE POLICY "Allow Authenticated Users to Read Profiles" 
ON public.user_profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 4. Weka Policy Mpya - Kuandika (Update): Kila mtu anaupdate profile yake tu!
CREATE POLICY "Users can update own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- 5. Weka Policy ya Super Admin Kufanya Edit zote kwenye profile zote (Haiwezi kuleta Recursion kwenye UPDATE)
CREATE POLICY "Super Admins can edit all profiles" 
ON public.user_profiles 
FOR UPDATE 
USING (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

CREATE POLICY "Super Admins can delete profiles" 
ON public.user_profiles 
FOR DELETE 
USING (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

-- Note: SELECT haitaji policy hii maana wote wanaruhusiwa. Hii inaondoa Infinite Loop kabisa!

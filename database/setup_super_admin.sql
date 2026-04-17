-- ============================================================
-- SMART MINE — SETUP SYSTEM OWNER (SUPER ADMIN)
-- Hii script itakupandisha daraja kuwa Mmiliki wa Mfumo mzima.
-- ============================================================

-- MAELEKEZO (INSTRUCTIONS):
-- 1. Jisajili (Sign up) kupitia login/signup page ya mfumo.
-- 2. Ingia kwenye Supabase Dashboard > Authentication > Users.
-- 3. Nakili (Copy) "User ID" yako (UUID).
-- 4. Badilisha 'REPLACE_WITH_YOUR_USER_ID' hapa chini na hiyo ID yako.
-- 5. Run script hii kwenye SQL Editor ya Supabase.

DO $$
DECLARE
    target_user_id UUID := 'f6deaa0a-929b-46a8-81a4-4e715ddad321'; -- <--- WEKA ID YAKO HAPA
BEGIN
    -- 1. Hakikisha profile ipo na mpe cheo cha 'SUPER_ADMIN'
    -- (Note: System Owner hana company_id maalum maana anasimamia zote)
    INSERT INTO public.user_profiles (id, role, position, status, first_name, last_name)
    VALUES (target_user_id, 'SUPER_ADMIN', 'SYSTEM_OWNER', 'active', 'System', 'Owner')
    ON CONFLICT (id) DO UPDATE SET 
        role = 'SUPER_ADMIN',
        position = 'SYSTEM_OWNER',
        status = 'active';

    -- 2. Mruhusu kuona modules za Medium Scale (Investor Level)
    INSERT INTO public.medium_scale_users (user_id, role, company_id)
    SELECT target_user_id, 'Investor', id FROM public.companies LIMIT 1
    ON CONFLICT (user_id) DO UPDATE SET role = 'Investor';

    -- 3. Mruhusu kuona modules za Small Scale (Admin Level)
    INSERT INTO public.small_scale_users (user_id, company_id, full_name, role)
    SELECT target_user_id, id, 'System Owner', 'admin' FROM public.companies LIMIT 1
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

    RAISE NOTICE 'SUCCESS: Hongera! Sasa wewe ndiye Super Admin wa mfumo mzima.';
END $$;

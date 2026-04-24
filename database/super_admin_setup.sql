-- ============================================================
-- SMART MINE — SETUP SYSTEM OWNER (SUPER ADMIN)
-- ============================================================

-- INSTRUCTIONS:
-- 1. Sign up/Login to the system.
-- 2. Find your User ID (UUID) in Supabase Auth > Users.
-- 3. Replace the ID below with your actual ID.
-- 4. Execute this script.

DO $$
DECLARE
    target_user_id UUID := 'REPLACE_WITH_YOUR_ID'; 
BEGIN
    -- 1. Elevate user to SUPER_ADMIN in user_profiles
    INSERT INTO public.user_profiles (id, role, roles, position, status, first_name, last_name)
    VALUES (target_user_id, 'SUPER_ADMIN', ARRAY['SUPER_ADMIN'], 'SYSTEM_OWNER', 'active', 'System', 'Owner')
    ON CONFLICT (id) DO UPDATE SET 
        role = 'SUPER_ADMIN',
        roles = ARRAY['SUPER_ADMIN'],
        position = 'SYSTEM_OWNER',
        status = 'active';

    RAISE NOTICE 'SUCCESS: User has been elevated to SUPER_ADMIN.';
END $$;

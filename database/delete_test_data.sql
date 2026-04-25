-- ============================================================
-- SMART MINE — DATA PURGE (DELETING ALL OPERATIONAL DATA)
-- ============================================================

-- 1. TRUNCATE ALL OPERATIONAL DATA
TRUNCATE TABLE 
    drilling_operations,
    diamond_drilling_operations,
    diamond_drilling_executions,
    blasting_operations,
    material_handling_operations,
    fuel_logs,
    maintenance_logs,
    stock_transactions,
    safety_incidents,
    risk_assessments,
    invoices,
    invoice_items,
    expenses,
    geophysics_surveys,
    geophysics_executions,
    equipment_inspections,
    equipment_payloads,
    equipment_payload_logs,
    audit_logs,
    password_reset_requests,
    vehicle_locations,
    phone_locations,
    hardware_locations,
    projects
CASCADE;

-- 2. DELETE NON-SUPER-ADMIN PROFILES
DELETE FROM user_profiles 
WHERE 'SUPER_ADMIN' != ALL(roles) 
  AND role != 'SUPER_ADMIN';

-- 3. DELETE ALL COMPANIES (except default if needed)
-- We keep companies table but clear its rows
DELETE FROM companies 
WHERE name != 'Amogtech (Core)';

-- 4. CLEANUP AUTH USERS (Only if running with service role / admin)
-- NOTE: In Supabase SQL editor, this might fail unless you have proper permissions.
-- DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM user_profiles);

-- Reset inventory stock but keep items
UPDATE inventory_items SET current_stock = 0;

DO $$
BEGIN
    RAISE NOTICE 'SUCCESS: All operational test data has been purged.';
END $$;

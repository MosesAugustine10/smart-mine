-- ============================================================
-- SMART MINE — DATA PURGE (DELETING ALL OPERATIONAL DATA)
-- ============================================================

-- TRUNCATE ALL OPERATIONAL TABLES (KEEP USERS, COMPANIES, PROJECTS)
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
    hardware_locations
CASCADE;

-- Reset inventory stock but keep items
UPDATE inventory_items SET current_stock = 0;

DO $$
BEGIN
    RAISE NOTICE 'SUCCESS: All operational test data has been purged.';
END $$;

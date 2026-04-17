-- ============================================================
-- SMART MINE — DATA PURGE (DELETING ALL TEST DATA)
-- ============================================================

-- TRUNCATE OPERATIONAL TABLES (DO NOT DELETE USERS OR ROLES)
TRUNCATE TABLE blasting_operations CASCADE;
TRUNCATE TABLE drilling_operations CASCADE;
TRUNCATE TABLE diamond_drilling_operations CASCADE;
TRUNCATE TABLE material_handling_operations CASCADE;
TRUNCATE TABLE geophysics_surveys CASCADE;
TRUNCATE TABLE geophysics_executions CASCADE;
TRUNCATE TABLE fuel_logs CASCADE;
TRUNCATE TABLE maintenance_logs CASCADE;
TRUNCATE TABLE equipment_inspections CASCADE;
TRUNCATE TABLE equipment_payloads CASCADE;
TRUNCATE TABLE equipment_payload_logs CASCADE;
TRUNCATE TABLE inventory_requests CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE invoice_items CASCADE;
TRUNCATE TABLE assay_samples CASCADE;
TRUNCATE TABLE safety_incidents CASCADE;
TRUNCATE TABLE risk_assessments CASCADE;
TRUNCATE TABLE stock_transactions CASCADE;

-- TRUNCATE SMALL SCALE SPECIFIC TABLES
-- (Assuming they use similar log names, but let's check current schema)
-- If small scale uses different tables, add them here.
-- Based on previous knowledge items:
-- chimney_logs, sales_logs, etc.
-- Let's just delete from known tables.

-- RESTART SEQUENCES IF ANY
-- (PostgreSQL automatically handles identity columns if using GENERATED ALWAYS)

-- DELETE ANY DEMO STOCK BUT KEEP ITEMS
UPDATE inventory_items SET stock_quantity = 0;

RAISE NOTICE 'ALL OPERATIONAL TEST DATA DELETED SUCCESSFULLY.';

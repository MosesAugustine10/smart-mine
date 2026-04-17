-- ============================================================
-- SMART MINE — FULL DATABASE SCHEMA
-- Verified against ALL module form files
-- Run this script in Supabase SQL Editor (public schema)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================
-- 1. COMPANIES
-- =============================================
CREATE TABLE IF NOT EXISTS companies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  logo_url      TEXT,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  website       TEXT,
  region        TEXT,
  country       TEXT DEFAULT 'Tanzania',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. USER PROFILES (linked to Supabase Auth)
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id    UUID REFERENCES companies(id),
  first_name    TEXT,
  last_name     TEXT,
  full_name     TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email         TEXT,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'OPERATOR',
  position      TEXT,
  status        TEXT DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. PROJECTS
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID REFERENCES companies(id),
  name          TEXT NOT NULL,
  region        TEXT,
  start_date    DATE,
  end_date      DATE,
  status        TEXT DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. DRILLING OPERATIONS
-- (Used by: Drilling Module - Budget + Execution forms)
-- =============================================
CREATE TABLE IF NOT EXISTS drilling_operations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID,
  drill_number          TEXT NOT NULL,
  date                  DATE,
  planned_date          DATE,
  region                TEXT,
  location              TEXT,
  
  -- Design Parameters
  planned_holes         INT DEFAULT 0,
  holes_drilled         INT DEFAULT 0,
  burden                NUMERIC DEFAULT 0,
  spacing               NUMERIC DEFAULT 0,
  planned_depth         NUMERIC DEFAULT 0,
  planned_rate          NUMERIC DEFAULT 0,       -- m/hr
  rig_id                TEXT,
  planned_bit_type      TEXT,
  
  -- Execution KPIs
  drilling_required_m   NUMERIC DEFAULT 0,       -- actual depth drilled
  penetration_rate_m_per_min NUMERIC DEFAULT 0,
  fuel_consumption_l    NUMERIC DEFAULT 0,
  
  -- Cost Breakdown
  drilling_cost_per_m   NUMERIC DEFAULT 0,
  labor                 NUMERIC DEFAULT 0,
  fuel_cost             NUMERIC DEFAULT 0,
  accessories_cost      NUMERIC DEFAULT 0,
  
  -- Calculated Outputs
  estimated_total_depth NUMERIC DEFAULT 0,
  estimated_cost        NUMERIC DEFAULT 0,
  estimated_hours       NUMERIC DEFAULT 0,
  planned_budget_tzs    NUMERIC DEFAULT 0,
  total_drilling_cost   NUMERIC DEFAULT 0,
  
  -- Approval Workflow
  status                TEXT DEFAULT 'pending',  -- pending, approved, rejected, completed
  current_phase         TEXT DEFAULT 'design',
  created_by            TEXT,
  approved_by           UUID,
  approved_by_name      TEXT,
  approval_date         TIMESTAMPTZ,
  approval_comments     TEXT,
  driller_name          TEXT,
  
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. DIAMOND DRILLING OPERATIONS
-- (Used by: Diamond Drilling Module)
-- =============================================
CREATE TABLE IF NOT EXISTS diamond_drilling_operations (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id                UUID,
  drill_number              TEXT,
  date                      DATE,
  shift                     TEXT,                -- Day / Night
  region                    TEXT,
  location                  TEXT,
  hole_number               TEXT,
  actual_depth_meters       NUMERIC DEFAULT 0,
  core_recovered_meters     NUMERIC DEFAULT 0,
  recovery_percentage       NUMERIC DEFAULT 0,
  rqd                       NUMERIC DEFAULT 0,   -- Rock Quality Designation %
  penetration_rate_m_per_h  NUMERIC DEFAULT 0,
  planned_budget_tzs        NUMERIC DEFAULT 0,
  total_cost                NUMERIC DEFAULT 0,
  sample_collected          TEXT,
  status                    TEXT DEFAULT 'completed',
  created_by                UUID,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Diamond Drilling Executions (fast-entry sub-form)
CREATE TABLE IF NOT EXISTS diamond_drilling_executions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID,
  hole_number   TEXT,
  date          DATE,
  depth_from    NUMERIC,
  depth_to      NUMERIC,
  recovery      NUMERIC,
  rqd           NUMERIC,
  lithology     TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. BLASTING OPERATIONS
-- (Used by: Blasting Module)
-- =============================================
CREATE TABLE IF NOT EXISTS blasting_operations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID,
  date                DATE,
  shift               TEXT,
  region              TEXT,
  location            TEXT,
  blaster_name        TEXT,
  
  -- Drill Parameters
  holes_blasted       INT DEFAULT 0,
  burden              NUMERIC DEFAULT 0,
  spacing             NUMERIC DEFAULT 0,
  hole_depth          NUMERIC DEFAULT 0,
  stemming_length     NUMERIC DEFAULT 0,
  
  -- Explosive Details
  explosive_type      TEXT,
  explosives_used_kg  NUMERIC DEFAULT 0,
  accessories_used    TEXT,
  detonator_type      TEXT,
  
  -- Results
  blasted_tonnage     NUMERIC DEFAULT 0,
  powder_factor       NUMERIC DEFAULT 0,         -- kg/tonne (auto-calculated)
  fragmentation_size  TEXT,
  
  -- Budget
  planned_budget_tzs  NUMERIC DEFAULT 0,
  total_cost          NUMERIC DEFAULT 0,
  
  notes               TEXT,
  photo_urls          TEXT[],
  status              TEXT DEFAULT 'completed',
  created_by          UUID,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. MATERIAL HANDLING OPERATIONS
-- (Used by: Material Handling Module)
-- =============================================
CREATE TABLE IF NOT EXISTS material_handling_operations (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id                UUID,
  operation_number          TEXT,
  date                      DATE,
  day                       TEXT,
  region                    TEXT,
  location                  TEXT,
  latitude                  NUMERIC,
  longitude                 NUMERIC,
  
  -- Fleet & Crew
  operator_names            TEXT,
  machines                  TEXT,
  truck_capacity_tonnes     NUMERIC DEFAULT 0,
  trips_per_day             NUMERIC DEFAULT 0,
  total_trucks              NUMERIC DEFAULT 0,
  
  -- Production KPIs (auto-calculated)
  production_per_day_tonnes NUMERIC DEFAULT 0,
  fuel_efficiency_km_per_l  NUMERIC DEFAULT 0,
  
  -- Consumption
  total_fuel_consumed_l     NUMERIC DEFAULT 0,
  total_distance_km         NUMERIC DEFAULT 0,
  downtime_hours            NUMERIC DEFAULT 0,
  downtime_reason           TEXT,
  
  -- Budget
  planned_budget_tzs        NUMERIC DEFAULT 0,
  cost_per_tonne_tzs        NUMERIC DEFAULT 0,
  total_cost                NUMERIC DEFAULT 0,
  
  -- Narrative
  challenges                TEXT,
  recommendations           TEXT,
  photo_urls                TEXT[],
  
  -- Signatures (stored as base64 data URLs)
  operator_signature        TEXT,
  supervisor_signature      TEXT,
  manager_signature         TEXT,
  
  status                    TEXT DEFAULT 'in_progress',
  created_by                UUID,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. VEHICLES (Fleet Registry)
-- =============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID,
  vehicle_number    TEXT NOT NULL UNIQUE,
  vehicle_type      TEXT NOT NULL,
  make              TEXT,
  model             TEXT,
  year              INT,
  status            TEXT DEFAULT 'operational',  -- operational, maintenance, breakdown, retired
  region            TEXT,
  current_location  TEXT,
  fuel_capacity     NUMERIC,
  odometer_reading  NUMERIC DEFAULT 0,
  tracking_method   TEXT DEFAULT 'PHONE_GPS',
  tracking_mode     TEXT DEFAULT 'PHONE_ONLY', -- PHONE_ONLY, HARDWARE_PRIMARY, HYBRID
  tracker_device_id TEXT,
  tracker_protocol  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. FUEL LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS fuel_logs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID,
  fleet_vehicle_id      UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id             UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  log_date_time         TIMESTAMPTZ,
  location              TEXT,
  fuel_type             TEXT DEFAULT 'Diesel',
  quantity              NUMERIC DEFAULT 0,       -- liters
  cost_per_liter        NUMERIC DEFAULT 0,
  total_cost            NUMERIC DEFAULT 0,
  odometer_reading      NUMERIC DEFAULT 0,
  notes                 TEXT,
  
  -- Signatures
  reporter_signature    TEXT,
  supervisor_signature  TEXT,
  manager_signature     TEXT,
  
  status                TEXT DEFAULT 'approved',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. MAINTENANCE LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id              UUID,
  fleet_vehicle_id        UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  maintenance_date        DATE,
  maintenance_type        TEXT NOT NULL,
  description             TEXT,
  cost                    NUMERIC DEFAULT 0,
  performed_by            TEXT,
  next_service_date       DATE,
  next_service_odometer   NUMERIC,
  odometer_reading        NUMERIC,
  
  -- Signatures
  reporter_signature      TEXT,
  supervisor_signature    TEXT,
  manager_signature       TEXT,
  
  status                  TEXT DEFAULT 'completed',
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. INVENTORY ITEMS
-- (Shared across all modules)
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID,
  item_code           TEXT,
  item_name           TEXT NOT NULL,
  category            TEXT NOT NULL,  -- explosives, fuel, drilling, mechanical, FLEET, BLASTING, DIAMOND
  unit                TEXT DEFAULT 'pcs',
  current_stock       NUMERIC DEFAULT 0,
  minimum_stock_level NUMERIC DEFAULT 0,
  reorder_point       NUMERIC DEFAULT 0,
  lead_time           INT DEFAULT 7,          -- days
  unit_cost           NUMERIC DEFAULT 0,
  
  -- Computed outputs (stored)
  stock_status        TEXT DEFAULT 'OPTIMAL', -- OPTIMAL, LOW, CRITICAL
  reorder_alert       BOOLEAN DEFAULT FALSE,
  total_asset_value   NUMERIC DEFAULT 0,
  
  created_by          UUID,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 12. STOCK TRANSACTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS stock_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID,
  item_id         UUID REFERENCES inventory_items(id),
  transaction_type TEXT NOT NULL,  -- IN, OUT, ADJUSTMENT
  quantity        NUMERIC NOT NULL,
  reference_id    TEXT,            -- e.g., maintenance log ID or blast ID
  module          TEXT,
  notes           TEXT,
  created_by      UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 13. SAFETY INCIDENTS
-- =============================================
CREATE TABLE IF NOT EXISTS safety_incidents (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id              UUID,
  reported_by             TEXT,
  incident_date           DATE,
  type                    TEXT,      -- injury, near miss, property damage
  location                TEXT,
  severity                TEXT,      -- low, medium, high, critical
  description             TEXT,
  corrective_action       TEXT,
  status                  TEXT DEFAULT 'open',  -- open, under investigation, closed
  
  -- Computed outputs
  risk_level              TEXT DEFAULT 'LOW',
  days_since_last_incident INT DEFAULT 0,
  safety_performance_index NUMERIC DEFAULT 100,
  
  site_photos             TEXT[],
  created_by              UUID,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 14. RISK ASSESSMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS risk_assessments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID,
  title           TEXT NOT NULL,
  risk_type       TEXT,
  likelihood      INT,            -- 1-5
  consequence     INT,            -- 1-5
  risk_score      INT,            -- auto = likelihood * consequence
  controls        TEXT,
  status          TEXT DEFAULT 'open',
  assessed_by     TEXT,
  review_date     DATE,
  created_by      UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 15. INVOICES
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID,
  invoice_number  TEXT UNIQUE,
  client_name     TEXT NOT NULL,
  client_company  TEXT,
  client_email    TEXT,
  client_address  TEXT,
  
  -- Financial Details
  subtotal        NUMERIC DEFAULT 0,
  tax_rate        NUMERIC DEFAULT 0,
  tax_amount      NUMERIC DEFAULT 0,
  total_amount    NUMERIC DEFAULT 0,
  amount_paid     NUMERIC DEFAULT 0,
  balance_due     NUMERIC DEFAULT 0,
  
  currency        TEXT DEFAULT 'TZS',
  due_date        DATE,
  issue_date      DATE DEFAULT CURRENT_DATE,
  payment_date    DATE,
  payment_method  TEXT,
  
  notes           TEXT,
  status          TEXT DEFAULT 'draft',  -- draft, sent, paid, overdue, cancelled
  
  -- Module source linkage
  source_module   TEXT,           -- blasting, drilling, material_handling etc
  source_id       UUID,
  
  created_by      UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  quantity        NUMERIC DEFAULT 1,
  unit_price      NUMERIC DEFAULT 0,
  total           NUMERIC DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 16. EXPENSES (Financial Ledger)
-- =============================================
CREATE TABLE IF NOT EXISTS expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID,
  date            DATE DEFAULT CURRENT_DATE,
  category        TEXT,
  description     TEXT NOT NULL,
  amount          NUMERIC DEFAULT 0,
  currency        TEXT DEFAULT 'TZS',
  vendor          TEXT,
  receipt_url     TEXT,
  status          TEXT DEFAULT 'pending',
  approved_by     UUID,
  created_by      UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 17. GEOPHYSICS SURVEYS
-- =============================================
CREATE TABLE IF NOT EXISTS geophysics_surveys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID,
  project_id      UUID REFERENCES projects(id),
  survey_date     DATE,
  region          TEXT,
  location        TEXT,
  survey_type     TEXT,           -- magnetic, seismic, gravity, IP, resistivity
  equipment_used  TEXT,
  operator_name   TEXT,
  grid_spacing    NUMERIC,
  total_line_km   NUMERIC,
  anomaly_detected BOOLEAN DEFAULT FALSE,
  anomaly_details TEXT,
  planned_budget_tzs NUMERIC DEFAULT 0,
  total_cost      NUMERIC DEFAULT 0,
  status          TEXT DEFAULT 'completed',
  notes           TEXT,
  file_urls       TEXT[],
  created_by      UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Geophysics Executions (field logs sub-table)
CREATE TABLE IF NOT EXISTS geophysics_executions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id       UUID REFERENCES geophysics_surveys(id),
  company_id      UUID,
  date            DATE,
  line_number     TEXT,
  station_from    NUMERIC,
  station_to      NUMERIC,
  reading_value   NUMERIC,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 18. ASSAY SAMPLES (Diamond Drilling Lab)
-- =============================================
CREATE TABLE IF NOT EXISTS assay_samples (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID,
  sample_id         TEXT UNIQUE NOT NULL,
  hole_id           TEXT,
  depth_from        NUMERIC,
  depth_to          NUMERIC,
  sample_type       TEXT,
  weight_kg         NUMERIC,
  au_grade_g_t      NUMERIC,       -- Gold grade g/t
  dispatch_date     DATE,
  received_date     DATE,
  result_date       DATE,
  lab_name          TEXT,
  status            TEXT DEFAULT 'dispatched',  -- dispatched, received, analysed, certified
  notes             TEXT,
  created_by        UUID,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 19. EQUIPMENT INSPECTIONS (Quarry Checklist)
-- =============================================
CREATE TABLE IF NOT EXISTS equipment_inspections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID,
  vehicle_id      UUID REFERENCES vehicles(id),
  inspector_id    UUID REFERENCES user_profiles(id),
  project_id      UUID REFERENCES projects(id),
  inspection_date DATE,
  shift           TEXT,
  checklist       JSONB,          -- flexible key/value inspection points
  overall_status  TEXT,           -- pass, fail, conditional
  notes           TEXT,
  
  -- Signatures
  operator_signature    TEXT,
  supervisor_signature  TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 20. EQUIPMENT PAYLOADS (Quarry Payload Logs)
-- =============================================
CREATE TABLE IF NOT EXISTS equipment_payloads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID,
  vehicle_id      UUID REFERENCES vehicles(id),
  operator_id     UUID REFERENCES user_profiles(id),
  project_id      UUID REFERENCES projects(id),
  log_date        DATE,
  shift           TEXT,
  material_type   TEXT,
  total_trips     INT DEFAULT 0,
  payload_per_trip NUMERIC DEFAULT 0,
  total_tonnes    NUMERIC DEFAULT 0,
  distance_km     NUMERIC DEFAULT 0,
  fuel_used_l     NUMERIC DEFAULT 0,
  notes           TEXT,
  
  -- Signatures
  operator_signature    TEXT,
  supervisor_signature  TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment_payload_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payload_id      UUID REFERENCES equipment_payloads(id),
  trip_number     INT,
  load_tonnes     NUMERIC,
  timestamp       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 21. CONTACT SUBMISSIONS (Landing Page)
-- =============================================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 22. SPARE PARTS (Fleet Inventory sub-module)
-- =============================================
CREATE TABLE IF NOT EXISTS spare_parts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID,
  item_code       TEXT UNIQUE,
  name            TEXT NOT NULL,
  category        TEXT,
  compatible_with TEXT,           -- vehicle types
  quantity        NUMERIC DEFAULT 0,
  unit            TEXT DEFAULT 'pcs',
  unit_cost       NUMERIC DEFAULT 0,
  reorder_level   NUMERIC DEFAULT 0,
  supplier        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STORAGE BUCKETS (Supabase Storage)
-- Create these manually in Supabase Dashboard > Storage:
-- 1. "operating-photos"   (public) — field site photos
-- 2. "operation-photos"  (public) — material handling photos
-- 3. "operating-photos"  (public) — safety incident photos
-- 4. "company-assets"    (private) — company logos
-- =============================================

-- =============================================
-- ROW LEVEL SECURITY (Basic Policy Template)
-- Enable RLS on each table and add policies
-- =============================================
ALTER TABLE companies            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE drilling_operations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE blasting_operations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE diamond_drilling_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_handling_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE geophysics_surveys   ENABLE ROW LEVEL SECURITY;
ALTER TABLE assay_samples        ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_payloads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts          ENABLE ROW LEVEL SECURITY;

-- Open read policy for authenticated users (adjust per module later)
CREATE POLICY "Allow authenticated read" ON drilling_operations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON blasting_operations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON diamond_drilling_operations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON material_handling_operations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON fuel_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON maintenance_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON inventory_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON safety_incidents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON invoices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON geophysics_surveys FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON assay_samples FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all inserts for authenticated users
CREATE POLICY "Allow authenticated insert" ON drilling_operations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON blasting_operations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON diamond_drilling_operations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON material_handling_operations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON vehicles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON fuel_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON maintenance_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON inventory_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON safety_incidents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON invoices FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON geophysics_surveys FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON assay_samples FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- 23. VEHICLE LOCATIONS (Live GPS Tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS vehicle_locations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  vehicle_id      UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_plate   TEXT,
  driver_id       UUID REFERENCES user_profiles(id),
  latitude        NUMERIC(10, 7) NOT NULL,
  longitude       NUMERIC(10, 7) NOT NULL,
  altitude_m      NUMERIC DEFAULT 0,
  speed_mps       NUMERIC DEFAULT 0,
  heading_deg     NUMERIC DEFAULT 0,
  accuracy_m      NUMERIC DEFAULT 0,
  source          TEXT DEFAULT 'phone',
  device_id       TEXT,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_plate_time ON vehicle_locations(vehicle_plate, recorded_at DESC);
ALTER TABLE vehicle_locations REPLICA IDENTITY FULL;

-- =============================================
-- 23A. PHONE LOCATIONS (Mobile Strategy)
-- =============================================
CREATE TABLE IF NOT EXISTS phone_locations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id      UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id       UUID REFERENCES user_profiles(id),
  latitude        NUMERIC(10, 7) NOT NULL,
  longitude       NUMERIC(10, 7) NOT NULL,
  speed_mps       NUMERIC DEFAULT 0,
  accuracy_m      NUMERIC DEFAULT 0,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phone_loc_vehicle ON phone_locations(vehicle_id, recorded_at DESC);

-- =============================================
-- 23b. HARDWARE LOCATIONS & UNIFIED VIEW
-- =============================================
CREATE TABLE IF NOT EXISTS hardware_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracker_device_id VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(5, 2),
    heading INTEGER,
    altitude DECIMAL(8, 2),
    fuel_level_raw DECIMAL(10, 2),
    engine_status BOOLEAN DEFAULT FALSE,
    raw_payload JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hardware_tracker_id ON hardware_locations(tracker_device_id);
CREATE INDEX IF NOT EXISTS idx_hardware_timestamp ON hardware_locations(timestamp DESC);
ALTER TABLE hardware_locations REPLICA IDENTITY FULL;

CREATE OR REPLACE VIEW unified_vehicle_locations AS
WITH latest_phone AS (
    SELECT DISTINCT ON (vehicle_id) 
        vehicle_id, latitude, longitude, speed_mps as speed, recorded_at as timestamp, 'phone' as source
    FROM vehicle_locations
    ORDER BY vehicle_id, recorded_at DESC
),
latest_hardware AS (
    SELECT DISTINCT ON (v.id) 
        v.id as vehicle_id, h.latitude, h.longitude, h.speed, h.timestamp, 'hardware' as source
    FROM vehicles v
    JOIN hardware_locations h ON v.tracker_device_id = h.tracker_device_id
    ORDER BY v.id, h.timestamp DESC
)
SELECT 
    v.id as vehicle_id,
    v.make || ' ' || v.model as vehicle_name,
    v.vehicle_number as plate_number,
    v.tracking_method,
    CASE 
        WHEN v.tracking_method = 'HARDWARE_TRACKER' THEN h.latitude
        ELSE p.latitude
    END as latitude,
    CASE 
        WHEN v.tracking_method = 'HARDWARE_TRACKER' THEN h.longitude
        ELSE p.longitude
    END as longitude,
    CASE 
        WHEN v.tracking_method = 'HARDWARE_TRACKER' THEN h.speed
        ELSE p.speed
    END as speed,
    CASE 
        WHEN v.tracking_method = 'HARDWARE_TRACKER' THEN h.timestamp
        ELSE p.timestamp
    END as last_updated,
    CASE 
        WHEN v.tracking_method = 'HARDWARE_TRACKER' THEN h.source
        ELSE p.source
    END as current_source
FROM vehicles v
LEFT JOIN latest_phone p ON v.id = p.vehicle_id
LEFT JOIN latest_hardware h ON v.id = h.vehicle_id;

-- DRIVER APP AUTO-TRIP HYBRID VIEW
CREATE OR REPLACE VIEW active_vehicle_locations AS
WITH recent_phone AS (
    SELECT DISTINCT ON (vehicle_id) 
        vehicle_id, latitude, longitude, speed_mps as speed, recorded_at as timestamp, 'phone_gps' as source
    FROM phone_locations
    ORDER BY vehicle_id, recorded_at DESC
),
recent_hardware AS (
    SELECT DISTINCT ON (v.id) 
        v.id as vehicle_id, h.latitude, h.longitude, h.speed, h.timestamp, 'hardware_tracker' as source
    FROM vehicles v
    JOIN hardware_locations h ON v.tracker_device_id = h.tracker_device_id
    ORDER BY v.id, h.timestamp DESC
)
SELECT 
    v.id as vehicle_id,
    v.vehicle_number,
    v.tracking_mode,
    COALESCE(
        CASE 
            WHEN v.tracking_mode = 'HARDWARE_PRIMARY' THEN rh.latitude
            WHEN v.tracking_mode = 'PHONE_ONLY' THEN rp.latitude
            WHEN v.tracking_mode = 'HYBRID' THEN (
                -- Priority to most recent
                CASE WHEN rh.timestamp > rp.timestamp THEN rh.latitude ELSE rp.latitude END
            )
        END, rp.latitude, rh.latitude
    ) as auto_latitude,
    COALESCE(
        CASE 
            WHEN v.tracking_mode = 'HARDWARE_PRIMARY' THEN rh.longitude
            WHEN v.tracking_mode = 'PHONE_ONLY' THEN rp.longitude
            WHEN v.tracking_mode = 'HYBRID' THEN (
                CASE WHEN rh.timestamp > rp.timestamp THEN rh.longitude ELSE rp.longitude END
            )
        END, rp.longitude, rh.longitude
    ) as auto_longitude,
    COALESCE(rh.timestamp, rp.timestamp) as last_updated
FROM vehicles v
LEFT JOIN recent_phone rp ON v.id = rp.vehicle_id
LEFT JOIN recent_hardware rh ON v.id = rh.vehicle_id;

-- =============================================
-- 24. GEOFENCES
-- =============================================
CREATE TABLE IF NOT EXISTS geofences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'pit',
  shape           TEXT NOT NULL DEFAULT 'polygon',
  coordinates     JSONB,
  center_lat      NUMERIC(10, 7),
  center_lng      NUMERIC(10, 7),
  radius_m        NUMERIC DEFAULT 0,
  active          BOOLEAN DEFAULT TRUE,
  created_by      UUID REFERENCES user_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 25. GEOFENCE EVENTS (Entry/Exit + Cycle Time)
-- =============================================
CREATE TABLE IF NOT EXISTS geofence_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  geofence_id     UUID REFERENCES geofences(id) ON DELETE CASCADE,
  vehicle_id      UUID REFERENCES vehicles(id)  ON DELETE CASCADE,
  vehicle_plate   TEXT,
  driver_id       UUID REFERENCES user_profiles(id),
  event_type      TEXT NOT NULL,
  latitude        NUMERIC(10, 7),
  longitude       NUMERIC(10, 7),
  entered_at      TIMESTAMPTZ,
  exited_at       TIMESTAMPTZ,
  time_inside_sec NUMERIC GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (exited_at - entered_at))) STORED,
  notes           TEXT,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_geofence_events_vehicle ON geofence_events(vehicle_id, recorded_at DESC);

-- =============================================
-- 26. MAINTENANCE ALERTS
-- =============================================
CREATE TABLE IF NOT EXISTS maintenance_alerts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID REFERENCES companies(id),
  vehicle_id            UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_plate         TEXT,
  alert_type            TEXT NOT NULL,
  message               TEXT NOT NULL,
  severity              TEXT DEFAULT 'warning',
  threshold_value       NUMERIC,
  current_value         NUMERIC,
  acknowledged          BOOLEAN DEFAULT FALSE,
  acknowledged_by       UUID REFERENCES user_profiles(id),
  acknowledged_at       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE vehicle_locations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_locations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences           ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_alerts  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read"   ON vehicle_locations  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON vehicle_locations  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read"   ON hardware_locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON hardware_locations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read"   ON geofences         FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON geofences         FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update" ON geofences         FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete" ON geofences         FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read"   ON geofence_events   FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON geofence_events   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read"   ON maintenance_alerts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert" ON maintenance_alerts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update" ON maintenance_alerts FOR UPDATE USING (auth.role() = 'authenticated');


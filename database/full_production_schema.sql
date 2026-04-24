-- ============================================================
-- SMART MINE — FULL CONSOLIDATED DATABASE SCHEMA
-- Verified against ALL module form files
-- Includes: Core, Fleet, Safety, Inventory, Finance, Technical, 
--           RBAC, Audit Logs, Multi-Branding, and Password Recovery.
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
  roles         TEXT[] DEFAULT ARRAY[]::TEXT[],
  position      TEXT,
  status        TEXT DEFAULT 'active',
  
  -- Security & Auth Features
  is_temp_password        BOOLEAN DEFAULT FALSE,
  temp_password_expires_at TIMESTAMPTZ,
  totp_secret             TEXT,
  totp_enabled            BOOLEAN DEFAULT FALSE,
  
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
-- =============================================
CREATE TABLE IF NOT EXISTS drilling_operations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID REFERENCES companies(id),
  drill_number          TEXT NOT NULL,
  date                  DATE,
  planned_date          DATE,
  region                TEXT,
  location              TEXT,
  planned_holes         INT DEFAULT 0,
  holes_drilled         INT DEFAULT 0,
  burden                NUMERIC DEFAULT 0,
  spacing               NUMERIC DEFAULT 0,
  planned_depth         NUMERIC DEFAULT 0,
  planned_rate          NUMERIC DEFAULT 0,
  rig_id                TEXT,
  planned_bit_type      TEXT,
  drilling_required_m   NUMERIC DEFAULT 0,
  penetration_rate_m_per_min NUMERIC DEFAULT 0,
  fuel_consumption_l    NUMERIC DEFAULT 0,
  drilling_cost_per_m   NUMERIC DEFAULT 0,
  labor                 NUMERIC DEFAULT 0,
  fuel_cost             NUMERIC DEFAULT 0,
  accessories_cost      NUMERIC DEFAULT 0,
  estimated_total_depth NUMERIC DEFAULT 0,
  estimated_cost        NUMERIC DEFAULT 0,
  estimated_hours       NUMERIC DEFAULT 0,
  planned_budget_tzs    NUMERIC DEFAULT 0,
  total_drilling_cost   NUMERIC DEFAULT 0,
  status                TEXT DEFAULT 'pending',
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
-- =============================================
CREATE TABLE IF NOT EXISTS diamond_drilling_operations (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id                UUID REFERENCES companies(id),
  drill_number              TEXT,
  date                      DATE,
  shift                     TEXT,
  region                    TEXT,
  location                  TEXT,
  hole_number               TEXT,
  actual_depth_meters       NUMERIC DEFAULT 0,
  core_recovered_meters     NUMERIC DEFAULT 0,
  recovery_percentage       NUMERIC DEFAULT 0,
  rqd                       NUMERIC DEFAULT 0,
  penetration_rate_m_per_h  NUMERIC DEFAULT 0,
  planned_budget_tzs        NUMERIC DEFAULT 0,
  total_cost                NUMERIC DEFAULT 0,
  sample_collected          TEXT,
  status                    TEXT DEFAULT 'completed',
  created_by                UUID REFERENCES user_profiles(id),
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diamond_drilling_executions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID REFERENCES companies(id),
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
-- =============================================
CREATE TABLE IF NOT EXISTS blasting_operations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID REFERENCES companies(id),
  date                DATE,
  shift               TEXT,
  region              TEXT,
  location            TEXT,
  blaster_name        TEXT,
  holes_blasted       INT DEFAULT 0,
  burden              NUMERIC DEFAULT 0,
  spacing             NUMERIC DEFAULT 0,
  hole_depth          NUMERIC DEFAULT 0,
  stemming_length     NUMERIC DEFAULT 0,
  explosive_type      TEXT,
  explosives_used_kg  NUMERIC DEFAULT 0,
  accessories_used    TEXT,
  detonator_type      TEXT,
  blasted_tonnage     NUMERIC DEFAULT 0,
  powder_factor       NUMERIC DEFAULT 0,
  fragmentation_size  TEXT,
  planned_budget_tzs  NUMERIC DEFAULT 0,
  total_cost          NUMERIC DEFAULT 0,
  notes               TEXT,
  photo_urls          TEXT[],
  status              TEXT DEFAULT 'completed',
  created_by          UUID REFERENCES user_profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. MATERIAL HANDLING OPERATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS material_handling_operations (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id                UUID REFERENCES companies(id),
  operation_number          TEXT,
  date                      DATE,
  day                       TEXT,
  region                    TEXT,
  location                  TEXT,
  latitude                  NUMERIC,
  longitude                 NUMERIC,
  operator_names            TEXT,
  machines                  TEXT,
  truck_capacity_tonnes     NUMERIC DEFAULT 0,
  trips_per_day             NUMERIC DEFAULT 0,
  total_trucks              NUMERIC DEFAULT 0,
  production_per_day_tonnes NUMERIC DEFAULT 0,
  fuel_efficiency_km_per_l  NUMERIC DEFAULT 0,
  total_fuel_consumed_l     NUMERIC DEFAULT 0,
  total_distance_km         NUMERIC DEFAULT 0,
  downtime_hours            NUMERIC DEFAULT 0,
  downtime_reason           TEXT,
  planned_budget_tzs        NUMERIC DEFAULT 0,
  cost_per_tonne_tzs        NUMERIC DEFAULT 0,
  total_cost                NUMERIC DEFAULT 0,
  challenges                TEXT,
  recommendations           TEXT,
  photo_urls                TEXT[],
  operator_signature        TEXT,
  supervisor_signature      TEXT,
  manager_signature         TEXT,
  status                    TEXT DEFAULT 'in_progress',
  created_by                UUID REFERENCES user_profiles(id),
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. VEHICLES (Fleet Registry)
-- =============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID REFERENCES companies(id),
  vehicle_number    TEXT NOT NULL UNIQUE,
  vehicle_type      TEXT NOT NULL,
  make              TEXT,
  model             TEXT,
  year              INT,
  status            TEXT DEFAULT 'operational',
  region            TEXT,
  current_location  TEXT,
  fuel_capacity     NUMERIC,
  odometer_reading  NUMERIC DEFAULT 0,
  tracking_method   TEXT DEFAULT 'PHONE_GPS',
  tracking_mode     TEXT DEFAULT 'PHONE_ONLY',
  tracker_device_id TEXT,
  tracker_protocol  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. FUEL LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS fuel_logs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID REFERENCES companies(id),
  fleet_vehicle_id      UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id             UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  log_date_time         TIMESTAMPTZ,
  location              TEXT,
  fuel_type             TEXT DEFAULT 'Diesel',
  quantity              NUMERIC DEFAULT 0,
  cost_per_liter        NUMERIC DEFAULT 0,
  total_cost            NUMERIC DEFAULT 0,
  odometer_reading      NUMERIC DEFAULT 0,
  notes                 TEXT,
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
  company_id              UUID REFERENCES companies(id),
  fleet_vehicle_id        UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  maintenance_date        DATE,
  maintenance_type        TEXT NOT NULL,
  description             TEXT,
  cost                    NUMERIC DEFAULT 0,
  performed_by            TEXT,
  next_service_date       DATE,
  next_service_odometer   NUMERIC,
  odometer_reading        NUMERIC,
  reporter_signature      TEXT,
  supervisor_signature    TEXT,
  manager_signature       TEXT,
  status                  TEXT DEFAULT 'completed',
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. INVENTORY ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID REFERENCES companies(id),
  item_code           TEXT,
  item_name           TEXT NOT NULL,
  category            TEXT NOT NULL,
  unit                TEXT DEFAULT 'pcs',
  current_stock       NUMERIC DEFAULT 0,
  minimum_stock_level NUMERIC DEFAULT 0,
  reorder_point       NUMERIC DEFAULT 0,
  lead_time           INT DEFAULT 7,
  unit_cost           NUMERIC DEFAULT 0,
  stock_status        TEXT DEFAULT 'OPTIMAL',
  reorder_alert       BOOLEAN DEFAULT FALSE,
  total_asset_value   NUMERIC DEFAULT 0,
  created_by          UUID REFERENCES user_profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 12. STOCK TRANSACTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS stock_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  item_id         UUID REFERENCES inventory_items(id),
  transaction_type TEXT NOT NULL,
  quantity        NUMERIC NOT NULL,
  reference_id    TEXT,
  module          TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES user_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 13. SAFETY INCIDENTS
-- =============================================
CREATE TABLE IF NOT EXISTS safety_incidents (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id              UUID REFERENCES companies(id),
  reported_by             TEXT,
  incident_date           DATE,
  type                    TEXT,
  location                TEXT,
  severity                TEXT,
  description             TEXT,
  corrective_action       TEXT,
  status                  TEXT DEFAULT 'open',
  risk_level              TEXT DEFAULT 'LOW',
  days_since_last_incident INT DEFAULT 0,
  safety_performance_index NUMERIC DEFAULT 100,
  site_photos             TEXT[],
  created_by              UUID REFERENCES user_profiles(id),
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 14. RISK ASSESSMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS risk_assessments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  title           TEXT NOT NULL,
  risk_type       TEXT,
  likelihood      INT,
  consequence     INT,
  risk_score      INT,
  controls        TEXT,
  status          TEXT DEFAULT 'open',
  assessed_by     TEXT,
  review_date     DATE,
  created_by      UUID REFERENCES user_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 15. INVOICES
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  invoice_number  TEXT UNIQUE,
  client_name     TEXT NOT NULL,
  client_company  TEXT,
  client_email    TEXT,
  client_address  TEXT,
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
  status          TEXT DEFAULT 'draft',
  source_module   TEXT,
  source_id       UUID,
  created_by      UUID REFERENCES user_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

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
  company_id      UUID REFERENCES companies(id),
  date            DATE DEFAULT CURRENT_DATE,
  category        TEXT,
  description     TEXT NOT NULL,
  amount          NUMERIC DEFAULT 0,
  currency        TEXT DEFAULT 'TZS',
  vendor          TEXT,
  receipt_url     TEXT,
  status          TEXT DEFAULT 'pending',
  approved_by     UUID REFERENCES user_profiles(id),
  created_by      UUID REFERENCES user_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 17. GEOPHYSICS SURVEYS
-- =============================================
CREATE TABLE IF NOT EXISTS geophysics_surveys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  project_id      UUID REFERENCES projects(id),
  survey_date     DATE,
  region          TEXT,
  location        TEXT,
  survey_type     TEXT,
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
  created_by      UUID REFERENCES user_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS geophysics_executions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id       UUID REFERENCES geophysics_surveys(id) ON DELETE CASCADE,
  company_id      UUID REFERENCES companies(id),
  date            DATE,
  line_number     TEXT,
  station_from    NUMERIC,
  station_to      NUMERIC,
  reading_value   NUMERIC,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 18. EQUIPMENT INSPECTIONS (Quarry Checklist)
-- =============================================
CREATE TABLE IF NOT EXISTS equipment_inspections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  vehicle_id      UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  inspector_id    UUID REFERENCES user_profiles(id),
  project_id      UUID REFERENCES projects(id),
  inspection_date DATE,
  shift           TEXT,
  checklist       JSONB,
  overall_status  TEXT,
  notes           TEXT,
  operator_signature    TEXT,
  supervisor_signature  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 19. EQUIPMENT PAYLOADS
-- =============================================
CREATE TABLE IF NOT EXISTS equipment_payloads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  vehicle_id      UUID REFERENCES vehicles(id) ON DELETE CASCADE,
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
  operator_signature    TEXT,
  supervisor_signature  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment_payload_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payload_id      UUID REFERENCES equipment_payloads(id) ON DELETE CASCADE,
  trip_number     INT,
  load_tonnes     NUMERIC,
  timestamp       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 20. AUDIT LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES auth.users(id),
  actor_name  TEXT,
  action      TEXT NOT NULL,
  module      TEXT,
  details     TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module, created_at DESC);

-- =============================================
-- 21. PASSWORD RESET REQUESTS
-- =============================================
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 22. BRANDS & SYSTEM FLAGS
-- =============================================
CREATE TABLE IF NOT EXISTS brands (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name   TEXT NOT NULL,
  logo_url     TEXT,
  tagline      TEXT,
  is_default   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_default ON brands(is_default) WHERE is_default = TRUE;

CREATE TABLE IF NOT EXISTS system_flags (
  flag_name   TEXT PRIMARY KEY,
  is_enabled  BOOLEAN DEFAULT FALSE,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 23. GPS & LOCATION TABLES
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
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS hardware_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracker_device_id VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(5, 2),
    heading INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 24. RLS POLICIES
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
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands               ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Authenticated users read brands" ON brands FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Public can insert reset requests" ON password_reset_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Super Admin manage all" ON audit_logs FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));
-- (Add more specific policies as needed per module)

-- =============================================
-- INITIAL DATA
-- =============================================
INSERT INTO brands (brand_name, logo_url, tagline, is_default)
VALUES ('Amogtech', '', 'Mining Excellence', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO system_flags (flag_name, is_enabled, description)
VALUES ('show_consultant_pricing', FALSE, 'Future use: show consultant pricing tier')
ON CONFLICT DO NOTHING;

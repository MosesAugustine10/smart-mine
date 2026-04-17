-- ============================================================
-- GPS Hardware Tracker Integration Migration
-- ============================================================

BEGIN;

-- 1. Update Vehicles Table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='tracking_method') THEN
        ALTER TABLE vehicles ADD COLUMN tracking_method VARCHAR(20) DEFAULT 'PHONE_GPS';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='tracker_device_id') THEN
        ALTER TABLE vehicles ADD COLUMN tracker_device_id VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='tracker_protocol') THEN
        ALTER TABLE vehicles ADD COLUMN tracker_protocol VARCHAR(30);
    END IF;
END $$;

-- 2. Create Hardware Locations Table
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

-- Indexing for fast queries
CREATE INDEX IF NOT EXISTS idx_hardware_tracker_id ON hardware_locations(tracker_device_id);
CREATE INDEX IF NOT EXISTS idx_hardware_timestamp ON hardware_locations(timestamp DESC);

-- 3. Create Fuel Calibration Table
CREATE TABLE IF NOT EXISTS fuel_calibration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    raw_value DECIMAL(10, 2) NOT NULL,
    actual_liters DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Unified View for Frontend
-- This view merges the latest phone GPS or Hardware Tracker location
CREATE OR REPLACE VIEW unified_vehicle_locations AS
WITH latest_phone AS (
    SELECT DISTINCT ON (vehicle_id) 
        vehicle_id, latitude, longitude, speed, timestamp, 'phone' as source
    FROM vehicle_locations
    ORDER BY vehicle_id, timestamp DESC
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
    v.name as vehicle_name,
    v.plate_number,
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

COMMIT;

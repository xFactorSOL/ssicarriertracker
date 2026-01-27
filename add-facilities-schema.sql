-- ============================================
-- FACILITIES (SHIPPERS & RECEIVERS) SCHEMA
-- ============================================
-- This adds proper shipper/receiver tracking to loads
-- Run this in Supabase SQL Editor

-- 1. Create facilities table (warehouses, distribution centers, customer locations)
CREATE TABLE IF NOT EXISTS facilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic Info
  facility_name TEXT NOT NULL,
  facility_type VARCHAR(20) CHECK (facility_type IN ('warehouse', 'distribution_center', 'manufacturing', 'retail', 'other')),
  
  -- Address
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip VARCHAR(10) NOT NULL,
  country VARCHAR(3) DEFAULT 'USA',
  
  -- Contact Info
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Operating Details
  hours_of_operation TEXT, -- e.g., "Mon-Fri 8AM-5PM"
  appointment_required BOOLEAN DEFAULT FALSE,
  dock_hours TEXT, -- e.g., "First come first served" or "Appointment only"
  
  -- Special Instructions
  gate_code TEXT,
  special_instructions TEXT,
  loading_time_avg INT, -- Average minutes to load/unload
  
  -- Performance Tracking
  total_pickups INT DEFAULT 0,
  total_deliveries INT DEFAULT 0,
  avg_loading_time INT, -- Calculated average
  avg_unloading_time INT,
  
  -- Relationship to customer
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_facilities_customer ON facilities(customer_id);
CREATE INDEX IF NOT EXISTS idx_facilities_city_state ON facilities(city, state);
CREATE INDEX IF NOT EXISTS idx_facilities_name ON facilities(facility_name);

-- 3. Add shipper and receiver to loads table
ALTER TABLE loads 
  ADD COLUMN IF NOT EXISTS shipper_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shipper_name TEXT,
  ADD COLUMN IF NOT EXISTS shipper_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS shipper_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS shipper_instructions TEXT,
  ADD COLUMN IF NOT EXISTS shipper_appointment_time TIME,
  
  ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS receiver_name TEXT,
  ADD COLUMN IF NOT EXISTS receiver_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS receiver_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS receiver_instructions TEXT,
  ADD COLUMN IF NOT EXISTS receiver_appointment_time TIME;

-- 4. Add indexes for loads
CREATE INDEX IF NOT EXISTS idx_loads_shipper ON loads(shipper_id);
CREATE INDEX IF NOT EXISTS idx_loads_receiver ON loads(receiver_id);

-- 5. Update trigger to track facility usage
CREATE OR REPLACE FUNCTION update_facility_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- When a load is created, increment pickup/delivery counts
  IF TG_OP = 'INSERT' THEN
    -- Increment shipper pickups
    IF NEW.shipper_id IS NOT NULL THEN
      UPDATE facilities 
      SET total_pickups = total_pickups + 1,
          updated_at = NOW()
      WHERE id = NEW.shipper_id;
    END IF;
    
    -- Increment receiver deliveries
    IF NEW.receiver_id IS NOT NULL THEN
      UPDATE facilities 
      SET total_deliveries = total_deliveries + 1,
          updated_at = NOW()
      WHERE id = NEW.receiver_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS loads_facility_stats_trigger ON loads;
CREATE TRIGGER loads_facility_stats_trigger
  AFTER INSERT ON loads
  FOR EACH ROW
  EXECUTE FUNCTION update_facility_stats();

-- 6. RLS Policies for facilities
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read facilities
CREATE POLICY "Users can view facilities"
  ON facilities FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can create facilities
CREATE POLICY "Users can create facilities"
  ON facilities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update facilities
CREATE POLICY "Users can update facilities"
  ON facilities FOR UPDATE
  TO authenticated
  USING (true);

-- Only super admins can delete facilities
CREATE POLICY "Super admins can delete facilities"
  ON facilities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- 7. Helper function to auto-create facility from load data (for migration)
CREATE OR REPLACE FUNCTION create_facility_from_address(
  p_name TEXT,
  p_address TEXT,
  p_city TEXT,
  p_state TEXT,
  p_zip TEXT,
  p_customer_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_facility_id UUID;
BEGIN
  -- Check if facility already exists
  SELECT id INTO v_facility_id
  FROM facilities
  WHERE facility_name = p_name
    AND city = p_city
    AND state = p_state
    AND zip = p_zip
  LIMIT 1;
  
  -- If not found, create it
  IF v_facility_id IS NULL THEN
    INSERT INTO facilities (
      facility_name,
      address_line1,
      city,
      state,
      zip,
      customer_id,
      facility_type
    ) VALUES (
      p_name,
      p_address,
      p_city,
      p_state,
      p_zip,
      p_customer_id,
      'other'
    )
    RETURNING id INTO v_facility_id;
  END IF;
  
  RETURN v_facility_id;
END;
$$ LANGUAGE plpgsql;

-- 8. View for load details with shipper/receiver info
CREATE OR REPLACE VIEW loads_with_facilities AS
SELECT 
  l.*,
  
  -- Shipper details
  s.facility_name as shipper_facility_name,
  s.address_line1 as shipper_address,
  s.city as shipper_city_full,
  s.state as shipper_state_full,
  s.zip as shipper_zip_full,
  s.contact_name as shipper_contact,
  s.contact_phone as shipper_phone,
  s.hours_of_operation as shipper_hours,
  s.appointment_required as shipper_appt_required,
  s.special_instructions as shipper_special_instructions,
  
  -- Receiver details
  r.facility_name as receiver_facility_name,
  r.address_line1 as receiver_address,
  r.city as receiver_city_full,
  r.state as receiver_state_full,
  r.zip as receiver_zip_full,
  r.contact_name as receiver_contact,
  r.contact_phone as receiver_phone,
  r.hours_of_operation as receiver_hours,
  r.appointment_required as receiver_appt_required,
  r.special_instructions as receiver_special_instructions
  
FROM loads l
LEFT JOIN facilities s ON l.shipper_id = s.id
LEFT JOIN facilities r ON l.receiver_id = r.id;

-- Grant access to view
GRANT SELECT ON loads_with_facilities TO authenticated;

-- 9. Sample data (optional - for testing)
-- Uncomment to create sample facilities
/*
INSERT INTO facilities (facility_name, address_line1, city, state, zip, facility_type, contact_name, contact_phone, hours_of_operation, appointment_required) VALUES
  ('ABC Warehouse - Atlanta', '123 Industrial Pkwy', 'Atlanta', 'GA', '30303', 'warehouse', 'John Smith', '404-555-1234', 'Mon-Fri 7AM-4PM', true),
  ('XYZ Distribution Center', '456 Logistics Dr', 'Chicago', 'IL', '60601', 'distribution_center', 'Jane Doe', '312-555-5678', '24/7', false),
  ('ACME Manufacturing', '789 Factory Rd', 'Dallas', 'TX', '75201', 'manufacturing', 'Bob Johnson', '214-555-9012', 'Mon-Sat 6AM-6PM', true),
  ('Big Box Retail DC', '321 Commerce Blvd', 'Los Angeles', 'CA', '90001', 'retail', 'Sarah Williams', '213-555-3456', 'Mon-Sun 8AM-8PM', true);
*/

-- 10. Migration script for existing loads (optional)
-- This will create facilities from existing load origin/destination data
-- WARNING: Only run this once, and review the data first!
/*
-- Migrate origins to facilities
INSERT INTO facilities (facility_name, address_line1, city, state, zip, facility_type, customer_id)
SELECT DISTINCT
  COALESCE(origin_city || ' Location', 'Unknown Origin') as facility_name,
  COALESCE(origin_city, 'Unknown') as address_line1,
  origin_city,
  origin_state,
  origin_zip,
  'other' as facility_type,
  customer_id
FROM loads
WHERE origin_city IS NOT NULL
  AND origin_state IS NOT NULL
  AND origin_zip IS NOT NULL
ON CONFLICT DO NOTHING;

-- Update loads with shipper_id (match by city, state, zip)
UPDATE loads l
SET shipper_id = f.id
FROM facilities f
WHERE f.city = l.origin_city
  AND f.state = l.origin_state
  AND f.zip = l.origin_zip
  AND l.shipper_id IS NULL;
*/

COMMENT ON TABLE facilities IS 'Warehouses, distribution centers, and customer locations for pickups and deliveries';
COMMENT ON COLUMN facilities.appointment_required IS 'Whether facility requires appointment for pickup/delivery';
COMMENT ON COLUMN facilities.hours_of_operation IS 'Facility operating hours (e.g., Mon-Fri 8AM-5PM)';
COMMENT ON COLUMN facilities.loading_time_avg IS 'Average time in minutes to load/unload';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Facilities schema created successfully!';
  RAISE NOTICE '📦 Table: facilities (shippers/receivers)';
  RAISE NOTICE '🔗 Loads table updated with shipper_id and receiver_id';
  RAISE NOTICE '📊 Trigger created to track facility usage stats';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update your frontend to include shipper/receiver selection';
  RAISE NOTICE '2. Add a Facilities management page';
  RAISE NOTICE '3. Optionally run migration script to populate facilities from existing loads';
END $$;

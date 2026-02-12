-- =====================================================
-- Import Walmart RFQ from CSV into RFQ System
-- =====================================================
-- This helper script creates an RFQ and imports lanes from your spreadsheet
-- =====================================================

-- Step 1: Create the RFQ Request
INSERT INTO rfq_requests (
  rfq_name,
  status,
  valid_from,
  valid_until,
  response_deadline,
  description,
  special_requirements,
  insurance_required,
  created_by
) VALUES (
  'Walmart & Seaboard Feb-Aug 2026 Lanes',
  'draft', -- Change to 'sent' when ready
  '2026-02-01',
  '2026-08-31',
  '2026-01-31 12:00:00-05', -- Jan 31, 2026 at noon EST
  'RFQ for Walmart and Seaboard Solutions lanes covering February 2026 through August 2026',
  '- Food grade and fumigated equipment required
- Equipment must be clean, no holes or dirt - must be washed
- Cargo can travel on pallets or slip sheets
- Transportation must comply with local guidelines for USA movement
- License, circulation permits must be up to date
- Temperature Requirements: Between 32F to -10F for refrigerated equipment
- Heaviest months: October to February',
  100000.00, -- $100,000 cargo insurance
  (SELECT id FROM profiles WHERE role = 'superadmin' LIMIT 1) -- Your user ID
) RETURNING id, rfq_number;

-- Note the RFQ ID from above, then insert lanes below
-- Replace 'YOUR-RFQ-ID' with the actual UUID returned above

-- =====================================================
-- Step 2: Insert All 30 Lanes from Your Spreadsheet
-- =====================================================

-- Lane 1: Wheeling, IL → Miami, FL (Reefer)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, temperature_min, temperature_max, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 1, 'Wheeling', 'IL', 'Miami', 'FL',
  '53'' Trailer Reefer', 'Frozen Pizza', 2, 'Single -Interstate Trucking', -10, 32, 1380
);

-- Lane 2: Perryville, MO → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 2, 'Perryville', 'MO', 'Miami', 'FL',
  '53'' Trailer Dry', 'Cereal', 2, 'Single -Interstate Trucking', 1150
);

-- Lane 3: Perryville, MO → Houston, TX (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 3, 'Perryville', 'MO', 'Houston', 'TX',
  '53'' Trailer Dry', 'Cereal', 2, 'Single -Interstate Trucking', 900
);

-- Lane 4: Visalia, CA → Houston, TX (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 4, 'Visalia', 'CA', 'Houston', 'TX',
  '53'' Trailer Dry', 'Pet Food', 2, 'Single -Interstate Trucking', 1600
);

-- Lane 5: Visalia, CA → Los Angeles, CA (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 5, 'Visalia', 'CA', 'Los Angeles', 'CA',
  '53'' Trailer Dry', 'Pet Food', 2, 'Single -Interstate Trucking', 200
);

-- Lane 6: Newnan, GA → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 6, 'Newnan', 'GA', 'Miami', 'FL',
  '53'' Trailer Dry', 'Snacks', 8, 'Single -Interstate Trucking', 650
);

-- Lane 7: Pleasant Prairie, WI → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 7, 'Pleasant Prairie', 'WI', 'Miami', 'FL',
  '53'' Trailer Dry', 'Dressing', 6, 'Single -Interstate Trucking', 1420
);

-- Lane 8: Cambria, WI → Miami, FL (Dry) ** HIGH VOLUME **
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 8, 'Cambria', 'WI', 'Miami', 'FL',
  '53'' Trailer Dry', 'Canned Foods', 60, 'Single -Interstate Trucking', 1450
);

-- Lane 9: Atlanta, GA → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 9, 'Atlanta', 'GA', 'Miami', 'FL',
  '53'' Trailer Dry', 'Canned Foods', 12, 'Single -Interstate Trucking', 660
);

-- Lane 10: Opelousas, LA → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 10, 'Opelousas', 'LA', 'Miami', 'FL',
  '53'' Trailer Dry', 'Coco Oil', 10, 'Single -Interstate Trucking', 1100
);

-- Lane 11: Burlington, IA → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 11, 'Burlington', 'IA', 'Miami', 'FL',
  '53'' Trailer Dry', 'Cookies', 6, 'Single -Interstate Trucking', 1300
);

-- Lane 12: Charleston, SC → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 12, 'Charleston', 'SC', 'Miami', 'FL',
  '53'' Trailer Dry', 'Clothes', 4, 'Single -Interstate Trucking', 550
);

-- Lane 13: St Ansgar, IA → New Jersey, NJ (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 13, 'St Ansgar', 'IA', 'New Jersey', 'NJ',
  '53'' Trailer Dry', 'Oatmeal', 10, 'Single -Interstate Trucking', 1100
);

-- Lane 14: St Ansgar, IA → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 14, 'St Ansgar', 'IA', 'Miami', 'FL',
  '53'' Trailer Dry', 'Oatmeal', 4, 'Single -Interstate Trucking', 1400
);

-- Lane 15: La Grange, GA → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 15, 'La Grange', 'GA', 'Miami', 'FL',
  '53'' Trailer Dry', 'Aluminum Foil', 12, 'Single -Interstate Trucking', 600
);

-- Lane 16: Los Angeles, CA → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 16, 'Los Angeles', 'CA', 'Miami', 'FL',
  '53'' Trailer Dry', 'Clothes', 4, 'Single -Interstate Trucking', 2750
);

-- Lane 17: Elk Grove Village, IL → Miami, FL (Reefer)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, temperature_min, temperature_max, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 17, 'Elk Grove Village', 'IL', 'Miami', 'FL',
  '53'' Trailer Reefer', 'Marshmallows', 12, 'Single -Interstate Trucking', -10, 32, 1380
);

-- Lane 18: Westerville, OH → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 18, 'Westerville', 'OH', 'Miami', 'FL',
  '53'' Trailer Dry', 'Dry/Empty Cylinder', 4, 'Single -Interstate Trucking', 1150
);

-- Lane 19: Victorville, CA → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 19, 'Victorville', 'CA', 'Miami', 'FL',
  '53'' Trailer Dry', 'Childrens Products', 2, 'Single -Interstate Trucking', 2700
);

-- Lane 20: Carthage, MO → Miami, FL (Reefer) ** HIGH VOLUME **
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, temperature_min, temperature_max, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 20, 'Carthage', 'MO', 'Miami', 'FL',
  '53'' Trailer Reefer', 'Mozzarella Cheese/Chilled', 80, 'Single -Interstate Trucking', -10, 32, 1200
);

-- Lane 21: Bristol, VA → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 21, 'Bristol', 'VA', 'Miami', 'FL',
  '53'' Trailer Dry', 'Dry/Cookie-Snacks', 20, 'Single -Interstate Trucking', 900
);

-- Lane 22: Fowler, CA → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 22, 'Fowler', 'CA', 'Miami', 'FL',
  '53'' Trailer Dry', 'Raisins', 12, 'Single -Interstate Trucking', 2800
);

-- Lane 23: New Jersey, NJ → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 23, 'New Jersey', 'NJ', 'Miami', 'FL',
  '53'' Trailer Dry', 'GDSM/Clothing', 4, 'Single -Interstate Trucking', 1280
);

-- Lane 24: Chesterfield, MO → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 24, 'Chesterfield', 'MO', 'Miami', 'FL',
  '53'' Trailer Dry', 'Cards', 4, 'Single -Interstate Trucking', 1200
);

-- Lane 25: Victorville, CA → Los Angeles, CA (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 25, 'Victorville', 'CA', 'Los Angeles', 'CA',
  '53'' Trailer Dry', 'Childrens Products', 4, 'Single -Interstate Trucking', 85
);

-- Lane 26: Greer, SC → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 26, 'Greer', 'SC', 'Miami', 'FL',
  '53'' Trailer Dry', 'Juice', 8, 'Single -Interstate Trucking', 620
);

-- Lane 27: El Paso, TX → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 27, 'El Paso', 'TX', 'Miami', 'FL',
  '53'' Trailer Dry', 'Communication Equipment', 4, 'Single -Interstate Trucking', 1950
);

-- Lane 28: Spanish Fork, UT → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 28, 'Spanish Fork', 'UT', 'Miami', 'FL',
  '53'' Trailer Dry', 'Scented Oils & Diffusers', 2, 'Single -Interstate Trucking', 2200
);

-- Lane 29: Delaware, OH → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 29, 'Delaware', 'OH', 'Miami', 'FL',
  '53'' Trailer Dry', 'Diapers', 12, 'Single -Interstate Trucking', 1150
);

-- Lane 30: Bedford Park, IL → Miami, FL (Dry)
INSERT INTO rfq_lanes (rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state, 
  equipment_type, commodity, annual_volume, service_type, estimated_miles)
VALUES (
  'YOUR-RFQ-ID', 30, 'Bedford Park', 'IL', 'Miami', 'FL',
  '53'' Trailer Dry', 'Dry Cookies', 8, 'Single -Interstate Trucking', 1380
);

-- =====================================================
-- Step 3: Verify Import
-- =====================================================

-- Check the RFQ was created
SELECT * FROM vw_rfq_overview WHERE rfq_name LIKE '%Walmart%';

-- Check all lanes were imported
SELECT 
  lane_number,
  origin,
  destination,
  equipment_type,
  commodity,
  annual_volume,
  estimated_miles
FROM vw_rfq_lanes_with_stats
WHERE rfq_id = 'YOUR-RFQ-ID'
ORDER BY lane_number;

-- Summary stats
SELECT 
  COUNT(*) as total_lanes,
  SUM(annual_volume) as total_annual_volume,
  SUM(estimated_miles * annual_volume) as total_annual_miles
FROM rfq_lanes
WHERE rfq_id = 'YOUR-RFQ-ID';

-- =====================================================
-- DONE!
-- =====================================================
SELECT '✅ RFQ and 30 lanes imported successfully!' as status;
SELECT 'Next: Add carriers and start collecting bids' as next_step;

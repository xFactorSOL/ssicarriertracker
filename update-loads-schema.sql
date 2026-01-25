-- ===========================================
-- Update Loads Table for Proper City/State Storage
-- ===========================================

-- Add separate city and state columns
ALTER TABLE loads ADD COLUMN IF NOT EXISTS origin_city TEXT;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS origin_state TEXT;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS origin_zip TEXT;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS destination_city TEXT;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS destination_state TEXT;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS destination_zip TEXT;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS miles INTEGER;

-- Migrate existing data from origin/destination to city/state
-- This handles format like "Houston, TX" or "Miami, FL"
UPDATE loads 
SET 
  origin_city = TRIM(SPLIT_PART(origin, ',', 1)),
  origin_state = TRIM(SPLIT_PART(origin, ',', 2))
WHERE origin IS NOT NULL AND origin LIKE '%,%';

UPDATE loads 
SET 
  destination_city = TRIM(SPLIT_PART(destination, ',', 1)),
  destination_state = TRIM(SPLIT_PART(destination, ',', 2))
WHERE destination IS NOT NULL AND destination LIKE '%,%';

-- Add comments
COMMENT ON COLUMN loads.origin_city IS 'Origin city name';
COMMENT ON COLUMN loads.origin_state IS 'Origin state abbreviation (e.g., TX, FL)';
COMMENT ON COLUMN loads.origin_zip IS 'Origin ZIP code';
COMMENT ON COLUMN loads.destination_city IS 'Destination city name';
COMMENT ON COLUMN loads.destination_state IS 'Destination state abbreviation';
COMMENT ON COLUMN loads.destination_zip IS 'Destination ZIP code';
COMMENT ON COLUMN loads.miles IS 'Total miles for the load';

-- Verify the migration
SELECT 
  id,
  load_number,
  origin,
  origin_city,
  origin_state,
  destination,
  destination_city,
  destination_state
FROM loads
LIMIT 10;

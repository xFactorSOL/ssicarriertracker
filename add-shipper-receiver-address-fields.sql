-- =====================================================
-- Add Full Address Fields for Shipper/Receiver
-- =====================================================
-- This adds address_line1 and address_line2 fields to
-- the loads table for shipper and receiver information
-- =====================================================

-- Add shipper address fields to loads table
ALTER TABLE loads 
ADD COLUMN IF NOT EXISTS shipper_address TEXT,
ADD COLUMN IF NOT EXISTS shipper_address_line2 TEXT;

-- Add receiver address fields to loads table
ALTER TABLE loads 
ADD COLUMN IF NOT EXISTS receiver_address TEXT,
ADD COLUMN IF NOT EXISTS receiver_address_line2 TEXT;

-- Verify the new columns were added
SELECT 'New address columns added to loads table:' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'loads' 
  AND column_name IN ('shipper_address', 'shipper_address_line2', 'receiver_address', 'receiver_address_line2')
ORDER BY column_name;

-- =====================================================
-- INSTRUCTIONS:
-- =====================================================
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. The new address fields will be available for loads
-- 3. These fields are optional (nullable)
-- 4. They will be auto-populated when selecting existing
--    facilities or when creating new facilities
-- =====================================================

SELECT '✅ Address fields added successfully!' as status;

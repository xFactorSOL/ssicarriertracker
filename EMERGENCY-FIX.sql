-- =====================================================
-- EMERGENCY FIX: Completely Disable All RFQ Triggers
-- =====================================================
-- Run this if you're STILL getting stack depth errors
-- This nuclear option disables EVERYTHING and uses
-- client-side batch inserts with manual stat updates
-- =====================================================

-- 1. DROP ALL TRIGGERS (nuclear option)
DROP TRIGGER IF EXISTS trigger_update_lane_bid_stats ON rfq_bids CASCADE;
DROP TRIGGER IF EXISTS trigger_update_rfq_stats_on_lane ON rfq_lanes CASCADE;
DROP TRIGGER IF EXISTS trigger_update_rfq_stats_on_bid ON rfq_bids CASCADE;
DROP TRIGGER IF EXISTS trigger_auto_calculate_rankings ON rfq_bids CASCADE;
DROP TRIGGER IF EXISTS trigger_simple_bid_update ON rfq_bids CASCADE;

-- 2. Verify no triggers remain
SELECT 
  'BEFORE: ' || trigger_name as status,
  event_object_table,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('rfq_bids', 'rfq_lanes');

-- Should return no rows!

-- 3. Keep the manual update functions (they're safe)
-- These are called explicitly, not automatically

-- 4. Create a MUCH simpler bulk import that avoids triggers entirely
CREATE OR REPLACE FUNCTION simple_bulk_import_bids(
  p_rfq_id UUID,
  p_carrier_id UUID,
  p_bids JSONB
)
RETURNS JSONB AS $$
DECLARE
  bid JSONB;
  lane RECORD;
  inserted_count INT := 0;
  bid_id UUID;
BEGIN
  -- Loop through each bid and insert directly
  FOR bid IN SELECT * FROM jsonb_array_elements(p_bids)
  LOOP
    -- Find the lane
    SELECT id, estimated_miles INTO lane
    FROM rfq_lanes
    WHERE rfq_id = p_rfq_id
      AND lane_number = (bid->>'lane_number')::INT
    LIMIT 1;
    
    IF lane.id IS NOT NULL THEN
      -- Direct insert with explicit ID generation (no triggers!)
      INSERT INTO rfq_bids (
        id,
        rfq_id,
        rfq_lane_id,
        carrier_id,
        rate_per_load,
        rate_per_mile,
        transit_time_hours,
        max_weight,
        carrier_notes,
        status,
        submitted_at
      ) VALUES (
        gen_random_uuid(),
        p_rfq_id,
        lane.id,
        p_carrier_id,
        (bid->>'rate_per_load')::DECIMAL,
        (bid->>'rate_per_mile')::DECIMAL,
        (bid->>'transit_time_hours')::INT,
        COALESCE((bid->>'max_weight')::INT, 0),
        COALESCE(bid->>'carrier_notes', ''),
        'submitted',
        NOW()
      );
      
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;
  
  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'inserted_count', inserted_count,
    'message', 'Imported ' || inserted_count || ' bids'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'inserted_count', 0,
    'message', 'Error: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Create a simple function to update stats manually
CREATE OR REPLACE FUNCTION update_rfq_stats_manual(p_rfq_id UUID)
RETURNS TEXT AS $$
DECLARE
  lane RECORD;
BEGIN
  -- Update each lane's stats
  FOR lane IN SELECT id FROM rfq_lanes WHERE rfq_id = p_rfq_id
  LOOP
    -- Update lane bid stats
    UPDATE rfq_lanes l
    SET
      bids_received = (
        SELECT COUNT(*) FROM rfq_bids 
        WHERE rfq_lane_id = lane.id 
          AND status IN ('submitted', 'under_review', 'awarded')
      ),
      lowest_bid = (
        SELECT MIN(rate_per_load) FROM rfq_bids
        WHERE rfq_lane_id = lane.id
          AND status IN ('submitted', 'under_review', 'awarded')
      ),
      highest_bid = (
        SELECT MAX(rate_per_load) FROM rfq_bids
        WHERE rfq_lane_id = lane.id
          AND status IN ('submitted', 'under_review', 'awarded')
      ),
      average_bid = (
        SELECT ROUND(AVG(rate_per_load)::NUMERIC, 2) FROM rfq_bids
        WHERE rfq_lane_id = lane.id
          AND status IN ('submitted', 'under_review', 'awarded')
      )
    WHERE l.id = lane.id;
    
    -- Update bid rankings for this lane
    WITH ranked AS (
      SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY rate_per_load ASC) as new_rank,
        rate_per_load
      FROM rfq_bids
      WHERE rfq_lane_id = lane.id
        AND status IN ('submitted', 'under_review', 'awarded')
    )
    UPDATE rfq_bids b
    SET rank = r.new_rank
    FROM ranked r
    WHERE b.id = r.id;
    
    -- Calculate vs average percentages
    WITH stats AS (
      SELECT
        AVG(rate_per_load) as avg_rate,
        MIN(rate_per_load) as min_rate
      FROM rfq_bids
      WHERE rfq_lane_id = lane.id
        AND status IN ('submitted', 'under_review', 'awarded')
    )
    UPDATE rfq_bids b
    SET
      vs_average_pct = CASE 
        WHEN s.avg_rate > 0 THEN 
          ROUND(((b.rate_per_load - s.avg_rate) / s.avg_rate * 100)::NUMERIC, 2)
        ELSE 0
      END,
      vs_lowest_pct = CASE
        WHEN s.min_rate > 0 THEN 
          ROUND(((b.rate_per_load - s.min_rate) / s.min_rate * 100)::NUMERIC, 2)
        ELSE 0
      END
    FROM stats s
    WHERE b.rfq_lane_id = lane.id
      AND b.status IN ('submitted', 'under_review', 'awarded');
  END LOOP;
  
  -- Update RFQ-level stats
  UPDATE rfq_requests r
  SET
    total_lanes = (SELECT COUNT(*) FROM rfq_lanes WHERE rfq_id = p_rfq_id),
    total_responses = (SELECT COUNT(DISTINCT carrier_id) FROM rfq_bids WHERE rfq_id = p_rfq_id),
    total_awarded = (SELECT COUNT(*) FROM rfq_lanes WHERE rfq_id = p_rfq_id AND status = 'awarded')
  WHERE r.id = p_rfq_id;
  
  RETURN 'Stats updated for RFQ ' || p_rfq_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Verify triggers are gone
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All triggers removed successfully!'
    ELSE '❌ Still have ' || COUNT(*) || ' triggers'
  END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('rfq_bids', 'rfq_lanes');

-- 7. Test the new function (optional - comment out if you don't have test data)
-- SELECT simple_bulk_import_bids(
--   'your-rfq-id'::UUID,
--   'your-carrier-id'::UUID,
--   '[{"lane_number": 1, "rate_per_load": 1500, "rate_per_mile": 1.5, "transit_time_hours": 48, "max_weight": 45000}]'::JSONB
-- );

SELECT '✅ Emergency fix applied! All triggers disabled. Import should work now.' as final_status;

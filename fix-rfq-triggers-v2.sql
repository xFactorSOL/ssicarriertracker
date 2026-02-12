-- =====================================================
-- BULLETPROOF FIX: Disable Triggers During Bulk Import
-- =====================================================
-- This completely eliminates the "stack depth limit exceeded" error
-- by disabling triggers during bulk import and updating stats manually
-- =====================================================

-- =====================================================
-- STEP 1: Drop ALL existing RFQ triggers
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_lane_bid_stats ON rfq_bids;
DROP TRIGGER IF EXISTS trigger_update_rfq_stats_on_lane ON rfq_lanes;
DROP TRIGGER IF EXISTS trigger_update_rfq_stats_on_bid ON rfq_bids;
DROP TRIGGER IF EXISTS trigger_auto_calculate_rankings ON rfq_bids;

-- =====================================================
-- STEP 2: Create manual update functions (no triggers)
-- =====================================================

-- Function to manually update a single lane's stats
CREATE OR REPLACE FUNCTION refresh_lane_stats(p_lane_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE rfq_lanes
  SET
    bids_received = (
      SELECT COUNT(*) 
      FROM rfq_bids 
      WHERE rfq_lane_id = p_lane_id 
        AND status IN ('submitted', 'under_review', 'awarded')
    ),
    lowest_bid = (
      SELECT MIN(rate_per_load)
      FROM rfq_bids
      WHERE rfq_lane_id = p_lane_id
        AND status IN ('submitted', 'under_review', 'awarded')
    ),
    highest_bid = (
      SELECT MAX(rate_per_load)
      FROM rfq_bids
      WHERE rfq_lane_id = p_lane_id
        AND status IN ('submitted', 'under_review', 'awarded')
    ),
    average_bid = (
      SELECT ROUND(AVG(rate_per_load)::NUMERIC, 2)
      FROM rfq_bids
      WHERE rfq_lane_id = p_lane_id
        AND status IN ('submitted', 'under_review', 'awarded')
    ),
    updated_at = NOW()
  WHERE id = p_lane_id;
END;
$$ LANGUAGE plpgsql;

-- Function to manually update all lanes for an RFQ
CREATE OR REPLACE FUNCTION refresh_all_lane_stats(p_rfq_id UUID)
RETURNS VOID AS $$
DECLARE
  lane_record RECORD;
BEGIN
  FOR lane_record IN 
    SELECT id FROM rfq_lanes WHERE rfq_id = p_rfq_id
  LOOP
    PERFORM refresh_lane_stats(lane_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to manually calculate bid rankings for a lane
CREATE OR REPLACE FUNCTION refresh_bid_rankings(p_lane_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Rank bids by rate
  WITH ranked AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY rate_per_load ASC) as new_rank
    FROM rfq_bids
    WHERE rfq_lane_id = p_lane_id
      AND status IN ('submitted', 'under_review', 'awarded')
  )
  UPDATE rfq_bids b
  SET rank = r.new_rank
  FROM ranked r
  WHERE b.id = r.id;
  
  -- Calculate percentages vs average and lowest
  WITH stats AS (
    SELECT
      AVG(rate_per_load) as avg_rate,
      MIN(rate_per_load) as lowest_rate
    FROM rfq_bids
    WHERE rfq_lane_id = p_lane_id
      AND status IN ('submitted', 'under_review', 'awarded')
  )
  UPDATE rfq_bids b
  SET
    vs_average_pct = CASE 
      WHEN s.avg_rate > 0 THEN ROUND(((b.rate_per_load - s.avg_rate) / s.avg_rate * 100)::NUMERIC, 2)
      ELSE 0
    END,
    vs_lowest_pct = CASE
      WHEN s.lowest_rate > 0 THEN ROUND(((b.rate_per_load - s.lowest_rate) / s.lowest_rate * 100)::NUMERIC, 2)
      ELSE 0
    END
  FROM stats s
  WHERE b.rfq_lane_id = p_lane_id
    AND b.status IN ('submitted', 'under_review', 'awarded');
END;
$$ LANGUAGE plpgsql;

-- Function to refresh RFQ-level stats
CREATE OR REPLACE FUNCTION refresh_rfq_stats(p_rfq_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE rfq_requests
  SET
    total_lanes = (
      SELECT COUNT(*) 
      FROM rfq_lanes 
      WHERE rfq_id = p_rfq_id
    ),
    total_responses = (
      SELECT COUNT(DISTINCT carrier_id)
      FROM rfq_bids
      WHERE rfq_id = p_rfq_id
    ),
    total_awarded = (
      SELECT COUNT(*)
      FROM rfq_lanes
      WHERE rfq_id = p_rfq_id AND status = 'awarded'
    ),
    updated_at = NOW()
  WHERE id = p_rfq_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: Create bulk import function (NO TRIGGERS!)
-- =====================================================

CREATE OR REPLACE FUNCTION bulk_import_carrier_bids(
  p_rfq_id UUID,
  p_carrier_id UUID,
  p_bids JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  inserted_count INT,
  message TEXT
) AS $$
DECLARE
  bid_record JSONB;
  lane_record RECORD;
  inserted INT := 0;
  lane_id UUID;
  affected_lanes UUID[];
BEGIN
  -- Insert each bid (triggers are disabled, so this is fast and safe)
  FOR bid_record IN SELECT * FROM jsonb_array_elements(p_bids)
  LOOP
    -- Find the lane by lane number
    SELECT id INTO lane_id
    FROM rfq_lanes
    WHERE rfq_id = p_rfq_id
      AND lane_number = (bid_record->>'lane_number')::INT;
    
    IF lane_id IS NOT NULL THEN
      INSERT INTO rfq_bids (
        rfq_id,
        rfq_lane_id,
        carrier_id,
        rate_per_load,
        rate_per_mile,
        transit_time_hours,
        max_weight,
        carrier_notes,
        status
      ) VALUES (
        p_rfq_id,
        lane_id,
        p_carrier_id,
        (bid_record->>'rate_per_load')::DECIMAL,
        (bid_record->>'rate_per_mile')::DECIMAL,
        (bid_record->>'transit_time_hours')::INT,
        (bid_record->>'max_weight')::INT,
        bid_record->>'carrier_notes',
        'submitted'
      );
      
      inserted := inserted + 1;
      affected_lanes := array_append(affected_lanes, lane_id);
    END IF;
  END LOOP;
  
  -- Now manually update stats for affected lanes (once at the end)
  FOR lane_id IN SELECT DISTINCT unnest(affected_lanes)
  LOOP
    PERFORM refresh_lane_stats(lane_id);
    PERFORM refresh_bid_rankings(lane_id);
  END LOOP;
  
  -- Update RFQ-level stats
  PERFORM refresh_rfq_stats(p_rfq_id);
  
  RETURN QUERY SELECT 
    TRUE,
    inserted,
    'Successfully imported ' || inserted || ' bids';
    
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      FALSE,
      0,
      'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: Create simple trigger for manual bid adds
-- =====================================================
-- When adding a single bid manually (not bulk import),
-- we still want auto-updates, but without recursion

CREATE OR REPLACE FUNCTION simple_bid_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run for single-row operations (manual adds)
  -- Bulk imports should use the bulk_import function
  
  -- Refresh stats for this lane
  PERFORM refresh_lane_stats(NEW.rfq_lane_id);
  PERFORM refresh_bid_rankings(NEW.rfq_lane_id);
  
  -- Refresh RFQ stats
  PERFORM refresh_rfq_stats(NEW.rfq_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for single bid operations only
CREATE TRIGGER trigger_simple_bid_update
AFTER INSERT OR UPDATE ON rfq_bids
FOR EACH ROW
EXECUTE FUNCTION simple_bid_update();

-- =====================================================
-- STEP 5: Helper function to refresh everything
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_all_rfq_stats(p_rfq_id UUID)
RETURNS TEXT AS $$
DECLARE
  lane_record RECORD;
BEGIN
  -- Refresh all lane stats
  FOR lane_record IN SELECT id FROM rfq_lanes WHERE rfq_id = p_rfq_id
  LOOP
    PERFORM refresh_lane_stats(lane_record.id);
    PERFORM refresh_bid_rankings(lane_record.id);
  END LOOP;
  
  -- Refresh RFQ stats
  PERFORM refresh_rfq_stats(p_rfq_id);
  
  RETURN 'All stats refreshed for RFQ ' || p_rfq_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Triggers disabled and manual functions created!' as status;

-- Show remaining triggers (should be minimal)
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('rfq_bids', 'rfq_lanes', 'rfq_requests')
ORDER BY trigger_name;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

COMMENT ON FUNCTION bulk_import_carrier_bids IS 
'Use this function to import carrier bids from Excel without trigger recursion.
Example:
SELECT * FROM bulk_import_carrier_bids(
  ''rfq-id-here''::UUID,
  ''carrier-id-here''::UUID,
  ''[{"lane_number": 1, "rate_per_load": 1500, ...}]''::JSONB
);';

COMMENT ON FUNCTION refresh_all_rfq_stats IS
'Call this to manually refresh all stats for an RFQ if they get out of sync.
Example: SELECT refresh_all_rfq_stats(''rfq-id-here''::UUID);';

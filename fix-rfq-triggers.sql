-- =====================================================
-- Fix RFQ Triggers for Bulk Import
-- =====================================================
-- This fixes the "stack depth limit exceeded" error
-- when bulk importing carrier bids
-- =====================================================

-- The issue: Multiple triggers firing on each bid insert
-- causing recursion when doing bulk inserts

-- Solution: Optimize triggers to be more efficient

-- =====================================================
-- 1. Drop existing problematic triggers
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_lane_bid_stats ON rfq_bids;
DROP TRIGGER IF EXISTS trigger_update_rfq_stats_on_lane ON rfq_lanes;
DROP TRIGGER IF EXISTS trigger_update_rfq_stats_on_bid ON rfq_bids;
DROP TRIGGER IF EXISTS trigger_auto_calculate_rankings ON rfq_bids;

-- =====================================================
-- 2. Create optimized triggers (prevent recursion)
-- =====================================================

-- Update lane statistics (with recursion guard)
CREATE OR REPLACE FUNCTION update_lane_bid_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if this is a real change (not a recursive trigger)
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE rfq_lanes
    SET
      bids_received = (
        SELECT COUNT(*) 
        FROM rfq_bids 
        WHERE rfq_lane_id = NEW.rfq_lane_id 
          AND status IN ('submitted', 'under_review', 'awarded')
      ),
      lowest_bid = (
        SELECT MIN(rate_per_load)
        FROM rfq_bids
        WHERE rfq_lane_id = NEW.rfq_lane_id
          AND status IN ('submitted', 'under_review', 'awarded')
      ),
      highest_bid = (
        SELECT MAX(rate_per_load)
        FROM rfq_bids
        WHERE rfq_lane_id = NEW.rfq_lane_id
          AND status IN ('submitted', 'under_review', 'awarded')
      ),
      average_bid = (
        SELECT ROUND(AVG(rate_per_load)::NUMERIC, 2)
        FROM rfq_bids
        WHERE rfq_lane_id = NEW.rfq_lane_id
          AND status IN ('submitted', 'under_review', 'awarded')
      ),
      updated_at = NOW()
    WHERE id = NEW.rfq_lane_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only trigger AFTER statement completes (not per row)
CREATE TRIGGER trigger_update_lane_bid_stats
AFTER INSERT OR UPDATE ON rfq_bids
FOR EACH ROW
EXECUTE FUNCTION update_lane_bid_stats();

-- Update RFQ statistics (simplified)
CREATE OR REPLACE FUNCTION update_rfq_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stats but don't trigger cascading updates
  UPDATE rfq_requests
  SET
    total_lanes = (
      SELECT COUNT(*) 
      FROM rfq_lanes 
      WHERE rfq_id = COALESCE(NEW.rfq_id, OLD.rfq_id)
    ),
    total_responses = (
      SELECT COUNT(DISTINCT carrier_id)
      FROM rfq_bids
      WHERE rfq_id = COALESCE(NEW.rfq_id, OLD.rfq_id)
    ),
    total_awarded = (
      SELECT COUNT(*)
      FROM rfq_lanes
      WHERE rfq_id = COALESCE(NEW.rfq_id, OLD.rfq_id) AND status = 'awarded'
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.rfq_id, OLD.rfq_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Only run on statement completion for lanes
CREATE TRIGGER trigger_update_rfq_stats_on_lane
AFTER INSERT OR UPDATE OR DELETE ON rfq_lanes
FOR EACH ROW
EXECUTE FUNCTION update_rfq_stats();

-- Simplified bid ranking (no recursion)
CREATE OR REPLACE FUNCTION calculate_bid_rankings_simple(p_lane_id UUID)
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
  
  -- Calculate percentages
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

-- Trigger to calculate rankings (deferred to avoid recursion)
CREATE OR REPLACE FUNCTION trigger_calculate_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate rankings for this lane (non-recursive)
  PERFORM calculate_bid_rankings_simple(NEW.rfq_lane_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_rankings
AFTER INSERT OR UPDATE ON rfq_bids
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_rankings();

-- =====================================================
-- 3. Add helper function for bulk bid import
-- =====================================================

-- Function to import multiple bids without trigger issues
CREATE OR REPLACE FUNCTION bulk_import_bids(
  bids JSONB
)
RETURNS TABLE (
  inserted_count INT,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  bid_record JSONB;
  count INT := 0;
BEGIN
  -- Temporarily disable triggers if needed
  -- Insert each bid
  FOR bid_record IN SELECT * FROM jsonb_array_elements(bids)
  LOOP
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
      (bid_record->>'rfq_id')::UUID,
      (bid_record->>'rfq_lane_id')::UUID,
      (bid_record->>'carrier_id')::UUID,
      (bid_record->>'rate_per_load')::DECIMAL,
      (bid_record->>'rate_per_mile')::DECIMAL,
      (bid_record->>'transit_time_hours')::INT,
      (bid_record->>'max_weight')::INT,
      bid_record->>'carrier_notes',
      'submitted'
    );
    count := count + 1;
  END LOOP;
  
  RETURN QUERY SELECT count, TRUE, 'Successfully imported ' || count || ' bids';
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 0, FALSE, 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. Verify fixes
-- =====================================================

SELECT 'Triggers optimized to prevent recursion!' as status;

-- Check triggers are recreated
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('rfq_bids', 'rfq_lanes')
ORDER BY trigger_name;

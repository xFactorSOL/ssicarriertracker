-- =====================================================
-- RFQ (Request for Quote) Management System
-- =====================================================
-- Complete database schema for managing RFQs, bids, and awards
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. RFQ REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rfq_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic Info
  rfq_number TEXT UNIQUE NOT NULL, -- Auto-generated: RFQ-2026-001
  rfq_name TEXT NOT NULL, -- e.g., "Walmart Q1 2026 Lanes"
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL, -- Optional
  
  -- Status & Dates
  status TEXT CHECK (status IN ('draft', 'sent', 'in_review', 'awarded', 'closed', 'cancelled')) DEFAULT 'draft',
  valid_from DATE NOT NULL, -- Rate validity start
  valid_until DATE NOT NULL, -- Rate validity end
  response_deadline TIMESTAMPTZ NOT NULL, -- When carriers must respond
  
  -- Requirements
  description TEXT,
  special_requirements TEXT, -- Food grade, fumigated, etc.
  insurance_required DECIMAL(12,2) DEFAULT 100000.00,
  
  -- Calculated Stats
  total_lanes INT DEFAULT 0,
  total_responses INT DEFAULT 0,
  total_awarded INT DEFAULT 0,
  total_estimated_value DECIMAL(15,2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ,
  awarded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_rfq_requests_status ON rfq_requests(status);
CREATE INDEX IF NOT EXISTS idx_rfq_requests_customer ON rfq_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_rfq_requests_created_at ON rfq_requests(created_at DESC);

-- Function to generate RFQ number
CREATE OR REPLACE FUNCTION generate_rfq_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  next_num INT;
  rfq_num TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  -- Get the next number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(rfq_number FROM 'RFQ-' || year || '-(\d+)') AS INT)), 0) + 1
  INTO next_num
  FROM rfq_requests
  WHERE rfq_number LIKE 'RFQ-' || year || '-%';
  
  rfq_num := 'RFQ-' || year || '-' || LPAD(next_num::TEXT, 3, '0');
  RETURN rfq_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate RFQ number
CREATE OR REPLACE FUNCTION set_rfq_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rfq_number IS NULL OR NEW.rfq_number = '' THEN
    NEW.rfq_number := generate_rfq_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_rfq_number
BEFORE INSERT ON rfq_requests
FOR EACH ROW
EXECUTE FUNCTION set_rfq_number();

-- =====================================================
-- 2. RFQ LANES TABLE (Individual Routes/Lanes)
-- =====================================================
CREATE TABLE IF NOT EXISTS rfq_lanes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID REFERENCES rfq_requests(id) ON DELETE CASCADE NOT NULL,
  
  -- Lane Details
  lane_number INT NOT NULL, -- Display order: 1, 2, 3...
  
  -- Origin
  origin_city TEXT NOT NULL,
  origin_state TEXT NOT NULL,
  origin_zip TEXT,
  origin_facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  
  -- Destination
  destination_city TEXT NOT NULL,
  destination_state TEXT NOT NULL,
  destination_zip TEXT,
  destination_facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  
  -- Equipment & Commodity
  equipment_type TEXT NOT NULL, -- "53' Trailer Dry", "53' Trailer Reefer"
  commodity TEXT NOT NULL,
  weight_min INT, -- Minimum weight in lbs
  weight_max INT, -- Maximum weight in lbs
  
  -- Volume & Service
  annual_volume INT, -- Projected shipments per year
  service_type TEXT DEFAULT 'Full Truckload',
  
  -- Temperature (for reefer)
  temperature_min INT, -- Fahrenheit
  temperature_max INT, -- Fahrenheit
  
  -- Special Instructions
  special_instructions TEXT,
  
  -- Calculated
  estimated_miles INT,
  
  -- Award Status
  status TEXT CHECK (status IN ('open', 'awarded', 'no_bid', 'cancelled')) DEFAULT 'open',
  awarded_carrier_id UUID REFERENCES carriers(id) ON DELETE SET NULL,
  awarded_bid_id UUID, -- Will reference rfq_bids(id)
  awarded_rate DECIMAL(10,2),
  awarded_at TIMESTAMPTZ,
  awarded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  award_notes TEXT,
  
  -- Stats
  bids_received INT DEFAULT 0,
  lowest_bid DECIMAL(10,2),
  highest_bid DECIMAL(10,2),
  average_bid DECIMAL(10,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(rfq_id, lane_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rfq_lanes_rfq_id ON rfq_lanes(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_lanes_status ON rfq_lanes(status);
CREATE INDEX IF NOT EXISTS idx_rfq_lanes_awarded_carrier ON rfq_lanes(awarded_carrier_id);

-- =====================================================
-- 3. RFQ CARRIERS (Invited Carriers)
-- =====================================================
CREATE TABLE IF NOT EXISTS rfq_carriers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID REFERENCES rfq_requests(id) ON DELETE CASCADE NOT NULL,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE NOT NULL,
  
  -- Invitation Status
  status TEXT CHECK (status IN ('invited', 'sent', 'viewed', 'responded', 'declined', 'no_response')) DEFAULT 'invited',
  
  -- Timestamps
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ, -- When email was sent
  viewed_at TIMESTAMPTZ, -- When they opened the RFQ
  responded_at TIMESTAMPTZ, -- When they submitted first bid
  
  -- Contact Info (can override carrier's default contact)
  contact_email TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  
  -- Stats
  total_bids_submitted INT DEFAULT 0,
  total_lanes_awarded INT DEFAULT 0,
  total_awarded_value DECIMAL(15,2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(rfq_id, carrier_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rfq_carriers_rfq_id ON rfq_carriers(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_carriers_carrier_id ON rfq_carriers(carrier_id);
CREATE INDEX IF NOT EXISTS idx_rfq_carriers_status ON rfq_carriers(status);

-- =====================================================
-- 4. RFQ BIDS (Carrier Responses)
-- =====================================================
CREATE TABLE IF NOT EXISTS rfq_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_lane_id UUID REFERENCES rfq_lanes(id) ON DELETE CASCADE NOT NULL,
  rfq_id UUID REFERENCES rfq_requests(id) ON DELETE CASCADE NOT NULL,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE NOT NULL,
  
  -- Bid Details
  rate_per_load DECIMAL(10,2) NOT NULL, -- Carrier's quoted rate
  rate_per_mile DECIMAL(6,2), -- Calculated or provided
  transit_time_hours INT, -- Expected transit time
  min_weight INT, -- Minimum weight they'll accept
  max_weight INT, -- Maximum weight capacity
  
  -- Additional Terms
  fuel_surcharge_type TEXT CHECK (fuel_surcharge_type IN ('included', 'variable', 'fixed_percentage')),
  fuel_surcharge_rate DECIMAL(5,2),
  accessorial_fees JSONB, -- Store as JSON: {"lumper": 150, "detention": 50}
  
  -- Status
  status TEXT CHECK (status IN ('submitted', 'under_review', 'awarded', 'rejected', 'withdrawn')) DEFAULT 'submitted',
  
  -- Scoring
  score DECIMAL(5,2), -- 0-100 score for comparison
  rank INT, -- 1st, 2nd, 3rd for this lane
  
  -- Price Analysis
  vs_average_pct DECIMAL(5,2), -- % above/below average bid
  vs_lowest_pct DECIMAL(5,2), -- % above lowest bid
  
  -- Notes
  carrier_notes TEXT, -- Carrier's comments
  internal_notes TEXT, -- Your internal notes
  
  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- If entered manually
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(rfq_lane_id, carrier_id) -- One bid per carrier per lane
);

-- Add foreign key to rfq_lanes (awarded_bid_id)
ALTER TABLE rfq_lanes 
ADD CONSTRAINT fk_rfq_lanes_awarded_bid 
FOREIGN KEY (awarded_bid_id) REFERENCES rfq_bids(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rfq_bids_rfq_id ON rfq_bids(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_bids_lane_id ON rfq_bids(rfq_lane_id);
CREATE INDEX IF NOT EXISTS idx_rfq_bids_carrier_id ON rfq_bids(carrier_id);
CREATE INDEX IF NOT EXISTS idx_rfq_bids_status ON rfq_bids(status);

-- =====================================================
-- 5. RFQ BID ATTACHMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS rfq_bid_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_id UUID REFERENCES rfq_bids(id) ON DELETE CASCADE NOT NULL,
  
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase storage path
  file_type TEXT CHECK (file_type IN ('rate_confirmation', 'insurance_cert', 'w9', 'other')),
  file_size INT,
  mime_type TEXT,
  
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_rfq_bid_attachments_bid_id ON rfq_bid_attachments(bid_id);

-- =====================================================
-- 6. RFQ ACTIVITY LOG (Audit Trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS rfq_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID REFERENCES rfq_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  action TEXT NOT NULL, -- 'created', 'sent', 'bid_received', 'awarded', 'cancelled'
  description TEXT NOT NULL,
  metadata JSONB, -- Additional data
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfq_activity_log_rfq_id ON rfq_activity_log(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_activity_log_created_at ON rfq_activity_log(created_at DESC);

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Calculate rate per mile
CREATE OR REPLACE FUNCTION calculate_rate_per_mile(
  rate DECIMAL,
  miles INT
)
RETURNS DECIMAL AS $$
BEGIN
  IF miles > 0 THEN
    RETURN ROUND(rate / miles, 2);
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update lane statistics when bid is created/updated
CREATE OR REPLACE FUNCTION update_lane_bid_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the lane's bid statistics
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lane_bid_stats
AFTER INSERT OR UPDATE ON rfq_bids
FOR EACH ROW
EXECUTE FUNCTION update_lane_bid_stats();

-- Update RFQ statistics
CREATE OR REPLACE FUNCTION update_rfq_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the RFQ's overall statistics
  UPDATE rfq_requests
  SET
    total_lanes = (
      SELECT COUNT(*) 
      FROM rfq_lanes 
      WHERE rfq_id = NEW.rfq_id
    ),
    total_responses = (
      SELECT COUNT(DISTINCT carrier_id)
      FROM rfq_bids
      WHERE rfq_id = NEW.rfq_id
    ),
    total_awarded = (
      SELECT COUNT(*)
      FROM rfq_lanes
      WHERE rfq_id = NEW.rfq_id AND status = 'awarded'
    ),
    total_estimated_value = (
      SELECT COALESCE(SUM(l.awarded_rate * l.annual_volume), 0)
      FROM rfq_lanes l
      WHERE l.rfq_id = NEW.rfq_id AND l.status = 'awarded'
    ),
    updated_at = NOW()
  WHERE id = NEW.rfq_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rfq_stats_on_lane
AFTER INSERT OR UPDATE OR DELETE ON rfq_lanes
FOR EACH ROW
EXECUTE FUNCTION update_rfq_stats();

CREATE TRIGGER trigger_update_rfq_stats_on_bid
AFTER INSERT OR UPDATE ON rfq_bids
FOR EACH ROW
EXECUTE FUNCTION update_rfq_stats();

-- Calculate bid rankings for a lane
CREATE OR REPLACE FUNCTION calculate_bid_rankings(lane_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Rank bids by rate (lowest = best)
  WITH ranked AS (
    SELECT 
      id,
      RANK() OVER (ORDER BY rate_per_load ASC) as new_rank
    FROM rfq_bids
    WHERE rfq_lane_id = lane_id
      AND status IN ('submitted', 'under_review', 'awarded')
  )
  UPDATE rfq_bids b
  SET rank = r.new_rank
  FROM ranked r
  WHERE b.id = r.id;
  
  -- Calculate vs_average_pct and vs_lowest_pct
  WITH stats AS (
    SELECT
      AVG(rate_per_load) as avg_rate,
      MIN(rate_per_load) as lowest_rate
    FROM rfq_bids
    WHERE rfq_lane_id = lane_id
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
  WHERE b.rfq_lane_id = lane_id
    AND b.status IN ('submitted', 'under_review', 'awarded');
END;
$$ LANGUAGE plpgsql;

-- Auto-calculate rankings when bid is added/updated
CREATE OR REPLACE FUNCTION trigger_calculate_rankings()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_bid_rankings(NEW.rfq_lane_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_rankings
AFTER INSERT OR UPDATE ON rfq_bids
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_rankings();

-- =====================================================
-- 8. VIEWS FOR EASY QUERYING
-- =====================================================

-- View: RFQ Overview
CREATE OR REPLACE VIEW vw_rfq_overview AS
SELECT 
  r.id,
  r.rfq_number,
  r.rfq_name,
  r.status,
  r.valid_from,
  r.valid_until,
  r.response_deadline,
  r.total_lanes,
  r.total_responses,
  r.total_awarded,
  r.total_estimated_value,
  c.name as customer_name,
  p.full_name as created_by_name,
  r.created_at,
  r.updated_at,
  -- Days until deadline
  EXTRACT(DAY FROM (r.response_deadline - NOW())) as days_until_deadline,
  -- Award percentage
  CASE 
    WHEN r.total_lanes > 0 THEN ROUND((r.total_awarded::NUMERIC / r.total_lanes * 100), 1)
    ELSE 0
  END as award_percentage
FROM rfq_requests r
LEFT JOIN customers c ON r.customer_id = c.id
LEFT JOIN profiles p ON r.created_by = p.id;

-- View: Lane with Bid Stats
CREATE OR REPLACE VIEW vw_rfq_lanes_with_stats AS
SELECT
  l.*,
  r.rfq_number,
  r.rfq_name,
  r.status as rfq_status,
  c.name as awarded_carrier_name,
  -- Concatenated origin/destination for display
  l.origin_city || ', ' || l.origin_state as origin,
  l.destination_city || ', ' || l.destination_state as destination,
  -- Calculated fields
  CASE 
    WHEN l.estimated_miles > 0 AND l.awarded_rate > 0 
    THEN ROUND((l.awarded_rate / l.estimated_miles)::NUMERIC, 2)
    ELSE NULL
  END as awarded_rate_per_mile,
  CASE
    WHEN l.annual_volume > 0 AND l.awarded_rate > 0
    THEN l.awarded_rate * l.annual_volume
    ELSE 0
  END as estimated_annual_value
FROM rfq_lanes l
LEFT JOIN rfq_requests r ON l.rfq_id = r.id
LEFT JOIN carriers c ON l.awarded_carrier_id = c.id;

-- View: Bid Comparison
CREATE OR REPLACE VIEW vw_bid_comparison AS
SELECT
  b.id,
  b.rfq_id,
  b.rfq_lane_id,
  l.lane_number,
  l.origin_city || ', ' || l.origin_state as origin,
  l.destination_city || ', ' || l.destination_state as destination,
  l.equipment_type,
  l.commodity,
  l.estimated_miles,
  c.name as carrier_name,
  c.mc_number,
  c.safety_rating,
  b.rate_per_load,
  b.rate_per_mile,
  b.transit_time_hours,
  b.max_weight,
  b.status,
  b.score,
  b.rank,
  b.vs_average_pct,
  b.vs_lowest_pct,
  b.submitted_at,
  -- Indicators
  CASE WHEN b.rank = 1 THEN true ELSE false END as is_lowest_bid,
  CASE WHEN b.id = l.awarded_bid_id THEN true ELSE false END as is_awarded
FROM rfq_bids b
LEFT JOIN rfq_lanes l ON b.rfq_lane_id = l.id
LEFT JOIN carriers c ON b.carrier_id = c.id;

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE rfq_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_bid_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_activity_log ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all RFQs
CREATE POLICY "Authenticated users can read RFQs" ON rfq_requests
FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can create RFQs
CREATE POLICY "Authenticated users can create RFQs" ON rfq_requests
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update their own RFQs
CREATE POLICY "Authenticated users can update RFQs" ON rfq_requests
FOR UPDATE USING (auth.role() = 'authenticated');

-- Similar policies for other tables
CREATE POLICY "Authenticated users can read lanes" ON rfq_lanes
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage lanes" ON rfq_lanes
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read carriers" ON rfq_carriers
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage carriers" ON rfq_carriers
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read bids" ON rfq_bids
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage bids" ON rfq_bids
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read attachments" ON rfq_bid_attachments
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage attachments" ON rfq_bid_attachments
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read activity log" ON rfq_activity_log
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert activity log" ON rfq_activity_log
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 10. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- You can uncomment this to create a sample RFQ for testing

/*
-- Create sample RFQ
INSERT INTO rfq_requests (
  rfq_name,
  status,
  valid_from,
  valid_until,
  response_deadline,
  description,
  special_requirements,
  insurance_required
) VALUES (
  'Walmart Q1 2026 Lanes - Test',
  'draft',
  '2026-02-01',
  '2026-08-31',
  '2026-01-31 12:00:00-05',
  'Test RFQ for Walmart lanes',
  'Food grade equipment required. Fumigated. Temperature controlled 32F to -10F.',
  100000.00
) RETURNING id;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'rfq%'
ORDER BY table_name;

-- Check views were created
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE 'vw_rfq%'
ORDER BY table_name;

-- =====================================================
-- SUCCESS!
-- =====================================================
SELECT '✅ RFQ Management Schema created successfully!' as status;
SELECT 'You can now start building the UI for RFQ management' as next_step;

-- =====================================================
-- CARRIER PORTAL AUTHENTICATION
-- =====================================================
-- Extends carriers table to support portal login
-- Carriers can register, login, and submit RFQ bids
-- =====================================================

-- =====================================================
-- 1. Extend Carriers Table with Auth Fields
-- =====================================================

ALTER TABLE carriers ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS portal_email TEXT UNIQUE;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS portal_password_hash TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS portal_last_login TIMESTAMPTZ;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS portal_created_at TIMESTAMPTZ;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN carriers.portal_enabled IS 'Whether carrier has access to portal';
COMMENT ON COLUMN carriers.portal_email IS 'Email for portal login (can differ from main contact)';
COMMENT ON COLUMN carriers.portal_password_hash IS 'Hashed password for portal';
COMMENT ON COLUMN carriers.portal_last_login IS 'Last time carrier logged into portal';
COMMENT ON COLUMN carriers.email_verified IS 'Whether carrier email is verified';

-- Index for faster login queries
CREATE INDEX IF NOT EXISTS idx_carriers_portal_email ON carriers(portal_email);

-- =====================================================
-- 2. Carrier Portal Sessions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS carrier_portal_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE NOT NULL,
  
  -- Session Info
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carrier_sessions_token ON carrier_portal_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_carrier_sessions_carrier ON carrier_portal_sessions(carrier_id);

-- Auto-delete expired sessions
CREATE OR REPLACE FUNCTION delete_expired_carrier_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM carrier_portal_sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. Carrier Portal Activity Log
-- =====================================================

CREATE TABLE IF NOT EXISTS carrier_portal_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE NOT NULL,
  
  action TEXT NOT NULL, -- 'login', 'logout', 'view_rfq', 'submit_bid', 'edit_bid'
  rfq_id UUID REFERENCES rfq_requests(id) ON DELETE SET NULL,
  bid_id UUID REFERENCES rfq_bids(id) ON DELETE SET NULL,
  
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carrier_activity_carrier ON carrier_portal_activity(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_activity_created ON carrier_portal_activity(created_at DESC);

-- =====================================================
-- 4. Helper Functions
-- =====================================================

-- Register new carrier portal user
CREATE OR REPLACE FUNCTION register_carrier_portal(
  p_carrier_id UUID,
  p_email TEXT,
  p_password_hash TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  verification_token TEXT
) AS $$
DECLARE
  v_token TEXT;
  v_existing_email TEXT;
BEGIN
  -- Check if email already exists
  SELECT portal_email INTO v_existing_email
  FROM carriers
  WHERE portal_email = p_email;
  
  IF v_existing_email IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Email already registered', NULL::TEXT;
    RETURN;
  END IF;
  
  -- Generate verification token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Update carrier with portal credentials
  UPDATE carriers
  SET
    portal_enabled = TRUE,
    portal_email = p_email,
    portal_password_hash = p_password_hash,
    portal_created_at = NOW(),
    email_verified = FALSE,
    verification_token = v_token
  WHERE id = p_carrier_id;
  
  -- Log activity
  INSERT INTO carrier_portal_activity (carrier_id, action)
  VALUES (p_carrier_id, 'register');
  
  RETURN QUERY SELECT TRUE, 'Registration successful. Please verify email.', v_token;
END;
$$ LANGUAGE plpgsql;

-- Verify carrier email
CREATE OR REPLACE FUNCTION verify_carrier_email(
  p_token TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_carrier_id UUID;
BEGIN
  -- Find carrier with this token
  SELECT id INTO v_carrier_id
  FROM carriers
  WHERE verification_token = p_token;
  
  IF v_carrier_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Mark as verified
  UPDATE carriers
  SET
    email_verified = TRUE,
    verification_token = NULL
  WHERE id = v_carrier_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create portal session
CREATE OR REPLACE FUNCTION create_carrier_session(
  p_carrier_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate session token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Create session (expires in 7 days)
  INSERT INTO carrier_portal_sessions (
    carrier_id,
    session_token,
    ip_address,
    user_agent,
    expires_at
  ) VALUES (
    p_carrier_id,
    v_token,
    p_ip_address,
    p_user_agent,
    NOW() + INTERVAL '7 days'
  );
  
  -- Update last login
  UPDATE carriers
  SET portal_last_login = NOW()
  WHERE id = p_carrier_id;
  
  -- Log activity
  INSERT INTO carrier_portal_activity (carrier_id, action, ip_address, user_agent)
  VALUES (p_carrier_id, 'login', p_ip_address, p_user_agent);
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- Validate session
CREATE OR REPLACE FUNCTION validate_carrier_session(
  p_session_token TEXT
)
RETURNS TABLE (
  valid BOOLEAN,
  carrier_id UUID,
  carrier_name TEXT,
  carrier_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE 
      WHEN s.expires_at > NOW() THEN TRUE
      ELSE FALSE
    END as valid,
    c.id as carrier_id,
    c.name as carrier_name,
    c.portal_email as carrier_email
  FROM carrier_portal_sessions s
  JOIN carriers c ON s.carrier_id = c.id
  WHERE s.session_token = p_session_token
    AND s.expires_at > NOW();
  
  -- Update last activity
  UPDATE carrier_portal_sessions
  SET last_activity = NOW()
  WHERE session_token = p_session_token;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. RLS Policies for Carrier Portal
-- =====================================================

-- Carriers can only see RFQs assigned to them
CREATE POLICY "Carriers can view assigned RFQs" ON rfq_carriers
FOR SELECT USING (
  carrier_id IN (
    SELECT carrier_id 
    FROM carrier_portal_sessions 
    WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
  )
);

-- Carriers can only see their own bids
CREATE POLICY "Carriers can view own bids" ON rfq_bids
FOR SELECT USING (
  carrier_id IN (
    SELECT carrier_id 
    FROM carrier_portal_sessions 
    WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
  )
);

-- Carriers can create their own bids
CREATE POLICY "Carriers can create bids" ON rfq_bids
FOR INSERT WITH CHECK (
  carrier_id IN (
    SELECT carrier_id 
    FROM carrier_portal_sessions 
    WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
  )
  AND status = 'submitted'
);

-- Carriers can update their own bids (before deadline)
CREATE POLICY "Carriers can update own bids before deadline" ON rfq_bids
FOR UPDATE USING (
  carrier_id IN (
    SELECT carrier_id 
    FROM carrier_portal_sessions 
    WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
  )
  AND status = 'submitted'
  AND EXISTS (
    SELECT 1 FROM rfq_requests r 
    WHERE r.id = rfq_id 
    AND r.response_deadline > NOW()
  )
);

-- =====================================================
-- 6. Views for Carrier Portal
-- =====================================================

-- Carrier's assigned RFQs with status
CREATE OR REPLACE VIEW vw_carrier_rfqs AS
SELECT
  rc.carrier_id,
  r.id as rfq_id,
  r.rfq_number,
  r.rfq_name,
  r.status as rfq_status,
  r.valid_from,
  r.valid_until,
  r.response_deadline,
  r.special_requirements,
  r.insurance_required,
  r.total_lanes,
  rc.status as invitation_status,
  rc.invited_at,
  rc.responded_at,
  -- Stats
  (SELECT COUNT(*) FROM rfq_bids WHERE rfq_id = r.id AND carrier_id = rc.carrier_id) as bids_submitted,
  (SELECT COUNT(*) FROM rfq_bids WHERE rfq_id = r.id AND carrier_id = rc.carrier_id AND status = 'awarded') as bids_awarded,
  -- Time remaining
  EXTRACT(EPOCH FROM (r.response_deadline - NOW())) / 3600 as hours_until_deadline,
  CASE
    WHEN r.response_deadline < NOW() THEN true
    ELSE false
  END as is_expired
FROM rfq_carriers rc
JOIN rfq_requests r ON rc.rfq_id = r.id
WHERE r.status IN ('sent', 'in_review');

-- Carrier's bids with lane details
CREATE OR REPLACE VIEW vw_carrier_bids AS
SELECT
  b.id as bid_id,
  b.carrier_id,
  b.rfq_id,
  b.rfq_lane_id,
  r.rfq_number,
  r.rfq_name,
  l.lane_number,
  l.origin_city || ', ' || l.origin_state as origin,
  l.destination_city || ', ' || l.destination_state as destination,
  l.equipment_type,
  l.commodity,
  l.estimated_miles,
  l.annual_volume,
  b.rate_per_load,
  b.rate_per_mile,
  b.transit_time_hours,
  b.max_weight,
  b.status,
  b.rank,
  b.submitted_at,
  -- Award info (if applicable)
  CASE
    WHEN l.awarded_bid_id = b.id THEN true
    ELSE false
  END as is_awarded,
  l.awarded_at,
  -- Potential annual value
  b.rate_per_load * l.annual_volume as potential_annual_value
FROM rfq_bids b
JOIN rfq_lanes l ON b.rfq_lane_id = l.id
JOIN rfq_requests r ON b.rfq_id = r.id;

-- =====================================================
-- 7. Email Templates Table
-- =====================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  variables JSONB, -- List of available variables like {{carrier_name}}, {{rfq_number}}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default templates
INSERT INTO email_templates (template_name, subject, body_html, body_text, variables)
VALUES
  (
    'rfq_invitation',
    'New RFQ: {{rfq_name}} - Submit Your Bid',
    '<h2>New RFQ Available</h2>
    <p>Dear {{carrier_name}},</p>
    <p>You have been invited to submit bids for <strong>{{rfq_name}}</strong>.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>RFQ Number: {{rfq_number}}</li>
      <li>Total Lanes: {{total_lanes}}</li>
      <li>Response Deadline: {{response_deadline}}</li>
    </ul>
    <p><a href="{{portal_url}}" style="background: #003366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View RFQ & Submit Bids</a></p>
    <p>Questions? Reply to this email or call us.</p>',
    'New RFQ Available\n\nDear {{carrier_name}},\n\nYou have been invited to submit bids for {{rfq_name}}.\n\nDetails:\n- RFQ Number: {{rfq_number}}\n- Total Lanes: {{total_lanes}}\n- Response Deadline: {{response_deadline}}\n\nView RFQ and submit bids: {{portal_url}}\n\nQuestions? Reply to this email or call us.',
    '{"carrier_name": "Carrier company name", "rfq_name": "RFQ title", "rfq_number": "RFQ-2026-001", "total_lanes": "30", "response_deadline": "Jan 31, 2026", "portal_url": "Link to portal"}'
  ),
  (
    'bid_award_winner',
    'Congratulations! You Won Lanes in {{rfq_name}}',
    '<h2>Congratulations!</h2>
    <p>Dear {{carrier_name}},</p>
    <p>We are pleased to inform you that you have been awarded <strong>{{lanes_awarded}}</strong> lane(s) in {{rfq_name}}.</p>
    <p><strong>Award Details:</strong></p>
    <ul>
      <li>Total Lanes Awarded: {{lanes_awarded}}</li>
      <li>Estimated Annual Value: ${{annual_value}}</li>
    </ul>
    <p><a href="{{portal_url}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Award Details</a></p>
    <p>Our team will contact you shortly to finalize rate confirmations.</p>',
    'Congratulations!\n\nDear {{carrier_name}},\n\nWe are pleased to inform you that you have been awarded {{lanes_awarded}} lane(s) in {{rfq_name}}.\n\nAward Details:\n- Total Lanes Awarded: {{lanes_awarded}}\n- Estimated Annual Value: ${{annual_value}}\n\nView details: {{portal_url}}\n\nOur team will contact you shortly to finalize rate confirmations.',
    '{"carrier_name": "Carrier company name", "rfq_name": "RFQ title", "lanes_awarded": "5", "annual_value": "125000", "portal_url": "Link to portal"}'
  ),
  (
    'bid_award_loser',
    'RFQ {{rfq_name}} - Award Status',
    '<h2>RFQ Update</h2>
    <p>Dear {{carrier_name}},</p>
    <p>Thank you for submitting bids for {{rfq_name}}.</p>
    <p>After careful review, we have selected other carriers for this RFQ. We appreciate your participation and look forward to working with you on future opportunities.</p>
    <p><a href="{{portal_url}}" style="background: #003366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Portal</a></p>
    <p>Thank you for your partnership.</p>',
    'RFQ Update\n\nDear {{carrier_name}},\n\nThank you for submitting bids for {{rfq_name}}.\n\nAfter careful review, we have selected other carriers for this RFQ. We appreciate your participation and look forward to working with you on future opportunities.\n\nView portal: {{portal_url}}\n\nThank you for your partnership.',
    '{"carrier_name": "Carrier company name", "rfq_name": "RFQ title", "portal_url": "Link to portal"}'
  );

-- =====================================================
-- 8. Verification Queries
-- =====================================================

-- Check carrier portal extensions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'carriers' AND column_name LIKE 'portal%'
ORDER BY ordinal_position;

-- Check new tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('carrier_portal_sessions', 'carrier_portal_activity', 'email_templates')
ORDER BY table_name;

-- =====================================================
-- SUCCESS!
-- =====================================================
SELECT '✅ Carrier Portal Authentication schema created!' as status;
SELECT 'Carriers can now register and submit bids through portal' as next_step;

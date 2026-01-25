-- ===========================================
-- Fix Audit Log to Show Actual User
-- ===========================================

-- First, let's check if the audit log table exists
CREATE TABLE IF NOT EXISTS load_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  load_id UUID REFERENCES loads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE load_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON load_audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON load_audit_logs;

-- Recreate policies
CREATE POLICY "Authenticated users can view audit logs" ON load_audit_logs
FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert audit logs" ON load_audit_logs
FOR INSERT TO authenticated WITH CHECK (true);

-- Create or replace the trigger function to log load changes
CREATE OR REPLACE FUNCTION log_load_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT operations (new load created)
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO load_audit_logs (load_id, user_id, action, changes)
    VALUES (
      NEW.id,
      NEW.created_by,  -- Use the created_by field from the new load
      'Load Created',
      json_build_object(
        'load_number', NEW.load_number,
        'status', NEW.status,
        'carrier_id', NEW.carrier_id,
        'customer_id', NEW.customer_id
      )::jsonb
    );
    RETURN NEW;
  
  -- For UPDATE operations (load modified)
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only log if there are actual changes
    IF (NEW.* IS DISTINCT FROM OLD.*) THEN
      INSERT INTO load_audit_logs (load_id, user_id, action, changes)
      VALUES (
        NEW.id,
        auth.uid(),  -- Use the current user making the update
        'Load Updated',
        json_build_object(
          'old', row_to_json(OLD.*),
          'new', row_to_json(NEW.*)
        )::jsonb
      );
    END IF;
    RETURN NEW;
  
  -- For DELETE operations
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO load_audit_logs (load_id, user_id, action, changes)
    VALUES (
      OLD.id,
      auth.uid(),
      'Load Deleted',
      row_to_json(OLD.*)::jsonb
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS loads_audit_trigger ON loads;

-- Create the trigger
CREATE TRIGGER loads_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON loads
FOR EACH ROW
EXECUTE FUNCTION log_load_changes();

-- Verify the trigger was created
SELECT tgname, tgenabled, tgtype 
FROM pg_trigger 
WHERE tgname = 'loads_audit_trigger';

-- Test: View recent audit logs with user names
SELECT 
  la.id,
  la.action,
  la.created_at,
  p.full_name as user_name,
  p.email as user_email,
  l.load_number
FROM load_audit_logs la
LEFT JOIN profiles p ON la.user_id = p.id
LEFT JOIN loads l ON la.load_id = l.id
ORDER BY la.created_at DESC
LIMIT 10;

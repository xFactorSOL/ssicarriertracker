-- ===========================================
-- Fix Load Audit Logs Table Schema
-- ===========================================

-- Add the missing 'changes' column if it doesn't exist
ALTER TABLE load_audit_logs ADD COLUMN IF NOT EXISTS changes JSONB;

-- Ensure we have user_id column (this was likely missing)
ALTER TABLE load_audit_logs ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'load_audit_logs_user_id_fkey'
  ) THEN
    ALTER TABLE load_audit_logs 
    ADD CONSTRAINT load_audit_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id);
  END IF;
END $$;

-- Drop the old trigger function and recreate it correctly
DROP TRIGGER IF EXISTS loads_audit_trigger ON loads;
DROP FUNCTION IF EXISTS log_load_changes();

-- Create the corrected trigger function
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
        'carrier_name', NEW.carrier_name,
        'customer_name', NEW.customer_name
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
          'fields_changed', json_build_object(
            'status', CASE WHEN NEW.status != OLD.status THEN json_build_object('old', OLD.status, 'new', NEW.status) ELSE NULL END,
            'carrier_name', CASE WHEN NEW.carrier_name != OLD.carrier_name THEN json_build_object('old', OLD.carrier_name, 'new', NEW.carrier_name) ELSE NULL END,
            'origin_city', CASE WHEN NEW.origin_city != OLD.origin_city THEN json_build_object('old', OLD.origin_city, 'new', NEW.origin_city) ELSE NULL END,
            'destination_city', CASE WHEN NEW.destination_city != OLD.destination_city THEN json_build_object('old', OLD.destination_city, 'new', NEW.destination_city) ELSE NULL END
          )
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

-- Create the trigger
CREATE TRIGGER loads_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON loads
FOR EACH ROW
EXECUTE FUNCTION log_load_changes();

-- Verify the trigger was created
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  tgtype as type
FROM pg_trigger 
WHERE tgname = 'loads_audit_trigger';

-- Verify the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'load_audit_logs'
ORDER BY ordinal_position;

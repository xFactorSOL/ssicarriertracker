-- =====================================================
-- Complete Fix for Load Audit Logs System
-- =====================================================
-- This script fixes the audit log trigger to properly
-- track all changes to loads
-- =====================================================

-- Step 1: Check current state of audit logs table
SELECT 'Checking load_audit_logs table structure...' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'load_audit_logs'
ORDER BY ordinal_position;

-- Step 2: Ensure all required columns exist
ALTER TABLE load_audit_logs ADD COLUMN IF NOT EXISTS changes JSONB;
ALTER TABLE load_audit_logs ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 3: Check for existing triggers
SELECT 'Current triggers on loads table:' as status;
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'loads'::regclass;

-- Step 4: Drop existing trigger and function
DROP TRIGGER IF EXISTS loads_audit_trigger ON loads;
DROP FUNCTION IF EXISTS log_load_changes() CASCADE;

-- Step 5: Create improved trigger function
CREATE OR REPLACE FUNCTION log_load_changes()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  old_data JSONB;
  new_data JSONB;
  change_details JSONB;
BEGIN
  -- Try to get current user ID, fall back to system if not available
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  -- INSERT: New load created
  IF (TG_OP = 'INSERT') THEN
    -- Use created_by from the load, or current user
    current_user_id := COALESCE(NEW.created_by, current_user_id);
    
    INSERT INTO load_audit_logs (load_id, user_id, action, changes, created_at)
    VALUES (
      NEW.id,
      current_user_id,
      'INSERT',
      jsonb_build_object(
        'new', row_to_json(NEW)::jsonb
      ),
      NOW()
    );
    
    RETURN NEW;
  
  -- UPDATE: Load modified
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Build old and new data JSON
    old_data := row_to_json(OLD)::jsonb;
    new_data := row_to_json(NEW)::jsonb;
    
    -- Remove updated_at from comparison to avoid logging every auto-update
    old_data := old_data - 'updated_at';
    new_data := new_data - 'updated_at';
    
    -- Only log if there are actual changes
    IF (old_data IS DISTINCT FROM new_data) THEN
      change_details := jsonb_build_object(
        'old', old_data,
        'new', new_data
      );
      
      INSERT INTO load_audit_logs (load_id, user_id, action, changes, created_at)
      VALUES (
        NEW.id,
        current_user_id,
        'UPDATE',
        change_details,
        NOW()
      );
    END IF;
    
    RETURN NEW;
  
  -- DELETE: Load deleted
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO load_audit_logs (load_id, user_id, action, changes, created_at)
    VALUES (
      OLD.id,
      current_user_id,
      'DELETE',
      jsonb_build_object(
        'old', row_to_json(OLD)::jsonb
      ),
      NOW()
    );
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create the trigger
CREATE TRIGGER loads_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON loads
FOR EACH ROW
EXECUTE FUNCTION log_load_changes();

-- Step 7: Ensure RLS policies allow audit log inserts
-- First check if RLS is enabled
SELECT 'Checking RLS policies on load_audit_logs...' as status;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'load_audit_logs';

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Allow authenticated users to view audit logs" ON load_audit_logs;
DROP POLICY IF EXISTS "Allow system to insert audit logs" ON load_audit_logs;
DROP POLICY IF EXISTS "Allow service role to insert audit logs" ON load_audit_logs;

-- Policy 1: Allow authenticated users to view audit logs
CREATE POLICY "Allow authenticated users to view audit logs"
ON load_audit_logs FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy 2: Allow system (trigger) to insert audit logs
CREATE POLICY "Allow system to insert audit logs"
ON load_audit_logs FOR INSERT
WITH CHECK (true);  -- Allow all inserts since trigger is SECURITY DEFINER

-- Policy 3: Allow authenticated users to insert (for manual logs if needed)
CREATE POLICY "Allow authenticated users to insert audit logs"
ON load_audit_logs FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Step 8: Test the trigger by creating a test update
-- (Uncomment to test)
-- UPDATE loads SET notes = COALESCE(notes, '') || ' [Audit test]' 
-- WHERE id = (SELECT id FROM loads LIMIT 1);

-- Step 9: Verify trigger is working
SELECT 'Verifying trigger installation...' as status;
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgname = 'loads_audit_trigger';

-- Step 10: Check recent audit logs
SELECT 'Recent audit log entries:' as status;
SELECT 
  load_id,
  user_id,
  action,
  created_at,
  jsonb_pretty(changes) as changes
FROM load_audit_logs
ORDER BY created_at DESC
LIMIT 5;

-- Step 11: Count audit logs per load
SELECT 'Audit log counts per load:' as status;
SELECT 
  l.load_number,
  l.id as load_id,
  COUNT(la.id) as audit_count
FROM loads l
LEFT JOIN load_audit_logs la ON l.id = la.load_id
GROUP BY l.id, l.load_number
ORDER BY l.created_at DESC
LIMIT 10;

-- =====================================================
-- INSTRUCTIONS:
-- =====================================================
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Check the output to verify trigger is installed
-- 3. Create or update a load in the TMS
-- 4. Refresh the load detail page
-- 5. The Change Log tab should now show entries
-- =====================================================

SELECT '✅ Audit log system fixed!' as status;

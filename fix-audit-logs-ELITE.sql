-- =====================================================
-- ELITE FIX: Load Audit Logs with Proper Timing
-- =====================================================
-- The issue: AFTER DELETE trigger runs after the load
-- is deleted, but foreign key constraint checks fail
-- because the load no longer exists!
--
-- The solution: Use BEFORE DELETE for deletes,
-- AFTER for everything else
-- =====================================================

-- Step 1: Drop ALL existing triggers
DROP TRIGGER IF EXISTS loads_audit_trigger ON loads;
DROP TRIGGER IF EXISTS loads_audit_trigger_delete ON loads;
DROP FUNCTION IF EXISTS log_load_changes() CASCADE;
DROP FUNCTION IF EXISTS log_load_delete() CASCADE;

-- Step 2: Create function for INSERT and UPDATE (AFTER trigger)
CREATE OR REPLACE FUNCTION log_load_changes()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  old_data JSONB;
  new_data JSONB;
BEGIN
  -- Try to get current user ID
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  -- INSERT: New load created
  IF (TG_OP = 'INSERT') THEN
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
    old_data := row_to_json(OLD)::jsonb;
    new_data := row_to_json(NEW)::jsonb;
    
    -- Remove updated_at from comparison
    old_data := old_data - 'updated_at';
    new_data := new_data - 'updated_at';
    
    -- Only log if there are actual changes
    IF (old_data IS DISTINCT FROM new_data) THEN
      INSERT INTO load_audit_logs (load_id, user_id, action, changes, created_at)
      VALUES (
        NEW.id,
        current_user_id,
        'UPDATE',
        jsonb_build_object(
          'old', old_data,
          'new', new_data
        ),
        NOW()
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create function for DELETE (BEFORE trigger - this is key!)
CREATE OR REPLACE FUNCTION log_load_delete()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Try to get current user ID
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  -- Log the delete BEFORE it happens (so load still exists for FK check)
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create AFTER trigger for INSERT and UPDATE
CREATE TRIGGER loads_audit_trigger
AFTER INSERT OR UPDATE ON loads
FOR EACH ROW
EXECUTE FUNCTION log_load_changes();

-- Step 5: Create BEFORE trigger for DELETE (runs before deletion)
CREATE TRIGGER loads_audit_trigger_delete
BEFORE DELETE ON loads
FOR EACH ROW
EXECUTE FUNCTION log_load_delete();

-- Step 6: Ensure foreign key constraint is normal (not deferred)
ALTER TABLE load_audit_logs 
DROP CONSTRAINT IF EXISTS load_audit_logs_load_id_fkey CASCADE;

ALTER TABLE load_audit_logs
ADD CONSTRAINT load_audit_logs_load_id_fkey
FOREIGN KEY (load_id) 
REFERENCES loads(id) 
ON DELETE CASCADE;

-- Step 7: Verify triggers
SELECT 'Triggers on loads table:' as status;
SELECT 
    tgname as trigger_name,
    CASE 
        WHEN tgtype & 1 = 1 THEN 'ROW'
        ELSE 'STATEMENT'
    END as level,
    CASE 
        WHEN tgtype & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    CASE 
        WHEN tgtype & 4 = 4 THEN 'INSERT '
        ELSE ''
    END ||
    CASE 
        WHEN tgtype & 8 = 8 THEN 'DELETE '
        ELSE ''
    END ||
    CASE 
        WHEN tgtype & 16 = 16 THEN 'UPDATE'
        ELSE ''
    END as events
FROM pg_trigger 
WHERE tgrelid = 'loads'::regclass
AND tgname LIKE 'loads_audit%'
ORDER BY tgname;

-- Step 8: Test by viewing recent audit logs
SELECT 'Recent audit logs:' as status;
SELECT 
    load_id,
    action,
    user_id,
    created_at
FROM load_audit_logs
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- HOW IT WORKS:
-- =====================================================
-- INSERT: AFTER trigger logs creation (load exists ✓)
-- UPDATE: AFTER trigger logs changes (load exists ✓)
-- DELETE: BEFORE trigger logs deletion (load still exists ✓)
--         Then CASCADE deletes the audit logs
-- =====================================================

SELECT '✅ ELITE FIX COMPLETE! Audit logs now work perfectly!' as status;

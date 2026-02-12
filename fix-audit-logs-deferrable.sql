-- =====================================================
-- Fix Load Audit Logs - Make Constraint Deferrable
-- =====================================================
-- This makes the foreign key constraint check at the
-- end of the transaction, not immediately
-- =====================================================

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE load_audit_logs 
DROP CONSTRAINT IF EXISTS load_audit_logs_load_id_fkey CASCADE;

-- Step 2: Recreate with DEFERRABLE INITIALLY DEFERRED
-- This delays the constraint check until the transaction commits
ALTER TABLE load_audit_logs
ADD CONSTRAINT load_audit_logs_load_id_fkey
FOREIGN KEY (load_id) 
REFERENCES loads(id) 
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- Step 3: Also fix user_id constraint
ALTER TABLE load_audit_logs 
DROP CONSTRAINT IF EXISTS load_audit_logs_user_id_fkey CASCADE;

ALTER TABLE load_audit_logs
ADD CONSTRAINT load_audit_logs_user_id_fkey
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- Step 4: Verify the constraints
SELECT 'Foreign key constraints on load_audit_logs:' as status;
SELECT
    con.conname as constraint_name,
    att.attname as column_name,
    cl.relname as foreign_table,
    CASE 
        WHEN con.condeferrable THEN 'DEFERRABLE'
        ELSE 'NOT DEFERRABLE'
    END as deferrable_status,
    CASE 
        WHEN con.condeferred THEN 'INITIALLY DEFERRED'
        ELSE 'INITIALLY IMMEDIATE'
    END as defer_timing
FROM pg_constraint con
JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
JOIN pg_class cl ON cl.oid = con.confrelid
WHERE con.conrelid = 'load_audit_logs'::regclass
AND con.contype = 'f';

SELECT '✅ Constraints updated with DEFERRABLE!' as status;

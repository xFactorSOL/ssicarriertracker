-- =====================================================
-- Fix Load Audit Logs Foreign Key Constraint
-- =====================================================
-- This fixes the foreign key issue that prevents audit
-- logs from being created
-- =====================================================

-- Step 1: Check current constraint
SELECT 'Current foreign key constraints on load_audit_logs:' as status;
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'load_audit_logs'
    AND tc.constraint_type = 'FOREIGN KEY';

-- Step 2: Drop the problematic foreign key constraint
ALTER TABLE load_audit_logs 
DROP CONSTRAINT IF EXISTS load_audit_logs_load_id_fkey;

-- Step 3: Recreate the constraint with ON DELETE CASCADE
-- This allows audit logs to be deleted when the load is deleted
ALTER TABLE load_audit_logs
ADD CONSTRAINT load_audit_logs_load_id_fkey
FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE;

-- Step 4: Also fix the user_id constraint if it exists
ALTER TABLE load_audit_logs 
DROP CONSTRAINT IF EXISTS load_audit_logs_user_id_fkey;

-- Step 5: Recreate user_id constraint with ON DELETE SET NULL
-- This keeps audit logs even if the user is deleted
ALTER TABLE load_audit_logs
ADD CONSTRAINT load_audit_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Step 6: Verify the new constraints
SELECT 'New foreign key constraints on load_audit_logs:' as status;
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'load_audit_logs'
    AND tc.constraint_type = 'FOREIGN KEY';

-- =====================================================
-- INSTRUCTIONS:
-- =====================================================
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. The audit logs should now work correctly
-- 3. Try creating or editing a load to test
-- =====================================================

SELECT '✅ Foreign key constraints fixed!' as status;

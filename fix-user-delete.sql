-- Fix: Allow user deletion by updating foreign key constraint
-- This sets created_by to NULL when a user is deleted (preserves the loads)

-- First, drop the existing constraint
ALTER TABLE loads DROP CONSTRAINT IF EXISTS loads_created_by_fkey;

-- Re-add with ON DELETE SET NULL
ALTER TABLE loads 
ADD CONSTRAINT loads_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- Also fix load_notes if it has a similar constraint
ALTER TABLE load_notes DROP CONSTRAINT IF EXISTS load_notes_user_id_fkey;
ALTER TABLE load_notes 
ADD CONSTRAINT load_notes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- Also fix load_audit_logs if it has a similar constraint
ALTER TABLE load_audit_logs DROP CONSTRAINT IF EXISTS load_audit_logs_user_id_fkey;
ALTER TABLE load_audit_logs 
ADD CONSTRAINT load_audit_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- Verify the constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND kcu.column_name IN ('created_by', 'user_id')
ORDER BY tc.table_name;

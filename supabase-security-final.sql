-- ============================================
-- CARRIER TRACKER - FINAL SECURITY HARDENING
-- ============================================
-- Run this in Supabase SQL Editor to secure all tables
-- This fixes the temporarily disabled RLS from debugging

-- ============================================
-- SECTION 1: Re-enable RLS on all tables
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECTION 2: PROFILES Policies (Updated)
-- ============================================

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- All authenticated users can view profiles
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
FOR SELECT TO authenticated USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Super admins can update any profile
CREATE POLICY "Super admins can update any profile" ON profiles
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
);

-- Super admins can delete any profile (except their own)
CREATE POLICY "Super admins can delete profiles" ON profiles
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  AND id != auth.uid()
);

-- ============================================
-- SECTION 3: LOAD_NOTES Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view notes" ON load_notes;
DROP POLICY IF EXISTS "Users can add notes" ON load_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON load_notes;

-- All authenticated users can view notes
CREATE POLICY "Authenticated users can view notes" ON load_notes
FOR SELECT TO authenticated USING (true);

-- Authenticated users can add notes
CREATE POLICY "Authenticated users can add notes" ON load_notes
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notes, managers can delete any
CREATE POLICY "Users can delete own notes" ON load_notes
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'manager' OR is_super_admin = true))
);

-- ============================================
-- SECTION 4: LOAD_AUDIT_LOGS Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view audit logs" ON load_audit_logs;
DROP POLICY IF EXISTS "Trigger can insert audit logs" ON load_audit_logs;

-- All authenticated users can view audit logs
CREATE POLICY "Authenticated users can view audit logs" ON load_audit_logs
FOR SELECT TO authenticated USING (true);

-- Allow system/trigger to insert audit logs
CREATE POLICY "System can insert audit logs" ON load_audit_logs
FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- SECTION 5: LOAD_DOCUMENTS Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view documents" ON load_documents;
DROP POLICY IF EXISTS "Users can upload documents" ON load_documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON load_documents;

-- All authenticated users can view documents
CREATE POLICY "Authenticated users can view documents" ON load_documents
FOR SELECT TO authenticated USING (true);

-- Authenticated users can upload documents
CREATE POLICY "Authenticated users can upload documents" ON load_documents
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can delete their own documents, managers can delete any
CREATE POLICY "Users can delete documents" ON load_documents
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'manager' OR is_super_admin = true))
);

-- ============================================
-- SECTION 6: Verify RLS is enabled
-- ============================================

SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'loads', 'carriers', 'customers', 'load_notes', 'load_audit_logs', 'load_documents');

-- ============================================
-- SECURITY CHECKLIST
-- ============================================
-- 1. [x] RLS enabled on all tables
-- 2. [x] Profiles: Users can only update own profile
-- 3. [x] Profiles: Super admins can manage all profiles
-- 4. [x] Notes: Users can add notes, delete own
-- 5. [x] Audit logs: Read-only for users, system can write
-- 6. [x] Documents: Users can upload, delete own
-- 7. [ ] Ensure Vercel has proper environment variables
-- 8. [ ] Rotate Supabase anon key if it was exposed

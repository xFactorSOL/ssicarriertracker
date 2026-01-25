-- ============================================
-- FIX DATABASE ISSUES
-- ============================================
-- Run this in Supabase SQL Editor to fix fetch errors

-- Check if load_documents table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'load_documents';

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'loads', 'carriers', 'customers', 'load_notes', 'load_documents', 'load_audit_logs', 'notifications');

-- Check existing policies on load_documents
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'load_documents';

-- ============================================
-- FIX: Drop and recreate all RLS policies
-- ============================================

-- PROFILES TABLE
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;

CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Super admins can update any profile" ON profiles
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
);

CREATE POLICY "Super admins can delete profiles" ON profiles
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  AND id != auth.uid()
);

-- LOADS TABLE
DROP POLICY IF EXISTS "Users can view loads" ON loads;
DROP POLICY IF EXISTS "Users can insert loads" ON loads;
DROP POLICY IF EXISTS "Users can update loads" ON loads;
DROP POLICY IF EXISTS "Managers can delete loads" ON loads;

CREATE POLICY "Authenticated users can view loads" ON loads
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert loads" ON loads
FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update loads" ON loads
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Managers can delete loads" ON loads
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'manager' OR is_super_admin = true))
);

-- CARRIERS TABLE
DROP POLICY IF EXISTS "Users can view carriers" ON carriers;
DROP POLICY IF EXISTS "Users can manage carriers" ON carriers;

CREATE POLICY "Authenticated users can view carriers" ON carriers
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert carriers" ON carriers
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update carriers" ON carriers
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Managers can delete carriers" ON carriers
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'manager' OR is_super_admin = true))
);

-- CUSTOMERS TABLE
DROP POLICY IF EXISTS "Users can view customers" ON customers;
DROP POLICY IF EXISTS "Users can manage customers" ON customers;

CREATE POLICY "Authenticated users can view customers" ON customers
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert customers" ON customers
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers" ON customers
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Managers can delete customers" ON customers
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'manager' OR is_super_admin = true))
);

-- LOAD_NOTES TABLE
DROP POLICY IF EXISTS "Authenticated users can view notes" ON load_notes;
DROP POLICY IF EXISTS "Authenticated users can add notes" ON load_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON load_notes;

CREATE POLICY "Authenticated users can view notes" ON load_notes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can add notes" ON load_notes
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON load_notes
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'manager' OR is_super_admin = true))
);

-- LOAD_AUDIT_LOGS TABLE
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON load_audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON load_audit_logs;

CREATE POLICY "Authenticated users can view audit logs" ON load_audit_logs
FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert audit logs" ON load_audit_logs
FOR INSERT TO authenticated WITH CHECK (true);

-- LOAD_DOCUMENTS TABLE - THE KEY FIX
DROP POLICY IF EXISTS "Authenticated users can view documents" ON load_documents;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON load_documents;
DROP POLICY IF EXISTS "Users can delete documents" ON load_documents;

CREATE POLICY "Authenticated users can view documents" ON load_documents
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can upload documents" ON load_documents
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents" ON load_documents
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete documents" ON load_documents
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'manager' OR is_super_admin = true))
);

-- NOTIFICATIONS TABLE
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- STORAGE POLICIES (Critical for document upload/download)
-- ============================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Create new storage policies for load-documents bucket
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'load-documents');

CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'load-documents');

CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'load-documents');

-- ============================================
-- Verify everything is working
-- ============================================

-- Check all tables have RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'loads', 'carriers', 'customers', 'load_notes', 'load_documents', 'load_audit_logs', 'notifications');

-- Should return TRUE for all tables

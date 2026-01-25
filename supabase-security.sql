-- ============================================
-- CARRIER TRACKER - DATABASE SECURITY SETUP
-- ============================================
-- Run this in Supabase SQL Editor to secure your database
-- WARNING: Run each section one at a time!

-- ============================================
-- SECTION 1: Add security columns to profiles
-- ============================================

-- Add is_super_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Set the super admin (run this with your email)
UPDATE profiles SET is_super_admin = true WHERE email = 'fbeta280@gmail.com';

-- ============================================
-- SECTION 2: Enable Row Level Security
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECTION 3: PROFILES Policies
-- ============================================

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON profiles;

-- Users can read all profiles (needed for seeing who created loads)
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can create their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile (but not role/is_super_admin)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- SECTION 4: LOADS Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own loads" ON loads;
DROP POLICY IF EXISTS "Managers can view all loads" ON loads;
DROP POLICY IF EXISTS "Users can create loads" ON loads;
DROP POLICY IF EXISTS "Users can update own loads" ON loads;
DROP POLICY IF EXISTS "Managers can update all loads" ON loads;
DROP POLICY IF EXISTS "Users can delete own loads" ON loads;
DROP POLICY IF EXISTS "Managers can delete all loads" ON loads;

-- Helper function to check if user is manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (role = 'manager' OR is_super_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View: Users see own loads, managers see all
CREATE POLICY "Users can view own loads" ON loads
  FOR SELECT USING (
    created_by = auth.uid() OR is_manager()
  );

-- Insert: Any authenticated user can create loads
CREATE POLICY "Users can create loads" ON loads
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Update: Users update own, managers update all
CREATE POLICY "Users can update loads" ON loads
  FOR UPDATE USING (
    created_by = auth.uid() OR is_manager()
  );

-- Delete: Users delete own, managers delete all
CREATE POLICY "Users can delete loads" ON loads
  FOR DELETE USING (
    created_by = auth.uid() OR is_manager()
  );

-- ============================================
-- SECTION 5: CARRIERS Policies
-- ============================================

DROP POLICY IF EXISTS "Anyone can view carriers" ON carriers;
DROP POLICY IF EXISTS "Managers can manage carriers" ON carriers;

-- All authenticated users can view carriers
CREATE POLICY "Anyone can view carriers" ON carriers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only managers can insert/update/delete carriers
CREATE POLICY "Managers can insert carriers" ON carriers
  FOR INSERT WITH CHECK (is_manager());

CREATE POLICY "Managers can update carriers" ON carriers
  FOR UPDATE USING (is_manager());

CREATE POLICY "Managers can delete carriers" ON carriers
  FOR DELETE USING (is_manager());

-- ============================================
-- SECTION 6: CUSTOMERS Policies
-- ============================================

DROP POLICY IF EXISTS "Anyone can view customers" ON customers;
DROP POLICY IF EXISTS "Managers can manage customers" ON customers;

-- All authenticated users can view customers
CREATE POLICY "Anyone can view customers" ON customers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only managers can insert/update/delete customers
CREATE POLICY "Managers can insert customers" ON customers
  FOR INSERT WITH CHECK (is_manager());

CREATE POLICY "Managers can update customers" ON customers
  FOR UPDATE USING (is_manager());

CREATE POLICY "Managers can delete customers" ON customers
  FOR DELETE USING (is_manager());

-- ============================================
-- SECTION 7: Secure profile role updates
-- ============================================

-- Create a function to safely update roles (only super admins can do this)
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if current user is super admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true) THEN
    RAISE EXCEPTION 'Only super admins can change user roles';
  END IF;
  
  -- Prevent changing super admin's role
  IF EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id AND is_super_admin = true) THEN
    RAISE EXCEPTION 'Cannot change super admin role';
  END IF;
  
  -- Update the role
  UPDATE profiles SET role = new_role WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECTION 8: Add audit logging (optional)
-- ============================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit log
CREATE POLICY "Super admins can view audit log" ON audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'loads', 'carriers', 'customers');

-- Check policies exist
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

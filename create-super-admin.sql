-- =====================================================
-- CREATE SUPER ADMIN USER
-- =====================================================
-- This script creates a super admin user for CarrierTracker
-- Run this in your Supabase SQL Editor
-- =====================================================

-- INSTRUCTIONS:
-- 1. Replace 'admin@example.com' with your email
-- 2. Replace 'YourStrongPassword123!' with your password
-- 3. Replace 'Your Full Name' with your name
-- 4. Run this entire script in Supabase SQL Editor
-- =====================================================

-- Create a function to make user creation easier
CREATE OR REPLACE FUNCTION create_super_admin(
  admin_email TEXT,
  admin_password TEXT,
  admin_name TEXT
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  status TEXT
) AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();
  
  -- Create the auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_sent_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    last_sign_in_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object(),
    false,
    NOW()
  );
  
  -- Create the profile
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    admin_email,
    admin_name,
    'superadmin',
    NOW(),
    NOW()
  );
  
  -- Return success info
  RETURN QUERY
  SELECT 
    new_user_id,
    admin_email,
    'Super admin user created successfully! You can now log in.'::TEXT;
    
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'User with email % already exists', admin_email;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- NOW CREATE YOUR SUPER ADMIN USER
-- =====================================================
-- Replace these values with your own:

SELECT * FROM create_super_admin(
  'admin@example.com',      -- ← CHANGE THIS to your email
  'YourStrongPassword123!', -- ← CHANGE THIS to your password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
  'Admin User'              -- ← CHANGE THIS to your full name
);

-- =====================================================
-- VERIFY THE USER WAS CREATED
-- =====================================================

SELECT 'Checking auth.users table:' as info;
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'admin@example.com'  -- ← CHANGE THIS to match your email above
ORDER BY created_at DESC 
LIMIT 1;

SELECT 'Checking profiles table:' as info;
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'admin@example.com'  -- ← CHANGE THIS to match your email above
ORDER BY created_at DESC 
LIMIT 1;

-- =====================================================
-- SUCCESS! 
-- =====================================================
-- If you see your user in both tables above, you're ready!
-- Go to your app and log in with the email/password you set.
-- =====================================================

-- First, check which users exist
SELECT id, email, full_name, role, status, is_super_admin 
FROM profiles 
ORDER BY created_at DESC;

-- To delete a specific user by email:
-- Replace 'email@example.com' with the actual email
DO $$ 
DECLARE
  user_uuid UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO user_uuid FROM profiles WHERE email = 'xyfactor@gmail.com';
  
  IF user_uuid IS NOT NULL THEN
    -- Delete from profiles table
    DELETE FROM profiles WHERE id = user_uuid;
    
    -- Delete from auth.users table (requires admin/service role)
    -- This will also cascade delete the auth session
    DELETE FROM auth.users WHERE id = user_uuid;
    
    RAISE NOTICE 'User deleted: %', user_uuid;
  ELSE
    RAISE NOTICE 'User not found';
  END IF;
END $$;

-- Or delete multiple users at once:
-- DELETE FROM profiles WHERE email IN ('email1@example.com', 'email2@example.com');
-- DELETE FROM auth.users WHERE email IN ('email1@example.com', 'email2@example.com');

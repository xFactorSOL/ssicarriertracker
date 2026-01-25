-- Check if your profile is marked as super admin
SELECT id, email, full_name, is_super_admin, role, status 
FROM profiles 
WHERE email = 'fbeta280@gmail.com';

-- If is_super_admin is false, run this to fix it:
UPDATE profiles 
SET is_super_admin = true 
WHERE email = 'fbeta280@gmail.com';

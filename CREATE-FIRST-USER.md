# How to Create Your First User

## Problem
You can't log into the app because no users exist yet.

## Solutions

### Option A: Create User via Supabase Dashboard (Easiest)

1. Go to https://app.supabase.com/
2. Open your project
3. Navigate to **Authentication** → **Users**
4. Click **Add User** → **Create new user**
5. Enter:
   - Email: `your-email@example.com`
   - Password: Must be strong (8+ chars, uppercase, lowercase, number, special char)
   - Check "Auto Confirm User"
6. Click **Create User**

7. Now create the profile:
   - Go to **Table Editor** → **profiles** table
   - Click **Insert** → **Insert row**
   - Fill in:
     - `id`: (use the same ID from the auth user you just created)
     - `email`: Same email
     - `full_name`: Your name
     - `role`: `superadmin` (for first user)
   - Click **Save**

### Option B: Create User via SQL (Faster)

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL (replace with your info):

```sql
-- Step 1: Create the auth user
-- This will return a user ID - SAVE THIS ID!
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com', -- CHANGE THIS
  crypt('YourStrongPassword123!', gen_salt('bf')), -- CHANGE THIS
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) RETURNING id;

-- Step 2: Create the profile (use the ID from step 1)
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  'USER-ID-FROM-ABOVE', -- REPLACE WITH THE ID FROM STEP 1
  'admin@example.com', -- SAME EMAIL
  'Admin User', -- YOUR NAME
  'superadmin',
  NOW(),
  NOW()
);
```

### Option C: Use the simpler SQL (if the above is complex)

```sql
-- This is a function that creates a user with profile in one go
-- You'll need to create this function first, then call it

CREATE OR REPLACE FUNCTION create_user_with_profile(
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT,
  user_role TEXT DEFAULT 'user'
)
RETURNS TEXT AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create auth user
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
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}'
  ) RETURNING id INTO new_user_id;
  
  -- Create profile
  INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (new_user_id, user_email, user_full_name, user_role, NOW(), NOW());
  
  RETURN 'User created with ID: ' || new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Then call it like this:
SELECT create_user_with_profile(
  'admin@example.com',  -- Email
  'YourStrongPass123!', -- Password
  'Admin User',         -- Full name
  'superadmin'          -- Role
);
```

## After Creating User

1. Go back to your app: http://localhost:3000
2. Log in with the email and password you created
3. You should now have access!

## Common Issues

### "Invalid login credentials"
- Make sure you're using the correct email/password
- Check that email_confirmed_at is set in auth.users table
- Verify the profile exists with the same user ID

### "Profile not found"
- The profile record is missing
- Run: `SELECT * FROM profiles WHERE id = 'your-user-id';`
- If empty, create the profile record

### Still can't connect?
- Check if Supabase project is active (not paused)
- Verify the SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Check browser console for errors (F12 → Console tab)

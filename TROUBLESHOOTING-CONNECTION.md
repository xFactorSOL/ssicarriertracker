# CarrierTracker - Connection Troubleshooting Guide

## 🔴 Current Issue
**Status:** Connection to Supabase is failing with `TypeError: fetch failed`

This means your app cannot reach the Supabase database.

---

## ✅ Step-by-Step Fix

### Step 1: Check if Supabase Project is Active

1. Go to: https://app.supabase.com/
2. Sign in to your account
3. Look for your project: `qwoabopuoihbawlwmgbf`
4. Check the status:
   - ✅ **Active (Green)** → Continue to Step 2
   - ⏸️ **Paused** → Click "Restore project" or "Resume"
   - ❌ **Not found** → You'll need to create a new project or get the correct URL

### Step 2: Verify Your Credentials

1. In Supabase Dashboard, go to: **Settings** → **API**
2. You should see:
   - **Project URL**: Should match `https://qwoabopuoihbawlwmgbf.supabase.co`
   - **Project API keys** → **anon/public key**: Should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. Compare with your `App.js` file (lines 22-23):
   ```javascript
   const supabaseUrl = 'https://qwoabopuoihbawlwmgbf.supabase.co';
   const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```

4. If they DON'T match:
   - Create a `.env.local` file in the `carrier-tracker` folder
   - Add:
     ```
     REACT_APP_SUPABASE_URL=https://your-actual-url.supabase.co
     REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key
     ```
   - Restart your development server

### Step 3: Test the Connection

Run the test script I created:
```bash
cd /Users/fbetancourtjr/CarrierTracker/carrier-tracker
node test-supabase-connection.js
```

**Expected Results:**
- ✅ "Successfully connected to database!" → Connection works!
- ❌ "TypeError: fetch failed" → Still having issues, continue to Step 4

### Step 4: Check Your Network

1. Can you access Supabase directly?
   - Open: https://qwoabopuoihbawlwmgbf.supabase.co
   - You should see a Supabase error page (this is normal - it confirms the server exists)
   - If you get "Can't reach this page" or timeout → Network/DNS issue

2. Check your firewall:
   - Make sure your firewall isn't blocking connections to `supabase.co`
   - Try disabling VPN temporarily
   - Try from a different network (mobile hotspot)

### Step 5: Create Your First User

Once connected, you need a user to log in:

**Option A - Use the SQL Script (Easiest):**
1. Open Supabase Dashboard → SQL Editor
2. Open the file: `create-super-admin.sql`
3. Edit the email, password, and name (lines 69-72)
4. Run the entire script
5. You should see: "Super admin user created successfully!"

**Option B - Manual Creation:**
See the detailed guide in `CREATE-FIRST-USER.md`

### Step 6: Start Your App and Log In

```bash
cd /Users/fbetancourtjr/CarrierTracker/carrier-tracker
npm start
```

Then go to: http://localhost:3000

Log in with the credentials you created in Step 5.

---

## 🔍 Common Error Messages & Solutions

### "Invalid login credentials"
**Cause:** Email or password is wrong, or user doesn't exist
**Fix:**
1. Double-check your email/password (case-sensitive!)
2. Verify user exists: Run in SQL Editor:
   ```sql
   SELECT * FROM auth.users WHERE email = 'your-email@example.com';
   SELECT * FROM profiles WHERE email = 'your-email@example.com';
   ```
3. Both queries should return results. If not, create the user.

### "Profile not found for user"
**Cause:** User exists in auth.users but not in profiles table
**Fix:** Run in SQL Editor:
```sql
-- Get the user ID first
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Create the profile (replace USER-ID with the ID from above)
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  'USER-ID-HERE',
  'your-email@example.com',
  'Your Name',
  'superadmin',
  NOW(),
  NOW()
);
```

### "TypeError: fetch failed"
**Cause:** Can't connect to Supabase
**Fix:**
1. Check Supabase project is active (not paused)
2. Verify URL and API key are correct
3. Check network connectivity
4. Try from different network
5. Check if `supabase.co` is accessible in your browser

### "Cannot read properties of null"
**Cause:** App is trying to access data that doesn't exist
**Fix:**
1. Make sure database tables exist
2. Run the schema migrations if you have them
3. Check browser console (F12) for specific errors

### "row level security policy violation"
**Cause:** Database tables have RLS enabled but no policies allow access
**Fix:** Run in SQL Editor:
```sql
-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE loads DISABLE ROW LEVEL SECURITY;
-- etc for other tables
```

---

## 🚀 Quick Start Checklist

- [ ] Supabase project is active and accessible
- [ ] Credentials in App.js match Supabase Dashboard
- [ ] Can run `node test-supabase-connection.js` successfully
- [ ] Created at least one super admin user
- [ ] User exists in BOTH `auth.users` AND `profiles` tables
- [ ] User's email is confirmed (`email_confirmed_at` is set)
- [ ] App starts with `npm start`
- [ ] Can log in with created credentials

---

## 📞 Still Having Issues?

If you're still stuck, gather this information:

1. **What's the exact error message?**
   - Check browser console (F12 → Console tab)
   - Screenshot the error

2. **What's the Supabase project status?**
   - Active/Paused/Not found?

3. **Can you access this URL?**
   - https://qwoabopuoihbawlwmgbf.supabase.co
   - What do you see?

4. **Test connection output:**
   - Run: `node test-supabase-connection.js`
   - Copy/paste the full output

5. **User creation results:**
   - Did you run `create-super-admin.sql`?
   - What was the result?

With this info, we can debug further!

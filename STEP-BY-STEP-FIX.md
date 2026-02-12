# 🚨 STEP-BY-STEP FIX FOR STACK DEPTH ERROR

## The Problem
Database triggers are STILL active and causing recursion when inserting bids.

## The Solution (5 Minutes)

---

## ✅ STEP 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your CarrierTracker project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

---

## ✅ STEP 2: Run the Fix SQL

1. Open the file: `FINAL-FIX-RUN-THIS.sql`
2. Copy the **ENTIRE** file contents
3. Paste into Supabase SQL Editor
4. Click **RUN** (or press Cmd+Enter / Ctrl+Enter)

### What You Should See:
```
✅ SUCCESS: All triggers removed!
✅ Function exists: simple_bulk_import_bids
✅ Function exists: update_rfq_stats_manual
🎯 FINAL FIX APPLIED!
```

---

## ✅ STEP 3: Verify Triggers Are Gone

Run this query in Supabase to double-check:

```sql
SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('rfq_bids', 'rfq_lanes');
```

**Expected Result:** Should return **0 rows** (no triggers!)

---

## ✅ STEP 4: Clear Browser Cache & Refresh

1. **Close** your CarrierTracker browser tab completely
2. **Clear cache:** 
   - Chrome/Edge: Ctrl+Shift+Delete → Clear last hour
   - Safari: Cmd+Option+E
   - Firefox: Ctrl+Shift+Delete → Clear last hour
3. **Reopen** CarrierTracker
4. **Hard refresh:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

## ✅ STEP 5: Try Import Again

1. Go to **RFQs** page
2. Open your RFQ
3. Click **"Import Carrier Bids from Excel"**
4. Select carrier
5. Upload Excel file
6. Click **Import**

### Should Now See:
```
✅ Imported 30 bids successfully!
```

---

## 🔍 If You STILL Get Errors

### Option A: Check Browser Console
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Try import again
4. **Screenshot the FULL error** and send it to me

### Option B: Verify SQL Ran Correctly
Run this in Supabase:
```sql
-- Should return 0
SELECT COUNT(*) FROM information_schema.triggers
WHERE event_object_table = 'rfq_bids';

-- Should return the functions
SELECT * FROM simple_bulk_import_bids(
  '00000000-0000-0000-0000-000000000000'::UUID,
  '00000000-0000-0000-0000-000000000000'::UUID,
  '[]'::JSONB
);
```

---

## 📋 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Function does not exist" | Re-run FINAL-FIX-RUN-THIS.sql |
| Still getting stack depth | Triggers still exist - check Step 3 |
| "Permission denied" | Make sure you're using Service Role in Supabase |
| Import seems stuck | Refresh page and try again |

---

## 🎯 What This Fix Does

### Before:
```
Insert Bid 1 → TRIGGER fires → Update lane → TRIGGER fires → RECURSION!
```

### After:
```
Insert Bid 1 → (no triggers) → Success!
Insert Bid 2 → (no triggers) → Success!
... all 30 bids ...
Manually update stats once → Done!
```

---

## ⚠️ IMPORTANT

After running this fix:
- Stats won't update automatically anymore
- The app calls `update_rfq_stats_manual()` after imports
- This is MUCH SAFER and faster!
- Manual bid adds still work fine

---

**File to run:** `FINAL-FIX-RUN-THIS.sql`
**Status:** Ready to use NOW!

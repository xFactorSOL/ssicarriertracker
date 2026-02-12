# 🚨 URGENT: Fix Bulk Import Error

## The Problem
Getting **"stack depth limit exceeded"** when importing carrier bids.

## The Solution
Database triggers are causing infinite recursion. We need to disable them and use a safer bulk import function.

---

## ⚡ Quick Fix (2 minutes)

### Step 1: Run the SQL Fix
1. Open **Supabase SQL Editor**
2. Copy and paste the entire contents of `fix-rfq-triggers-v2.sql`
3. Click **RUN**
4. Should see: `Triggers disabled and manual functions created!`

### Step 2: Try Import Again
1. Refresh your CarrierTracker page
2. Go to RFQ → Import Bids from Excel
3. Upload your carrier bid file
4. Should now import successfully! 🎉

---

## What Changed?

### Before (Broken)
```
Insert Bid 1 → Trigger fires → Updates lane → Updates RFQ → Calculates rankings
Insert Bid 2 → Trigger fires → Updates lane → Updates RFQ → Calculates rankings
... (30 bids) ...
❌ Stack depth limit exceeded!
```

### After (Fixed)
```
✅ Insert all 30 bids at once (no triggers)
✅ Update stats once at the end
✅ Fast, safe, no recursion!
```

---

## Technical Details

### What the SQL does:
1. **Drops problematic triggers** that caused recursion
2. **Creates manual update functions** instead
3. **Adds `bulk_import_carrier_bids()`** RPC function
4. **Updates only at the end** of bulk import

### What the frontend does:
- Changed from `.insert()` → `.rpc('bulk_import_carrier_bids')`
- All 30 bids imported in **one function call**
- Progress bar shows: 0% → 50% → 100%
- No batching, no delays, just works!

---

## Testing

After running the SQL:

```sql
-- Verify triggers are fixed
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'rfq_bids';

-- Should only see 'trigger_simple_bid_update' for manual single-bid adds
```

---

## If Something Goes Wrong

Manually refresh stats for an RFQ:
```sql
SELECT refresh_all_rfq_stats('your-rfq-id-here');
```

---

## Next Steps

1. ✅ Run `fix-rfq-triggers-v2.sql` in Supabase
2. ✅ Test importing carrier bids
3. ✅ Verify bid rankings and stats are correct
4. 🎯 Ready for Walmart RFQ!

---

**File Location:** `/carrier-tracker/fix-rfq-triggers-v2.sql`

**Run this BEFORE trying to import carrier bids again!**

# 🚀 RFQ Module - Quick Start Guide
## Get Running with Walmart RFQ in 30 Minutes

---

## ✅ What You Have Now

I've created a complete RFQ management system for you:

**Database:**
- ✅ `rfq-management-schema.sql` - Core RFQ tables (6 tables, 3 views, auto-calculations)
- ✅ `carrier-portal-auth-schema.sql` - Carrier login system
- ✅ `import-rfq-from-csv.sql` - Pre-filled Walmart RFQ (30 lanes ready to import)

**Documentation:**
- ✅ `RFQ-SOLUTION-DESIGN.md` - Complete system design
- ✅ `RFQ-IMPLEMENTATION-PLAN.md` - 4-week rollout plan
- ✅ `RFQ-COMPARISON-BEFORE-AFTER.md` - Spreadsheet vs TMS comparison

**Tools:**
- ✅ `csv-import-helper.js` - CSV parser for future RFQs

---

## 🎯 Your Goal: Test with Walmart RFQ

By end of this quick start, you'll have:
1. ✅ Database set up with RFQ tables
2. ✅ Walmart RFQ imported (30 lanes)
3. ✅ Carrier portal authentication ready
4. ✅ Foundation to build UI on

---

## 📋 Step-by-Step Setup (30 mins)

### Step 1: Set Up Database (10 mins)

#### 1.1 Open Supabase Dashboard
```
1. Go to: https://app.supabase.com/
2. Sign in
3. Select your project: qwoabopuoihbawlwmgbf
4. Make sure it's ACTIVE (not paused)
```

#### 1.2 Run Core RFQ Schema
```
1. Click "SQL Editor" in left sidebar
2. Click "+ New query"
3. Open: rfq-management-schema.sql
4. Copy ALL contents
5. Paste into Supabase SQL Editor
6. Click "Run" (or Ctrl+Enter)
7. Wait for success message
```

**Expected Result:**
```
✅ RFQ Management Schema created successfully!
You can now start building the UI for RFQ management
```

**Verify Tables Created:**
```sql
-- Run this to check:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'rfq%'
ORDER BY table_name;
```

You should see:
- rfq_requests
- rfq_lanes  
- rfq_carriers
- rfq_bids
- rfq_bid_attachments
- rfq_activity_log

#### 1.3 Run Carrier Portal Schema
```
1. Create another new query
2. Open: carrier-portal-auth-schema.sql
3. Copy ALL contents
4. Paste and Run
5. Wait for success
```

**Expected Result:**
```
✅ Carrier Portal Authentication schema created!
Carriers can now register and submit bids through portal
```

**Verify:**
```sql
-- Check carrier portal tables:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'carrier%'
ORDER BY table_name;
```

You should see:
- carrier_portal_sessions
- carrier_portal_activity
- email_templates

---

### Step 2: Import Walmart RFQ (5 mins)

#### 2.1 Create the RFQ
```sql
-- Run this in SQL Editor:
INSERT INTO rfq_requests (
  rfq_name,
  status,
  valid_from,
  valid_until,
  response_deadline,
  description,
  special_requirements,
  insurance_required,
  created_by
) VALUES (
  'Walmart & Seaboard Feb-Aug 2026 Lanes',
  'draft',
  '2026-02-01',
  '2026-08-31',
  '2026-01-31 12:00:00-05',
  'RFQ for Walmart and Seaboard Solutions lanes covering February 2026 through August 2026',
  '- Food grade and fumigated equipment required
- Equipment must be clean, no holes or dirt
- Temperature: 32F to -10F for refrigerated
- Heaviest months: October to February',
  100000.00,
  (SELECT id FROM profiles WHERE role = 'superadmin' LIMIT 1)
) RETURNING id, rfq_number;
```

**Copy the RFQ ID!** It will look like: `550e8400-e29b-41d4-a716-446655440000`

#### 2.2 Import All 30 Lanes
```
1. Open: import-rfq-from-csv.sql
2. Find "YOUR-RFQ-ID" (appears 30+ times)
3. Replace ALL instances with your actual RFQ ID from step 2.1
   (Use Find & Replace: Ctrl+F or Cmd+F)
4. Copy the entire file
5. Paste into SQL Editor
6. Run
```

**Verify Import:**
```sql
-- Check lanes were imported:
SELECT 
  COUNT(*) as total_lanes,
  SUM(annual_volume) as total_annual_volume
FROM rfq_lanes
WHERE rfq_id = 'YOUR-RFQ-ID'; -- Replace with your ID
```

Expected: 30 lanes, 280 total annual volume

---

### Step 3: Check Your RFQ (2 mins)

#### 3.1 View RFQ Details
```sql
SELECT * FROM vw_rfq_overview 
WHERE rfq_name LIKE '%Walmart%';
```

You should see:
- RFQ-2026-001
- Status: draft
- Total lanes: 30
- Deadline: Jan 31, 2026

#### 3.2 View Lanes
```sql
SELECT 
  lane_number,
  origin,
  destination,
  equipment_type,
  commodity,
  annual_volume,
  estimated_miles
FROM vw_rfq_lanes_with_stats
WHERE rfq_name LIKE '%Walmart%'
ORDER BY lane_number;
```

You should see all 30 lanes with:
- Lane 1: Wheeling, IL → Miami, FL (Reefer, Frozen Pizza, 2/yr, 1380 mi)
- Lane 8: Cambria, WI → Miami, FL (Dry, Canned Foods, 60/yr, 1450 mi) ← High volume!
- Lane 20: Carthage, MO → Miami, FL (Reefer, Mozzarella, 80/yr, 1200 mi) ← Highest!
- ...etc

---

### Step 4: Enable Carrier Portal Access (5 mins)

#### 4.1 Check Your Existing Carriers
```sql
SELECT id, name, mc_number, email, phone
FROM carriers
ORDER BY name
LIMIT 10;
```

#### 4.2 Enable Portal for Test Carriers

Pick 2-3 carriers you want to test with, then:

```sql
-- Example: Enable ABC Trucking for portal access
-- Replace 'ABC Trucking' with actual carrier name

-- First, set up portal credentials (use a test password initially)
UPDATE carriers
SET
  portal_enabled = TRUE,
  portal_email = 'test@abctrucking.com', -- Use their real email
  email_verified = TRUE, -- Skip verification for testing
  portal_created_at = NOW()
WHERE name = 'ABC Trucking';

-- Repeat for 2-3 more carriers
```

**Note:** We're skipping password hashing for now. You'll implement proper auth in UI.

#### 4.3 Assign Carriers to RFQ
```sql
-- Invite carriers to bid on Walmart RFQ
-- Replace carrier IDs and RFQ ID with your actual values

INSERT INTO rfq_carriers (rfq_id, carrier_id, status, contact_email)
SELECT 
  'YOUR-RFQ-ID', -- Replace with your RFQ ID
  id,
  'invited',
  portal_email
FROM carriers
WHERE portal_enabled = TRUE
LIMIT 3; -- Invite your test carriers
```

**Verify:**
```sql
SELECT 
  c.name as carrier_name,
  c.portal_email,
  rc.status,
  rc.invited_at
FROM rfq_carriers rc
JOIN carriers c ON rc.carrier_id = c.id
WHERE rc.rfq_id = 'YOUR-RFQ-ID';
```

---

### Step 5: Test Data - Add Sample Bids (5 mins)

Let's add some test bids so you can see the comparison view work:

```sql
-- Sample bid from Carrier 1 for Lane 1 (Wheeling → Miami)
INSERT INTO rfq_bids (
  rfq_id,
  rfq_lane_id,
  carrier_id,
  rate_per_load,
  rate_per_mile,
  transit_time_hours,
  max_weight,
  status
)
SELECT
  l.rfq_id,
  l.id,
  (SELECT id FROM carriers WHERE portal_enabled = TRUE LIMIT 1), -- First enabled carrier
  2400.00, -- Rate
  2.00, -- $/mile
  32, -- Hours
  45000, -- Max weight
  'submitted'
FROM rfq_lanes l
WHERE l.rfq_id = 'YOUR-RFQ-ID' AND l.lane_number = 1;

-- Sample bid from Carrier 2 for same lane (higher rate)
INSERT INTO rfq_bids (
  rfq_id,
  rfq_lane_id,
  carrier_id,
  rate_per_load,
  rate_per_mile,
  transit_time_hours,
  max_weight,
  status
)
SELECT
  l.rfq_id,
  l.id,
  (SELECT id FROM carriers WHERE portal_enabled = TRUE LIMIT 1 OFFSET 1), -- Second carrier
  2520.00, -- Higher rate
  2.10,
  30, -- Faster transit
  44000,
  'submitted'
FROM rfq_lanes l
WHERE l.rfq_id = 'YOUR-RFQ-ID' AND l.lane_number = 1;

-- Sample bid from Carrier 3 for same lane (middle rate)
INSERT INTO rfq_bids (
  rfq_id,
  rfq_lane_id,
  carrier_id,
  rate_per_load,
  rate_per_mile,
  transit_time_hours,
  max_weight,
  status
)
SELECT
  l.rfq_id,
  l.id,
  (SELECT id FROM carriers WHERE portal_enabled = TRUE LIMIT 1 OFFSET 2), -- Third carrier
  2460.00,
  2.05,
  34,
  45000,
  'submitted'
FROM rfq_lanes l
WHERE l.rfq_id = 'YOUR-RFQ-ID' AND l.lane_number = 1;
```

**View Bid Comparison:**
```sql
SELECT
  carrier_name,
  rate_per_load,
  rate_per_mile,
  transit_time_hours,
  rank,
  vs_average_pct,
  is_lowest_bid
FROM vw_bid_comparison
WHERE rfq_id = 'YOUR-RFQ-ID' AND lane_number = 1
ORDER BY rank;
```

You should see:
1. Carrier 1: $2,400 ($2.00/mi) - Rank 1 (LOWEST) ✅
2. Carrier 3: $2,460 ($2.05/mi) - Rank 2
3. Carrier 2: $2,520 ($2.10/mi) - Rank 3

**Magic!** Rankings and vs_average_pct calculated automatically! 🎉

---

## 🎉 Success! You're Ready!

### What You Have Now:

✅ **Database:** Complete RFQ schema with 9 tables
✅ **Walmart RFQ:** Imported with 30 lanes
✅ **Carriers:** 3 test carriers invited
✅ **Test Bids:** Sample bids for testing
✅ **Auto-calculations:** Rankings, $/mile, comparisons working

---

## 🚀 Next Steps: Build the UI

### Option 1: Start Small (Recommended)
Build just the **bid comparison view** first:
1. Create RFQ dashboard (list RFQs)
2. Create lane list view
3. Create bid comparison table
4. Add award button
5. Test with existing data

This lets you **USE** the system immediately while building the rest.

### Option 2: Full Build
Follow the 4-week implementation plan:
- Week 1: Admin UI for RFQ creation
- Week 2: CSV import + carrier selection
- Week 3: Carrier portal
- Week 4: Analytics + trends

---

## 📊 Database Quick Reference

### Key Tables:
```
rfq_requests         → Main RFQ info
rfq_lanes            → Individual lanes (routes)
rfq_carriers         → Invited carriers
rfq_bids             → Carrier bid submissions
rfq_bid_attachments  → Documents (rate confirmations)
rfq_activity_log     → Audit trail
```

### Key Views (Pre-built queries):
```
vw_rfq_overview           → RFQ summary with stats
vw_rfq_lanes_with_stats   → Lanes with bid counts
vw_bid_comparison         → Compare all bids side-by-side
vw_carrier_rfqs           → Carrier's assigned RFQs (for portal)
vw_carrier_bids           → Carrier's bids with status
```

### Key Functions:
```
generate_rfq_number()           → Auto RFQ-2026-001 numbering
calculate_bid_rankings()        → Rank bids automatically
update_lane_bid_stats()         → Update min/max/avg bids
register_carrier_portal()       → Register carrier for portal
create_carrier_session()        → Login carrier
```

---

## 🔍 Useful Queries

### See All RFQs:
```sql
SELECT * FROM vw_rfq_overview ORDER BY created_at DESC;
```

### See Walmart RFQ Lanes:
```sql
SELECT * FROM vw_rfq_lanes_with_stats 
WHERE rfq_name LIKE '%Walmart%'
ORDER BY lane_number;
```

### See All Bids for an RFQ:
```sql
SELECT * FROM vw_bid_comparison
WHERE rfq_id = 'YOUR-RFQ-ID'
ORDER BY lane_number, rank;
```

### See High Volume Lanes (>20/year):
```sql
SELECT 
  lane_number,
  origin,
  destination,
  commodity,
  annual_volume,
  bids_received
FROM vw_rfq_lanes_with_stats
WHERE rfq_name LIKE '%Walmart%'
  AND annual_volume > 20
ORDER BY annual_volume DESC;
```

### Award a Lane:
```sql
-- Award Lane 1 to lowest bidder
UPDATE rfq_lanes
SET
  status = 'awarded',
  awarded_carrier_id = (
    SELECT carrier_id 
    FROM rfq_bids 
    WHERE rfq_lane_id = (SELECT id FROM rfq_lanes WHERE rfq_id = 'YOUR-RFQ-ID' AND lane_number = 1)
    ORDER BY rate_per_load ASC 
    LIMIT 1
  ),
  awarded_bid_id = (
    SELECT id 
    FROM rfq_bids 
    WHERE rfq_lane_id = (SELECT id FROM rfq_lanes WHERE rfq_id = 'YOUR-RFQ-ID' AND lane_number = 1)
    ORDER BY rate_per_load ASC 
    LIMIT 1
  ),
  awarded_rate = (
    SELECT rate_per_load 
    FROM rfq_bids 
    WHERE rfq_lane_id = (SELECT id FROM rfq_lanes WHERE rfq_id = 'YOUR-RFQ-ID' AND lane_number = 1)
    ORDER BY rate_per_load ASC 
    LIMIT 1
  ),
  awarded_at = NOW(),
  awarded_by = (SELECT id FROM profiles WHERE role = 'superadmin' LIMIT 1)
WHERE rfq_id = 'YOUR-RFQ-ID' AND lane_number = 1;

-- Mark winning bid as awarded
UPDATE rfq_bids
SET status = 'awarded', awarded_at = NOW()
WHERE rfq_lane_id = (SELECT id FROM rfq_lanes WHERE rfq_id = 'YOUR-RFQ-ID' AND lane_number = 1)
  AND rank = 1;
```

---

## 🐛 Troubleshooting

### "Table already exists" error:
```sql
-- Drop and recreate (ONLY if needed):
DROP TABLE IF EXISTS rfq_activity_log CASCADE;
DROP TABLE IF EXISTS rfq_bid_attachments CASCADE;
DROP TABLE IF EXISTS rfq_bids CASCADE;
DROP TABLE IF EXISTS rfq_carriers CASCADE;
DROP TABLE IF EXISTS rfq_lanes CASCADE;
DROP TABLE IF EXISTS rfq_requests CASCADE;

-- Then run the schema again
```

### "Foreign key violation" error:
Make sure you're using correct IDs:
```sql
-- Check RFQ exists:
SELECT id, rfq_number FROM rfq_requests;

-- Check carrier exists:
SELECT id, name FROM carriers WHERE portal_enabled = TRUE;

-- Check lane exists:
SELECT id, lane_number FROM rfq_lanes WHERE rfq_id = 'YOUR-RFQ-ID';
```

### Can't find RFQ ID:
```sql
-- Get latest RFQ:
SELECT id, rfq_number, rfq_name 
FROM rfq_requests 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 📞 What's Next?

**Immediate (This Week):**
1. ✅ Database set up (you just did this!)
2. [ ] Build basic RFQ dashboard in React
3. [ ] Build bid comparison view
4. [ ] Test with real Walmart data

**Near Term (2-3 Weeks):**
1. [ ] Build carrier portal login
2. [ ] Build carrier bid submission form
3. [ ] Add email notifications
4. [ ] Invite real carriers to test

**Future (Month 2+):**
1. [ ] Historical trends analytics
2. [ ] Advanced filters and search
3. [ ] Mobile-responsive design
4. [ ] Integration with loads table

---

## 🎯 Your Walmart RFQ is Ready!

You now have:
- ✅ Complete database schema
- ✅ 30 lanes imported
- ✅ Test carriers invited
- ✅ Sample bids for testing
- ✅ Auto-calculations working

**Start building the UI and test with real bids!**

Questions? Review the other docs:
- `RFQ-SOLUTION-DESIGN.md` - Full system design
- `RFQ-IMPLEMENTATION-PLAN.md` - Week-by-week plan
- `RFQ-COMPARISON-BEFORE-AFTER.md` - Time/cost savings

**Let's revolutionize your RFQ process! 🚀**

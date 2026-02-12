# 🚀 RFQ Module - Get It Running NOW!

## ✅ What I Just Built:

The RFQ module is now **integrated into your CarrierTracker app**! I've added:

1. ✅ New "RFQs" menu item (visible to managers/admins)
2. ✅ RFQ dashboard with stats
3. ✅ Create RFQ form
4. ✅ **CSV Import feature** for importing your Walmart lanes
5. ✅ Lane management view
6. ✅ All integrated into your existing UI

---

## 🎯 2-Step Setup (10 minutes)

### Step 1: Run Database Schemas (5 mins)

1. Go to **Supabase Dashboard**: https://app.supabase.com/
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"+ New query"**

#### Run Schema 1:
```
1. Open file: rfq-management-schema.sql
2. Copy ALL contents
3. Paste into SQL Editor
4. Click "Run"
5. Wait for success ✅
```

#### Run Schema 2:
```
1. Create another new query
2. Open file: carrier-portal-auth-schema.sql
3. Copy ALL contents
4. Paste and Run
5. Wait for success ✅
```

### Step 2: Start Your App (2 mins)

```bash
cd /Users/fbetancourtjr/CarrierTracker/carrier-tracker
npm start
```

**That's it!** Your app will open at http://localhost:3000

---

## 🎉 What You Can Do NOW:

### 1. See the RFQ Module:
- Log into CarrierTracker
- Click **"RFQs"** in the sidebar (below Facilities)
- You'll see the RFQ dashboard

### 2. Create Your First RFQ:
- Click **"+ New RFQ"** button
- Fill in the form:
  - **Name:** "Walmart Q1 2026 Lanes"
  - **Valid From:** 2026-02-01
  - **Valid Until:** 2026-08-31
  - **Deadline:** 2026-01-31 12:00 PM
  - **Insurance:** $100,000
  - **Special Requirements:** (paste your requirements)
- Click **"Create RFQ"**

### 3. Import Your Walmart Lanes (CSV):
- Click on the RFQ you just created
- Click **"Import Lanes (CSV)"**
- Upload your Walmart spreadsheet (export as CSV first)
- Click **"Parse CSV"** to preview
- Click **"Import X Lanes"**
- **Done!** All 30 lanes imported

---

## 📊 Your Walmart Spreadsheet CSV Format:

Your spreadsheet should export to CSV with these columns:
```
Origin City, Origin State, Destination City, Destination State, Equipment Type, Commodity, Annual Volume, Service Type
```

Example:
```
Wheeling,IL,Miami,FL,53' Trailer Reefer,Frozen Pizza,2,Single -Interstate Trucking
Perryville,MO,Miami,FL,53' Trailer Dry,Cereal,2,Single -Interstate Trucking
...
```

**Note:** The CSV parser expects data starting from row 5 (skips 4 header rows like your Google Sheet)

---

## 🔍 What You'll See:

### RFQ Dashboard:
```
┌─────────────────────────────────────────┐
│  RFQ Management         [+ New RFQ]     │
├─────────────────────────────────────────┤
│  📊 Quick Stats                          │
│  Total: 1 │ Active: 1 │ Bids: 0         │
├─────────────────────────────────────────┤
│  🔍 Search RFQs...                       │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │ Walmart Q1 2026 Lanes       DRAFT │  │
│  │ RFQ #RFQ-2026-001                 │  │
│  │ 30 Lanes │ 0 Responses │ Jan 31   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### RFQ Details (after clicking):
```
┌─────────────────────────────────────────┐
│  ← Walmart Q1 2026  [Import Lanes CSV]  │
├─────────────────────────────────────────┤
│  Stats: 30 Lanes │ 0 Bids │ 0 Awarded   │
├─────────────────────────────────────────┤
│  Lanes (30):                             │
│  ┌───────────────────────────────────┐  │
│  │ #1  Wheeling, IL → Miami, FL      │  │
│  │     53' Reefer • Frozen Pizza     │  │
│  │     Volume: 2/yr  Miles: 1380     │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ #2  Perryville, MO → Miami, FL    │  │
│  │     53' Dry • Cereal              │  │
│  │     Volume: 2/yr  Miles: 1150     │  │
│  └───────────────────────────────────┘  │
│  ... (28 more lanes)                    │
└─────────────────────────────────────────┘
```

---

## 🎯 Quick Test Checklist:

- [ ] Database schemas run successfully
- [ ] App starts without errors
- [ ] "RFQs" appears in sidebar menu
- [ ] Can create new RFQ
- [ ] Can view RFQ details
- [ ] Can import lanes from CSV
- [ ] Lanes appear in the list

---

## 🐛 Troubleshooting:

### "RFQs menu not showing"
- Make sure you're logged in as manager/superadmin
- Check browser console for errors (F12)

### "Cannot read from vw_rfq_overview"
- Make sure you ran BOTH database schemas
- Refresh Supabase schema cache

### "CSV import not working"
- Check CSV format (should match expected columns)
- Try with just first 5 rows to test
- Check browser console for errors

### "No lanes showing after import"
- Check Supabase Table Editor → rfq_lanes table
- Make sure rfq_id matches your RFQ
- Try refreshing the page

---

## 📝 Next Steps After Setup:

Once you have lanes imported:

1. **Add Carriers to RFQ** (coming in next update)
   - Select carriers to invite
   - Send email notifications

2. **Receive Bids** (manual entry for now)
   - Enter carrier quotes
   - System automatically ranks them

3. **Compare Bids**
   - Side-by-side comparison
   - Automatic $/mile calculations
   - Award lanes

4. **Carrier Portal** (Week 3)
   - Carriers log in
   - Submit bids directly
   - Track award status

---

## 💡 Pro Tips:

1. **Export Google Sheet to CSV:**
   - Open your Walmart spreadsheet
   - File → Download → CSV
   - Save as `walmart-lanes.csv`

2. **Test with Small Dataset First:**
   - Copy first 5 lanes to a test CSV
   - Import those first
   - Once it works, import all 30

3. **Backup Your Data:**
   - Supabase auto-backups
   - But good practice to export important data

---

## 🚨 Important Notes:

1. **Database MUST be set up first**
   - Run both SQL schemas before starting app
   - App will error if tables don't exist

2. **Currently Admin-Only**
   - Only managers/admins see RFQs menu
   - Carrier portal coming in Week 3

3. **CSV Format Matters**
   - Make sure columns match expected format
   - Parser expects specific order

---

## 🎊 You're Ready!

1. Run database schemas ✅
2. Start app ✅
3. Create RFQ ✅
4. Import Walmart lanes ✅
5. Start getting bids! 🚀

**Questions?** Check browser console (F12) for errors.

**Let's test it now! 🎯**

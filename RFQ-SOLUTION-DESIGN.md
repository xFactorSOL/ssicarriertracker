# RFQ (Request for Quote) Management Solution
## For CarrierTracker TMS - Walmart & Customer Bids

---

## 📊 Current State Analysis

### What You Have (Spreadsheet):
- **30 lanes** from various origins to destinations (mostly to Miami, FL)
- Equipment types: 53' Trailer Dry, 53' Trailer Reefer
- Commodities: Food products (frozen pizza, cereal, snacks, etc.)
- Annual volume projections per lane
- Requirements: Food grade, fumigated, temperature controlled
- 6-month rate validity period
- Need to collect: Rate, Transit Time, Max Weight, Insurance Coverage

### Pain Points:
1. ❌ Manual spreadsheet management - error prone
2. ❌ Can't track multiple carrier responses efficiently
3. ❌ No side-by-side comparison of bids
4. ❌ No history/audit trail of previous RFQs
5. ❌ Can't analyze pricing trends over time
6. ❌ Not integrated with your load management
7. ❌ Difficult to award and convert to loads
8. ❌ No automated notifications to carriers
9. ❌ No deadline tracking
10. ❌ Manual rate calculations ($/mile, margins)

---

## 🎯 Proposed Solution: RFQ Module for CarrierTracker

### Module Overview:
Add a new **"RFQ Management"** section to your TMS with these capabilities:

1. **Create RFQs** - Define lanes, requirements, and deadlines
2. **Send to Carriers** - Email/notify selected carriers
3. **Receive Bids** - Carriers submit quotes (portal or upload)
4. **Compare Bids** - Side-by-side analysis with scoring
5. **Award Lanes** - Select winners and notify
6. **Convert to Contracts** - Turn awarded bids into rate agreements
7. **Analytics** - Track pricing trends, carrier performance

---

## 📐 Database Schema Design

### 1. RFQ Requests Table
```sql
CREATE TABLE rfq_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic Info
  rfq_number TEXT UNIQUE NOT NULL, -- e.g., "RFQ-2026-001"
  rfq_name TEXT NOT NULL, -- e.g., "Walmart Q1 2026 Lanes"
  customer_id UUID REFERENCES customers(id), -- Optional: link to customer
  
  -- Status & Dates
  status TEXT CHECK (status IN ('draft', 'sent', 'in_review', 'awarded', 'closed', 'cancelled')) DEFAULT 'draft',
  valid_from DATE NOT NULL, -- Rate start date
  valid_until DATE NOT NULL, -- Rate end date
  response_deadline TIMESTAMPTZ NOT NULL, -- When carriers must respond by
  
  -- Requirements
  description TEXT,
  special_requirements TEXT, -- e.g., "Food grade, fumigated equipment"
  insurance_required DECIMAL(12,2), -- e.g., $100,000
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Stats (calculated)
  total_lanes INT DEFAULT 0,
  total_responses INT DEFAULT 0,
  total_awarded INT DEFAULT 0
);
```

### 2. RFQ Lanes Table (Individual Routes)
```sql
CREATE TABLE rfq_lanes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID REFERENCES rfq_requests(id) ON DELETE CASCADE,
  
  -- Lane Details
  lane_number INT NOT NULL, -- 1, 2, 3... for display order
  
  -- Origin
  origin_city TEXT NOT NULL,
  origin_state TEXT NOT NULL,
  origin_zip TEXT,
  origin_facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL, -- Optional link
  
  -- Destination
  destination_city TEXT NOT NULL,
  destination_state TEXT NOT NULL,
  destination_zip TEXT,
  destination_facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  
  -- Equipment & Commodity
  equipment_type TEXT NOT NULL, -- "53' Trailer Dry", "53' Trailer Reefer"
  commodity TEXT NOT NULL,
  weight_min INT, -- lbs
  weight_max INT, -- lbs
  
  -- Volume & Service
  annual_volume INT, -- Projected shipments per year
  service_type TEXT DEFAULT 'Full Truckload', -- FTL, LTL, Reefer, etc.
  
  -- Special Requirements
  temperature_min INT, -- Fahrenheit (for reefer)
  temperature_max INT,
  special_instructions TEXT,
  
  -- Calculated
  estimated_miles INT, -- Can calculate from zip codes
  
  -- Award Status
  status TEXT CHECK (status IN ('open', 'awarded', 'no_bid', 'cancelled')) DEFAULT 'open',
  awarded_carrier_id UUID REFERENCES carriers(id) ON DELETE SET NULL,
  awarded_bid_id UUID REFERENCES rfq_bids(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ,
  awarded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. RFQ Carriers (Who We're Sending To)
```sql
CREATE TABLE rfq_carriers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID REFERENCES rfq_requests(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE,
  
  -- Invitation Status
  status TEXT CHECK (status IN ('invited', 'sent', 'viewed', 'responded', 'declined', 'no_response')) DEFAULT 'invited',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ, -- When email was sent
  viewed_at TIMESTAMPTZ, -- When they opened the RFQ
  responded_at TIMESTAMPTZ,
  
  -- Contact
  contact_email TEXT,
  contact_name TEXT,
  
  -- Notes
  notes TEXT,
  
  UNIQUE(rfq_id, carrier_id)
);
```

### 4. RFQ Bids (Carrier Responses)
```sql
CREATE TABLE rfq_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_lane_id UUID REFERENCES rfq_lanes(id) ON DELETE CASCADE,
  rfq_id UUID REFERENCES rfq_requests(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE,
  
  -- Bid Details
  rate_per_load DECIMAL(10,2) NOT NULL, -- What carrier quoted
  rate_per_mile DECIMAL(6,2), -- Calculated or provided
  transit_time_hours INT, -- Expected transit time
  min_weight INT, -- Minimum weight they'll accept
  max_weight INT, -- Maximum weight capacity
  
  -- Additional Terms
  fuel_surcharge_type TEXT CHECK (fuel_surcharge_type IN ('included', 'variable', 'fixed_percentage')),
  fuel_surcharge_rate DECIMAL(5,2), -- % or fixed amount
  accessorial_fees TEXT, -- JSON or text of additional fees
  
  -- Status
  status TEXT CHECK (status IN ('submitted', 'under_review', 'awarded', 'rejected', 'withdrawn')) DEFAULT 'submitted',
  
  -- Scoring (for comparison)
  score DECIMAL(5,2), -- Calculated score 0-100
  rank INT, -- 1st, 2nd, 3rd place for this lane
  
  -- Notes
  carrier_notes TEXT, -- Carrier's comments
  internal_notes TEXT, -- Your internal notes about this bid
  
  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- If entered by your team
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(rfq_lane_id, carrier_id) -- One bid per carrier per lane
);
```

### 5. RFQ Bid Attachments (Rate Confirmations, Documents)
```sql
CREATE TABLE rfq_bid_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_id UUID REFERENCES rfq_bids(id) ON DELETE CASCADE,
  
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase storage path
  file_type TEXT, -- 'rate_confirmation', 'insurance', 'other'
  file_size INT,
  mime_type TEXT,
  
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
```

### 6. RFQ Activity Log (Audit Trail)
```sql
CREATE TABLE rfq_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID REFERENCES rfq_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  action TEXT NOT NULL, -- 'created', 'sent', 'bid_received', 'awarded', 'cancelled'
  description TEXT,
  metadata JSONB, -- Store additional data
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 UI/UX Design Concepts

### Main RFQ Dashboard
```
┌──────────────────────────────────────────────────────────────┐
│  RFQ Management                                    [+ New RFQ]│
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  📊 Quick Stats                                                │
│  ┌────────────┬────────────┬────────────┬────────────┐       │
│  │ Active RFQs│  Pending   │   Awarded  │ Total Lanes│       │
│  │     3      │ Responses  │   Lanes    │    45      │       │
│  │            │     12     │     18     │            │       │
│  └────────────┴────────────┴────────────┴────────────┘       │
│                                                                │
│  🔍 Filter: [All] [Draft] [Sent] [In Review] [Awarded]       │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ RFQ-2026-001 - Walmart Q1 2026 Lanes                 │    │
│  │ Status: In Review │ Deadline: Feb 20, 2026           │    │
│  │ 30 Lanes │ 8 Carriers │ 142 Bids Received            │    │
│  │ [View Details] [Compare Bids] [Award Lanes]          │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ RFQ-2026-002 - Seaboard Feb-Aug 2026                 │    │
│  │ Status: Draft │ Deadline: Not Set                     │    │
│  │ 15 Lanes │ 0 Carriers │ 0 Bids                        │    │
│  │ [Edit] [Send to Carriers]                             │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### Create/Edit RFQ Screen
```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to RFQs          Create New RFQ                       │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Step 1: Basic Information                                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ RFQ Name: [Walmart Q2 2026 Lanes________________]     │  │
│  │                                                        │  │
│  │ Customer: [Select Customer ▼] (Optional)              │  │
│  │                                                        │  │
│  │ Valid Period:                                          │  │
│  │   From: [02/01/2026] To: [08/31/2026]                 │  │
│  │                                                        │  │
│  │ Response Deadline: [01/31/2026] [12:00 PM EST ▼]      │  │
│  │                                                        │  │
│  │ Cargo Insurance Required: [$100,000_____]             │  │
│  │                                                        │  │
│  │ Special Requirements:                                  │  │
│  │ [✓] Food Grade Equipment                              │  │
│  │ [✓] Fumigated                                          │  │
│  │ [✓] Temperature Controlled (Reefer)                   │  │
│  │ [ ] Hazmat Certified                                   │  │
│  │                                                        │  │
│  │ Description:                                           │  │
│  │ ┌──────────────────────────────────────────────────┐ │  │
│  │ │ Equipment must be clean, no holes, washed...     │ │  │
│  │ │ Temperature between 32F to -10F for reefer...    │ │  │
│  │ └──────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  [Next: Add Lanes →]                                          │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### Add Lanes Screen
```
┌──────────────────────────────────────────────────────────────┐
│  Step 2: Add Lanes          [Import from CSV] [Use Template] │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  30 Lanes Added                            [+ Add Lane]       │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Lane 1  │  Wheeling, IL → Miami, FL                   │    │
│  │ 53' Reefer │ Frozen Pizza │ 2 loads/year │ 1,200 mi   │    │
│  │ [Edit] [Delete] [Duplicate]                            │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Lane 2  │  Perryville, MO → Miami, FL                 │    │
│  │ 53' Dry │ Cereal │ 2 loads/year │ 1,100 mi             │    │
│  │ [Edit] [Delete] [Duplicate]                            │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  ... (28 more lanes)                                          │
│                                                                │
│  [← Back] [Next: Select Carriers →]                          │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### Select Carriers Screen
```
┌──────────────────────────────────────────────────────────────┐
│  Step 3: Select Carriers                                      │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Select carriers to send this RFQ to:                         │
│                                                                │
│  🔍 Filter: [All Carriers ▼] [Has Reefer] [Miami Coverage]   │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ [✓] ABC Trucking                                      │    │
│  │     MC: 123456 │ Safety: Satisfactory                 │    │
│  │     Contact: john@abc.com │ 50 trucks                 │    │
│  │     Past Performance: 98% on-time │ $2.15/mi avg      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ [ ] XYZ Transport                                      │    │
│  │     MC: 789012 │ Safety: Satisfactory                 │    │
│  │     Contact: mike@xyz.com │ 120 trucks                │    │
│  │     Past Performance: 95% on-time │ $2.28/mi avg      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  8 carriers selected                                          │
│                                                                │
│  [← Back] [Review & Send →]                                  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### Bid Comparison Screen (The Money Maker!)
```
┌──────────────────────────────────────────────────────────────┐
│  RFQ-2026-001 - Bid Comparison                     [Export]  │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Filter by Lane: [All Lanes ▼] | Sort by: [Lowest Rate ▼]   │
│                                                                │
│  Lane 1: Wheeling, IL → Miami, FL (53' Reefer, Frozen Pizza) │
│  1,200 miles │ 2 loads/year │ 5 bids received                │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         Carrier    │  Rate   │ $/Mile │ Transit │ Score │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ ⭐ ABC Trucking   │ $2,400  │ $2.00  │ 32 hrs  │  95   │  │
│  │    [Award] [View Details] [Message]                    │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │   XYZ Transport   │ $2,520  │ $2.10  │ 30 hrs  │  92   │  │
│  │    [Award] [View Details] [Message]                    │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │   Quick Haul LLC  │ $2,640  │ $2.20  │ 36 hrs  │  88   │  │
│  │    [Award] [View Details] [Message]                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  💡 Analysis:                                                 │
│     • Lowest bid: $2,400 ($2.00/mi) - ABC Trucking            │
│     • Average bid: $2,520 ($2.10/mi)                          │
│     • Highest bid: $2,640 ($2.20/mi)                          │
│     • Savings: $120/load by choosing ABC (5% below avg)       │
│                                                                │
│  [Previous Lane] [Next Lane] [Award All Lowest Bids]         │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### Awarded Summary Screen
```
┌──────────────────────────────────────────────────────────────┐
│  RFQ-2026-001 - Award Summary                                 │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Status: Awarded │ Completed: Feb 15, 2026                    │
│                                                                │
│  📊 Results:                                                   │
│  • 30 Lanes total                                             │
│  • 28 Lanes awarded (93%)                                     │
│  • 2 Lanes no bid / cancelled                                 │
│  • 5 Carriers awarded                                         │
│  • Total estimated annual value: $450,000                     │
│  • Average rate: $2.15/mile                                   │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ABC Trucking - 12 lanes awarded                        │  │
│  │ Est. Annual: $180,000 │ Avg: $2.00/mi                  │  │
│  │ [View Contract] [Export Lanes]                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ XYZ Transport - 8 lanes awarded                        │  │
│  │ Est. Annual: $120,000 │ Avg: $2.12/mi                  │  │
│  │ [View Contract] [Export Lanes]                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  [Notify All Carriers] [Generate Report] [Close RFQ]         │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Features & Functionality

### Phase 1 - MVP (Core Features)
1. ✅ Create RFQ with basic info
2. ✅ Add lanes manually (one at a time)
3. ✅ Select carriers from your carrier database
4. ✅ Manual bid entry (you enter carrier quotes)
5. ✅ Simple bid comparison table
6. ✅ Award lanes to carriers
7. ✅ Basic reporting (awarded summary)
8. ✅ Activity log / audit trail

### Phase 2 - Enhanced (Nice to Have)
9. 📤 Email notifications to carriers
10. 📊 Advanced bid comparison with scoring algorithm
11. 📁 Import lanes from CSV/Excel
12. 📝 Save lane templates (common routes)
13. 📈 Analytics dashboard (pricing trends over time)
14. 🔗 Integration with loads table (auto-create loads from awarded lanes)
15. 💬 In-app messaging with carriers
16. 📄 Document attachments (rate confirmations, insurance certs)
17. 🎯 Duplicate RFQ functionality (reuse previous RFQs)
18. 🔔 Deadline reminders and alerts

### Phase 3 - Advanced (Future)
19. 🌐 Carrier portal (carriers can log in and submit bids directly)
20. 🤖 Auto-scoring algorithm based on:
    - Price competitiveness
    - Carrier safety rating
    - Past performance
    - Transit time
    - Equipment availability
21. 📊 Predictive analytics (suggest optimal rates based on market data)
22. 🗺️ Route optimization (suggest better lanes)
23. 💰 Automated margin calculations
24. 📱 Mobile app for carriers
25. 🔌 API for carrier integration
26. 📧 Automated follow-ups for non-responsive carriers

---

## 💡 Key Improvements Over Spreadsheet

| Feature | Spreadsheet | RFQ Module |
|---------|-------------|------------|
| Multiple carrier responses | ❌ Hard to track | ✅ Each carrier's bid stored separately |
| Bid comparison | ❌ Manual | ✅ Side-by-side comparison with auto-calculations |
| Historical data | ❌ Lost over time | ✅ Full history and trends |
| Audit trail | ❌ None | ✅ Complete activity log |
| Notifications | ❌ Manual emails | ✅ Automated emails & reminders |
| Award tracking | ❌ Manual | ✅ One-click award with notifications |
| Lane templates | ❌ Copy/paste | ✅ Reusable templates |
| Analytics | ❌ None | ✅ Pricing trends, carrier performance |
| Integration | ❌ None | ✅ Converts to loads automatically |
| Collaboration | ❌ One person at a time | ✅ Multi-user with roles |

---

## 📈 ROI & Benefits

### Time Savings:
- **Before:** 4-6 hours to manually manage RFQ in spreadsheet, email carriers, track responses
- **After:** 30-60 minutes to create RFQ and review bids
- **Savings:** 70-80% time reduction

### Cost Savings:
- Better bid comparison = choose optimal carriers
- Historical data = negotiate better rates
- Example: 5% savings on $500K annual freight = **$25,000 saved**

### Risk Reduction:
- Audit trail for compliance
- Carrier safety data integration
- Insurance verification
- Reduced human error

### Growth Enablement:
- Scale to handle 10x more RFQs
- Faster turnaround = more business
- Better carrier relationships

---

## 🛠️ Technical Implementation Notes

### Integration Points:
1. **Carriers Table** - Link to existing carrier data
2. **Facilities Table** - Use for origin/destination
3. **Customers Table** - Link RFQs to customers
4. **Loads Table** - Convert awarded bids to future loads

### API Endpoints Needed:
- `POST /api/rfq/create` - Create new RFQ
- `POST /api/rfq/{id}/lanes` - Add lanes
- `POST /api/rfq/{id}/carriers` - Add carriers
- `POST /api/rfq/{id}/bids` - Submit bid
- `GET /api/rfq/{id}/compare` - Get bid comparison data
- `POST /api/rfq/{id}/award` - Award lanes
- `GET /api/rfq/analytics` - Get historical data

### Email Templates Needed:
1. RFQ invitation to carriers
2. Bid received confirmation
3. Award notification (winners)
4. Decline notification (losers)
5. Deadline reminder (24 hours before)

### Calculations:
```javascript
// Rate per mile
ratePerMile = totalRate / estimatedMiles;

// Score calculation (example)
score = 
  (priceWeight * priceScore) +
  (transitWeight * transitScore) +
  (safetyWeight * safetyScore) +
  (performanceWeight * performanceScore);

// Annual value
annualValue = ratePerLoad * annualVolume;
```

---

## 🎯 Next Steps

### Option A: Start with MVP (Recommended)
1. Create database tables (run SQL)
2. Build basic UI screens (create, list, view)
3. Add manual bid entry
4. Build comparison view
5. Add award functionality
6. Test with one real RFQ

### Option B: Import Current RFQ
1. Create database tables
2. Build CSV import feature
3. Import your Walmart spreadsheet
4. Test with current data
5. Get carriers to submit bids
6. Use for real award decision

### Option C: Full Build
1. Build entire Phase 1 + Phase 2
2. Carrier portal
3. Email automation
4. Advanced analytics
5. Launch to all customers

---

## 📊 Sample Data Model (Your Walmart RFQ)

Would look like this in the system:

**RFQ Request:**
- ID: `rfq-2026-001`
- Name: "Walmart Q1 2026 Lanes - Seaboard Solutions"
- Status: "In Review"
- Valid: 02/01/2026 - 08/31/2027
- Deadline: 01/16/2026 12:00 PM EST
- Insurance: $100,000
- Requirements: "Food grade, fumigated, temperature 32F to -10F"

**RFQ Lanes:** (30 lanes)
1. Wheeling, IL → Miami, FL | 53' Reefer | Frozen Pizza | 2/year
2. Perryville, MO → Miami, FL | 53' Dry | Cereal | 2/year
3. ... (28 more)

**RFQ Carriers:** (You'd select your carriers)
- ABC Trucking
- XYZ Transport
- Quick Haul LLC
- ... etc

**Bids:** (Carriers respond)
- ABC: Lane 1 = $2,400, 32 hrs, 45,000 lbs max
- XYZ: Lane 1 = $2,520, 30 hrs, 44,000 lbs max
- ... etc

---

## 💭 Questions to Consider

1. **Do you want carriers to submit bids themselves?** (Portal) or **Do you collect via email/phone and enter manually?**

2. **How often do you run RFQs?** Monthly? Quarterly? Per customer?

3. **Do you want to auto-generate loads from awarded lanes?** Or keep them separate?

4. **Should RFQ data affect your carrier scoring/ranking system?** (Price competitiveness)

5. **Do you need approval workflows?** (Manager approves before awarding)

6. **Should this integrate with your accounting?** (Invoice against awarded rates)

---

## 🎉 Summary

This RFQ module would transform your bidding process from a manual spreadsheet nightmare into a streamlined, integrated system that:

✅ Saves you hours per RFQ
✅ Helps you get better rates
✅ Tracks everything for compliance
✅ Integrates with your existing TMS
✅ Scales as you grow
✅ Provides valuable analytics

**Ready to build this?** Let's start with the database schema and MVP features!

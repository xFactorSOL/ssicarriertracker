# RFQ Module - Implementation Plan
## Test with Walmart RFQ → Full Rollout

---

## 🎯 Project Goals

1. ✅ Replace spreadsheet-based RFQ process
2. ✅ **Carrier portal** for self-service bid submission
3. ✅ **Auto bid comparison** with rankings
4. ✅ **Historical pricing trends** analytics
5. ✅ **CSV import** for quick lane setup
6. ✅ Integrated as separate module in main TMS dashboard
7. ✅ Test with current Walmart RFQ (30 lanes)

---

## 📅 Timeline: ASAP Launch (4 weeks)

### Week 1: Database + Core Backend (Days 1-7)
**Goal:** Foundation ready for testing

**Tasks:**
- [x] Database schema created (`rfq-management-schema.sql`)
- [ ] Run schema in Supabase (you can do this now!)
- [ ] Create API endpoints:
  - `POST /api/rfq/create` - Create RFQ
  - `POST /api/rfq/:id/lanes` - Add/import lanes
  - `GET /api/rfq/:id` - Get RFQ details
  - `POST /api/rfq/:id/carriers` - Invite carriers
  - `GET /api/rfq/:id/compare` - Bid comparison data
- [ ] CSV import parser (parse lane spreadsheets)
- [ ] Email notification system (carrier invites)

**Deliverable:** Backend can handle RFQ creation and bid storage

---

### Week 2: Admin UI + Import Walmart RFQ (Days 8-14)
**Goal:** You can create and manage RFQs

**Admin Features:**
- [ ] RFQ Dashboard (list all RFQs)
- [ ] Create RFQ form
- [ ] Import lanes from CSV
- [ ] Select carriers to invite
- [ ] View RFQ details
- [ ] Bid comparison view (table format)
- [ ] Award lanes functionality

**Test:**
- [ ] Import your Walmart RFQ (30 lanes)
- [ ] Invite 2-3 test carriers
- [ ] Verify email notifications work

**Deliverable:** You can create Walmart RFQ and invite carriers

---

### Week 3: Carrier Portal (Days 15-21)
**Goal:** Carriers can submit bids

**Carrier Portal Features:**
- [ ] Carrier registration/login (separate from admin)
- [ ] View assigned RFQs
- [ ] See RFQ requirements and deadlines
- [ ] Submit bids (rate, transit time, etc.)
- [ ] Edit submitted bids (before deadline)
- [ ] View award status
- [ ] Upload documents (rate confirmations)

**Security:**
- [ ] Carrier-specific authentication
- [ ] Carriers only see their assigned RFQs
- [ ] Can't see other carrier bids
- [ ] Email verification for new carriers

**Test:**
- [ ] Give carrier login to 2-3 real carriers
- [ ] They submit test bids
- [ ] You review in admin dashboard

**Deliverable:** Carriers can submit bids independently

---

### Week 4: Comparison + Analytics (Days 22-28)
**Goal:** Make award decisions with data

**Features:**
- [ ] Enhanced bid comparison:
  - Side-by-side all bids per lane
  - Color coding (green=best, red=worst)
  - Automatic rankings
  - $/mile calculations
  - Savings analysis
- [ ] Historical pricing trends:
  - Chart: Rate trends by lane over time
  - Average $/mile by origin-destination pair
  - Carrier price competitiveness
  - Market rate benchmarks
- [ ] Award workflow:
  - One-click award
  - Bulk award (award all lowest bids)
  - Auto-notify carriers (winners + losers)
  - Generate award summary report

**Test:**
- [ ] Get real bids from carriers
- [ ] Compare using new UI
- [ ] Make award decisions
- [ ] Complete Walmart RFQ cycle

**Deliverable:** Full RFQ cycle complete with real data

---

## 🏗️ Technical Architecture

### Database (Supabase)
```
rfq_requests (main RFQ)
├── rfq_lanes (30 lanes for Walmart)
├── rfq_carriers (invited carriers)
├── rfq_bids (carrier submissions)
├── rfq_bid_attachments (rate confirmations)
└── rfq_activity_log (audit trail)
```

### Frontend (React Components)
```
src/
├── components/
│   ├── RFQ/
│   │   ├── RFQDashboard.jsx       (list all RFQs)
│   │   ├── CreateRFQ.jsx          (create new RFQ)
│   │   ├── RFQDetails.jsx         (view/edit RFQ)
│   │   ├── LaneManager.jsx        (add/import lanes)
│   │   ├── CarrierSelector.jsx    (invite carriers)
│   │   ├── BidComparison.jsx      (compare bids)
│   │   ├── AwardDashboard.jsx     (award lanes)
│   │   └── HistoricalTrends.jsx   (analytics)
│   └── CarrierPortal/
│       ├── CarrierLogin.jsx       (carrier auth)
│       ├── CarrierRFQs.jsx        (view assigned RFQs)
│       ├── SubmitBid.jsx          (submit bid form)
│       └── BidStatus.jsx          (track awards)
```

### API Endpoints
```
Admin API:
  POST   /api/rfq/create
  GET    /api/rfq/list
  GET    /api/rfq/:id
  POST   /api/rfq/:id/lanes/import
  POST   /api/rfq/:id/carriers/invite
  GET    /api/rfq/:id/compare
  POST   /api/rfq/:id/award
  GET    /api/rfq/analytics/trends

Carrier API:
  POST   /api/carrier/register
  POST   /api/carrier/login
  GET    /api/carrier/rfqs
  POST   /api/carrier/rfq/:id/bid
  PUT    /api/carrier/bid/:id
  GET    /api/carrier/bid/:id/status
```

---

## 🎨 UI Integration Plan

### Main Dashboard Addition:
```
Current Navigation:
├── Dashboard
├── Loads
├── Carriers
├── Customers
├── Facilities
└── [NEW] RFQs ← Add this

RFQ Section:
├── Active RFQs (In Progress)
├── Create New RFQ
├── Draft RFQs
├── Completed RFQs
└── Analytics
```

### Quick Stats on Dashboard:
```
┌─────────────────────────────────────────────────┐
│ RFQ Management                        [+ New]   │
├─────────────────────────────────────────────────┤
│  Active: 1 │ Pending Bids: 142 │ Due Soon: 1   │
└─────────────────────────────────────────────────┘
```

---

## 📋 MVP Feature Checklist

### Phase 1: Core (Week 1-2) - Must Have
- [x] Database schema
- [ ] Create RFQ manually
- [ ] Add lanes manually (form)
- [ ] Import lanes from CSV ⭐
- [ ] Select carriers from existing carrier list
- [ ] View RFQ details
- [ ] Basic bid entry (manual)
- [ ] Simple bid comparison table

### Phase 2: Carrier Portal (Week 3) - Must Have
- [ ] Carrier authentication (email/password)
- [ ] Carrier dashboard (see assigned RFQs)
- [ ] Submit bid form ⭐
- [ ] View bid status
- [ ] Email notifications (RFQ assigned, deadline reminder)

### Phase 3: Intelligence (Week 4) - Must Have
- [ ] Auto bid comparison with rankings ⭐
- [ ] Side-by-side bid view
- [ ] Award lanes with notifications
- [ ] Historical pricing trends chart ⭐
- [ ] Export award summary (PDF/CSV)

### Phase 4: Nice to Have (Post-Launch)
- [ ] Duplicate RFQ (reuse lanes)
- [ ] Lane templates (common routes)
- [ ] Bulk operations (award all lowest)
- [ ] Advanced filters (by carrier, price, etc.)
- [ ] Mobile-responsive carrier portal
- [ ] Real-time bid notifications (push)
- [ ] Integration with loads (auto-create from awarded lanes)

---

## 🧪 Testing Plan

### Test Case 1: Walmart RFQ Import
```
1. Create new RFQ: "Walmart Q1 2026"
2. Import CSV with 30 lanes
3. Verify all lanes imported correctly
4. Add special requirements (food grade, reefer, etc.)
5. Set deadline: Jan 31, 2026
```

### Test Case 2: Carrier Invitation
```
1. Select 3 carriers from existing list
2. Send invitations
3. Verify emails sent with RFQ link
4. Check carrier portal access
```

### Test Case 3: Bid Submission
```
1. Carrier logs in to portal
2. Views Walmart RFQ details
3. Submits bid for Lane 1 (Wheeling→Miami)
   - Rate: $2,400
   - Transit: 32 hours
   - Max weight: 45,000 lbs
4. Saves bid
5. Edits bid (change rate to $2,350)
6. Re-saves
```

### Test Case 4: Bid Comparison
```
1. After 3 carriers submit bids
2. View comparison dashboard
3. Verify automatic ranking (1st, 2nd, 3rd)
4. Check $/mile calculations
5. Review savings analysis
6. Award Lane 1 to lowest bidder
7. Verify winner email sent
```

### Test Case 5: Historical Trends
```
1. Complete Walmart RFQ award
2. View analytics dashboard
3. See pricing trends for:
   - Wheeling, IL → Miami, FL
   - All lanes to Miami, FL
   - Reefer vs Dry rates
4. Export trend chart
```

---

## 🔒 Security Considerations

### Admin Access:
- Existing TMS authentication (your current login)
- Role-based: Only superadmin/admin can create RFQs
- All RFQ actions logged in `rfq_activity_log`

### Carrier Portal:
- Separate authentication (not mixed with admin)
- Email verification required
- Carriers linked to existing `carriers` table via MC number
- RLS policies:
  - Carriers only see RFQs assigned to them
  - Can't see other carrier bids
  - Can't modify after deadline
  - Can't see award decisions of others

### Data Privacy:
- Bid amounts are confidential
- Only admin can see all bids
- Carriers see their own bids + award status
- Historical trends show aggregated data only

---

## 📊 Success Metrics

### Week 4 Goals:
- ✅ Import Walmart RFQ successfully
- ✅ At least 3 carriers submit bids via portal
- ✅ Make award decisions using comparison tool
- ✅ Complete full RFQ cycle end-to-end
- ✅ Time to complete: <1 hour (vs 9 hours previously)

### Post-Launch (3 months):
- Handle 2-3 more RFQs
- 80%+ carriers using portal (vs email)
- Historical data shows rate trends
- Time per RFQ: <50 minutes
- Zero calculation errors

---

## 🚀 Launch Plan

### Soft Launch (Week 4):
- Complete Walmart RFQ using new system
- Internal team only
- Document any issues/improvements
- Refine UI based on feedback

### Full Launch (Week 5):
- Announce to all carriers via email
- Carrier portal training (video/guide)
- Use for next RFQ (March/April)
- Monitor adoption rates

### Scale (Weeks 6-12):
- Handle 2-3 more RFQs
- Collect carrier feedback
- Add requested features
- Optimize performance

---

## 💰 Expected ROI

### Time Savings (per RFQ):
- **Before:** 9 hours
- **After:** 50 minutes
- **Savings:** 8+ hours per RFQ

### Annual Impact (5 RFQs/year):
- **Time saved:** 40 hours/year
- **Cost saved:** ~$2,000/year (at $50/hr)
- **Error reduction:** 5% → 0.1%
- **Capacity increase:** 5 RFQs → 50+ RFQs possible

### Carrier Benefits:
- Self-service portal (24/7 access)
- Faster award notifications
- Track bid status
- Historical performance data
- Better experience = stronger relationships

---

## 📝 Next Immediate Actions

### Today (You):
1. ✅ Review this plan
2. [ ] Run `rfq-management-schema.sql` in Supabase SQL Editor
3. [ ] Verify tables created successfully
4. [ ] Get your Walmart spreadsheet ready for import

### Tomorrow (Development):
1. [ ] Set up API endpoints (backend)
2. [ ] Create RFQ dashboard component
3. [ ] Build CSV import parser
4. [ ] Test with sample data

### This Week:
1. [ ] Complete admin UI for RFQ creation
2. [ ] Import Walmart RFQ
3. [ ] Build carrier selection interface
4. [ ] Send test invitations

### Next Week:
1. [ ] Build carrier portal UI
2. [ ] Set up carrier authentication
3. [ ] Create bid submission form
4. [ ] Invite 2-3 test carriers

---

## 🎉 Success Criteria

We'll know we succeeded when:

✅ **Week 2:** You can import Walmart RFQ in <10 minutes  
✅ **Week 3:** Carriers can submit bids without calling/emailing you  
✅ **Week 4:** You award lanes using comparison tool in <15 minutes  
✅ **Month 2:** You've completed 2nd RFQ entirely in the system  
✅ **Month 3:** Historical trends show pricing patterns  
✅ **Month 6:** You never open a spreadsheet for RFQs again  

---

## 🔄 Feedback Loop

After Walmart RFQ test:
1. Survey carriers (How was the portal experience?)
2. Internal debrief (What worked? What didn't?)
3. Prioritize improvements
4. Update roadmap for next RFQ

**Let's build this! 🚀**

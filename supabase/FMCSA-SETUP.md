# FMCSA Carrier Lookup Setup Guide

This guide will help you set up the FMCSA carrier data scraper feature.

## Overview

The FMCSA lookup feature allows you to automatically populate carrier information by entering an MC number. The data is scraped from the [FMCSA SAFER](https://safer.fmcsa.dot.gov/CompanySnapshot.aspx) website.

## Setup Steps

### Step 1: Update Database Schema

Run the SQL in `supabase-carriers-update.sql` in your Supabase SQL Editor:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `supabase-carriers-update.sql`
5. Click **Run**

### Step 2: Install Supabase CLI

If you don't have the Supabase CLI installed:

```bash
# Using npm
npm install -g supabase

# Or using Homebrew (macOS)
brew install supabase/tap/supabase
```

### Step 3: Login to Supabase

```bash
supabase login
```

### Step 4: Link Your Project

```bash
cd /Users/fbetancourtjr/CarrierTracker/carrier-tracker
supabase link --project-ref qwoabopuoihbawlwmgbf
```

(Replace `qwoabopuoihbawlwmgbf` with your actual project reference if different)

### Step 5: Deploy the Edge Function

```bash
supabase functions deploy scrape-fmcsa
```

### Step 6: Verify Deployment

Test the function with curl:

```bash
curl -X POST 'https://qwoabopuoihbawlwmgbf.supabase.co/functions/v1/scrape-fmcsa' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{"mcNumber": "123456"}'
```

## How It Works

1. **User enters MC number** in the "Add Carrier" form
2. **Clicks "Lookup"** button
3. **Edge Function is called** which:
   - Makes a request to FMCSA SAFER website
   - Parses the HTML response
   - Returns structured carrier data
4. **Form auto-fills** with the carrier information:
   - Company Name
   - DOT Number
   - Address, City, State, ZIP
   - Phone Number
   - Safety Rating
   - Operating Status
   - Number of Power Units & Drivers

## Data Retrieved

| Field | Description |
|-------|-------------|
| Legal Name | Official registered business name |
| DBA Name | "Doing Business As" name |
| USDOT Number | Department of Transportation number |
| MC Number | Motor Carrier number |
| Physical Address | Street, City, State, ZIP |
| Phone | Contact phone number |
| Safety Rating | Satisfactory, Conditional, Unsatisfactory, or None |
| Operating Status | AUTHORIZED, NOT AUTHORIZED, etc. |
| Power Units | Number of trucks |
| Drivers | Number of registered drivers |

## Troubleshooting

### "Carrier not found"
- Verify the MC number is correct
- Try searching on [FMCSA SAFER](https://safer.fmcsa.dot.gov/CompanySnapshot.aspx) directly to confirm the carrier exists

### "Failed to lookup carrier"
- Check if the Edge Function is deployed correctly
- Verify your Supabase URL and API key in `.env`

### Edge Function Logs
View logs in Supabase Dashboard:
1. Go to **Edge Functions**
2. Select `scrape-fmcsa`
3. Click **Logs**

## Cost

- **Supabase Edge Functions**: Free tier includes 500,000 invocations/month
- **No third-party API costs**: Data is scraped directly from FMCSA

## Legal Note

This feature scrapes publicly available data from the FMCSA SAFER system. The data is provided by the U.S. Department of Transportation and is free to access. Always verify carrier information before entering into contracts.

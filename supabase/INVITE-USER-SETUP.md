# Deploy Invite User Edge Function

## Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Already logged in with access token

## Deploy the Function

```bash
cd /Users/fbetancourtjr/CarrierTracker/carrier-tracker

# Deploy the invite-user function
supabase functions deploy invite-user --project-ref qwoabopuoihbawlwmgbf
```

## Set Environment Variables

The function needs these secrets:

```bash
# Set the service role key (CRITICAL - has admin access)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here --project-ref qwoabopuoihbawlwmgbf

# Set the app URL (for password reset redirect)
supabase secrets set APP_URL=https://ssicarriertracker.vercel.app --project-ref qwoabopuoihbawlwmgbf
```

## Get Your Service Role Key

1. Go to: https://supabase.com/dashboard/project/qwoabopuoihbawlwmgbf/settings/api
2. Find "service_role" key under "Project API keys"
3. Copy it (it starts with `eyJ...`)
4. Run: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<paste_key_here> --project-ref qwoabopuoihbawlwmgbf`

## How It Works

1. Admin creates user in Team page
2. Frontend calls `invite-user` Edge Function
3. Edge Function uses admin API to:
   - Create auth.users record
   - Create profiles record
   - Send password reset email
4. User receives email with link to set password
5. User sets password and can log in

## Test It

After deploying, create a user from the Team page. They should receive an email!
